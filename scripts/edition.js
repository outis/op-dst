	/**
	 * Convert between editions.
	 */
	let edition = globals.edition = {
		_editions: {
			'2': {
				abilities: {
					talents: ['dodge'],
					skills: ['repair'],
					knowledges: ['law', 'linguistics'],
				},
				preLoad() {
					edition.foldArcanoi();
				},
			},
			'20': {
				abilities: {
					talents: ['persuasion'],
					skills: ['larceny'],
					knowledges: ['academics', 'technology'],
				},
			},
			'': { // abilities from other sheets
				abilities: {
					talents: ['animalken'],
					skills: ['security', 'socialize', 'survival'],
					knowledges: ['weaponry'],
				}
			},
		},
		labels: {
			'animalken': 'Animal Ken',
		},

		/* DST event handlers */
		preLoad(opts, $context) {
			module.tarryFor(
				'compatibility',
				'abilities' // so specialties have been separated from dynamic abilities
			);
			this.ed('preLoad');
			this.import();
		},

		postLoad() {
			this.ed('postLoad');
		},

		preSave() {
			this.ed('preSave');
			this.export();
			dsa.data.edition = dsf.value('edition');
		},

		/* */
		export() {
		},

		import() {
			let sheetEd = dsf.value('edition');
			if (dsa.data.edition != sheetEd) {
				// look for abilities in this edition from the `dyn_{ability}_{i:02}`, and copy abilities from other editions to them
				let tpls = {
					dyn: {
						name: `dyn_{base}_{i:02}_name`,
						specialty: `dyn_{base}_{i:02}_specialty`,
						value: `dyn_{base}_{i:02}`,
					},
				},
					compact = {};
;

				function tpl(base) {
					if (! (base in tpls)) {
						tpls[base] = mapObject(tpls.dyn, value => klass.eval(value, {base}));
					}
					return tpls[base];
				}

				function into_current(ed) {
					// this ed.; scan dynamic abilities for this ed.'s static abilities
					for (let [base, names] of Object.entries(ed.abilities)) {
						let tplFrom = tpl(base),
							size = +udf.size(base),
							// envs can be undefined, which will cause a scan rather than iterating over envs
							envs = this.envs(base);
						for (let entry of dsa.entries(tplFrom.name, envs, {continuous: true})) {
							let env = klass.extract(tplFrom.name, entry[0]),
								ability = entry[1].toLowerCase(),
								field = abilities.fieldName(ability);
							if (dsf.exists(field)) {
								compact[base] = Math.max(env.i, compact[base] || 0);
								dsa.rename(klass.eval(tplFrom.value, env), field);
								delete dsa.data[entry[0]];

								let field_specialty = field + '_specialty',
									from_specialty = klass.eval(tplFrom.specialty, env),
									match;
								if (dsa.exists(from_specialty)) {
									dsa.rename(from_specialty, field_specialty);
								} else if ((match = ability.match(/\(([^)]+)\)/))) {
									dsa.data[field_specialty] = match[1];
								}
							}
						}
					}
				}

				function from_other(ed) {
					// other ed.; convert their static abilities to dynamic ones
					for (let [base, names] of Object.entries(ed.abilities)) {
						let tplTo = tpl(base);
						// scan tplFrom, looking for 
						for (let name of names) {
							if (dsa.exists(name) && ! abilities.find(name)) {
								let item = dsa.nextName(tplTo);
								dsa.data[item.name] = this.label(name);
								dsa.rename(name + '_specialty', item.specialty);
								dsa.rename(name, item.value);
								udf.updateSize(base, item.i);
							}
						}
					}
				}

				this.each(
					into_current.bind(this),
					from_other.bind(this)
				);

				for (let base in compact) {
					let tpls = tpl(base);
					udf.compact(base, tpls, {index: compact[base]+1});
				}
			}
		},

		each(current, others) {
			let ed = dsf.value('edition'),
				curr = this._editions[ed];
			delete this._editions[ed];
			try {
				// handle current first, so as to clear out 
				current(curr, ed);
				for (let [ed, other] of Object.entries(this._editions)) {
					others(other, ed);
				}
			} finally {
				if (curr) {
					this._editions[dsf.value('edition')] = curr;
				}
			}
		},

		ed(evt) {
			let ed = this._editions[dsf.value('edition')];
			if (ed && is_function(ed[evt])) {
				ed[evt]();
			}
		},

		envs(base) {
			let size = +udf.size(base);
			if (size) {
				return range.keyed({i: {from: 1, through:size}});
			}
		},

		/**
		 * Combine left and right demipips, from sheets that have bisected arcanoi for those that don't.
		 */
		foldArcanoi() {
			let envs = this.envs('arcanoi');
			for (let [name, value] of dsa.entries('dyn_arcanoi_{i:02}', envs, {continuous: true})) {
				let parts = value.match(pips.reDemi);
				if (parts) {
					dsa.data[name] = this.unify(parts.groups);
				}
			}
		},

		label(name) {
			if (this.labels[name]) {
				return this.labels[name];
			}
			return name.titleCase();
		},

		unify({left, right, lmask, rmask}) {
			if (lmask) {
				left = Math.bits(+left);
			}
			if (rmask) {
				right = Math.bits(+right);
			}
			return Math.max(+left, +right);
		},
	};
