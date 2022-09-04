	/**
	 * Generate a name for an item that doesn't yet exist.
	 *
	 * The primary method, {@link this.nameGen}, scans existing items (checking with {@link this.exists}) until it finds an index not yet used, and returns the name for that index.
	 *
	 * Client objects must supply an {@link this.exists} method.
	 *
	 *
	 * @mixin
	 */
	let nameGen = {
		count(tpl) {
			return this.last(tpl).i;
		},

		/**
		 * @function exists
		 *
		 * Report whether an item with the given name exists.
		 *
		 * @param {string} name - Item name to check.
		 *
		 * @returns boolean
		 */

		/**
		 * Get the last name & index from the item matching the given name template.
		 *
		 * @param {NameTemplate} tpl
		 */
		last(tpl) {
			let base, i=1, name, last;

			({base, tpl} = klass._varify(tpl, '_{i:02}'));

			if (tpl in this._next) {
				// start at the previous non-existent item index
				i = this._next[tpl];
			}

			while (true) {
				name = klass.eval(tpl, {i});
				if (this.exists(name)) {
					last = name;
					++i;
				} else {
					// restore name of last known item
					name = last;
					break;
				}
			}
			// no base[i], so start there next time
			this._next[tpl] = i;
			--i;
			return {name, i};
		},

		/**
		 * Return an index for the next available (i.e. non-existent) item.
		 *
		 * @param {NameTemplate} tpl - Name template. Must include an '{i}' variable.
		 * @param {string} [start] - starting index for scanning.
		 *
		 * @returns number
		 */
		next(tpl, start=1) {
			return start + this.count(tpl);
		},

		/**
		 * Generate names for a collection of name templates that follow the last item matching the templates.
		 *
		 * Can pass name templates in an array, an object, or separately:
		 *
		 *    nameGen.nextName(['base_{i:02}_name', 'base_{i:02}']);
		 *    nameGen.nextName({name:'base_{i:02}_name', value:'base_{i:02}'});
		 *    nameGen.nextName('base_{i:02}_name', 'base_{i:02}');
		 *
		 * Note that only the first template is used when searching for existing items, so be sure to pass one that will be present for all items.
		 *
		 * @param {NameTemplate[]|object} tpls - Name templates.
		 * @param {object} [options] - Keyword arguments.
		 * @param {number} [options.start=1] - Index to start scanning from.
		 */
		nextName(...tpls) {
			let i, opts = {start:1},
				names = {};
			if (is_object(tpls[0])) {
				opts = {...opts, ...(tpls[1] /*??*/|| {})};
				tpls = tpls[0];
				const first = Object.values(tpls)[0];
				i = this.next(first, opts.start);
				names = klass.evalAll(tpls, {i});
			} else {
				if (Array.isArray(tpls[0])) {
					opts = {...opts, ...(tpls[1] /*??*/|| {})};
					tpls = tpls[0];
				} else if (is_object(tpls[tpls.length - 1])) {
					opts = {...opts, ...tpls.pop()};
				}
				i = this.next(tpls[0], opts.start);
				if (tpls.length > 1) {
					names = tpls.map(tpl => klass.eval(tpl, {i}));
				} else {
					// so `names` will take arbitrary properties
					names = new String(klass.eval(tpls[0], {i}));
				}
			}
			if (is_object(names)) {
				// so 'i' isn't enumerable; won't work on & not necessary for strings
				Object.defineProperty(names, 'i', {
					enumerable:false,
					value: i,
				});
			} else {
				names.i = i;
			}
			return names;
		},
	};
