	/**
	 * Mixin.
	 */
	let nameGen = {
		count(tpl) {
			return this.last(tpl).i;
		},
		
		/**
		 * Get the last name & index from the item matching the given name template.
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

		next(tpl, start=1) {
			return start + this.count(tpl);
		},
		
		/**
		 */
		nextName(...tpls) {
			let i, opts = {start:1},
				names = {};
			if (is_object(tpls[0])) {
				opts = {...opts, ...(tpls[1] ?? {})};
				tpls = tpls[0];
				const first = Object.values(tpls)[0];
				i = this.next(first, opts.start);
				for (const k in tpls) {
					names[k] = klass.eval(tpls[k], {i});
				}
			} else {
				if (Array.isArray(tpls[0])) {
					opts = {...opts, ...(tpls[1] ?? {})};
					tpls = tpls[0];
				} else if (is_object(tpls[tpls.length - 1])) {
					opts = {...opts, ...tpls.pop()};
				}
				i = this.next(tpls[0], opts.start);
				if (tpls.length > 1) {
					names = tpls.map(tpl => klass.eval(tpl, {i}));
				} else {
					names = klass.eval(tpls[0], {i});
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
