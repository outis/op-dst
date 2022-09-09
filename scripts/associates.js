	/**
	 *
	 */
	const associates = globals.associates = {
		updaters: {
			'2.1': function (data) {
				let _ = {};
				for (let [name, value] of range.filter(
					Object.entries(dsa.data),
					([n, v]) => /^dyn_(allies|contacts|mentors|foes)/.test(n)))
				{
					let {base, i, key} = udf.parseName(name),
						newTpl = 'dyn_associates_{i:02}',
						newName;
					if (key == 'value') { // v1 'value' -> v2 'name'
						key = 'name';
					}
					//_[base] ??= {};
					_[base] || (_[base] = {});
					if (! _[base][i]) {
						let typeName = dsa.nextName(newTpl + '_type');
						_[base][i] = {i: typeName.i};
						dsa.data[typeName] = words.singulize(base).ucfirst();
					}
					newTpl += '_' + key;
					newName = klass.eval(newTpl, _[base][i]);
					dsa.rename(name, newName);
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
