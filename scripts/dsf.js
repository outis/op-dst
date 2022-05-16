	/*** 
	 * Dynamic Sheet Fields 
	 *
	 * @requires field, klass, pips, aisleten
	 */
	let dsf = globals.dsf = {
		/* DST event handlers */
		postLoad({containerId}, $context) {
			this.$context = $context;
			this.sheetId = containerId;
			this.each(function (elt, $elt, name, value) {
				// strip 'Click to edit' text?
				if (editMarker == elt.textContent) {
					elt.textContent = '';
				}
				value = this.override(name, value)
				if (is_flag(elt, name, value)) {
				} else if (pips.is(elt, name, value)) {
					//let val = $elt.text() || elt.dataset.value || $elt.data('value');
					$elt.text('');
					pips.pippify($elt, {name, value});
				} else {
				}
			}, this);

			this.$context.find('input[type="checkbox"].dsf').each(function (i, elt) {
				if (elt.className.match(/_specialty\b/)) {
					elt.title = 'Specialty';
				}
			});
		},

		/* */
		/** Remove the value set on a DSF node. */
		clear(eltDsf) {
			delete eltDsf.dataset.value;
			let $eltDsf = $(eltDsf);
			$eltDsf.removeData('value');
			if (! $eltDsf.hasClass('pips')) {
				$eltDsf.empty();
			}
		},

		/**
		 * @param {(Node, jQuery, string, string) => null} fn (element, $(element), name, value)
		 */
		each(fn, self) {
			if (self) {
				fn = fn.bind(self);
			}
			this.$context.find('.dsf').each(function (i, elt) {
				let $elt = $(elt),
					name = dsf.name(elt),
					value = field.value(elt, name); // elt.dataset.value || $elt.data('value') || field.value(name);
				fn(elt, $elt, name, value);
			});
		},

		/* make node's descendant DSFs editable */
		editable(node) {
			$(node)
				.find('.dsf')
				.not('.readonly')
				//.not('.pips') // should be covered by .readonly
				//.not('.hidden') // should be covered by .readonly
				.each(function (i, elt) {
					let name = dsf.stripPrefix(dsf.name(elt));
					aisleten.characters.bindField(name, udfs.containerId, udfs.slug);
				});
		},

		linked: {
			base(name) {
				if (this.isExtra(name)) {
					return name.replace(/(^|_)extra_/, '$1perm_');
				}
			},

			extra(name) {
				if (this.isBase(name)) {
					return name.replace(/(^|_)perm_/, '$1extra_');
				}
			},
			
			isBase(name) {
				return name.match(/(^|_)perm_/);
			},
			
			isExtra(name) {
				return name.match(/(^|_)extra_/);
			},

			/*
			has_extra(name) {
			},
			*/
		},
		
		isVolatile(node) {
			return node.className.match(/(?:\b|_)curr_|\bcurrent\b/);
		},

		addPrefix(name) {
			return name.replace(/^(?:dsf_)?/, 'dsf_');
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
			return klass.param(elt, 'dsf');
		},

		/* get/set value from dsf */
		value(name, value) {
			name = this.addPrefix(name);
			let $dsf = this.$context.find(`.${name}`);
			if (value) {
				$dsf.text(value);
			}
			return $dsf.text();
		},

		// TODO: find better name
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

		/* Volatile & DSFs are currently incompatible (as reordering changes field name, but localStorage isn't updated) */
		update(eltField, name, value) {
			eltField.dataset.value = value;
			if (this.isVolatile(eltField)) {
				name = this.sku(dsf.stripPrefix(name));
				localStorage[name] = value;
			}
			//$(eltField).data('value', value);
			//this.value(name, value);
		},
	};
