	/***
	 * Dynamic Sheet Fields
	 *
	 * @mixes nameGen
	 */
	let dsf = globals.dsf = {
		/* DST event handlers */
		preLoad({containerId, slug}, $context) {
			this.$context = $context;
			this.sheetId = containerId;
			this.slug = slug;
		},

		postLoad(opts, $context) {
			this.each(function (elt, $elt, name, value) {
				// strip 'Click to edit' text?
				if (editMarker == elt.textContent) {
					elt.textContent = '';
				}
			}, this);

			this.$context.find('.dsf.specialty').each(function (i, elt) {
				elt.title = 'Specialty';
			});
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
			this.$dsfs(this.$context).each(function (i, elt) {
				let $elt = $(elt),
					name = dsf.name(elt),
					value = dsf.value(elt);
				if (name) {
					fn(elt, $elt, name, value);
				} else {
					console.log(`No name for dsf ${elt.className}`, elt);
				}
			});
		},

		/* make node's descendant DSFs editable */
		editable(node) {
			this.$dsfs($(node))
				.not('.readonly')
				//.not('.pips') // should be covered by .readonly
				//.not('.hidden') // should be covered by .readonly
				.each(function (i, elt) {
					let name = dsf.stripPrefix(dsf.name(elt));
					aisleten.characters.bindField(name, dsf.sheetId, dsf.slug);
				});
		},

		entries(tpl) {
			tpl = dsf.addPrefix(tpl);
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

		sectionName(elt) {
			let $elt;
			if ('string' == typeof(elt)) {
				$elt = this.$context.find(elt);
			} else if (elt instanceof $) {
				$elt = elt;
			} else {
				$elt = $(elt);
			}
			let sectionElt = $elt.parent().closest('[class]')[0];
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
		 * Sort out whether the given thing is a field name, element or jQuery result.
		 */
		resolve(field) {
			let name, elt, $elt, type;
			if ('string' == typeof(field)) {
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
					return $elt[0].dataset.value /*??*/|| $elt.data('value') /*??*/|| $elt.text();
				},
			},

			setters: {
				checkbox($elt, value) {
					$elt.find('input').prop('checked', !! value);
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

		/* get/set value from dsf */
		value(field, value) {
			let {elt, $elt, type} = this.resolve(field);
			if (! elt) {
				return '';
			}
			if (! is_undefined(value)) {
				this._dsf.setters[type]($elt, value);
				elt.dataset.value = value;
				$elt.data('value', value);
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
			name = dsf.stripPrefix(name);
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
			eltField.dataset.value = value || '';
			if (this.isVolatile(eltField)) {
				name = this.sku(dsf.stripPrefix(name));
				localStorage[name] = value;
			}
			//$(eltField).data('value', value);
			//this.value(name, value);
		},
	};
	mixIn(dsf, nameGen);
