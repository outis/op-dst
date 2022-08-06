	/**
	 * Section notes.
	 */
	let notes = globals.notes = {
		init($context, slug, editable) {
			this.$context = $context;
			if (! editable) {
				$context.find('H3.tipped > .tip:empty').parent().addClass('notip');
				$context.find('H4.tipped > .tip:empty').parent().addClass('notip');
			}
		},
	};
