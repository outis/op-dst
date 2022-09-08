	/***
	 * Dynamic Sheet Fields
	 *
	 * @mixes nameGen
	 */
	let dsf = globals.dsf = {
		/**
		 * A DsfExtract represents DSFs as an object, with DSF names used for property names.
		 * @typedef {object} DsfExtract
		 */
		/* DST event handlers */
		preLoad({containerId, slug, isEditable}, $context) {
			this.$context = $context;
			this.sheetId = containerId;
			this.slug = slug;
			this.isEditable = isEditable;
		},

		postLoad(opts, $context) {
			this.each(function (elt, $elt, name, value) {
				// strip 'Click to edit' text?
				if (editMarker == elt.textContent) {
					elt.textContent = '';
				} else {
					this._saveValue({elt, value: elt.textContent});
				}
			}, this);

			this.$context.find('.dsf.specialty').each(function (i, elt) {
				elt.title = 'Specialty';
			});
		},

		change({fieldName, fieldValue, $field, field, oldValue}) {
			// ensure old value is recorded, so is accessible when recording undo
			if (! ('value' in field.dataset)) {
				field.dataset.value = oldValue || '';
			}
			field.dataset.oldValue = oldValue || '';
			this.value(fieldName, fieldValue);
			delete field.dataset.oldValue;
		},


		/* */
		addPrefix(name) {
			return name.replace(/^(?:dsf_)?/, 'dsf_');
		},

		/**
		 * Mark sheet as not having unsaved changes.
		 */
		clean() {
			$("#dst_select").data("sheetValueChanged", false);
		},

		/** Remove the value set on a DSF node. */
		clear(eltDsf) {
			delete eltDsf.dataset.value;
			let $eltDsf = $(eltDsf);
			$eltDsf.removeData('value');
			if (! $eltDsf.hasClass('pips')) {
				$eltDsf.empty();
			}
		},

		count(tpl) {
			return this.last(tpl).i;
		},

		/**
		 * Mark sheet as having unsaved changes.
		 */
		dirty() {
			$("#dst_select").data("sheetValueChanged", true);
		},

		/**
		 * Return the specified DSF element.
		 *
		 * @param {string|HTMLElement|jQuery} name - DSF name, element, or jQuery-wrapped element
		 *
		 * @returns {HTMLElement}
		 */
		dsf(name) {
			let {elt} = this.resolve(name);
			return elt;
		},

		/**
		 * Return the element for the given name, wrapped in a jQuery.
		 *
		 * @param {string} name - DSF name
		 *
		 * @returns {jQuery}
		 */
		$dsf(name) {
			if (name) {
				name = this.addPrefix(name);
				return this.$context.find(`.${name}`);
			}
			return $();
		},

		$dsfs(context, {excludeCompatibility=false}={}) {
			let $dsfs = $(context).find('.dsf');
			if (excludeCompatibility) {
				$dsfs = $dsfs.not(dsf => $(dsf).closest('.compatibility').length);
			}
			return $dsfs;
		},

		/**
		 * @param {(Node, jQuery, string, string) => null} fn (element, $(element), name, value)
		 */
		each(fn, self) {
			if (self) {
				fn = fn.bind(self);
			}
			this.$dsfs(this.$context).each((i, elt) => {
				let $elt = $(elt),
					name = this.name(elt),
					value = this.value(elt);
				if (name) {
					fn(elt, $elt, name, value);
				} else {
					console.warn(`No name for dsf ${elt.className}`, elt);
				}
			});
		},

		/* make node's descendant DSFs editable */
		editable(node) {
			this.$dsfs($(node))
				.not('.readonly')
				//.not('.pips') // should be covered by .readonly
				//.not('.hidden') // should be covered by .readonly
				.each((i, elt) => {
					let name = this.stripPrefix(this.name(elt));
					aisleten.characters.bindField(name, this.sheetId, this.slug);
				});
		},

		entries(tpl) {
			tpl = this.addPrefix(tpl);
			let pre = klass.prefix(tpl);
			return this.$context.find(`.dsf[class*=" ${pre}"]`)
				.toArray()
				.filter(elt => klass.matches(tpl, elt.className))
				.map(elt => [this.name(elt), this.value(elt)]);
		},

		exists(name) {
			try {
				return this.$dsf(name).length;
			} catch (err) {
				console.error(err);
				return false;
			}
		},

		/**
		 * Extract the DSFs from the given context as key-value pairs of an object.
		 *
		 * Example:
		 *     dsf.extract('.mental');
		 *     # result:
		 *     {
		 *         perception: 2,
		 *         intelligence: 3,
		 *         wits: 4,
		 *     }
		 *
		 * @param {HTMLElement|selector|jQuery} context - where to search for DSFs
		 *
		 * @returns {DsfExtract}
		 */
		extract(context) {
			const data = {};
			for (let field of this.$dsfs(context)) {
				data[this.name(field)] = this.value(field);
			}
			return data;
		},

		isVolatile(node) {
			return /(?:\b|_)curr_|\bcurrent\b|\bvolatile\b/.test(node.className);
		},

		/**
		 * Get the last name & index from the DSA matching the given name template.
		 */
		last(tpl) {
			// can't simply grab last element, as it might not match tpl; instead, scan entries
			let entries = this.entries(tpl),
				i =  entries.length,
				last = entries[entries.length - 1],
				name = last && last[0];
			return {name, i};
			/* could potentially use nameGen.last instead */
		},


		/**
		 * Linked fields are interdependent fields representing a permanent rating and a current value, such as health or willpower, where the permanent rating is a maximum for the current value. There may also be a field that gives a bonus or penalty to the permanent field's own maximum.
		 */
		linked: {
			base(name) {
				// test ensures nullish value if no match
				if (this.isExtra(name)) {
					return name.replace(/(^|_)extra_/, '$1');
				}
			},

			bases(name) {
				let bases = [], base;
				if (this.isExtra(name)) {
					if ((base = this.perm(name))) {
						bases.push(base);
					}
					if ((base = this.curr(name))) {
						bases.push(base);
					}
				}
			},

			curr(name) {
				// test ensures nullish value if no match
				if (this.is_ep(name)) {
					return name.replace(/(^|_)(extra|perm)_/, '$1curr_');
				}
			},

			$curr(name) {
				({name} = this.resolve(name));
				return dsf.$dsf(this.curr(name));
			},

			extra(name) {
				// test ensures nullish value if no match
				if (this.isBase(name)) {
					return name.replace(/(^|_)(perm|curr)_/, '$1extra_');
				}
			},

			$extra(name) {
				({name} = this.resolve(name));
				return dsf.$dsf(this.extra(name));
			},

			perm(name) {
				// test ensures nullish value if no match
				if (this.is_ec(name)) {
					return name.replace(/(^|_)(extra|curr)_/, '$1perm_');
				}
			},

			$perm(name) {
				({name} = this.resolve(name));
				return dsf.$dsf(this.perm(name));
			},

			is(name) {
				return /(^|_)(extra|perm|curr)_/.test(name);
			},

			isBase(name) {
				return /(^|_)(perm|curr)_/.test(name);
			},

			isCurr(name) {
				return /(^|_)curr_/.test(name);
			},

			is_ec(name) {
				return /(^|_)(extra|curr)_/.test(name);
			},

			is_ep(name) {
				return /(^|_)(extra|perm)_/.test(name);
			},

			isExtra(name) {
				return /(^|_)extra_/.test(name);
			},

			isPerm(name) {
				return /(^|_)perm_/.test(name);
			},

			/*
			has_extra(name) {
			},
			*/
		},

		/**
		 * Change the name of a DSF.
		 *
		 * Used mosly for DSFs generated during export.
		 *
		 * Returns `true` if the DSF exists and was renamed, false otherwise.
		 *
		 * @param {string} oldName
		 * @param {string} newName
		 * @param {object} [options]
		 * @param {boolean} [options.overwrite] - Whether to rename if there's already a DSF with <var>newName</var>.
		 *
		 * @returns {boolean} whether the DSF exists & was renamed
		 */
		rename(oldName, newName, {overwrite=false}={}) {
			let $old = this.$dsf(oldName),
				$new = this.$dsf(newName);
			if ($old.length) {
				if ($new.length) {
					if (overwrite) {
						this._value($new, this.value($old));
						$old.remove();
					} else {
						return false;
					}
				} else {
					$old.removeClass(this.addPrefix(oldName)).addClass(this.addPrefix(newName));
				}
				return true;
			}
			return false;
		},

		/**
		 * The closest named container of a given element, as a jQuery.
		 *
		 * @param {string|selector|HTMLElement|jQuery} elt - an element of the section
		 *
		 * @returns {jQuery}
		 */
		$section(elt) {
			let $elt;
			if (is_string(elt)) {
				$elt = this.$context.find(elt);
				if (! $elt.length) {
					$elt = this.$dsf(elt);
				}
			} else if (elt instanceof $) {
				$elt = elt;
			} else {
				$elt = $(elt);
			}
			return $section = $elt.parent().closest('div[class], section[class]');
		},

		/**
		 * The closest named container of a given element, as an HTML element.
		 *
		 * @param {string|HTMLElement|jQuery} elt - an element of the section
		 *
		 * @returns {HTMLElement}
		 */
		section(elt) {
			let $section = this.$section(elt);
			if ($section[0]) {
				return $section[0];
			}
		},

		/**
		 * The name of the container of a given element.
		 *
		 * @param {string|HTMLElement|jQuery} elt - an element of the section
		 *
		 * @returns {string}
		 */
		sectionName(elt) {
			let sectionElt = this.section(elt);
			if (sectionElt) {
				return sectionElt.className.split(/\s+/)[0];
			}
		},

		/**
		 * A unique string for a name.
		 *
		 * Allows DSFs that use the same name from multiple sheets to be stored in local storage without colliding.
		 */
		sku(name) {
			return this.sheetId + '.' + name;
		},

		stripPrefix(name) {
			return name.replace(/^dsf_/, '');
		},

		name(elt) {
			if (elt instanceof $) {
				elt = elt[0];
			}
			return klass.param(elt, 'dsf');
		},

		/**
		 * Remove volatile values from local storage.
		 */
		removeValue(field) {
			let {elt, name} = this.resolve(field);
			name = this.sku(this.stripPrefix(name));
			localStorage.removeItem(name);
		},

		/**
		 * Sort out whether the given thing is a field name, element or jQuery result.
		 */
		resolve(field) {
			let name, elt, $elt, type;
			if (is_string(field)) {
				name = this.stripPrefix(field);
				$elt = this.$dsf(name);
				elt = $elt[0];
			} else {
				if (field instanceof $) {
					$elt = field;
					elt = $elt[0];
				} else {
					elt = field;
					$elt = $(field);
				}
				name = this.name(elt);
			}
			type = this.typify($elt);
			return {name, elt, $elt, type};
		},

		type(elt) {
			let {$elt, type} = this.resolve(elt);
			return type;
		},

		typify($elt) {
			if (! $elt[0]) {
				return;
			}
			if (   $elt.hasClass('checkbox')
				|| $elt.find('> input[type="checkbox"]').length)
			{
				return 'checkbox';
			}
			if (   'TEXTAREA' == $elt[0].tagName
				|| $elt.hasClass('notes') || $elt.hasClass('text'))
			{
				return 'text';
			}
			if ('SELECT' == $elt[0].tagName) {
				return 'select';
			}

			return 'default';
		},

		_dsf: {
			getters: {
				checkbox($elt) {
					return $elt.find('input').prop('checked');
				},
				select($elt) {
					return $elt.val();
				},
				text($elt) {
					return $elt.html();
				},
				default($elt) {
					//return $elt[0].dataset.value ?? $elt.data('value') ?? $elt.text();
					if ('value' in $elt[0].dataset) {
						return $elt[0].dataset.value;
					}
					let value = $elt.data('value');
					if (! is_undefined(value)) {
						return value;
					}
					return $elt.text();
				},
			},

			setters: {
				checkbox($elt, value) {
					$.disableHooks('prop', 'checked');
					$elt.find('input').prop('checked', to_boolean(value));
					$.enableHooks('prop', 'checked');
				},
				select($elt, values) {
					if (values.match(',')) {
						values = values.split(/\s*,\s*/);
					}
					return $elt.val(values);
				},
				text($elt, value) {
					$elt.html(value);
				},
				default($elt, value) {
					$elt.text(value);
				},
			},
		},

		/**
		 * If `undo` module is loaded, record the given changes to history.
		 *
		 * @param {object} change - information about what was changed
		 * @param {HTMLElement} change.elt - Backing element for DSF.
		 * @param {string} [change.name] - Name of DSF.
		 * @param {jQuery} [change.$elt] - jQuery wrapped backing element for DSF.
		 * @param {string|number} value - New value for DSF.
		 * @param {string|number} [oldValue] - Old value for DSF.
		 */
		_recordUndo(change, setValue) {
			if (modules.undo) {
				/* // is elt.dataset.oldValue needed with nullish coalescing?
				change.oldValue ??= change.elt.dataset.oldValue ?? this.value(change.elt);
				change.name ??= this.name(change.elt);
				change.$elt ??= $(change.elt);
				*/
				if (! ('oldValue' in change)) {
					if ('oldValue' in change.elt.dataset) {
						change.oldValue = change.elt.dataset.oldValue;
					} else {
						change.oldValue = this.value(change.elt);
					}
				}
				change.name || (change.name = this.name(change.elt));
				change.$elt || (change.$elt = $(change.elt));

				setValue = setValue.bind(this);

				modules.undo.record(
					() => {
						modules.undo.highlight(change.elt, change.$elt);
						//console.log(`undo: Reverting ${change.name} to ${change.oldValue}`);
						setValue({...change, value: change.oldValue});
					},
					() => {
						modules.undo.highlight(change.elt, change.$elt);
						//console.log(`redo: Setting ${change.name} to ${change.value}`);
						setValue(change);
					},
				);
			}
		},

		_setValue({elt, $elt, type, value}) {
			this._dsf.setters[type]($elt, value);
			this._saveValue({elt, $elt, value});
			this._storeValue({elt, name:this.name(elt), value});
		},

		_saveValue({elt, $elt, value}) {
			elt.dataset.value = value;
			($elt /*??*/|| $(elt)).data('value', value);
		},

		_storeValue({elt, name, value}) {
			// only store volatile values if not currently editing
			if (this.isVolatile(elt)) {
				name = this.sku(this.stripPrefix(name || this.name(elt)));
				if (this.isEditable) {
					// don't need local storage while editing; clean it out, so old value doesn't override when not editing
					localStorage.removeItem(name);
				} else {
					localStorage[name] = value;
				}
			}
		},

		/**
		 * Store volatile values in local storage.
		 *
		 * Volatile values can be changed by a player even when not editing a sheet. If a value is changed during play, it is stored in local storage until the change can be incorporated more permanently during editing. While editing, local storage isn't used (so this becomes a no-op).
		 *
		 * @param {string|HTMLElement|jQuery} field
		 * @param {string} value
		 */
		storeValue(field, value) {
			let {elt, name} = this.resolve(field);
			this._storeValue({elt, name, value});
		},

		_value(field, value) {
			let {elt, $elt, type} = this.resolve(field);
			if (! elt) {
				return '';
			}
			this._setValue({elt, $elt, type, value});
		},

		/* get/set value from dsf */
		value(field, value) {
			let {elt, $elt, type} = this.resolve(field);
			if (! elt) {
				return '';
			}
			if (! is_undefined(value)) {
				this._recordUndo({elt, $elt, type, value}, this._setValue);
				this._setValue({elt, $elt, type, value});
				return value;
			}
			let getter = this._dsf.getters[type] /*??*/|| this._dsf.getters.default;
			return getter($elt);
		},

		// TODO: refactor-find better name
		/**
		 * Use value from local storage (if any) instead of value from page load.
		 *
		 * Allows for values to be set outside of edit mode.
		 */
		override(name, value) {
			name = this.stripPrefix(name);
			let key = this.sku(name);
			if (key in localStorage) {
				value = localStorage[key];
				// overwrite value
				this.value(name, value);
			}
			return value;
		},

		/* TODO: get volatile DSFs to work with UDFs; the two are currently incompatible (as reordering changes field name, but localStorage isn't updated). */
		update(eltField, value, name) {
			//name ??= this.name(eltField);
			name || (name = this.name(eltField));

			function saveValue(kwargs) {
				this._saveValue(kwargs);
				this._storeValue(kwargs)
			}

			let change = {
				elt: eltField, $elt: $(eltField),
				name, value,
				oldValue: eltField.dataset.value,
			};

			if (change.value !== change.oldValue) {
				this._recordUndo(change, saveValue);
				saveValue.call(this, change);
			}
		},
	};
	// bind dsf.exists, so it can be used directly as a filter
	bindSome(dsf, ['exists']);
	mixIn(dsf, nameGen);
