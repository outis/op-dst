	/**
	 * Allows lookup by pattern-matching, rather than exact matching, of keys.
	 */
	function ShorthandDict(mapping={}) {
		this.shorthand = {};
		this.full = {};
		let shortdict = new Proxy(this, {
			apply(target, thisArg, args) {
			},

			// TODO: test
			defineProperty(target, key, descriptor) {
				Object.defineProperty(this, key, descriptor);
				return true;
			},

			/**
			 * Deletes the entry matching the given key, including removing it from the shorthand.
			 *
			 * If `entry` or `matches` are overridden, deletion may remove more than is wanted.
			 */
			deleteProperty(target, key) {
				let entry = this.resolve(key);
				if (entry) {
					let short = this.shorthand(key);
					if (short && short in target.shorthand) {
						target.shorthand[short] = target.shorthand[short].filter(item => item != entry.key);
						if (! target.shorthand[short].length) {
							delete target.shorthand[short];
						}
					}
					delete target.full[entry.key];
				}
			},

			/**
			 * If the given key matches `full`, returns the dict entry.
			 *
			 * Overridable to allow alternate ways of comparing & building the entry (such as if the full entry is a list, which must be searched to find the exact value).
			 *
			 * @param {string} full actual key
			 * @param {string} key approximate key
			 */
			entry(full, key, target) {
				let match = this.matches(full, key);
				if (match) {
					return {
						key: full,
						value: this.value({
							value: target.full[full],
							match, full, key,
						})
					};
				}
			},

			_direct: {shorthand:1, full:1},
			'get': function(target, key, receiver) {
				if (key in this._direct) {
					return target[key];
				}
				let entry = this.resolve(target, key);
				if (entry) {
					return entry.value;
				}
			},

			getPrototypeOf(target) {
				return ShorthandDict.prototype;
				// return target.constructor.prototype
			},

			getOwnPropertyDescriptor(target, key) {
				let entry = this.resolve(target, key);
				return Object.getOwnPropertyDescriptor(target.full, key);
			},

			has(target, key) {
				let entry = this.resolve(target, key);
				return ! is_undefined(entry);
			},

			/**
			 * Test whether keys match.
			 *
			 * Called by {@link this#entry}.
			 *
			 * @param {string} full actual key
			 * @param {string} key approximate key
			 *
			 * @return {*}
			 */
			matches(full, key) {
				return klass.matches(full, key);
			},

			ownKeys(target) {
				return Object.keys(target.full);
			},

			/**
			 * Find the entry matching the given key.
			 *
			 * @param {Object} target
			 * @param {string} key Approximate key.
			 *
			 * @returns {{key: string, value}}
			 */
			resolve(target, key) {
				if (key in target.full) {
					return {key, value: target.full[key]};
				}
				let short = this.shorthand(key),
					entry;
				// check shorthand before full for direct match in case short is a prefix for some other full (e.g. 'section', 'section_header')
				if (   short in target.shorthand
					&& (entry = this.search(target.shorthand[short], key, target)))
				{
					return entry;
				}
				if (   short in target.full
					&& (entry = this.entry(short, key, target)))
				{
					return entry;
				}
				return this.search(Object.keys(target.full), key, target);
			},

			search(candidates, key, target) {
				for (let full of candidates) {
					if ((entry = this.entry(full, key, target))) {
						return entry;
					}
				}
			},

			_overwriteable: {entry:1, matches:1, shorthand:1, value:1},
			'set': function(target, key, value) {
				if (key in this._overwriteable && is_function(value)) {
					this[key] = value.bind(target);
					return true;
				}
				let short = this.shorthand(key);
				if (short) {
					if (short in target.shorthand) {
						target.shorthand[short].push(key);
					} else {
						target.shorthand[short] = [key];
					}
				}
				target.full[key] = value;
				return true;
			},

			setPrototypeOf(target, prototype) {
				target.constructor.prototype = prototype;
				return true;
			},

			shorthand(key) {
				return klass.prefix(key);
			},

			/**
			 * Pick the value for a given entry.
			 *
			 * Overridable to allow an instance to use a different value than what's stored under `full`.
			 *
			 * Called by {@link this#entry}.
			 *
			 * @param {Object} candidates
			 * @param {*} candidates.value The value for `full`.
			 * @param {*} candidates.match The result of the call to {@link this#match}.
			 * @param {*} candidates.value The actual key.
			 * @param {*} candidates.value The approximate key.
			 *
			 * @return {*}
			 */
			value({value, match, full, key}) {
				return value;
			},
		});

		for (let [key, value] of Object.entries(mapping)) {
			shortdict[key] = value;
		}
		return shortdict;
	}

	//ShorthandDict.prototype = {};
	globals.ShorthandDict = ShorthandDict;
