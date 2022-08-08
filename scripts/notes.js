	/**
	 * Section notes.
	 */
	let notes = globals.notes = {
		postLoad({isEditable}) {
			this.$context = $context;
			if (! isEditable) {
				$context.find(':not(.help) .tipped > .tip:empty').parent().addClass('notip').removeClass('tipped');
			}
		},
	};
