	/*** Multi-variable sequences ranging over values. */
	let range = globals.range = {
		async *asyncConcat(...seqs) {
			for (let seq of seqs) {
				yield* seq;
			}
		},

		/* CloudFlare chokes on `*concat` */
		concat: function*(...seqs) {
			for (let seq of seqs) {
				yield* seq;
			}
		},
		/**
		 * Generate a keyed sequence over multiple sequences.
		 *
		 * @param {{key: generator, ...}} entries
		 */
		*keys(obj) {
			yield* this.entries(Object.entries(obj));
		},
		
		/**
		 * Generate a keyed sequence over a single key & sequence.
		 *
		 * @param {string} key
		 * @param {generator} vals
		 * @param {object?} obj
		 */
		*entry(key, vals, obj = {}) {
			for (let i of vals) {
				obj[key] = i;
				yield obj;
			}
		},

		/**
		 * Generate a keyed sequence over multiple keys & sequences.
		 *
		 * @param {[[key, generator], ...]} entries
		 */
		*entries(entries) {
			let entry, vals;
			switch (entries.length) {
			case 0:
				break;

			case 1:
				yield* this.entry(entries[0][0], entries[0][1]);
				break;
				
			default:
				entry = entries.pop();
				for (let vals of this.entries(entries)) {
					yield* this.entry(entry[0], entry[1], vals);
				}
				break;
			}
		},

		/**
		 * Generate a keyed sequence with key `key` and values ranging from `from` to `to`.
		 *
		 * @param {string} key Key of result object to hold sequence values.
		 * @param {int} from Lower limit (inclusive).
		 * @param {int} to Upper limit (exclusive).
		 * @param {object?} vals Object to extend & yield. Defaults to `{}`.
		 */
		*keyOver(key, from, to, vals = {}) {
			for (let i = from; i < to; ++i) {
				vals[key] = i;
				yield vals;
			}
		},
		
		/* *
		 * Generate a keyed sequence with keys from `vars` and values ranging from `from` to `to`. 
		 *
		 * @param {[string]} keys Keys of result object to hold sequence values.
		 * @param {int} from Lower limit (inclusive).
		 * @param {int} to Upper limit (exclusive).
		 */
		*keysOver(keys, from, to) {
			if (! to) {
				to = from;
				from = 0;
			}

			let key, vals;
			switch (keys.length) {
			case 0:
				break;

			case 1:
				yield* this.keyOver(keys[0], from, to);
				break;
				
			default:
				key = keys.pop();
				for (let vals of this.keysOver(keys, from, to)) {
					yield* this.keyOver(key, from, to, vals);
				}
				break;
			}
		},

		/**
		 * Generate a sequence of integers.
		 *
		 * The order of values in the `from` and `two` arguments only matters if no `step` is provided, in which case the order indicates whether the sequence increases (a positive `step`) or decreases (a negative `step`). If `step` is provided, `from` and `to` are automatically ordered appropriately.
		 *
		 * Examples:
		 *
		 *     [...range.over(5)]         # [0,1,2,3,4]
		 *     [...range.over(2,  5)]     # [2,3,4]
		 *     [...range.over(5,  2)]     # [2,3,4]
		 *     [...range.over(5,  2,  1)] # [2,3,4]
		 *     [...range.over(5,  2)]     # [5,4,3]
		 *     [...range.over(5,  2, -1)] # [5,4,3]
		 *     [...range.over(2,  5, -1)] # [5,4,3]
		 *     [...range.over(2, 10,  3)] # [2,5,8]
		 *     [...range.over(2, 10, -3)] # [10, 7, 4]
		 *
		 * @param {int?} from Lower limit (inclusive). Defaults to `0`
		 * @param {int} to Upper limit (exclusive).
		 * @param {int?} step Difference between successive values. Can be negative. Defaults to `1` if from < to; `-1` if from > to.
		 */
		*over(from, to, step) {
			if (is_undefined(to)) {
				to = from;
				from = 0;
			}
			if (! step) {
				step = from < to ? 1 : -1;
			}
			if (step > 0) {
				[from, to] = [from, to].sort();
				for (let i = from; i < to; i += step) {
					yield i;
				}
			} else {
				[from, to] = [from, to].sort().reverse();
				for (let i = from; i > to; i += step) {
					yield i;
				}
			}
		},
	};
