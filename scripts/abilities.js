	/**
	 * Extracts specialties from abilities.
	 *
	 * TODO: add management methods (so as to prevent duplicate dynamic abilities & ease altering them).
	 */
	const abilities = globals.abilities = {
		abilities: ['talents', 'skills', 'knowledges'],

		/* DST event handlers */
		preLoad() {
			module.tarryFor('compatibility'); // so dynamic abilities have been imported
			this.separateSpecialties();
		},

		/**
		 * Convert the ability text (from a dynamic ability field) to a valid DSF name (which is also an HTML class).
		 *
		 * @param {string} ability - ability label (i.e. a dynamic field value)
		 *
		 * @returns {string}
		 */
		fieldName(ability) {
			return ability.toLowerCase().replace(/\([^)]*\)/, '').trim().replace(/\s+/, '_');
		},

		/* */

		separateSpecialty(tpls, env, name, value) {
			//value ??= dsa.data[name] ?? '';
			value || (value = dsa.data[name] || '');
			let match = value.toString().match(/\(([^)]+)\)/);
			if (match) {
				let specialty = klass.eval(tpls.specialty, env);
				if (! dsa.data[specialty]) {
					dsa.data[specialty] = match[1];
					dsa.data[name] = value.slice(0, match.index).trim() + value.slice(match.index + match[0].length);
				}
			}
		},

		separateSpecialties_range(abilities) {
			//abilities ??= this.abilities;
			abilities || (abilities = this.abilities);
			const env = {},
				  tpls = {
					  name: 'dyn_{base}_{i:02}_name',
					  specialty: 'dyn_{base}_{i:02}_specialty',
				  };

			const {vars, envs, opts} = this.loopVars(tpls.name, {from: 1, base: abilities});
			for (let [name, value, env] of dsa.entries(tpl, envs)) {
				this.separateSpecialty(tpls, env, name, value);
			}
		},

		separateSpecialties_for(abilities) {
			//abilities ??= this.abilities;
			abilities || (abilities = this.abilities);
			const env = {},
				  tpls = {
					  name: 'dyn_{base}_{i:02}_name',
					  specialty: 'dyn_{base}_{i:02}_specialty',
				  };
			let name, specialty, match;

			for (let base of abilities) {
				env.base = base;
				const nItems = udf.size(base) || udf.maxCount;
				for (let i = 1; i <= nItems; ++i) {
					env.i = i;
					name = klass.eval(tpls.name, env);
					if (! dsa.data[name]) {
						break;
					}
					this.separateSpecialty(tpls, env, name);
				}
			}
		},

		separateSpecialties(abilities) {
			//abilities ??= this.abilities;
			abilities || (abilities = this.abilities);
			//this.separateSpecialties_range();
			this.separateSpecialties_for(abilities);
		},
	};
