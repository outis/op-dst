	/**
	 * Resolves among strings, HTML elements and jQuery objects, allowing mixed types to be passed to a function.
	 *
	 * Note that to get a name for other things, the client must implement {@link this.name}.
	 *
	 * @mixin
	 */
	let resolver = {
		/**
		 * @typedef {Object} Resolved
		 * @property {string} name - string that specifies thing (often a selector)
		 * @property {HTMLElement} elt - the thing itself
		 * @property {jQuery} $elt - the thing as a jQuery thing
		 */

		/**
		 * @function name
		 *
		 * @param {jQuery} $elt - a jQuery thing
		 *
		 * @param {string} A name for $elt.
		 */

		/**
		 * Takes a thing of various types and returns various types of that thing.
		 *
		 * @param {string|jQuery|HTMLElement} thing - the thing to resolve
		 *
		 * @returns {Resolved}
		 */
		resolve(thing) {
			let resolved = {};
			if (is_string(thing)) {
				resolved.$elt = $(thing);
				resolved.elt = resolved.$elt[0];
				resolved.selector = thing;
			} else if (thing instanceof $) {
				resolved.$elt = thing;
				resolved.elt = thing[0];
				if (thing.selector) {
					resolved.selector = thing.selector;
				}
			} else {
				resolved.elt = thing;
				resolved.$elt = $(thing);
			}
			if (is_function(this.name)) {
				resolved.name = this.name(resolved.$elt);
			} else {
				resolved.name = dsf.name(resolved.elt);
			}
			return resolved;
		},
	};
