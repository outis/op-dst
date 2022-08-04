	/*** Multi-variable sequences ranging over values. */
	let range = globals.range = {
		/**
		 * @internal
		 *
		 * Loop parameter ends.
		 */
		_ends: ['to', 'thru', 'through', 'upthru', 'upthrough', 'downthru', 'downthrough', 'upto', 'downto'],
		/**
		 * @internal
		 *
		 * Breakable generators receive a postive integer from `next`, indicating the number of levels to break out. This call to `next` is outside the usual iteration.
		 *
		 * To create a breakable generator:
		 * 1. save result of `yield`/`yield*`
		 * 2. if positive:
		 *    1. if was `yield`, then `yield` again (for the breaking `next`); the convention is to yield `break ${result}`.
		 *    2. return result - # of loops in the current (function) scope that are being skipped.
		 *
		 * Note that with 2.1, if there isn't a `yield` at the bottom, the next element of the sequence will get dropped.
		 */

		/**
		 * Numeric loop parameters.
		 *
		 * The interactions between the various properties can be complex, but should work as one might expect from reading the parameter expression (see examples below).
		 *
		 * At least one of the upper limit properties must be specified. 'To' in the property name indicates an exclusive limit, 'through' inclusive. If 'up' or 'down' is in the property name, `step` is given the appropriate sign. Otherwise, the sign of `step` indicates the direction. Lastly, if `step` isn't provided at all, it's deduced from `from` and `to`/`through`.
		 *
		 * Examples:
		 *
		 * | expression | values |
		 * |-|-|
		 * | `{to: 3}` | `[0, 1, 2]` |
		 * | `{from: 1, to: 3}` | `[1, 2]` |
		 * | `{from: 1, through: 3}` | `[1, 2, 3]` |
		 * | `{from: 3, to: 1}` | `[3, 2]` |
		 * | `{from: 3, through: 1}` | `[3, 2, 1]` |
		 * | `{to: 9, step: 3}` | `[0, 3, 6]` |
		 * | `{to: 9, step: -3}` | `[9, 6, 3]` |
		 * | `{through: 9, step: -3}` | `[9, 6, 3, 0]` |
		 * | `{upto: 9, step: 3}` | `[0, 3, 6]` |
		 * | `{upto: 9, step: -3}` | `[0, 3, 6]` |
		 * | `{from: 3, through: 9, step: 3}` | `[3, 6, 9]` |
		 * | `{from: 3, through: 9, step: -3}` | `[9, 6, 3]` |
		 *
		 * @typedef {Object} LoopParams
		 * @property {number} [from] Lower limit (inclusive). Defaults to `0`.
		 * @property {number} [to] Upper limit (exclusive).
		 * @property {number} [upto] Upper limit (exclusive), stepping up.
		 * @property {number} [downto] Upper limit (exclusive), stepping down.
		 * @property {number} [through] Upper limit (inclusive).
		 * @property {number} [upthrough] Upper limit (inclusive), stepping up.
		 * @property {number} [downthrough] Upper limit (inclusive), stepping down.
		 * @property {number} [step] Difference between successive values. Can be negative. Defaults to `1` if `from < to`; `-1` if `from > to`.
		 */

		/**
		 * @internal
		 *
		 * Normalized form of LoopParams.
		 *
		 * @typedef {Object} LoopConds
		 * @property {number} from Starting index.
		 * @property {number} to Ending index.
		 * @property {number} step Difference between successive values.
		 * @property {number => boolean} continue Whether the loop should continue at the given index.
		 * @property {number => boolean} done Whether the loop should stop at the given index.
		 */
		
		/**
		 * Normalize arguments to loop parameters.
		 *
		 * Used internally. Allows loop parameters to be passed in a few different ways:
		 * - as a number, which is the upper limit of a loop
		 * - as an object, which holds the upper limit and optionally holds lower limit & step
		 * - for functions that only take loop parameters, the lower, upper & step can be passed as separate arguments
		 *
		 *
		 * @param {LoopParams | number} params Loop parameters, or lower limit.
		 * @param {number} [to] Upper limit (exclusive).
		 * @param {?number} [step] Difference between successive values. Can be negative. Defaults to `1` if `from < to`; `-1` if `from > to`.
		 *
		 * @returns {Object}
		 */
		_parameterize(params, to, step) {
			const conds = {
				to: {
					up: {
						continue(i) { return i < this.to; },
						stop(i) { return i >= this.to; },
					},
					down: {
						continue(i) { return i > this.to; },
						stop(i) { return i <= this.to; },
					},
				},
				through: {
					up: {
						continue(i) { return i <= this.to; },
						stop(i) { return i > this.to; },
					},
					down: {
						continue(i) { return i >= this.to; },
						stop(i) { return i < this.to; },
					},
				}
			};
			let cond = conds.to;
			
			if (is_numeric(params)) {
				if (arguments.length == 1) {
					return {
						from: 0,
						to: params,
						step: 1,
						stop: cond.up.stop,
						'continue': cond.up.continue,
					}
				} else {
					params = {
						from: params,
						to: to,
						step: step,
					};
				}
			}
			if (is_undefined(params)) {
				debugger;
			}

			if ('continue' in params) {
				// already processed; don't reprocess.
				return params;
			}

			for (let pre of ['', 'up', 'down']) {
				if (`${pre}thru` in params) {
					params[`${pre}through`] ??= params[`${pre}thru`];
				}
			}
			
			if ('start' in params) {
				params.from ??= params.start ?? 0;
			} else {
				params.from ??= 0;
			}
			if (is_undefined(params.to)) { // handles params passed as numbers
				if ('through' in params) {
					params.to = params.through;
					cond = conds.through;
				} else if ('upthrough' in params) {
					params.to = params.upthrough;
					cond = conds.through;
					params.step = Math.abs(params.step) || 1;
				} else if ('downthrough' in params) {
					params.to = params.downthrough;
					cond = conds.through;
					params.step = -Math.abs(params.step) || -1;
				} else if ('upto' in params) {
					params.to = params.upto;
					params.step = Math.abs(params.step) || 1;
				} else if ('downto' in params) {
					params.to = params.downto;
					params.step = -Math.abs(params.step) || -1;
				} else {
					params.to = params.from;
					params.from = 0;
				}
			}
			if (! params.step) {
				params.step = params.from <= params.to ? 1 : -1;
			}
			if (params.step > 0) {
				if (params.from > params.to) {
					[params.from, params.to] = [params.to, params.from];
				}
				Object.assign(params, cond.up);
			} else {
				if (params.from < params.to) {
					[params.from, params.to] = [params.to, params.from];
				}
				Object.assign(params, cond.down);
			}
			return params;
		},

		async *asyncConcat(...seqs) {
			let result;
			for (let seq of seqs) {
				result = yield* seq;
				if (result > 0) {
					//yield `break ${result}`;
					return result - 1;
				}
			}
		},

		/* CloudFlare chokes on `*concat` */
		concat: function*(...seqs) {
			let result;
			for (let seq of seqs) {
				result = yield* seq;
				if (result > 0) {
					//yield `break ${result}`;
					return result - 1;
				}
			}
		},
		
		/**
		 * Generate a keyed sequence over a single key & sequence.
		 *
		 * @param {string} key
		 * @param {generator | LoopParams | number} vals
		 * @param {object?} obj
		 */
		entry: resettableGenerator(function*(key, vals, obj = {}) {
			let result;
			if (is_iterable(vals)) {
				// reset in case the generator is reused
				('reset' in vals) && vals.reset();
			} else {
				vals = range.over(vals);
			}
			for (let val of vals) {
				obj[key] = val;
				// yield a copy, so future iterations won't affect it
				result = yield {...obj};
				if (result > 0) { // break out of # `result` loops
					yield `break ${result}`;
					// keep breaking out of loops
					return result - 1;
				}
			}
		}, function() {
			('reset' in this.args[1]) && this.args[1].reset();
		}),

		/**
		 * Generate a keyed sequence over multiple keys & sequences.
		 *
		 * @param {Array.<Array.<string, generator  | LoopParams | number>>} entries
		 */
		entries(entries) {
			for (let i in entries) {
				if (! is_iterable(entries[i][1])) {
					entries[i][1] = range.over(entries[i][1]);
				}
			}

			function *_recurse(obj={}, i=0) {
				let entry, result;
				if (i < entries.length) {
					entry = entries[i];
					// need a copy to prevent recursive call from modifying local for subsequent calls
					for (let val of range.entry(entry[0], entry[1], obj)) {
						result = yield* _recurse(val, i+1);
						if (result > 0) { // break out of # `result` loops
							// keep breaking out of loops
							return result - 1;
						}
					}
				} else {
					// yield a copy, so future iterations won't affect it
					result = yield {...obj};
					if (result > 0) {
						// yield to the next() that produced `result`
						yield `break ${result}`;
						// break out of # `result` loops
						return result;
					}
				}
				return 0;
			}

			const _resettable = resettableGenerator(
				_recurse,
				function () {
					for (let entry of entries) {
						'reset' in entry && entry.reset();
					}
				}
			);

			return _resettable();
		},
		/*
		entries: resettableGenerator(function*(entries, obj) {
			let entry, result;
			switch (entries.length) {
			case 0:
				result = yield {...obj};
				if (result > 0) {
					// yield to the next() that produced `result`
					yield `break ${result}`;
					// break out of # `result` loops
					return result;
				}
				break;

			case 1:
				// optimization
				return yield* range.entry(entries[0][0], entries[0][1], obj);
				
			default:
				entry = entries[0];
				// need a copy to prevent recursive call from modifying local for subsequent calls
				entries = entries.slice(1);
				for (let val of range.entry(entry[0], entry[1], obj)) {
					result = yield* range.entries(entries, val);
					if (result > 0) { // break out of # `result` loops
						// keep breaking out of loops
						return result - 1;
					}
				}
				break;
			}
			return 0;
		}, function () {
			for (let entry of this.args[0]) {
				('reset' in entry[1] && entry[1].reset());
			}
		}),
		*/

		filter: resettableGenerator(function*(iter, fn) {
			let result;
			for (let x of iter) {
				if (fn(x)) {
					result = yield x;
					if (result > 0) {
						yield `break ${result}`;
						return result - 1;
					}
				}
			}
		}, function () {
			('reset' in this.args[0]) && this.args[0].reset();
		}),

		
		forVar(v, {lower=1, step, upper={}}={}) {
			let xs;
			if (v in upper) {
				xs = range.over(lower, upper[v], step);
			} else switch (v) {
			case 'i':
				xs = range.over(lower, 100, step);
				break;
			case 'j':
				xs = range.over(lower, 4, step);
				break;
			default:
				xs = range.over(lower, 10, step);
				break;
			}
			/*
			if (pad) {
				pad = ('boolean' == typeof(pad)) ? 2 : +pad;
				xs = range.map(xs, x => x.toString().padStart(pad, '0'));
			}
			*/
			return xs;
		},
		
		forVars(vars, opts={}) {
			let ranges = {};
			for (let v of vars) {
				ranges[v] = this.forVar(v, opts);
			}
			return range.keyed(ranges);
		},

		/** 
		 * Generate pairs of a string broken at successive separators.
		 *
		 * Example:
		 *
		 *     *halves('foo_bar_baz', '_');
		 *     // generates ['foo', 'bar_baz'], ['foo_bar', 'baz']
		 */
		*halves(string, sep) {
			if (sep instanceof RegExp) {
				yield* range.halvesByRe(string, sep);
			} else {
				yield* range.halvesByStr(string, sep);
			}
		},

		*halvesByRe(string, reSep) {
			let tail = halveString(string, reSep, {include:0}),
				halves = [tail[0], tail[tail.length - 1]],
				result;
			while (tail.length > 1 && halves[1]) {
				result = yield halves.slice(0, 2);
				if (result > 0) {
					yield `break ${result}`;
					return result - 1;
				}
				// add the previous separator
				halves[0] += tail[1];
				tail = halveString(halves[1], reSep, {include:0});
				halves[0] += tail[0];
				halves[1] = tail[tail.length - 1];
			}
		},

		*halvesByStr(string, sep) {
			// Just in case
			sep = sep.toString();
			let halves = halveString(string, sep),
				tail,
				result;
			while (halves.length > 1 && halves[1]) {
				// yield a copy
				result = yield halves.slice(0, 2);
				if (result > 0) {
					yield `break ${result}`;
					return result - 1;
				}
				tail = halveString(halves[1], sep);
				halves[0] += sep + tail[0];
				halves[1] = tail[1];
			}
		},

		/**
		 * whether loop parameters have an end parameter (e.g. to, through, ...).
		 */
		hasEnd(params) {
			return this._ends.some(end => end in params);
		},

		/**
		 * Generate a keyed sequence over multiple sequences.
		 *
		 * @param {{key: generator | LoopParams | number, ...}} entries
		 */
		keyed: resettableGenerator(function*(obj) {
			return yield* range.entries(Object.entries(obj));
		}, function () {
			for (let iter of this.args[0]) {
				('reset' in iter && iter.reset());
			}
		}),
		
		/**
		 * Generate a keyed sequence with key `key` and values ranging from `from` to `to`.
		 *
		 * @param {string} key Key of result object to hold sequence values.
		 * @param {LoopParams} params Loop parameters.
		 * @param {object?} vals Object to extend & yield. Defaults to `{}`.
		 */
		keyOver: resettableGenerator(function*(key, params, vals = {}) {
			params = range._parameterize(params);
			let result;
			for (let i = params.from; params.continue(i); i += params.step) {
				vals[key] = i;
				result = yield vals;
				if (result > 0) {
					yield `break ${result}`;
					return result - 1;
				}
			}
		}),
		
		/* *
		 * Generate a keyed sequence with keys from `keys` and values ranging from `from` to `to`. 
		 *
		 * @param {string[]} keys Keys of result object to hold sequence values.
		 * @param {LoopParams} params Loop parameters.
		 */
		keysOver: resettableGenerator(function*(keys, params) {
			params = range._parameterize(params);

			let key, vals, result;
			switch (keys.length) {
			case 0:
				break;

			case 1:
				yield* this.keyOver(keys[0], params);
				break;
				
			default:
				key = keys[0];
				keys = keys.slice(1);
				for (let val of this.keysOver(keys, params)) {
					result = yield* this.keyOver(key, params, val);
					if (result > 0) {
						return result - 1;
					}
				}
				break;
			}
		}),

		map: resettableGenerator(function*(iter, fn) {
			let result;
			for (let x of iter) {
				result = yield fn(x);
				if (result > 0) {
					yield `break ${result}`;
					return result - 1;
				}
			}
		}, function () {
			'reset' in this.args[0] && this.args[0].reset();
		}),


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
		 * @param {LoopParams | number} params Loop parameters, or lower limit.
		 * @param {number} [to] Upper limit (exclusive).
		 * @param {?number} [step] Difference between successive values. Can be negative. Defaults to `1` if from < to; `-1` if from > to.
		 */
		over: function (params, to, step) {
			params = range._parameterize(...arguments);
			let i = params.from;
			return {
				next(value) {
					// break protocol
					if (value > 0) {
						// prevent future iterations (unless `reset` is called)
						//i = params.to + params.step;
						return {value: value - 1, done: true};
					}
					// loop test
					if (params.stop(i)) {
						return {value: undefined, done: true};
					} else { // loop body
						// if step < 0, i += step decrements
						let next = { value: i, done: false };
						i += params.step;
						return next;
					}
				},
				
				reset() {
					i = params.from;
				},

				[Symbol.iterator]() { return this; },
			};
		},

		/**
		 * Loop over multiple indices.
		 *
		 * Example:
		 *
		 *     var A = Array.from({length:10}, () => []);
		 *     for (let [i,j] of range.overAll([10, 10])) {
		 *         A[i][j] = 0;
		 *     }
		 *
		 * Passing a number into {Generator.next} breaks out that many levels. It will not otherwise consume any elements from the generator, and this call to `next` won't return a sensible value (it should be ignored).
		 *
		 * Example:
		 *
		 *     // A is a jagged tensor
		 *     function missing(A, ...rest) {
		 *         let lvl = 0;
		 *         for (let i of rest) {
		 *             if (! (i in A)) {
		 *                 return rest.length - lvl;
		 *             }
		 *             ++lvl;
		 *         }
		 *         return 0;
		 *     }
		 *     let idxs = range.overAll([10, 10, 10]);
		 *     for (let [i,j,k] of idxs) {
		 *         let skip = missing(A, i, j, k);
		 *         if (skip) idxs.next(skip);
		 *         else A[i,j,k] += 1;
		 *     }
		 *
		 * @param {(LoopParams|number)[]} paramses Multiple loop parameters.
		 * @param {number[]} front Internal
		 * @param {number} end Internal
		 */
		overAll(paramses) {
			paramses = paramses.map(param => range._parameterize(param));

			function* _recurse(front=[], end=0) {
				let result;
				if (end < paramses.length) {
					let params = paramses[end];
					for (let i = params.from; params.continue(i); i += params.step) {
						front[end] = i;
						result = yield* _recurse(front, end+1);
						if (result > 0) {
							// keep breaking out of # `result` loops
							return result - 1;
						}
					}
				} else {
					result = yield front.slice();
					if (result > 0) {
						// yield to the next() that produced `result`
						yield `break ${result}`;
						// break out of # `result` loops
						return result;
					}
				}
			}
			const _resettable = resettableGenerator(_recurse);

			return _resettable();
		},
	};
