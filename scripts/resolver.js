	/**
	 * Mixin.
	 */
	let resolver = {
		resolve(thing) {
			let resolved = {};
			if ('string' == typeof(thing)) {
				resolved.$elt = $(selector);
				resolved.elt = resolved.$elt[0];
			} else if (thing instanceof $) {
				resolved.$elt = thing;
				resolved.elt = thing[0];
				if (thing.selector) {
					selector = thing.selector;
				}
			} else {
				resolved.elt = thing;
				resolved.$elt = $(thing);
			}
			if (is_function(this.name)) {
				resolved.name = this.name(resolved.$elt);
			}
			return resolved;
		},
	};
