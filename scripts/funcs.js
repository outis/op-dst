	/**
	 * Fill an object with a single value for multiple keys.
	 *
	 * @param {[string]} keys
	 * @param value
	 * @param {object} target Object to add entries to.
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
	 * Add a value to an object property. 
	 *
	 * Instead of overwriting existing properties, they're converted to arrays (if necessary) and the new value is added to the array.
	 *
	 * @param {object} keys
	 * @param {string} key
	 * @param value
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
	 * Copies properties from source objects if they don't already exist at the destination.
	 */
	function mixIn(dest, ...srcs) {
		for (let src of srcs) {
			for (let [k, v] of Object.entries[src]) {
				if (! (k in dest)) {
					dest[k] = v;
				}
			}
		}
		return dest;
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
		let result = {};
		for (let [key, val] of Object.entries(obj)) {
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

	/**
	 */
	function memoize(f) {		
		var results = {};
		
		return function (name, ...args) {
			if (! (name in results)) {
				results[name] = f.bind(this)(name, ...args);
			}
			return results[name];
		}
	}
	
	/**
	 * The number of digits in a number.
	 */
	function nDigits(x) {
		return Math.floor(1 + Math.log10(x));
	}

	/**
	 * Return where a child node is among its parent's children.
	 */
	function nodeIndex(node) {
		return Array.prototype.indexOf.call(node.parentNode.children, node);
	}

	/**
	 * Test whether the given element has an ancestor with the given class (making it of that kind).
	 *
	 * @param {string | [string]} kind Class names to test.
	 * @param {HTMLElement} elt
	 */
	function is_kind(kind, elt) {
		let $elt = $(elt);
		if ('string' == typeof(kind)) {
			return $elt.closest(`.${kind}`).length;
		} else {
			return kind.find(kind => $elt.closest(`.${kind}`).length);
		}
	}

	function is_ability(elt) {
		return is_kind('abilities', elt);
	}

	function is_advantage(elt) {
		return is_kind('advantages', elt);
	}
	
	function is_attribute(elt) {
		return is_kind('attributes', elt);
	}

	function is_flag(elt, name, value) {
		return elt.type == 'checkbox'
			|| elt.className.match(/\bcheckbox\b/)
			|| 'boolean' == typeof(value);
	}

	function is_included(name) {
		return name in included;
	}

	function is_undefined(value) {
		return 'undefined' == typeof(value);
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
	$.fn.closestHaving = function(sel, pred) {
		if ('string' == typeof(pred)) {
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
		return $candidates;
	};
