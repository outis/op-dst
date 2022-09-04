	/**
	 * Bind all methods in an object to a given object.
	 *
	 * @param {object} obj - object containing methods
	 * @param {object} [self=obj] - object to bind those methods to
	 */
	function bindAll(obj, self) {
		bindSome(obj, Object.keys(obj /*??*/|| {}), self);
	}

	/**
	 * Bind the given methods in an object to a given object.
	 *
	 * @param {object} obj - object containing methods
	 * @param {string} methods - method names to bind
	 * @param {object} [self=obj] - object to bind those methods to
	 */
	function bindSome(obj, methods, self) {
		//self ??= obj;
		self || (self = obj);
		for (let method of methods) {
			if (is_function(obj[method])) {
				obj[method] = obj[method].bind(self);
			}
		}
	}

	const {breakString, halveString} = (function () {

		/* helper functions */
		function breaker(string, sep, matcher, opts={include:1}) {
			let i = matcher(string, sep),
				parts = [string];
			if (i) {
				parts[0] = string.substring(0, i.index);
				parts.push(...i.match.slice(opts.include).filter(x => x));
				parts.push(string.substring(i.index + i.length));
				parts.groups = i.match.groups;
			}
			return parts;
		}

		function matchRegex(string, sep) {
			let match = string.match(sep);
			if (match) {
				return {
					index: match.index,
					length: match[0].length,
					match,
				};
			}
		}

		function matchString(string, sep) {
			let index = string.indexOf(sep);
			if (index > -1) {
				return {index, length: sep.length, match:[sep]};
			}
		}

		function chooseMatcher(sep) {
			if (sep instanceof RegExp) {
				return matchRegex;
			} else {
				return matchString;
			}
		}

		/**
		 * Break a string into parts.
		 *
		 * Like `String.split`, but can set a limit on the number of breaks. Note that
		 * this is a hard limit for string separators, but a soft limit for RegExp
		 * separators. For string separators, there will be no more than <var>limit</var> returned parts, and the limit is only reached if the separator occurs more than <var>limit</var> times. For regexp separators, *the separators are included* in the results.
		 *
		 * <var>options.include</var> requires a little explanation. Ultimately, this option is an index into the matches against the separator. With a string separator, there's only a single match (the entire separator), so `0` will include the separator and anything larger will exclude it. With a regex separator, a number is basically the group number, and all groups of that number or higher will be included in the results; a `0` will include the entire match and all groups, `1` just the capturing groups. Boolean values for `options.include` will get translated to numbers appropriate for the separator type. In particular, `true` for RegExp separators will include just capturing groups (but not the entire match), and will include the separator for string separators. The default is 1, which results in excluding the entire match but including capturing groups (if any), which is probably the most generally .
		 *
		 * Examples:
		 *
		 *     breakString('foo_bar_baz_bam', '_', 3);
		 *     # ['foo', 'bar', 'baz_bam']
		 *     breakString('foo_bar_baz_bam', /_/, 3);
		 *     # ['foo', 'bar', 'baz_bam']
		 *     breakString('foo_bar_baz_bam', /(_)/, 3);
		 *     # ['foo', '_', 'bar', '_', 'baz_bam']
		 *     breakString('foo_bar_baz_bam', /_/, true);
		 *     # ['foo', 'bar', 'baz', 'bam']
		 *     breakString('foo_bar_baz_bam', /_/, {include: 0, limit: 3});
		 *     # ['foo', '_', 'bar', '_', 'baz_bam']
		 *
		 *     breakString('a 7 / 10 solution', / *(\d+) *\\\/ *(\d+) *\/);
		 *     # ['a', '7', '10', ' solution']
		 *     breakString('a 7 / 10 solution', / *(\d+) *\\\/ *(\d+) *\/, {include:0});
		 *     # ['a', ' 7 / 10 ', '7', '10', 'solution']
		 *     breakString('a 7 / 10 solution', / *((\d+) *\\\/ *(\d+)) *\\/);
		 *     # ['a', '7 / 10', '7', '10', 'solution']
		 *     breakString('a 7 / 10 solution is 80% effective', / *(\d+) *(?:\/ *(\d+) *|% *)?/);
		 *     # ['a', '7', '10', 'solution is', '80', 'effective'];
		 *
		 * @param {string} string
		 * @param {string | RegExp} sep
		 * @param {Object} [options]
		 * @param {number} [options.limit] If provided, sets the limit on the number of breaks.
		 * @property {boolean|number} [options.include=1] Whether to include any matched groups from the separator. By default, includes all capturing groups (but not entire match) for RegExp separators, and excludes the match for string separators.
		 *
		 * @returns {Array} <var>string</var> separated at each <var>sep</var> into at most <var>limit</var> pieces. If <var>sep</var> is a RegExp with named groups, they will be included in a `groups` property of the result (an array of groups for each match).
		 */
		function breakString(string, sep, opts={}) {
			let {limit, include=1} = opts,
				nParts = 1; // increases with each break
			if ('number' === typeof(opts)) {
				limit = opts;
			} else if ('boolean' === typeof(opts)) {
				include = opts;
			}
			if ('boolean' === typeof(include)) {
				// regex: include from 1; string: include from 0
				include = include ? (sep instanceof RegExp) : Infinity;
			}

			let all = (is_undefined(limit)),
				parts = [string],
				halves, matcher;

			matcher = chooseMatcher(sep);
			parts.groups = [];

			/* core functionality */
			while (all || (nParts < limit)) {
				halves = breaker(parts[parts.length-1], sep, matcher, {include});
				if (halves.groups) {
					parts.groups[nParts-1] = halves.groups;
				}
				++nParts; // each break adds a part
				if (halves.length < 2) {
					// no separator match, so nothing left to break
					break;
				}
				// replace last part (which is being split)
				parts.splice(-1, 1, ...halves);
			}
			return parts;
		}
		globals.breakString = breakString;

		function halveString(string, sep, opts={include:1}) {
			let matcher = chooseMatcher(sep);
			//opts.include ??= 1;
			opts.include || (opts.include = 1);
			return breaker(string, sep, matcher, opts);
		}
		globals.halveString = halveString;

		return {breakString, halveString};
	})();

	/**
	 * Apply a collection of functions, returning non-`undefine`d results.
	 *
	 * Different from {@link callAllFunctions} in that this is variadic in <var>args</var>, while the other takes an array for arguments.
	 *
	 * @param {Function[]} funcs - functions to call
	 * @param {*[]} [args] - arguments to pass to functions
	 *
	 * @returns {*[]}
	 */
	function applyAllFunctions(funcs, args) {
		return funcs.map(f => f(...args)).filter(r => ! is_undefined(r));
	}

	/**
	 * Apply methods of a collection of objects.
	 *
	 * Equivalent to the following, if it were valid in JS:
	 *     obj[...keys][func](..args);
	 *
	 * Different from {@link callForAll} in that this takes an array for arguments, while the other is variadic in <var>args</var>. This function can also optionally either stop at the first exception (throwing it), or call all functions and collect any exceptions, throwing them only at the end.
	 *
	 * The functions can be indicated to be <var>related</var>, which will stop processing if any function throws an exception. If functions are unrelated, any thrown exceptions are collected, and only thrown (as a collection) after all functions have been invoked.
	 *
	 * @param {object} obj - Collection of objects.
	 * @param {string[]} keys - Property names of <var>obj</var>.
	 * @param {string} func - Method name.
	 * @param {*[]} [args] - Method arguments.
	 * @param {object} [options] - Options affect the calling of functions.
	 * @param {boolean} [options.related] - Whether or not the functions are related.
	 *
	 * @returns {*[]} Return values of each function, indexed by object name.
	 */
	function applyForAll(obj, keys, func, args=[], {related=false}={}) {
		let results = [],
			exceptions = Object.defineProperties(
				{}, {
					length: {
						value: 0,
						writable: true,
					},
					results: {
						value: results,
					},
				});
		for (let key of keys) {
			if (is_function(obj[key][func])) {
				try {
					results[key] = obj[key][func](...args);
					results.push(results[key]);
				} catch (err) {
					if (related) {
						err.for = key;
						err.results = results;
						throw err;
					}
					results.push(undefined);
					exceptions[key] = err;
					++exceptions.length;
				}
			}
		}
		if (exceptions.length) {
			if (1 == exceptions.length) {
				throw Object.values(exceptions)[0];
			}
			throw exceptions;
		}
		return results;
	}

	/**
	 * Call a collection of functions, returning non-`undefine`d results.
	 *
	 * Different from {@link applyAllFunctions} in that this is variadic in <var>args</var>, while the other takes an array for arguments.
	 *
	 * @param {Function[]} funcs - functions to call
	 * @param {*[]} [args] - arguments to pass to functions
	 *
	 * @returns {*[]}
	 */
	function callAllFunctions(funcs, ...args) {
		return funcs.map(f => f(...args)).filter(r => ! is_undefined(r));
	}

	/**
	 * Call methods of a collection of objects.
	 *
	 * Equivalent to the following, if it were valid in JS:
	 *     obj[...keys][func](..args);
	 *
	 * Different from {@link applyForAll} in that this is variadic in <var>args</var>, while the other takes an array for arguments.
	 *
	 * @param {object} obj - Collection of objects.
	 * @param {string[]} keys - Property names of <var>obj</var>.
	 * @param {string} func - Method name.
	 * @param {*[]} [args] - Method arguments.
	 *
	 * @returns {*[]} Return values of each function, indexed by object name.
	 */
	function callForAll(obj, keys, func, ...args) {
		return applyForAll(obj, keys, func, args);
	}

	/**
	 * Combine two arrays into an object, using one for keys and another for values.
	 *
	 * @param {string[]} keys
	 * @param {*} values
	 *
	 * @returns {object}
	 */
	function zipObject(keys, values) {
		let result = {};
		for (let i = 0; i < keys.length; ++i) {
			result[keys[i]] = values[i];
		}
		return result;
	}

	function copy(thing) {
		if (Array.isArray(thing)) {
			return [...thing]; // Array.from(thing);
		} else if (is_object(thing)) {
			return {...thing}; // Object.assign({}, thing);
		}
		return thing;
	}
	globals.copy = copy;

	function copyAll(things) {
		return things.map(copy);
	}
	globals.copyAll = copyAll;

	/**
	 * Fill an object with a single value for multiple keys.
	 *
	 * @param {string[]} keys
	 * @param value
	 * @param {Object} target Object to add entries to.
	 */
	function fillObject(keys, value, target = {}) {
		if (! (keys instanceof Array || Array.isArray(keys))) {
			keys = Object.keys(keys);
		}
		for (let key of keys) {
			target[key] = value;
		}
		return target;
	}

	/**
	 * Replace properties referring to other properties with those property values.
	 *
	 * Allows methods to be duplicated:
	 *     obj = derefProperties({
	 *         foo() { return 'foobar'; },
	 *         bar: 'foo',
	 *     });
	 *     obj.bar(); // 'foobar'
	 */
	function derefProperties(obj) {
		for (let [name, value] of Object.entries(obj /*??*/|| {})) {
			while (value in obj) {
				value = obj[name] = obj[value];
			}
		}
		return obj;
	}

	/**
	 * Add a value to an object property.
	 *
	 * Instead of overwriting existing properties, they're converted to arrays (if necessary) and the new value is added to the array.
	 *
	 * @param {Object} Object to add value to.
	 * @param {string} key
	 * @param {*} value
	 */
	function mergeVal(obj, key, val) {
		if (key in obj) {
			if (Array.isArray(obj[key])) {
				obj[key].push(val);
			} else {
				obj[key] = [obj[key], val];
			}
		} else {
			obj[key] = val;
		}
	}

	/**
	 * Copies properties from source objects if they either don't already exist at the destination, or exist but are falsey.
	 */
	function mergeObjects(dest, ...srcs) {
		for (let src of srcs) {
			for (let [k, v] of Object.entries(src)) {
				if (! (k in dest && dest[k])) {
					dest[k] = v;
				}
			}
		}
		return dest;
	}

	/**
	 * Copies properties from source objects if they don't already exist at the destination.
	 */
	function mixIn(dest, ...srcs) {
		for (let src of srcs) {
			for (let [k, v] of Object.entries(src)) {
				if (! (k in dest)) {
					dest[k] = v;
				}
			}
		}
		return dest;
	}

	function filterObject(obj, pred) {
		const filtered = {};
		for (const [key, value] of Object.entries(obj)) {
			if (pred(value, key)) {
				filtered[key] = value;
			}
		}
		return filtered;
	}
	globals.filterObject = filterObject;
	/**
	 * Exchange keys & values.
	 *
	 * Different keys for the same value get merged into an array. Array values get unpacked into multiple keys.
	 *
	 * Example:
	 *     flipObject({keys: 'str', names: 'str', xs: ['nums', 'ints']});
	 *     // result is:
	 *     {str: ['keys', 'names'], nums: 'xs', ints: 'xs'};
	 */
	function flipObject(obj) {
		const result = {};
		for (const [key, val] of Object.entries(obj)) {
			if (Array.isArray(val)) {
				for (let v of val) {
					mergeVal(result, v, key);
				}
			} else {
				mergeVal(result, val, key);
			}
		}
		return result;
	}

	function mapObject(obj, fn) {
		const result = {};
		for (let [key, value] of Object.entries(obj)) {
			let mapped = fn(value, key);
			if (is_object(mapped)) {
				// NOOP
			} else if (Array.isArray(mapped)) {
				[key, value] = mapped;
				mapped = {[key]: value}
			} else {
				// ?
				mapped = {[key]: mapped};
			}
			Object.assign(result, mapped);
		}
		return result;
	}

	/**
	 * Picks properties from an object based on property names.
	 *
	 * Similar to {@link filterObject}, but filters by selecting properties that match the given names.
	 *
	 * @param {string[]} keys - Property names to retrieve.
	 *
	 * @returns {Object}
	 */
	function pickObject(obj, keys) {
		return Object.fromEntries(keys.map(k => [k, obj[k]]));
	}


	/**
	 * Run code that awaits this function before the next repaint.
	 *
	 * Async version of `requestAnimationFrame()`. Helps you avoid callback hell. Note that since this only guarantees to run following code before the next repaint, if you need to separate two pieces of code by a frame, this can't guarantee that; instead, use {@link animationPost()}.
	 *
	 * @async
	 * @returns {DOMHighResTimeStamp} resumption time
	 */
	function animationFrame() {
		return new Promise(resolve => {
			let reqId = requestAnimationFrame((...args) => {
				resolve(...args);
			});
		});
	}
	globals.animationFrame = animationFrame;

	/**
	 * Ensures at least one animation frame occurs before continuing.
	 *
	 * Asynchronous; you must await this function.
	 *
	 * @async
	 */
	function animationPost() {
		return new Promise(resolve => {
			requestAnimationFrame(() => {
				// could also use `await wait(0)`
				setTimeout(resolve, 0);
			});
		});
	}
	globals.animationPost = animationPost;

	/**
	 * Await an event.
	 *
	 * Async equivalent to a one-time event handler.
	 *
	 * @param {HTMLElement | jQuery} elt - elements to listen for event on
	 * @param {string} name - event name
	 * @param {string} [selector] - selector to filter the descendents of <var>elt</var> that trigger the event
	 * @param {*} [data] - data to be passed via event.data
	 *
	 * @async
	 * @returns {Event} {@link https://api.jquery.com/Types/#Event jQuery event}
	 */
	function waitOn(elt, name, selector, data) {
		let $elt = $(elt);
		return new Promise(resolve => {
			$elt.one(name, selector, data, resolve);
		});
	}
	globals.waitOn = waitOn;

	/**
	 * Wait for the given number of milliseconds.
	 *
	 * Async version of `setTimeout()`.
	 *
	 * @param {number} time - Time to wait, in milliseconds.
	 *
	 * @async
	 */
	function wait(time) {
		return new Promise(resolve => {
			setTimeout(resolve, time);
		});
	}
	globals.wait = wait;

	/**
	 */
	function memoize(f) {
		var results = {};

		function _memoized(name, ...args) {
			if (! (name in results)) {
				results[name] = f.call(this, name, ...args);
			}
			return results[name];
		}

		_memoized.original = f;
		f.results = results;

		return _memoized;
	}

	/**
	 * The number of digits in a number.
	 */
	/* Not currently used
	function nDigits(x) {
		return Math.floor(1 + Math.log10(x));
	}
	*/

	/**
	 * Return where a child node is among its parent's children.
	 */
	function nodeIndex(node) {
		return Array.prototype.indexOf.call(node.parentNode.children, node);
	}


	/**
	 * Test whether the given element has an ancestor with the given class (making it of that kind).
	 *
	 * @param {string | string[]} kind Class names to test.
	 * @param {HTMLElement} elt
	 */
	function is_kind(kind, elt) {
		let $elt = $(elt);
		if (is_string(kind)) {
			return $elt.closest(`.${kind}`).length;
		} else {
			return kind.find(kind => $elt.closest(`.${kind}`).length);
		}
	}

	/* Not currently used
	function is_ability(elt) {
		return is_kind('abilities', elt);
	}

	function is_advantage(elt) {
		return is_kind('advantages', elt);
	}

	function is_attribute(elt) {
		return is_kind('attributes', elt);
	}
	*/

	function is_flag(elt, value) {
		return elt.type == 'checkbox'
			|| /\bcheckbox\b/.test(elt.className)
			|| 'boolean' === typeof(value);
	}

	/* Not currently used
	function is_included(name) {
		return name in included;
	}
	*/

	function is_function(value) {
		return 'function' === typeof(value);
	}

	function is_hex_rational(value) {
		return /^\s*(?:0x[\da-f]+|\d+)\s*\/\s*(?:0x[\da-f]+|\d+)\s*$/i.test(value);
	}

	function is_iterable(value) {
		return 'object' === typeof(value)
			&& 'function' === typeof(value.next);
	}

	function is_numeric(value) {
		return 'number' === typeof(value)
			|| /^ *[-+]? *\d+(?:\.\d+)? *$/.test(value);
	}

	function is_object(value) {
		return 'object' === typeof(value)
			&& ! (value instanceof String);
	}

	function is_real(value) {
		return ! Number.isNaN(value) && is_numeric(value);
	}

	function is_rational(value) {
		return /^\s*\d+\s*\/\s*\d+\s*$/.test(value);
	}

	function is_string(value) {
		return 'string' === typeof(value)
			|| value instanceof String;
	}

	function is_undefined(value) {
		return 'undefined' === typeof(value);
	}

	/* Add the given field kinds to the kinds that should use pips. */
	function addPippedKinds(...kinds) {
		pippedKinds.push(...kinds);
	}

	/* Sets the kinds of fields that should use pips. */
	function setPippedKinds(kinds) {
		pippedKinds = kinds;
	}

	function stripHtml(source) {
		var doc = new DOMParser().parseFromString(source, "text/html");
		return doc.documentElement.textContent;
	}

	function stripBreaks(source) {
		return source.replace(/<(p)[^>]*\/?>/g, '').replace(/<(\/p|br)[^>]*\/?>\n+/g, "\n");
	}

	/*** jQuery extensions */
	// TODO: feature-add methods that take multiple selectors, and return which has closer matching descendents (i.e. `closer()` for descendents)

	/**
	 * The closest element(s) that match the given predicate.
	 *
	 * Supports ':scope' in predicate (so that elements can be filtered based on descendents).
	 *
	 * Example:
	 *     // get the closest ancestors of `<div>`s that have a `<template>` child.
	 *     $('div').closestHaving('*', ':scope > template');
	 *
	 * @param {string} sel Selector for elements to match.
	 * @param {string|* => boolean} Predicate to filter elements.
	 */
	$.fn.closestHaving = function(sel, pred) {
		if (is_string(pred)) {
			// to support ':scope'
			let psel = pred;
			pred = (i, node) => node.querySelector(psel);
		}
		let $nodes = this,
			$candidates = {};

		for (;
			 $nodes.length && ! $candidates.length;
			 $nodes = $nodes.parent().closest(sel))
		{
			$candidates = $nodes.filter(pred);
		};
		return this.pushStack($candidates);
		//return $candidates;
	};
	$.fn.waitOn = async function (name) {
		await waitOn(this, name);
	};

	if ($.event.fixHooks) {
		const toCopy = ['dataTransfer'];
		function copyEventProps(name, toCopy) {
			if ($.event.fixHooks[name]) {
				if ($.event.fixHooks[name].props) {
					let props = new Set($.event.fixHooks[name].props);
					for (let prop of toCopy) {
						props.add(prop);
					}
					$.event.fixHooks[name].props = [...props.values()];
				} else {
					$.event.fixHooks[name].props = toCopy;
				}
			} else {
				$.event.fixHooks[name] = {
    				props: toCopy,
				};
			}
		}
		// copy dataTransfer property from native event. Only necessary for < v3
		copyEventProps('dragstart', toCopy);
		copyEventProps('dragenter', toCopy);
		copyEventProps('dragend', toCopy);
		//copyEventProps('drop', toCopy);
	}
	/**
	 * Return which selectors are matched by a closest (i.e. the node or ancestor)node from this.
	 *
	 * @param {string[]} sels Selectors.
	 *
	 * @returns {undefined|string|string[]} Returns multiple selectors if they each matched the same ancestors.
	 */
	$.fn.closer = function(...sels) {
		let $nodes = this,
			matches = [];
		for (; $nodes.length && ! matches.length; $nodes = $nodes.parent()) {
			matches = sels.filter(sel => $nodes.filter(sel).length);
		};
		if (matches && matches.length < 2) {
			return matches[0];
		}
		return matches;
	};
	$.fn.findClosest = function (...sels) {
	};
	/**
	 * Determine whether the matched elements have all of the given classes.
	 */
	$.fn.hasEveryClass = function (...classes) {
		return classes.every(cls => this.hasClass(cls));
	};
	/**
	 * Determine whether the matched elements have any of the given classes.
	 */
	$.fn.hasSomeClass = function (...classes) {
		return classes.some(cls => this.hasClass(cls));
	};
	/**
	 * Change the descendant selector for a delegated event.
	 */
	$.fn.redelegate = function(event, original, replacement) {
		let elt = this[0],
			handlers = ($._data(this[0], 'events') /*??*/|| {})[event] /*??*/|| [];
		for (let handler of handlers) {
			if (original == handler.selector) {
				handler.selector = replacement;
			}
		}
		return this;
	};
	if (! ('even' in $.fn)) {
		// older version of jQuery
		$.fn.even = function() {
			return this.pushStack( jQuery.grep( this, function( _elem, i ) {
				return ( i + 1 ) % 2;
			} ) );
		};
		$.fn.odd = function() {
			return this.pushStack( jQuery.grep( this, function( _elem, i ) {
				return i % 2;
			} ) );
		};
	}
	if (! (Symbol.iterator in $.fn)) {
		$.fn[Symbol.iterator] = function* () {
			for (let i = 0; i < this.length; ++i) {
				yield this[i];
			};
		};
	}
	if (! ('map' in Object.prototype)) {
		Object.defineProperties(Object.prototype, {
			map: {
				value: function (fn) {
					let result = Object.create(this);
					for (let p in this) {
						result[p] = fn(this[p]);
					}
					return result;
				},
			},
			mapKeys: {
				value: function (fn) {
					let result = Object.create(this);
					for (let p in this) {
						result[fn(p)] = this[p];
					}
					return result;
				},
			},
			mapEntries: {
				value: function (fn) {
					let result = Object.create(this),
						key, value;
					for (let p in this) {
						[key, value] = fn(p, this[p]);
						result[key] = value;
					}
					return result;
				}
			},
		});
	}
	if (! ('capitalize' in String.prototype)) {
		String.prototype.capitalize = function() {
			return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
		};
		String.prototype.titleCase = function() {
			return this.replace(
					/\b(\w)(\w*)/g,
				function (_, a, b) {
					return a.toUpperCase() + b.toLowerCase();
				});
			//return this.toLowerCase().ucwords();
		};
		String.prototype.dromedaryCase = function ({spaces=true}={}) {
			let pattern;
			if (spaces) {
				pattern = /[-_ ]+([a-z])/ig; // /\W+([a-z])/i;
			} else {
				pattern = /[-_]+([a-z])/ig;
			}
			return this.replace(
					pattern,
				function (_, a) {
					return a.toUpperCase();
				}
			);
		};
		String.prototype.ucfirst = function() {
			return this.charAt(0).toUpperCase() + this.substr(1);
		};
		String.prototype.ucwords = function() {
			return this.replace(/\b\w/g, function (m) {return m.toUpperCase();});
		};
	}

	if (! ('cmp' in String.prototype)) {
		if ('localeCompare' in String.prototype) {
			String.prototype.cmp = function(b) {
				return this.localeCompare(b);
			};
		} else {
			String.prototype.cmp = function(b) {
				return (a < b)
					? -1
					: +(a > b);
			};
		}
	}

	if (! ('splice' in String.prototype)) {
		/**
		 * Replace a section of a string with another.
		 *
		 * Similar to Array.splice, but doesn't modify string in-place, and handles negative amounts differently.
		 *
		 * @param {number} start - Starting index. Negative amounts are relative to end of string.
		 * @param {number} [deleteCount] - Count of characters to deltete. Negative amounts results in duplicate characters (counting back from `start`). By default, deletes through end of string.
		 * @param {string} [items] - Replacement string.
		 *
		 * @returns {string} Modified string.
		 */
		String.prototype.splice = function(start, deleteCount, items='') {
			if (is_string(deleteCount)) {
				items = deleteCount;
				deleteCount = null;
			}
			//deleteCount ??= this.length;
			deleteCount || (deleteCount = this.length);
			return this.slice(0, start) + items + this.slice(start + deleteCount);
		};
	}

	if (! ('bits' in Math)) {
		Math.bits = function (x) {
			return 1 + Math.floor(Math.log2(x));
		}
	}
	if (! ('digits' in Math)) {
		Math.digits = function (x) {
			return 1 + Math.floor(Math.log10(x));
		}
	}
