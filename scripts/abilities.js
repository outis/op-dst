	/**
	 * Base for ability field proxies.
	 */
	class AbilityProxy {
		constructor() {
		}

		get loaded() {
			return abilities.loaded;
		}

		_get(field) {
			return dsf.value(field) || dsa.data[field];
		}
		_set(field, value, fields) {
			//if (fields.any(dsa.exists)) {
			dsa.data[field] = value;
			//}
			if (dsf.exists(field)) {
				let $field = dsf.$dsf(field);
				if (pips.is($field, value)) {
					return pips.value($field, value);
				} else {
					return dsf.value(field, value);
				}
			}
		}
	}

	/**
	 * Represents a static ability field.
	 */
	class StaticAbility extends AbilityProxy {
		constructor(name) {
			super();

			Object.defineProperty(this, 'name', {
				value: name
			});
		}
		get specialty() {
			return this._get(`${this.name}_specialty`);
		}
		set specialty(value) {
			this._set(`${this.name}_specialty`, value);
		}
		get value() {
			return this._get(this.name);
		}
		set value(value) {
			pips.value(dsf.$dsf(this.name), value);
		}
	}

	/**
	 * Represents a dynamic (UDF) ability field.
	 */
	class DynamicAbility extends AbilityProxy {
		constructor(data) {
			super();

			Object.defineProperty(this, 'data', {
				value: data,
			});
		}

		get ability() {
			return this.data.base;
		}
		get base() {
			return this.data.base;
		}
		get i() {
			return this.data.i;
		}
		set i(value) {
			this.data.i = value;
		}
		get name() {
			return this._get(this.data.name_field);
		}
		set name(value) {
			this._set(this.data.name_field, value);
		}
		get specialty() {
			return this._get(this.data.specialty_field);
		}
		set specialty(value) {
			this._set(this.data.specialty_field, value);
		}
		get value() {
			return this._get(this.data.value_field);
		}
		set value(value) {
			pips.value(dsf.$dsf(this.data.value_field), value);
		}
	};

	/**
	 * Extracts specialties from abilities.
	 *
	 * TODO: add management methods (so as to prevent duplicate dynamic abilities & ease altering them).
	 */
	const abilities = globals.abilities = {
		abilities: ['talents', 'skills', 'knowledges'],
		// should probably be in a separate class
		_dynamic: {},

		/* DST event handlers */
		preLoad() {
			module.tarryFor('compatibility'); // so dynamic abilities have been imported
			this.separateSpecialties();
		},

		postLoad() {
			module.on('postLoad', () => this.loaded = true, 'abilities.postLoad');
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
		find(name, base) {
			name = this.normalizeName(name);
			if (dsf.exists(name)) { // static
				return new StaticAbility(name);
			} else { // dynamic
				if (this._dynamic[name]) {
					if (name == this.normalizeName(this._dynamic[name].name)) {
						return this._dynamic[name];
					}
					// dynamic ability no longer matches its key, so remove it
					delete this._dynamic[name];
				}
				this.scan();
				if (this._dynamic[name]) {
					return this._dynamic[name];
				}
			}
		},

		normalizeName(name) {
			return this.fieldName(name).replace(/\W+/, '');
		},

		scan() {
			for (let data of udf.scan('abilities')) {
				let name = this.normalizeName(data.name);
				this._dynamic[name] = new DynamicAbility(data);
			}
		},

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
