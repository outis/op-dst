	/*** */
	let field = globals.field = {
		value(elt, name) {
			return elt.dataset.value || $(elt).data('value') || dsf.value(name || dsf.name(elt));
		}
	};
