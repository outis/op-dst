	/**
	 *
	 */
	const associates = globals.associates = {
		updaters: {
			'2': function (data) {
				const tpl = 'dyn_{base}_{i:02}',
					  bases = ['allies', 'contacts', 'mentors', 'foes'];
				let envs;
				for (let [name, value] of range.filter(
					dsa.entries(tpl, envs),
					([n, v]) => /^dyn_(allies|contacts|mentors|foes)/.test(n) && ! is_numeric(v)))
				{
					dsa.rename(name, name + '_name');
				}
			},
		},

		postLoad(options, $context) {
			if (! options.isEditable) {
				for (let field of $context.find('.associates .dsf.pips')) {
					if (! +dsf.value(field)) {
						field.className += ' hidden';
					}
				}
			}
		},
	};
