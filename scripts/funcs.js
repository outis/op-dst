	/**
	 *
	 */
	function bindAll(obj, self) {
		for (let method in obj) {
			if (is_function(obj[method])) {
				obj[method] = obj[method].bind(self);
			}
		}
	}
	
	/**
	 * Break a string into parts.
	 *
	 * Like `String.split`, but can set a limit on the number of breaks. Note that
	 * this is a hard limit for string separators, but a soft limit for RegExp
	 * separators. For string separators, there will be no more than <var>limit</var> returned parts, and the limit is only reached if the separator occurs more than <var>limit</var> times. For regexp separators, *the separators are included* in the results.
	 *
	 * @param {string} string
	 * @param {string | RegExp} sep 
	 * @param {Object} [options]
	 * @param {number} [options.limit] If provided, sets the limit on the number of breaks.
	 * @property {boolean} [options.include=true] Whether to include any matched from the separator.
	 *
	 * @returns {Array} <var>string</var> separated at each <var>sep</var> into at most <var>limit</var> pieces.
	 */
	function breakString(string, sep, opts={}) {
		let {limit, include=(sep instanceof RegExp)} = opts;
		if ('number' === typeof(opts)) {
			limit = opts;
		} else if ('boolean' === typeof(opts)) {
			include = opts;
		}
			
		let all = (is_undefined(limit)),
			parts = [string],
			halves, matcher;

		/* helper functions */
		function breaker(string, sep) {
			let i = matcher(string, sep),
				parts = [string];
			if (i) {
				parts[0] = string.substring(0, i.index);
				parts.push(...i.keep);
				parts.push(string.substring(i.index + i.length));
			}
			return parts;
		}
		if (sep instanceof RegExp) {
			matcher = function (string, sep) {
				let match = string.match(sep);
				if (match) {
					return {
						index: match.index,
						length: match[0].length,
						keep: match,
					};
				}
			};
		} else {
			matcher = function (string, sep) {
				let index = string.indexOf(sep);
				if (index > -1) {
					return {index, length: sep.length, keep:[sep]};
				}
			};
		}

		/* core functionality */
		while (all || (parts.length < limit)) {
			halves = breaker(parts[parts.length-1], sep);
			if (halves.length < 2) {
				break;
			}
			parts[parts.length-1] = halves[0];
			if (include) {
				parts.push(...halves.slice(1, -1));
			}
			parts.push(halves[halves.length - 1]);
		}
		return parts;
	}
	globals.breakString = breakString;

	function copy(thing) {
		if (is_object(thing)) {
			return {...thing}; // Object.assign({}, thing);
		} else if (Array.isArray(thing)) {
			return [...thing]; // Array.from(thing);
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
		for (let [name, value] of Object.entries(obj)) {
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
		for (const [key, value] of object.entries(obj)) {
			if (pred(value, key)) {
				filtered[key] = value;
			}
		}
		return filtered;
	}
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
		if ('string' === typeof(kind)) {
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

	function is_flag(elt, name, value) {
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

	function is_iterable(value) {
		return 'object' === typeof(value)
			&& 'function' === typeof(value.next);
	}

	function is_numeric(value) {
		return 'number' === typeof(value)
			|| /^ *\d+(?:\.\d+)? *$/.test(value);
	}

	function is_object(value) {
		return 'object' === typeof(value);
	}

	function is_real(value) {
		return ! Number.isNaN(value) && is_numeric(value);
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
		if ('string' === typeof(pred)) {
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
