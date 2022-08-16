	/***
	 * Dynamic Sheet Attributes
	 *
	 * The DSA is the character data used as transport between the database and DST.
	 *
	 * @mixes nameGen
	 */
	let dsa = globals.dsa = {
		_next: {},

		get data() {
			return window.dynamic_sheet_attrs;
		},

		add(names, values, base) {
			names = this.nextName(names);
			let key; // want it in function scope so it can be accessed after loop
			for (key in names) {
				if (key in values) {
					this.data[names[key]] = values[key];
				}
			}
			return {
				base: base
					/*??*/|| ((names.value /*??*/|| names[key]).match(/^dyn_(?<base>[^_]+)/) /*??*/|| [])[1],
				i: names.i,
			};
		},

		compact(tpls, stop={gap:5}) {
			let tpl = Object.values(tpls)[0],
				names, name,
				i, j, n, loop,
				fields;

			// allows compacting of different field collections (e.g. DSFs, UDFs)
			// TODO: feature-compaction
			// * add compaction interface to other modules:
			//     {
			//       exists(name) {},
			//       rename(oldName, newName, {overwrite:false}={}) {},
			//       renumber(tpl, oldIndex, newIndex, options={}) {},
			//     }
			//fields ??= this;
			fields || (fields = this);

			if (is_numeric(stop)) {
				stop = {index: stop};
			}
			if (stop.index) {
				loop = {
					exists: true,
					continue(i, j) {
						return this.exists || i <= stop.index;
					},
					missing(i, j) {
						this.exists = false;
					},
					present(i, j) {
						this.exists = true;
					},
				};
			} else if (stop.gap) {
				loop = {
					continue(i, j) {
						return (i - this.i) <= stop.gap;
					},
					missing(i, j) {},
					present(i, j) {
						this.i = i;
					},
				};
			}

			i=0; j=0, n=0;
			do { // stops at 1st nonexistent item
				++i; ++j;
				name = klass.eval(tpl, {i});
			} while (fields.exists(name));
			// no item at index i, j
			do {
				name = klass.eval(tpl, {i: ++i});
				if (fields.exists(name)) {
					n = j;
					loop.present(i, j);
					fields.renumber(tpls, i, j++);
				} else {
					loop.missing(i, j);
				}
			} while (loop.continue(i, j));
			return n;
		},

		count(tpl) {
			return this.last(tpl).i;
		},

		entries(tpl, envs, opts={}) {
			if (envs) {
				return /*yield**/ this.entriesByBounds(tpl, envs, opts);
			} else {
				return /*yield**/ this.entriesByScan(tpl, opts);
			}
		},

		*entriesByBounds(tpl, envs, {continuous=false}={}) {
			let data = this.data,
				vars = klass.vars(tpl);
			for (let env of envs) {
				let name = klass.eval(tpl, env);
				if (dsa.exists(name, data)) {
					yield [name, data[name], env];
					//yield {name, value:data[name], env};
				} else if (continuous && Object.values(env).every(x => x)) {
					// only break out of variables at 2 or more
					let n = 0;
					// find first variable not at start of loop
					for (let i = vars.length - 1; i >= 0; --i) {
						if (env[vars[i]] > 1) {
							// break, so vars[i] will advance
							envs.next(n);
							n = 0;
							break;
						}
						++n;
					}
					// if n, then all vars <= 1; don't break yet
					break;
				}
			}
		},

		*entriesByScan(tpl, opts={}) {
			let data = this.data;
			yield* Object.entries(data).filter(([name, value]) => klass.matches(tpl, name));
		},

		exists(name, data) {
			return name in (data /*??*/|| this.data);
		},

		/**
		 * Get a list of character data, storing in the given <var>values</var> (or new one, if none passed in).
		 *
		 * Any values already present aren't overwritten.
		 *
		 * @param {string[]|object} names - attribute names.
		 * @param {string[]|object} [values] - stores attribute values (inout parameter).
		 *
		 * @returns {string[]|object} values
		 */
		getAll(names, values) {
			let entries;
			if (Array.isArray(names)) {
				entries = names.entries();
				//values ??= new Array(names.length);
				values || (values = new Array(names.length));
			} else if (is_object(names)) {
				entries = Object.entries(names);
				//values ??= {};
				values || (values = {});
			} else {
				throw new TypeError(`dsa.getAll: Invalid argument type: ${typeof(names)}. Arguments must both be either arrays or simple objects.`);
			}
			for (const [i, name] of entries) {
				//values[i] ??= dsa.data[name] ?? '';
				values[i] || (values[i] = dsa.data[name] || '');
			}
			return values;
		},

		rename(oldName, newName, {overwrite=false}={}) {
			if (   this.exists(oldName)
				&& (   overwrite
					|| ! this.exists(newName))
			) {
				this.data[newName] = this.data[oldName];
				delete this.data[oldName];
			}
		},

		renumber(tpls, oldNum, newNum, options={}) {
			for (let tpl of Object.values(tpls)) {
				this.rename(
					klass.eval(tpl, {i:oldNum}),
					klass.eval(tpl, {i:newNum}),
					options);
			}
		},
	};
	mixIn(dsa, nameGen);
