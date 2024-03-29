	/**
	 * @internal
	 * Create a parser for string tokens that either assigns a token as the itemm type, or assigns it to the first unset property with name from <var>names</var>.
	 *
	 * Used internally by {@link compatibility}
	 */
	function makeStringTokenParser(is_type, names=['name', 'description']) {
		if (is_function(is_type.test)) {
			let typeRe = is_type;
			is_type = (value) => typeRe.test(value);
			stringTokenParser.typeRe = typeRe;
		}

		function stringTokenParser(value, parsed) {
			value = value.trim();
			let [first, rest] = halveString(value, /\s+/),
				matched; // leave `undefined` to indicate unmatched
			if (is_type(first)) {
				parsed.type = first.toLowerCase();
				matched = true
				value = rest;
			}
			if (value) {
				for (let name of names) {
					if (! parsed[name]) {
						parsed[name] = value;
						return true;
					}
				}
			}
			return matched;
		};
		stringTokenParser.is_type = is_type;

		return stringTokenParser;
	}

	/***
	 * DSFs from other DSs
	 */
	let compatibility = globals.compatibility = {
		/**
		 * @typedef {Object} AliasOptions
		 * @property {boolean} [prefix] - Whether to prefix names with the DSF prefix.
		 * @property {boolean} [skipCorrections] - Whether to skip simple aliases that are spelling corrections.
		 * @property {string[] => boolean} [include] - Filter function, determines whether to include an alias entry in the results.
		 *
		 * @typedef {Object} MyAliasEntry
		 * @property {string} mine - DSF name for this DST
		 * @property {string} value - DSF value
		 * @property {string} theirs - DSF name for other DST
		 * @property {string} [env] - For template aliases, contains variables extracted from name.
		 *
		 * @typedef {MyAliasEntry} MyTemplateEntry
		 * @property {NameTemplate} theirs - DSF template for other DST
		 * @property {string} env
		 */
		defaults: {
		},
		sections: {
			artifact: 'equipment',
			relic: 'equipment',

			ally: 'associates',
			contact: 'associates',
			mentor: 'associates',
			foe: 'associates',
		},
		_prune: [],
		_aliases: null,
		_sesalia: {},
		get aliases() {
			if (! this._aliases && aliases) {
				// try to set from outer scope
				this.aliases = aliases;
			}
			return this._aliases;
		},
		set aliases(aliases) {
			this._aliases = aliases;
			derefProperties(this._aliases.options);

			//Object.assign(this._aliases, this.port);
			this._merge('export');
			aliases.import = new ShorthandDict(aliases.import);
			this._merge('import');
			if ('parse.' in this._aliases) {
				bindAll(this._aliases['parse.'], this);
				Object.assign(this.parse, this._aliases['parse.']);
			}

			// ?
			//bindAll(this._aliases., this);
			//aliases.export.dst ??= {};
			aliases.export.dst || (aliases.export.dst = {});
			//aliases.export.templates ??= {};
			aliases.export.templates || (aliases.export.templates = {});
			for (let [name, dst] of Object.entries(aliases.dst)) {
				derefProperties(dst.import);
				bindAll(dst.import, this);
				Object.assign(aliases.import, dst.import);
				if (dst.export) {
					derefProperties(dst.export);
					aliases.export.dst[name] = dst.export /*??*/|| { partial:true };
					if (dst.export.templates) {
						// suppress export of these (by exportTemplated)
						Object.assign(aliases.export.templates, dst.export.templates);
					}
				}
				if (is_function(dst.override)) {
					this.import.dst[name] = dst.override;
				}
			}

			this._sesalia.simple = flipObject(this.aliases.simple);
			this._sesalia.templates = flipObject(this.aliases.templates);
		},

		_merge(port) {
			// first, merge the main properties
			//this._aliases[port] ??= {};
			this._aliases[port] || (this._aliases[port] = {});
			bindAll(this._aliases[port], this);
			// copy global port functions
			Object.assign(this._aliases[port], this.port[port]);

			// then, work on sub-objects
			if ((port+'.') in this._aliases) {
				// check & merge dst separately so as not to either overwrite it or miss copying the properties
				if ('dst' in this._aliases[port+'.']) {
					//this[port].dst ??= {};
					this[port].dst || (this[port].dst = {});
					Object.assign(this[port].dst, this._aliases[port+'.'].dst);
				}
				bindAll(this._aliases[port+'.'], this);
				mergeObjects(this[port], this._aliases[port+'.']);
			}
		},

		get sesalia() {
			// ensure _sesalia is filled
			this.aliases;
			return this._sesalia;
		},

		get $aliases() {
			if (! this._$aliases) {
				let $aliases = this.$context.find('.compatibility');
				if (! $aliases.length) {
					$aliases = $('<div class="compatibility"></div>');
					this.$sheet.append($aliases);
				}
				this._$aliases = $aliases;
			}
			return this._$aliases;
		},

		get $sheet() {
			if (! this._$sheet) {
				this._$sheet = this.$context.find('.mll_sheet');
			}
			return this._$sheet;
		},

		// functions that only port one way (import or export)
		port: {
			// `this` will get bound to `compatibility`
			export: {
				//dst: {},
				/* Entry points for native DSFs/UDFs */
				flaws(names, values) {
					this.export.each(['flaws', 'flaw'], names, values);
				},

				merits(names, values) {
					this.export.each(['merits', 'merit'], names, values);
				},

				health(value) {
					// nWoD Reloaded! handled via simple aliases
					this.export.linked('health');
				},

				passions(names, values) {
					this.export.each(['passions', 'passion'], names, values);
				},

				power(value) {
					this.export.simple('power', value);
				},

				willpower(value) {
					// nWoD Reloaded! handled via simple aliases
					this.export.linked('willpower');
				},
			},

			import: {
			},
		},

		// copied to function `export`; `this` will get bound to `compatibility`
		'export.': {
			backgrounds(names, values) {
				this.export.generic('backgrounds', ...arguments);
			},

			/**
			 * Export multiple (usually related) fields.
			 *
			 * Field <var>names</var> and <var>values</var> are related by key. Examples:
			 *     compatibility.export.all(
			 *         {name: 'other_trait_1', value: 'other_value_1'},
			 *         {name: 'Oboli', value: '1.5'},
			 *         'money'
			 *     );
			 *     compatibility.export.all(
			 *         {name: 'equipment_name_00', value: 'equipment_tootip_00'},
			 *         {name: 'relic toothbrush: 8 / 10', value: 'no need to moliate a flip-top head'},
			 *         {
			 *             for: {
			 *                 name: ['dyn_equipment_01_type', 'dyn_equipment_01_name', 'dyn_equipment_01_charge'],
			 *             },
			 *             mine:'dyn_equipment_01_description',
			 *             classes: 'complex',
			 *         }
			 *     );
			 *
			 * Doesn't handle templated fields; for that, use {@link this.export.fields}, which will generate DSF names for related fields.
			 *
			 * Calls {@link this.export.dynamicField} to export each DSF.
			 *
			 * @param {object} names - foreign DSF names (not templated)
			 * @param {object} values - DSF values
			 * @param {string} options - native DSF names and keyword parameters for {@link this.createField}
			 * @param {string[]} [options.for] - native DSF name(s); indexed by same keys as <var>names</var> and <var>values</var>
			 * @param {string|string[]} [options.mine] - native DSF name(s)
			 */
			all(names, values, options={}) {
				if (! is_object(options)) {
					options = {mine: options};
				}
				//options.for ??= {};
				options.for || (options.for = {});
				for (let key in names) {
					let mine;
					if (options.for[key]) {
						// override with generated native DSF name
						mine = options.for[key];
					} else {
						mine = options.mine;
					}
					this.export.dynamicField(names[key], values[key], {...options, mine});
				}
			},

			arcanoi(names, values) {
				this.export.generic('arcanoi', ...arguments);
			},

			each(bases, ...args) {
				let exporters, genArgs = [bases[0]].concat(args);
				// TODO: test
				bases.push('generic');
				for (let slug in this.aliases.export.dst) {
					exporters = this.aliases.export.dst[slug];
					let base = bases.find(base => base in exporters);
					if (base) {
						let theirArgs = args;
						if ('generic' === base && args[0] != bases[0]) {
							theirArgs = genArgs;
						}
						exporters[base](...copyAll(theirArgs));
					} else if (! exporters.partial) {
						console.warn(`Cannot export field to ${slug}: no exporter matching any of ${bases}.`, args);
					}
				}
			},

			equipment(names, values) {
				this.export.generic('equipment', ...arguments);
			},

			/**
			 * Export a value to a foreign DSF and mark it as a dynamic DSF.
			 *
			 * DSFs are marked as dynamic with the 'dyn' class.
			 *
			 * Calls {@link this.exportField}.
			 *
			 * @param {string} theirs - DSF name ('dsf_' prefix is optional).
			 * @param {*} value - Value to store in DSF.
			 * @param {object} [extra] - Keyword parameters for {@link this.createField}.
			 */
			dynamicField(theirs, value, extra={}) {
				if (extra.classes) {
					extra.classes += 'dyn';
				} else {
					extra.classes = 'dyn';
				}
				return this.exportField(theirs, value, extra);
			},

			/**
			 * Export a dynamic DSF with a generated name.
			 *
			 * This method is for exporting dynamic foreign DSFs without the caller specifying the exact field name. Instead, the caller provides a name template that is used to generate an unused name by {@link dsf.nextName}.
			 *
			 * Note that this method only works on a single DSF that has no related DSFs, as each time the new name is generated with a higher index; instead, use {@link this.export.fields}. If this method were called for related DSFs, each created DSF would have different indices. An example of how this can result in bugs:
			 *
			 *     foo = [
			 *        {name: 'Bar'},
			 *        {name: 'Baz', description: 'The bazzest.'},
			 *     ];
			 *     // the following will export foo[1].description as 'foo_0_description'
			 *     for (let [i, field] of foo.entries()) {
			 *         for (let [key, value] of Object.entries(field)) {
			 *             compatibility.export.field('foo_{i}_name', value, `dyn_baz_${i+1}_${key}`);
			 *         }
			 *     }
			 *
			 * @param {NameTemplate} theirs - DSF name template ('dsf_' prefix is optional).
			 * @param {*} value - Value to store in DSF.
			 * @param {string} [mine] - Native DSF(s) being exported.
			 * @param {object} [options] - Keyword parameters for {@link this.createField}.
			 */
			field(name, value, mine, options={}) {
				if (! options && is_object(mine)) {
					options = mine;
					delete mine;
				}
				let theirs = dsf.nextName(name, options);

				this.export.dynamicField(theirs, value, {mine});
			},

			/**
			 * Export to a dynamic field with multiple DSFs.
			 *
			 * Properties of <var>names</var> and <var>values</var> with the same keys are paired. This method generates names for the fields, then exports to a DSF for each `name[key], value[key]` pair.
			 *
			 * @param {object} names - Foreign DSF name templates.
			 * @param {object} values - DSF values.
			 * @param {string} [mine] - Native DSFs that were the source of the values.
			 * @param {object} [options] - Options for {@link dsf.nextName}
			 */
			fields(names, values, mine, options={}) {
				if (! options && is_object(mine)) {
					options = mine;
					delete mine;
				}
				let theirs = dsf.nextName(names, options);

				this.export.all(theirs, values, mine);
			},

			/**
			 * Export a "flavor" field (merit, flaw), by packing a tag, the label, and possibly a value into a single DSF.
			 *
			 * @param {NameTemplate} name - foreign DSF name (can be templated)
			 * @param {object} values - values to export
			 * @param {string} [mine] - Native DSF(s) being exported.
			 * @param {object} [options] - Keyword parameters for {@link this.createField}.
			 */
			flavor(name, values, mine, options={}) {
				let value = values.name;
				if (values.value) {
					value += ': ' + values.value;
				}
				compatibility.export.field(name, value, mine, options);
			},

			/**
			 * Generic exporter.
			 *
			 * Checks each DST for an exporter named <var>base</var> or "generic" and calls them.
			 *
			 * @param {string} base - base name for DSF
			 * @param {*[]} args - additional arguments for DST-specific exporters
			 */
			generic(base, ...args) {
				this.export.each([base, 'generic'], ...args);
			},

			/**
			 * Export two {@link dsf.linked linked} fields (permanent & current) in a single foreign field.
			 *
			 * @param {string} mine - base of native DSF name
			 * @param {string} base - foreign DSF base
			 */
			linked(mine, base) {
				let perm = dsf.value('perm_' + mine),
					curr = dsf.value('curr_' + mine);
				this.export.simple(base /*??*/|| mine, `${curr} / ${perm}`);
			},

			/**
			 * Export a simple DSF.
			 *
			 * A DSF is simple to export when there's a 1-1 correspondence between the native and foreign DSF. Generally, these will be listed in the simple aliases.
			 *
			 * @param {string} mine - native DSF name
			 * @param {string} value
			 */
			simple(mine, value) {
				// TODO: behavior-only rename certain aliased fields
				// power -> pathos, curr_health -> corpus
				let name = this.sesalia.simple[mine] /*??*/|| mine;

				// TODO? loop over name, instead of taking first? Will probably need to filter out some aliases
				if (Array.isArray(name)) {
					name = name[0];
				}
				this.export.each([mine, 'simple'], name, value, mine);
			},

			/**
			 * Export static abilities (or other field categories) to dynamic ones.
			 *
			 * The <var>tpls</var> argument gives template names to export to for each category. Example:
			 *     {
             *         'talents': {
             *             name: `ability_type_{i:02}`,
             *             value: `ability_value_{i:02}`
             *         },
             *         'skills': {
             *             name: `talent_type_{i:02}`,
             *             value: `talent_value_{i:02}`
             *         },
             *         'knowledges': {
             *             name: `knowledge_type_{i:02}`,
             *             value: `knowledge_value_{i:02}`
             *         },
             *     }
			 *
			 * The <var>normalize</var> argument allows values to be altered before export (e.g. combine specialties with names, if foreign sheet doesn't support specialties).
			 *
			 * @param {string} section - HTML class name of section to scan for DSFs
			 * @param {object} foreign - static DSFs in other sheet (names as keys)
			 * @param {object} tpls - map of categories to foreign DSF name templates
			 * @param {object} kwargs
			 * @param {(names, values) => undefined} [kwargs.exporter] - . Defaults to {@link compatibility.export.fields}.
			 * @param {object => object} [kwargs.normalize] - process values before export. Only called by default exporter.
			 */
			staticToDynamic(section, foreign, tpls, {normalize=(x=>x), exporter}) {
				//exporter ??= ;
				exporter || (exporter = (names, values) => this.export.fields(names, normalize(values) /*??*/|| values));

				const $dsfs = dsf.$dsfs(`.${section}`).not('[class*="dsf_dyn"]').not('.notes').not('.hidden'),
					  dynamize = {};
				for (let field of $dsfs) {
					let name = dsf.name(field),
						[base, key] = path.split(name).concat('value');
					if (! (base in foreign)) {
						let category = dsf.sectionName(name) /*??*/|| '';
						//dynamize[category] ??= {};
						dynamize[category] || (dynamize[category] = {});
						//dynamize[category][base] ??= [];
						dynamize[category][base] || (dynamize[category][base] = {});
						dynamize[category][base].name = base;
						dynamize[category][base][key] = dsf.value(field);
					}
				}
				for (let category in dynamize) {
					if (! tpls[category]) {
						console.warn(`No foreign fields for ${category} when exporting static fields from ${section}.`);
						continue;
					}
					for (let base in dynamize[category]) {
						let values = dynamize[category][base];
						// only export abilities that have something set
						if (Object.entries(values).some(([k,v]) => 'name' != k && v)) {
							exporter(tpls[category], values);
						}
					}
				}
			}
		},

		// copied to function `import`; `this` will get bound to `compatibility`
		'import.': {
			dst: {},

			_udf(parsed, names, base) {
				//base ??= parsed.base ?? words.pluralize(parsed.type);
				base || (base = parsed.base || words.pluralize(parsed.type));
				if (parsed.description && ! names.description) {
					parsed.name += ` (${parsed.description})`;
				}
				udf.addDsa(names, parsed, base);
				parsed.imported = base;
			},

			advantage(parsed, names) {
				//console.info(`Trying to import ${parsed.type} as advantage.`);
				let advantage = this.advantage(parsed.type);
				if (advantage) {
					return this.import.dispatch({...parsed, name:parsed.base, base:advantage}, names);
				}
			},

			abilities(parsed, names) {
				let base = `dyn_${parsed.base}_{i:02}`;

				names = {name: base + '_name', specialty: base + '_specialty', value: base};
				//parsed.value ??= parsed.points;
				parsed.value || (parsed.value = parsed.points);
				this.import._udf(parsed, names);
				return parsed;
			},

			arcanoi(parsed, names) {
				names = {name: 'dyn_arcanoi_{i:02}_name', value: 'dyn_arcanoi_{i:02}'};
				parsed.name = parsed.name.titleCase();
				this.import._udf(parsed, names, 'arcanoi');
				return parsed;
			},

			associates(parsed, names) {
				let base = parsed.base;
				names = {
					type: `dyn_${base}_{i:02}_type`,
					name: `dyn_${base}_{i:02}_name`,
					value: `dyn_${base}_{i:02}`,
					notes:`dyn_${base}_{i:02}_notes`,
				};
				this.import._udf(parsed, names);
				if (parsed.type) {
					let bg = {
						base: 'backgrounds',
						name: parsed.type,
						value: parsed.points /*??*/|| parsed.value,
						description: parsed.name,
					};
					this.import.backgrounds(bg);
				}
			},

			backgrounds(parsed) {
				let names = {
						name: 'dyn_backgrounds_{i:02}_name',
						value: 'dyn_backgrounds_{i:02}',
						description: 'dyn_backgrounds_{i:02}_description',
					},
					label = parsed.name,
					values = {
						value: parsed.value /*??*/|| parsed.points,
					};
				if (parsed.type) {
					//label = `${parsed.type} (${parsed.name})`;
					values.name = parsed.type;
					values.description = parsed.name;
				} else {
					values.name = parsed.name;
					if (parsed.description) {
						values.description = parsed.description;
					}
				}
				this.parse.appendUnmatched(values, parsed.unmatched);
				this.import._udf(values, names, 'backgrounds');
				return parsed;
			},

			categorize(parsed, categories) {
				let base = parsed.base;
				if (base in categories) {
					return [base, base];
				}
				if (parsed.type in categories) {
					base = parsed.type;
					return [base, base];
				}

				let section = dsf.sectionName(`.${base}`);
				if (section in categories) {
					// catches abilities
					return [section, base];
				}
				if (dsf.exists(parsed.base)) {
					return ['simple', base];
				}
				if (udf.exists(parsed.base)) {
					return ['udf', base];
				}
				return ['generic', base];
			},

			dispatch(parsed, names) {
				try {
				let [category, base] = this.import.categorize(parsed, this.import),
					importer = this.import[category],
					imported = importer(parsed, names);
				if (imported && ! ('imported' in parsed)) {
					if (is_string(imported)) {
						parsed.imported = imported;
					} else if (is_object(imported)) {
						parsed = imported;
						if (! ('imported' in parsed)) {
							parsed.imported = base;
						}
					} else {
						parsed.imported = base;
					}
				}
				if (parsed.imported) {
					console.debug(`imported ${names} as ${parsed.imported}`);
				}
				} catch (err) {
					console.error(`Error importing ${names}`, err);
					throw err;
				}
				return parsed;
			},

			equipment(parsed, names) {
				this.import.backgrounds(parsed);
				names = {
					// name must come first, as it's the most common field for all items, so that dsa.add can find the existing items
					'name': 'dyn_equipment_{i:02}_name',
					'type': 'dyn_equipment_{i:02}_type',
					'points': 'dyn_equipment_{i:02}_points',
					'description': 'dyn_equipment_{i:02}_description',
					'charge': 'dyn_equipment_{i:02}_charge',
				};
				this.import._udf(parsed, names, 'equipment');
				/*
				let bg = {
					base: 'backgrounds',
					name: parsed.type,
					value: parsed.points,
					description: parsed.name,
				};
				this.import.backgrounds(bg);
				*/
				return parsed;
			},

			generic(parsed, names) {
				if (udf.exists(parsed.base)) {
					return this.import.udf(parsed, names);
				}
				let base = this.normalize(parsed.name /*??*/|| parsed.base /*??*/|| '');
				if (dsf.exists(base)) {
					parsed.base = base;
					delete parsed.name;
					return this.import.simple(parsed, names);
				}
				return this.import.advantage(parsed, names);
			},

			/**
			 * Finish parsing partially parsed data, then import.
			 *
			 * @param {object} defaults - already parsed data (may be overwritten)
			 * @param {string[]} values - data to parse
			 * @param {string} [section] - importer name; if not given, an importer matching the parsed' datas `type` or `base` is searched for
			 */
			partial(defaults, values, section) {
				let parsed = {...defaults, ...this.parse.stream(values)};
				if (! section) {
					let type = parsed.type.toLowerCase(),
						sections = [type, words.pluralize(type), parsed.base];
					for (let sctn of sections) {
						if (this.import[sctn]) {
							section = sctn;
							break;
						}
					}
				}
				if (this.import[section]) {
					return this.import[section](parsed);
				} else {
					console.error(`No importer for '${section}' when importing partial: `, parsed, values);
				}
			},

			/**
			 * Import UDFs with notes (such as associates).
			 *
			 * This method will try to determine the UDF base by looking for tags in the values.
			 *
			 * @param {object} values - (partially) parsed values
			 * @param {string} tags - regex subexpresion to match tags (must not have capturing groups)
			 * @param {string} section - e.g. 'associates'
			 * @param {string} base - default for UDF base, e.g. 'contacts'
			 */
			noted(values, tags, section, base) {
				return this.import[section](
					this.parse.noted(values, tags, base)
				);
			},

			simple(parsed, names) {
				// simple field: corpus, pathos, ...
				if (parsed.name) {
					if (dsf.exists(parsed.name)) {
						dsa.data[parsed.name] = parsed.value;
					} else {
						// update parsed.value?
						dsa.data[parsed.base] = parsed.name + ': ' + parsed.value;
					}
					delete dsa.data[names[1]];
				} else if (parsed.base && dsf.exists(parsed.base)) {
					dsa.data[parsed.base] = parsed.value;
				} else if (names[1]) {
					// names[0] is the base, names[1] the value
					dsa.rename(names[1], parsed.base);
					//parsed.value = values[1];
				} else {
					// most likely, field names[0] has both base & value
					dsa.data[parsed.base] = parsed.value;
				}
				parsed.imported = parsed.base;
				return parsed;
			},

			static(parsed, names) {
				dsa.data[parsed.base /*??*/|| parsed.type /*??*/|| parsed.name] = parsed.value;
			},

			stream(values, names) {
				dsa.getAll(names, values);
				let parsed = this.parse.stream(values);
				if (! parsed) {
					return parsed;
				}
				// for debugging
				//window.parses ??= {};
				//window.parses[names[1] ?? names[0]] = {from: [values], ...parsed};

				return this.import.dispatch(parsed, names);
			},

			split(value, names, base) {
				let parsed = this.parse.split(value, {base});
				if (parsed) {
					if (is_numeric(parsed.value)) {
						parsed.value = +parsed.value;
					}
					this.import._udf(parsed, names, base);
				}
				return parsed;
			},

			udf(parsed, names) {
				// get template for `.{$parsed.base}`
				let base = parsed.base,
					$tpl = udf.$template(base);

				if ($tpl) {
					let tpls = udf.keyedFieldsFor(base, {$tpl});
					this.parse.appendUnmatched(parsed);
					this.import._udf(parsed, tpls);
					return parsed;
				}
			},
		},

		// `this` will get bound to `compatibility`
		parse: {
			_patterns: {
				split: [
					/^\W*(?<name>\b.*\w)\W*\( *(?<value>[-+]?\d{1,2}) *\) *$/,
					/^\W*(?<name>\b[^-:*]*\w(?: *\([^)]*\))?)[-: ]+(?<value>[-+]?\d{1,2})\W*$/,
					/^\W*(?<name>\b.*?\w)\W*$/,
				],
			},

			appendUnmatched(parsed, kwargs={}) {
				let {to, unmatched} = kwargs;
				if (is_string(kwargs)) {
					to = kwargs;
				} else if (Array.isArray(kwargs)) {
					unmatched = kwargs;
				}
				//unmatched ??= parsed.unmatched;
				unmatched || (unmatched = parsed.unmatched);
				//to ??= 'description';
				to || (to = 'description');

				if (unmatched && unmatched.string) {
					let additional = unmatched.string.join('; ');
					if (parsed[to]) {
						parsed[to] += ` (${additional})`;
					} else {
						parsed[to] = additional;
					}
				}
			},

			byPatterns(value, patterns, defaults) {
				value = this.scrub(value);
				if (! value) {
					return;
				}
				let parts, dbg = false;
				if (patterns in this.parse._patterns) {
					patterns = this.parse._patterns[patterns];
				}
				for (let pattern of patterns) {
					if ((parts = value.match(pattern))) {
						return mergeObjects(parts.groups, defaults);
					}
				}
			},


			/**
			 * @typedef {Object} Prelim
			 * @propery {string} Prelim.parser
			 * @propery {string} Prelim.base
			 * @propery {string} [Prelim.hint]
			 *
			 * @typedef {Object} Parsed Result of parsing a field from another sheet.
			 * @propery {string} Parsed.base Base for DSF name(s) in this sheet.
			 * @propery {string} [Parsed.type]
			 * @propery {string} [Parsed.name] Display name.
			 * @propery {string} [Parsed.description]
			 * @propery {string} [Parsed.specialty]
			 * @propery {string} Parsed.value Field value.
			 * @propery {string} [Parsed.points]
			 * @propery {string} [Parsed.charge]
			 */

			/*** parse by tokens ***/

			_byTokens: {
				abilities: {
					string: ['name', 'specialty'],
					number: ['value'],
				},
				arcanoi: {
					string: ['name'],
					number: ['value'],
				},
				associates: {
					pre: function(parsed) {
						if (udf.exists(parsed.base, compatibility.$context.find('.associates'))) {
							// set `type`, in case it's already been removed from tokens
							parsed.type = parsed.base;
						}
					},
					/* recalculated during init, but provide sensible defaults */
					reAssociates: /all(y|ies)|contacts?|foes?|mentors?/i,
					string: makeStringTokenParser(/all(y|ies)|contacts?|foes?|mentors?/i, ['name', 'notes']),
					number: ['value'],
					post: function(parsed) {
						if (parsed.type) {
							parsed.type = words.singulize(parsed.type).ucfirst();
						}
						if (/*parsed.unmatched?.string*/parsed.unmatched && parsed.unmatched.string) {
							parsed.unmatched.string = parsed.unmatched.string.join('. ');
							if (parsed.notes) {
								parsed.notes += '. ' + parsed.unmatched.string;
							} else {
								parsed.notes = parsed.unmatched.string;
							}
							delete parsed.unmatched.string;
						}
					},
				},
				backgrounds: function(tokens, prelim) {
					if (! prelim.hint) {
						// DSF was categorized based on 'background' token; check if there's a more specific one
						let {prelim:recategory, groups} = this.parse.categorizeFirst(tokens[0], this.parse._byTokens),
							{parser, hint} = recategory /*??*/|| {};
						// handle things like equipment by delegating to another by-token parser
						if (parser && 'backgrounds' !== parser && this.parse._byTokens[parser]) {
							// `rest` indicates `token` was split for categorization
							if (groups.rest) {
								tokens.splice(0, 1, groups.first, groups.rest);
							} else {
								// overwrite to reflect any modifications to the token
								tokens[0] = groups.first;
							}
							return this.parse.dispatch(tokens, {...prelim, ...recategory});
						}
					}
					let fields = {
						string: ['name', 'description'],
						number: ['value'],
					};
					return this.parse.tokens(tokens, fields, prelim);
				},
				equipment: {
					string: makeStringTokenParser(/artifact|relic/i),
					integer: ['points', 'charge'],
					rational: ['charge'],
					post: function (parsed) {
						//parsed.charge ??= 10;
						parsed.charge || (parsed.charge = 10);
						// for BG value
						//parsed.value ??= parsed.points;
						parsed.value || (parsed.value = parsed.points);

						if ('equipment' !== parsed.base && ! parsed.type) {
							parsed.type = parsed.base;
						}
						parsed.base = 'equipment';

						if (/*parsed.unmatched?.string*/parsed.unmatched && parsed.unmatched.string) {
							parsed.unmatched.string = parsed.unmatched.string.join('; ');
							if (parsed.description) {
								parsed.description += '; ' + parsed.unmatched.string;
							} else {
								parsed.description = parsed.unmatched.string;
							}
							delete parsed.unmatched.string;
						}
					},
				},
				generic: {
					string: ['name', 'description'],
					number: ['value'],
				},
				simple: {
					string: ['name', 'value'],
					number: ['value'],
					post: function (parsed) {
						if (('name' in parsed) && ! ('value' in parsed)) {
							parsed.value = parsed.name;
							delete parsed.name;
						}
					}
				},
				static: {
					string: ['value'],
					number: ['value'],
				},
			},

			categorize(token, categories) {
				let type = this.normalize(token),
					base = words.pluralize(type);
				// edge case: token is possessive suffix "'s"
				if (! type) {
					return;
				}
				// TODO? include token in result?
				if (base in categories) {
					return {parser:base, base};
				}
				if (type in categories) {
					return {parser:type, base:type};
				}

				let section = dsf.sectionName(`.${base}`);
				if (section in categories) {
					return {parser:section, base};
					//return {parser:section, base:section, type:base};
				}

				// TODO: store elsewhere
				section = type;
				if (section in this.sections) {
					section = this.sections[section];
				}
				if (section in categories) {
					// use `type`, even though it may be singular; parser will correct
					return {parser:section, base:section, hint:type};
				}

				if (dsf.exists(type)) {
					return {parser:'static', base:type};
				}
				if (dsf.exists(base)) {
					return {parser:'static', base};
				}

				let advantage = this.advantage(type);
				if (advantage) {
					if (udf.exists(type)) {
						return {parser:advantage, base:type};
					}
					if (udf.exists(base)) {
						// allies & contacts
						return {parser:advantage, base, hint:type};
					}
					if (advantage in categories) {
						return {parser:advantage, base:advantage, hint:type};
					}
					return {parser:'generic', type:advantage};
				}

				if (udf.exists(type)) {
					return {parser:'generic', base:type};
				}
				if (udf.exists(base)) {
					return {parser:'generic', base};
				}

				return; // no category
			},

			/**
			 * Attempt to categorize the first word in the given token.
			 */
			categorizeFirst(token, categories) {
				let match = token.match(/^(?<skip>(?<junk>\W*)(?<first>\w+)\W*)(?<rest>.*)/),
					prelim;
				if (match) {
					token = match.groups.first;
				} else {
					match = [token, token, token];
					match.groups = {
						skip: token,
						first: token,
					};
				}
				if ((prelim = this.parse.categorize(token, categories))) {
					// reflect any modifications to the token
					if (prelim.hint) {
						match.groups.first = prelim.hint;
					}
					return {prelim, match, groups:match.groups};
				}
				// no category
				return {match, groups:match.groups};
			},

			categorizeAny(tokens, categories) {
				var prelim, groups;
				for (let i=0; i < tokens.length; ++i) {
					let token = tokens[i],
						skipped = '';
					while (token) {
						// token may be compound; base categorization only on first word
						({prelim, groups} = this.parse.categorizeFirst(token, categories));
						if (prelim) {
							// first part of token is recognized; split the token in `tokens`
							let replacements = [];
							// should match.junk be included in skipped?
							if (skipped) {
								replacements.push(skipped.trim());
							}
							replacements.push(groups.first);
							if (groups.rest) {
								replacements.push(groups.rest);
							}
							// skip if replacements.length == 1?
							tokens.splice(i, 1, ...replacements);
							if (skipped) {
								// position of `first`
								++i;
							}
							return {...prelim, i};
						} else {
							skipped += groups.skip;
							token = groups.rest;
						}
					}
				}
				// no match
				return;
			},

			cleanToken(token) {
				return token.replace(/^(\d*) *pts?$/, '$1');
			},

			dispatch(tokens, prelim) {
				let parser = this.parse._byTokens[prelim.parser],
					parsed;
				if (parser) {
					if (is_function(parser)) {
						parsed = parser(tokens, prelim);
					} else {
						// parse.tokens mutates parser properties, so make a copy first
						parser = copyAll(parser);
						parsed = this.parse.tokens(tokens, parser, prelim);
					}
					return this.parse.normalize(parsed);
				} else {
					console.error(`compatibility.parse.dispatch: No token parser for '${category}'`);
				}
			},

			/**
			 * Post-parse, pre-import processing.
			 */
			normalize(parsed) {
				if (parsed.name) {
					parsed.name = parsed.name.ucfirst();
				}
				return parsed;
			},

			/**
			 * Final stage parsing for simple UDFs with notes (such as associates).
			 *
			 * Mostly, this method tries to determine the UDF base by looking for tags (using <var>tags</var>) in the parsed values.
			 *
			 * @param {object} parsed
			 * @param {string} tags - regex subexpresion to match tags (must not have capturing groups)
			 * @param {string} base - default for base
			 *
			 * @returns {object}
			 */
			noted(parsed, tags, base) {
				const reTag = new RegExp(`^(${tags})\\W+`, 'i'),
					  reTags = new RegExp(`\\b(?:${tags})\\b`, 'gi'),
					  value = (parsed.name || parsed.value);
				let tag = value.match(reTag);
				if (tag) {
					parsed.base = words.pluralize(tag[1].toLowerCase());
					if (parsed.name) {
						parsed.name = parsed.name.replace(reTag, '');
					} else {
						parsed.value = parsed.value.replace(reTag, '');
					}
				} else if ((tag = parsed.notes.match(reTags)) && tag && tag/*?*/.length == 1) {
					parsed.base = words.pluralize(tag[0]);
				} else {
					parsed.base = base /*??*/|| category;
				}
				return parsed;
			},

			prelim(tokens) {
				let prelim = this.parse.categorizeAny(tokens, this.parse._byTokens);
				if (prelim) {
					let i = prelim.i
					if (! prelim.hint) {
						// remove the categorized token
						++i;
					}
					// skip if i == 0?
					tokens.splice(0, i);
				}
				return prelim;
			},

			streamType(value, fields) {
				if (is_numeric(value)) {
					return fields.integer ? 'integer' : 'number';
				} else if (is_hex_rational(value)) {
					return fields.rational ? 'rational' : 'number';
				}
				return 'string';
			},

			/**
			 * Parse <var>values</var> as a stream.
			 */
			stream(values) {
				if (values.every(v => v && v.length < 2)) {
					return false;
				}
				values = values.map(decodeEntities);
				let tokens = [...this.parse.tokenizeAll(values)],
					prelim = this.parse.prelim(tokens),
					{parser} = prelim /*??*/|| {};

				if (parser) {
					if (this.parse._byTokens[parser]) {
						/* `i` is where hint was found, `tokens` the tokens after the 
						 * hint. Replace up to the hint with the remaining tokens.
						 */
						return this.parse.dispatch(tokens, prelim);
					} else {
						console.error(`'${values.join("','")}' categorized as ${parser}, but no parser found.`);
					}
				}
			},

			/**
			 * Break up <var>value</var> into separate tokens.
			 *
			 * @param {string} value
			 *
			 * @returns {string[]}
			 */
			tokenize(value) {
				return this.scrub(value.toString())
					.split(/ *(?:[- ]*[:;()]+[- ]*| -|- |((?:0x[\dA-F]{1,2}|\d{1,2}) *(?:pts?|\/ *(?:0x[\dA-F]{1,2}|\d{1,2})))) *| *(\d{1,2})$/g)
					.filter(x => x)
					.map(x => x.replace(/^[-]|[-]$/, ''));
			},

			/**
			 * Break up <var>values</var> into separate tokens.
			 *
			 * @param {string[]} values
			 *
			 * @yields {string}
			 */
			*tokenizeAll(values) {
				for (let value of values) {
					yield* this.parse.tokenize(value);
				}
			},

			/**
			 * @param {string[]} tokens
			 * @param {Object | function} fields
			 * @param {Prelim} prelim
			 *
			 * @returns {Parsed}
			 */
			tokens(tokens, fields, prelim) {
				// `base` might be hint/type or name, rather than base
				let type, parsed = {base:prelim.base};
				if (fields.pre) {
					fields.pre(parsed);
				}

				function unmatched(parsed, type, token) {
					//parsed.unmatched ??= [];
					parsed.unmatched || (parsed.unmatched = []);
					parsed.unmatched.push(token)
					//parsed.unmatched[type] ??= [];
					parsed.unmatched[type] || (parsed.unmatched[type] = []);
					parsed.unmatched[type].push(token)
					console.warn(`parse.stream: out of fields for '${token}':${type}`);
				}

				for (let token of tokens) {
					token = this.parse.cleanToken(token);
					type = this.parse.streamType(token, fields);
					if (type in fields) {
						if (Array.isArray(fields[type])) {
							// skip anything already set
							while (parsed[fields[type][0]]) {
								fields[type].shift();
							}
							if (fields[type].length) {
								parsed[fields[type].shift()] = token;
							} else {
								unmatched(parsed, type, token);
							}
						} else if (is_function(fields[type])) {
							let name = fields[type](token, parsed);
							if (is_string(name)) {
								parsed[name] = token;
							} else if (is_undefined(name)) {
								unmatched(parsed, type, token);
							}
						} else {
							console.warn(`parse.stream: ${base} has unknown handler type for '${token}':'${type}'`);
						}
					} else {
						console.warn(`parse.stream: ${base} has no way to handle '${token}':'${type}'`);
					}
				}
				if (fields.post) {
					fields.post(parsed);
				}
				return parsed;
			},

			/*** /parse by tokens ***/

			split(value, defaults={}) {
				const parsed = this.parse.byPatterns(value, 'split', defaults);
				if (parsed) {
					return this.parse.normalize(parsed);
				}
			},

			glueRe: memoize(function (glue) {
				return new RegExp(` *${glue} *`);
			}),

			tagged(values, glue=';') {
				let parsed = {};
				for (let value of values) {
					let fields = value.split(this.parse.glueRe(glue));
					for (let field of fields) {
						let [name, value] = halveString(field, / *: */);
						if (name) {
							if (value && value.indexOf(',') > -1) {
								value = value.split(/ *, */);
							}
							parsed[name] = value;
						}
					}
				}
				return parsed;
			},
		},


		/* DST event handlers */
		init($context) {
			this.$context = $context;
			module.waitFor('dsf');
			if (! dsf.exists('last_dst')) {
				this.$sheet.append($('<span class="hidden dsf dsf_last_dst"></span>'));
			}
			// add trampoline for DST-specific exporters
			for (let [slug, dst] of Object.entries(this.aliases.export.dst)) {
				for (let [name, exporter] of Object.entries(dst)) {
					name = words.singulize(name);
					let names = words.pluralize(name),
						base, bases;
					if ('_' != name[0] && ! (name in this.aliases.export) && ! (names in this.aliases.export)) {
						if (udf.exists(names) || dsf.exists(names)) {
							base = names;
							bases = [names, name];
						} else if (udf.exists(name) || dsf.exists(name)) {
							base = name;
							bases = [name, names];
						} else {
							continue;
						}
						if (bases[0] == bases[1]) {
							bases.pop();
						}
						let exporter = function () {
							// Woo-hoo! let
							this.export.each(bases, ...arguments);
						};
						this.aliases.export[base] = exporter.bind(this);
					}
				}
			}
		},

		preLoad(options, $context) {
			this.$context = $context;
			this.slug = options.slug;
			this.import();
		},

		postLoad(options, $context) {
		},

		change({containerId, fieldName, fieldValue}, $context) {
			if (this.is(fieldName)) {

			}
		},

		preSave(options, $context) {
			// wait for udf to recount
			module.waitFor('udf', 'undo');
			this.export();
		},



		/*  */

		advantage(base) {
			for (let key in this.advantages) {
				if (base in this.advantages[key]) {
					return key;
				}
			}
		},


		/* /TODO */

		/**
		 * Generate alias pairs in the given segment (e.g. simple, templates) of aliases.
		 *
		 * @param {string|object} segment Segment name, or segment.
		 * @param {AliasOptions} [options]
		 */
		*aliasEntries(segment, options={}) {
			const isSimple = ('simple' == segment || segment === this.aliases.simple);
			let include = options.include || (entry => true);
			if (segment in this.aliases) {
				segment = this.aliases[segment];
			}
			for (let entry of Object.entries(segment)) {
				if (options.prefix) {
					entry[0] = dsf.addPrefix(entry[0]);
					entry[1] = dsf.addPrefix(entry[1]);
				}
				// skip simple aliases corresponding to complex ones, as the former are spelling corrections (`mine` isn't actually mine)
				if (include(entry)) {
					yield entry;
				}
			}
		},

		aliasFor(names) {
			return Object.values(names).map(dsf.addPrefix).join(',');
		},

		compatible(slug_a, slug_b) {
			// matches edition suffix
			const reEd = /\d+[e]$/i;
			// remove edition suffix before comparing
			return slug_a && slug_b
				&& slug_a.replace(reEd, '') == slug_b.replace(reEd, '');
		},

		/**
		 * Create a DSF for a foreign sheet if it doesn't exist.
		 *
		 * If a DSF already exists with the given name <var>theirs</var>, this method:
		 * + marks it as the foreign DSF for native DSF <var>mine</var>
		 * + adds classes (if any)
		 *
		 * @param {string} theirs - Foreign DSF name ('dsf_' prefix is optional).
		 * @param {object} [extra] - Keyword arguments
		 * @param {string} [mine] - Native DSF(s) being exported.
		 * @param {string} [extra.attrs] - Additional attributes for the DSF element.
		 * @param {string} [extra.classes] - Additional HTML classes for the DSF element.
		 *
		 * @returns {jQuery} The foreign DSF.
		 */
		createField(theirs, {mine, attrs='', classes=''}={}) {
			theirs = dsf.addPrefix(theirs);
			if (mine) {
				if (Array.isArray(mine)) {
					mine = mine.map(dsf.addPrefix).join(',');
				} else {
					mine = dsf.addPrefix(mine);
				}
				attrs += ` data-for="${mine}"`;
			}

			let $field = this.$context.find(`.${theirs}`);
			if (! $field.length) {
				$field = $(`<span class="dsf ${theirs} ${classes}"${attrs}></span>`);
				this.$aliases.append($(`<label for="${theirs}" class="${classes}">${dsf.stripPrefix(theirs)}</label>`));
				this.$aliases.append($field);
			} else if (mine) {
				$field.attr('data-for', mine).addClass(classes);
			}
			return $field;
		},

		/**
		 * Create multiple fields, generating names from a template.
		 *
		 * @param {NameTemplate} tpl - name template
		 * @param {object} options - options for name generation and {@link this.createField}
		 */
		createFields(tpl, options) {
			let {envs, opts} = this.loopVars(tpl, options);
			for (let env of envs) {
				let theirs = klass.eval(tpl, env);
				this.createField(theirs, options);
			}
		},

		/**
		 * Iterate over all aliased DSFs.
		 *
		 * Won't expand any templates into actual DSFs.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 */
		eachAlias(fn, self, options) {
			if (self) {
				fn = fn.bind(self);
			}
			this.eachSimple(fn, null, options);
			this.eachTemplate(fn, null, options);
		},

		/**
		 * Iterate over each entry of some alias segment (simple or templates).
		 *
		 * @param {(string, string) => null} fn
		 * @param {string} segment Segment name.
		 * @param {Object} [self] `fn` is bound to `self`, if provided.
		 * @param {AliasOptions} [options]
		 */
		eachEntry(fn, segment, self, options={}) {
			if (self) {
				fn = fn.bind(self);
			}
			for (let [theirs, mine] of this.aliasEntries(segment, options)) {
				fn(theirs, mine);
			}
		},


		/**
		 * Iterate over all aliased DSFs.
		 *
		 * Will expand any templates into actual DSFs.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 */
		/*
		eachOf(fn, expander, self, options) {
			if (self) {
				fn = fn.bind(self);
			}

			this.eachSimple(fn, null, options);

			for (let [theirs, mine] of Object.entries(this.aliases.templates)) {
				if (options.prefix) {
					theirs = dsf.addPrefix(theirs);
					mine = dsf.addPrefix(mine);
				}

				let aliases = expander(theirs, mine, options);
				for (let {theirs, mine} of aliases) {
					fn(theirs, mine);
				}
			}
		},
		*/
		/**
		 * Iterate over all my aliased DSFs.
		 *
		 * Will expand any templates into actual DSFs.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 */
		/*
		eachOfMine(fn, self, options={}) {
			this.eachOf(fn, this.expandMine.bind(this), self, options);
		},
		*/

		/**
		 * Iterate over all their aliased DSFs.
		 *
		 * Will expand any templates into actual DSFs.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 */
		/*
		eachOfTheirs(fn, self, options={}) {
			this.eachOf(fn, this.expandTheirs.bind(this), self, options);
		},
		*/

		/**
		 * Iterate over simple (i.e. non-templated) aliases.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 * @param {Object} [self] `fn` is bound to `self`, if provided.
		 * @param {AliasOptions} [options]
		 */
		eachSimple(fn, self, options={}) {
			return this.eachEntry(fn, 'simple', self, options);
		},

		/**
		 * Iterate over template aliases.
		 *
		 * Won't expand any templates into actual DSFs.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 * @param {Object} [self] `fn` is bound to `self`, if provided.
		 * @param {AliasOptions} [options]
		 */
		eachTemplate(fn, self, options={}) {
			return this.eachEntry(fn, 'templates', self, options={});
		},


		/**
		 * For templated aliases, return a collection of field names matching those templates.
		 */
		/*
		expandMine(theirs, mine, options={}) {
			let tplTheirs = dsf.addPrefix(theirs),
				tplMine = dsf.addPrefix(mine);
			let pre = klass.prefix(tplMine);
			return this.$context.find(`[class*=" ${pre}"]`)
				.toArray()
				.filter(elt => klass.matches(tplMine, elt.className))
				.map(function (elt) {
					let env = klass.extract(tplMine, elt.className),
						mine = klass.eval(tplMine, env),
						theirs = klass.eval(tplTheirs, env);
					if (klass.hasVars(theirs)) {
						// TODO: fix-theirs has free variables; how to handle?
						fillObject(klass.vars(theirs), '', env);
						theirs = klass.eval(theirs, env);
					}
					if (! options.prefix) {
						theirs = dsf.stripPrefix(theirs);
						mine = dsf.stripPrefix(mine);
					}
					return {theirs, mine};
				});
		},
		*/

		/**
		 * For templated aliases, return a collection of field names matching those templates.
		 */
		/*
		expandTheirs(theirs, mine, options={}) {
			let tplTheirs = dsf.stripPrefix(theirs),
				tplMine = dsf.stripPrefix(mine),
				envs = this.loopVars(theirs);

			for (let [name, value] of dsa.entries(tplTheirs, envs, options)) {
			}

			let pre = klass.prefix(tplTheirs);
			return this.$context.find(`[class*=" ${pre}"]`)
				.toArray()
				.filter(elt => klass.matches(tplTheirs, elt.className))
				.map(function (elt) {
					let env = klass.extract(tplTheirs, elt.className),
						theirs = klass.eval(tplTheirs, env)
						mine = klass.eval(tplMine, env);
					if (klass.hasVars(mine)) {
						// TODO: fix-mine has free variables; how to handle?
						fillObject(klass.vars(mine), '', env);
						mine = klass.eval(mine, env);
					}
					if (! options.prefix) {
						theirs = dsf.stripPrefix(theirs);
						mine = dsf.stripPrefix(mine);
					}
					return {theirs, mine};
				});
		},
		*/

		/*
		*expandTo(theirs, mine, envs) {
			theirs = dsf.addPrefix(theirs);
			mine = dsf.addPrefix(mine);
			for (let env of envs) {
				yield ({
					theirs: klass.eval(theirs, env),
					mine: klass.eval(mine, env)
				});
			}
		},
		*/

		/**
		 *
		 */
		export(/*data*/) {
			if (dsf.exists('export') && ! dsf.value('export')) {
				this.$aliases.find('.dsf').remove();
				return;
			}

			callForAll(this.aliases.export.dst, Object.keys(this.aliases.export.dst), '_start');

			//this.createFields();
			this.exportRequired();

			// handle complex cases
			for (let base in this.aliases.export) {
				// dereference exporters (done when compatibility is first created, but do again in case a client has added more)
				while (is_string(this.aliases.export[base]) && this.aliases.export[base] in this.aliases.export) {
					base = this.aliases.export[base];
				}
				if (! is_function(this.aliases.export[base])) {
					// ignore non-function properties
					continue;
				}
				let {name, elt, $elt} = dsf.resolve(base),
					fn = this.aliases.export[base];//.bind(this);
				if ($elt.length) {
					this.tryExporter(() => fn(dsf.value(elt)), name);
				} else if (($elt = udf.$udf(base)).length) {
					/* TODO:
					 * + behavior-skip more general exporters when there's a more specific exporter
					 * + skip related fields (e.g. BGs for equipment)
					 */
					for (let entry of udf.entries($elt)) {
						/* TODO:
						 * + figure out way of passing UDF base (e.g. 'skills') for section exporters (e.g. 'abilities')
						 */
						this.tryExporter(() => fn(entry.names, entry.values), name);
					};
				}
			}
			this.finishExport();
		},

		exportRequired() {
			this.exportSimple();
			this.exportTemplated();
		},

		exportSimple() {
			for (const [theirs, mine] of this.simpleAliases({prefix:false, skipCorrections:true})) {
				this.exportField(theirs, dsf.value(mine), {mine});
			}
		},

		exportTemplated() {
			// TODO: evaluate whether to set 'export' when exporting to a specific DST (cusory exam: yes, as )
			const opts = {prefix:false, export:true};
			for (let {mine, value, theirs, env} of this.myTemplateEntries(opts)) {
				if (theirs in this.aliases.options) {
					// handle 0-based indices
					let options = this.aliases.options[theirs];
					if (options.noExport) {
						continue;
					}
					if ('start' in options) {
						env.i = (+env.i) + this.offset(options.start);
					}
				}
				// use env & overwrite old fields of theirs
				theirs = klass.eval(theirs, env);
				this.export.dynamicField(theirs, value, {mine});
			}
		},

		/**
		 * Handle export to names with typos by renaming.
		 */
		exportTypos() {
			for (let [typo, fixed] of Object.entries(aliases.typos)) {
				this.exportField(typo, dsf.value(fixed), {mine: fixed});
			}
		},

		/**
		 * Create a field and set its value.
		 *
		 * Note that this method can be called for dynamic fields, but the field name must be fully generated; as far as this method is concerned, the field name is static.
		 *
		 * @param {string} theirs - DSF name ('dsf_' prefix is optional).
		 * @param {*} value - Value to store in DSF.
		 * @param {object} [extra] - Keyword parameters for {@link this.createField}.
		 */
		exportField(theirs, value, extra={}) {
			this.createField(theirs, extra);
			dsf.value(theirs, value);
		},

		/**
		 * Get aliased DSFs.
		 *
		 * @returns {{theirs, mine, value}}: their name, my name, field value
		 */
		extract(data) {
			let entries = [], mine;
			for (let [theirs, value] of Object.entries(data)) {
				// check this.aliases.simple, this.aliases.templates
				if ((mine = this.myNameFor(theirs))) {
					entries.push({theirs, mine, value});
				}
			}
			return entries;
		},

		/**
		 * Get aliased DSFs for the given `aliases`.
		 *
		 *
		 */
		// TODO: refactor-find better name
		extract_(data, aliases) {
			let entries = [];
			for (let [name, value] of Object.entries(data)) {
				// check aliases.simple, aliases.templates
				if (   name in aliases.simple
				    || this.isInstance(name, aliases.templates))
				{
					entries.push({name, value});
				}
			}
			return entries;
		},

		/* Get aliased DSFs for this DST out of storage. */
		extractMine(data) {
			return this.extract_(data, this.sesalia);
		},

		/* Get aliased DSFs for other DSTs out of storage. */
		extractTheirs(data) {
			return this.extract_(data, this.aliases);
		},

		/**
		 * Perform final tasks after exporting DSFs.
		 */
		finishExport() {
			try {
				callForAll(this.aliases.export.dst, Object.keys(this.aliases.export.dst), '_finish');
			} finally {
				this.finishPrune();
				this.exportTypos();
			}
		},

		finishPrune() {
			if (this._prune.length) {
				for (let key of Object.keys(filterObject(dsa.data, (v, k) => this._prune.some(f => f(k))))) {
					this.createField(key);
				}
				this._prune = [];
			}
		},

		/* Copy from their fields to mine. */
		import(/*data*/) {
			let data = dsa.data;

			if (this.compatible(this.slug, data.last_dst)) {
				/* don't bother importing if the last DST used was this one */
				return;
			}

			if (data.last_dst in this.import.dst && is_function(this.import.dst[data.last_dst])) {
				// only import from last_dst
				this.import.dst[data.last_dst](data);
				return;
			}

			for (let [theirs, mine] of this.simpleAliases({prefix:false})) {
				dsa.rename(theirs, mine);
			}
			for (let {theirs, mine, env} of this.theirTemplateEntries({prefix:false})) {
				// generate my name, in case theirs is discontinuous. Also prevents overwriting, but that shouldn't happen (as the presence of their & my template names are mutually exclusive)
				// TODO: fix-handle related fields (only generate next name for 1st)
				mine = dsa.nextName(mine);
				dsa.rename(theirs, mine);
			}

			// more complex imports, where there isn't a 1-1 field mapping
			for (let [tpl, fn] of Object.entries(this.aliases.import)) {
				let {envs, options} = this.loopVars(tpl);
				for (let [name, value, env] of dsa.entries(tpl, envs)) {
					try {
						fn.call(this, name, value, env);
					} catch (err) {
						console.error(`Error importing ${name} (${value}): ${err}`, err.stack);
						// let import continue with other fields
						//throw err;
					}
				}
			}

			this.setDefaults(dsa.data);

			data.last_dst = this.slug;
		},

		/** Convert index for one of their dynamic fields to mine. */
		iMine(iTheirs, start) {
			return (+iTheirs) - this.offset(start);
		},

		/** Convert index for one of my dynamic fields to theirs. */
		iTheirs(iMine, start) {
			return (+iMine) + this.offset(start);
		},

		/** Reports whether the given field name is aliased. */
		is: memoize(function (name) {
			name = dsf.stripPrefix(name);
			return this.isSimple(name) || this.isInstance(name);
		}),

		isInstance(name, aliases) {
			return this.templateFor(name, aliases);
		},

		isSimple: memoize(function (name) {
			name = dsf.stripPrefix(name);
			return name in this.aliases.simple || name in this.sesalia.simple;
		}),

		/**
		 * Loop options are arguments to {@link range.over} used by {@link this.loopVars} when creating DSF name sequences from a {@link NameTemplate name template}.
		 *
		 * Options can be set for specific DSF name templates in {@link aliases.options}. Example:
		 *
		 *     aliases = {
		 *         options: {
		 *             'bg{i}': {
		 *                 from: 1,
		 *                 to: 10,
		 *                 continuous: false,
		 *             },
		 *             'bg{i}_expanded{j}': {
		 *                 from: 1,
		 *                 i: {to: 10},
		 *                 j: {thru: 3},
		 *                 continuous: false,
		 *             },
		 *         }
		 *     }
		 *
		 * @param {NameTemplate} tpl - the name template
		 * @param {object} [defaults] - defaults for loop options
		 */
		loopOptions(tpl, defaults={}) {
			defaults = {from: 0, continuous: true, ...defaults};
			let options = {};
			if (tpl in this.aliases.options) {
				options = this.aliases.options[tpl];
			}
			if (! (range.hasEnd(defaults) || range.hasEnd(options))) {
				defaults.to = udf.maxCount;
			}
			return {...defaults, ...options};
		},

		/**
		 * Creates a {@link range.keyed keyed} sequence to loop over (templated) DSF names.
		 *
		 * Example:
		 *     let tpl = 'bg{i}_expanded{j}',
		 *         {envs} = compatibility.loopVars(tpl);
		 *     for (let env of envs) {
		 *         let name = klass.eval(tpl, env);
		 *         // …
		 *     }
		 *
		 *     let tpl = 'bg{i}_expanded{j}',
		 *         {envs, opts} = compatibility.loopVars(tpl, {from: 1, to: 10, continuous: false}),
		 *         expandedBgs = dsa.entries(tpl, envs, opts);
		 *
		 * Creates an {@link range.keyed iterable} yielding {@link NameTemplate name template} environments which can be used with {@link klass.eval} to produce a sequence of DSF names.
		 *
		 * Returns not only the sequence, but also the template vars and the loop options used to create the sequence.
		 *
		 * @param {NameTemplate} tpl - the name template
		 * @param {object} [defaults] - defaults for loop options
		 *
		 * @returns {{vars, envs, opts}}
		 */
		loopVars(tpl, defaults={}) {
			let options = this.loopOptions(tpl, defaults),
				vars = klass.vars(tpl),
				paramses = {},
				envs;
			for (let v of vars) {
				if (v in options) {
					// this leaves any variable-specific options in options[v], but those should be ignored within range.keyed
					paramses[v] = {...options, ...options[v]};
					if (range.hasEnd(options[v]) && paramses[v].to == udf.maxCount) {
						// default end not overwritten; remove it, so it doesn't take precedence over the end from options
						delete paramses[v].to;
					}
				} else {
					paramses[v] = options;
				}
			}
			envs = range.keyed(paramses);
			return {vars, envs, opts:paramses};
		},

		/**
		 * 
		 */
		*myEntries(options) {
			yield* this.mySimpleEntries(options);
			yield* this.myTemplateEntries(options);
		},

		/**
		 * Generates alias instances for each DSF existing in current DST.
		 *
		 * Gets the DSFs from this DST corresponding to simple aliases. Yields the name & value from the DSFs in this DST, along with the (alias) name (the name from another DST).
		 *
		 * @yields {MyAliasEntry}
		 */
		*mySimpleEntries(options) {
			yield* range.map(
				this.simpleAliases(options),
				([theirs, mine]) => ({mine, value:dsf.value(mine), theirs})
			);
		},

		/**
		 * Generates alias template instances for each DSF existing in current DST.
		 *
		 * For templated aliases (pairs of my/theirs templated DSF names), gets the DSFs from this DST matching my template. Extracts the variables from the instance (using the template). Yields the name, value and variables from the DSFs in this DST with their template (unevaluated, so consumer can set their template variables).
		 *
		 * @yields {MyTemplateEntry}
		 */
		*myTemplateEntries(options) {
			for (let [theirs, myTpl] of this.templateAliases(options)) {
				yield* range.map(
					dsf.entries(myTpl),
					([myName, value]) => {
						let env = klass.extract(myTpl, myName);
						for (let [k, v] of Object.entries(env)) {
							if (is_numeric(v)) {
								env[k] = +env[k];
							}
						}
						return {mine:myName, value, theirs, env};
					}
				);
			}
		},

		/**
		 * If `theirs` is an aliased field from another sheet, return my name for it.
		 *
		 * @param {string} theirs A field name (not a template).
		 */
		myNameFor: memoize(function (theirs) {
			return this.nameFor(theirs, this.aliases);
		}),

		/**
		 * If `name` is in the given aliases, return the foreign name for it.
		 *
		 * Note: monodirectional; `name` must correspond to a key in aliases.
		 *
		 * @param {string} theirs A field name (not a template).
		 */
		nameFor(name, aliases) {
			name = dsf.stripPrefix(name);
			if (name in aliases.simple) {
				return aliases.simple[name];
			}
			let from = this.templateFor(name, aliases),
				to = aliases.templates[tpl];
			return klass.apply(from, to, name);
		},

		normalize: memoize(function (name) {
			name = this.scrub(name);
			name = words.singulize(name);
			return this.standardize(name);
		}),

		normalizes: memoize(function (name) {
			name = this.normalize(name);
			if (name in this._sesalia.simple) {
				// don't pluralize aliases
				return name;
			}
			return words.pluralize(name);
		}),

		/**
		 * Calculate index offset for DSTs that use a different index base
		 *
		 * iTheirs = iMine + this.offset(theirStart);
		 */
		offset(start) {
			return start - 1;
		},

		/**
		 * Remove old values.
		 *
		 * @param {RegExp|string => boolean} predicate - tests which existing character data to prune
		 */
		prune(predicate) {
			if (predicate.test) {
				// e.g. regex
				const pred = predicate;
				predicate = k => pred.test(k);
			}
			// schedule pruning
			this._prune.push(predicate);
		},

		scrub: memoize(function (name) {
			return name.replace(/<[^>]*>|click to edit| *\((cont('d|inued)?\.*|misc\.?|\.+)\)|^[- :;_()]+$/gi, '');
		}),

		standardize: memoize(function (name) {
			name = words.standardize(name.toLowerCase());
			return words.lookup(name, this.aliases.simple);
		}),

		_splatRe: memoize(function (base) {
			switch (base) {
			case 'talent':
			case 'skill':
			case 'knowledge':
				return new RegExp(`^[^a-z]*${base}s?[: ]+(?<name>[^(]*)(?: *\\((?<specialty>[^)]*)\\))?`, 'i');

			default:
				return new RegExp(`^[^a-z]*${base}s?[: ]+(?<name>.*)`, 'i');
			}
		}),

		renameSplat(base, theirs, rating, value) {
			let parts;
			if ((parts = value.match(this._splatRe(base)))) {
				// splat traits uses singular base, MLL uses plural
				base = words.pluralize(base);
				let names = {
					name: `dyn_${base}_{i:02}_name`,
					value: `dyn_${base}_{i:02}`,
					specialty: `dyn_${base}_{i:02}_specialty`,
				}, values = parts.groups;
				values.value = dsa.data[rating];
				udf.addDsa(names, values, base);
				/*
				dsa.data[names[0]] = parts.groups.val;
				dsa.rename(rating, names[1]);
				dsa.updateSize(base, names.i);
				*/
				delete dsa.data[rating];
				delete dsa.data[theirs];
				return true;
			}
			return false;
		},

		/**
		 * Convert their name to mine (or vice versa) by resolving the alias (if any).
		 *
		 * Differs from `nameFor` in that this method will return the original name if it's not aliased, while `nameFor` will only return the aliased field for the given name.
		 */
		resolve(name, aliases) {
			return this.nameFor(name, aliases) /*??*/|| name;
		},

		/**
		 * Convert a DSF name to one on my sheet by resolving the alias (if any).
		 *
		 * Differs from `nameForMine` in that this method will return the original name if it's not aliased (and thus presumably is on this sheet), while `nameForMine` will only return .
		 */
		resolveToMine: memoize(function (name) {
			return this.resolve(name, this.aliases);
		}),

		/**
		 * Convert a DSF name to one on another sheet by resolving the alias (if any).
		 *
		 * Differs from `nameForTheirs` in that this method will return the original name if it's not aliased, while `nameForTheirs` will only return the aliased field for the given name.
		 */
		resolveToTheirs: memoize(function (name) {
			return this.resolve(name, this.sesalia);
		}),

		/**
		 * Set default values when importing.
		 *
		 * This is in case player left off a field, or the foreign sheet simply has no corresponding field.
		 *
		 * There should be a very short list of defaults.
		 */
		setDefaults(data) {
			//data ??= dsa.data;
			data || (data = dsa.data);
			for (let [k, v] of Object.entries(this.defaults)) {
				if (! data[k]) {
					if (v in data) {
						data[k] = data[v];
					} else {
						data[k] = v;
					}
				}
			}
		},

		/**
		 * Generate pairs of simple aliases.
		 *
		 * @param {AliasOptions} [options]
		 */
		*simpleAliases(options={}) {
			yield* this.aliasEntries('simple', options);
			if (! options.skipCorrections) {
				yield* this.aliasEntries('typos', options);
			}
		},

		/**
		 * Generate pairs of (unexpanded) templated aliases.
		 *
		 * @param {AliasOptions} [options]
		 */
		*templateAliases(options={}) {
			// should options be copied first?
			delete options.skipCorrections;
			if (options.export) {
				options.include = entry => {
					const prefix = klass.prefix(entry[1]),
						  name = klass.eval(entry[1], {i:1}),
						  $udf = dsf.$dsf(name).closest('.udf');
					if (   (entry[0] in this.aliases.export.templates)
						|| (entry[1] in this.aliases.export.templates))
					{
						return false;
					}
					return true;
				};
			}
			yield* this.aliasEntries('templates', options);
		},

		/**
		 * Return the template alias matching the given name (if any).
		 *
		 * If no aliases are given, checks fields for this sheet & others.
		 *
		 * @param {string} name A field name.
		 * @param {{simple:{...}, templates:{...}}} als simple & templated aliases
		 */
		templateFor(name, als) {
			name = dsf.stripPrefix(name);
			if (als) {
				return Object.keys(als.templates).find(tpl => klass.matches(tpl, name))
			}
			return this.templateFor(name, this.aliases)
				/*??*/|| this.templateFor(name, this.sesalia);
		},

		/**
		 * Generates a sequence of [theirName, value, myName, env].
		 */
		*theirEntries(options) {
			yield* this.theirSimpleEntries(options);
			yield* this.theirTemplateEntries(options);
		},

		*theirSimpleEntries(options) {
			yield* range.map(
				this.simpleAliases(options),
				([theirs, mine]) => ({theirs, value:dsa.data[theirs], mine})
			);
		},

		*theirTemplateEntries(options) {
			for (let [theirs, mine] of Object.entries(this.aliases.templates)) {
				let {envs, opts:loopOpts} = this.loopVars(theirs, options);
				yield* range.map(
					dsa.entries(theirs, envs, loopOpts),
					([theirs, value, env]) => ({theirs, value, mine, env})
				);
			}
		},

		/**
		 * If `mine` is an aliased field from this sheet, return their name for it
		 *
		 * @param {string} mine A field name (not a template).
		 */
		theirNameFor: memoize(function (mine) {
			return this.nameFor(mine, this.sesalia);
		}),

		/**
		 */
		tryExporter(exporter, label='') {
			try {
				exporter();
			} catch (err) {
				if (label) {
					label = ' for ' + label;
				}
				console.error(`Error during export${label}:`, err);
			}
		},
	};
	for (let funcs of [
		compatibility.port.export,
		compatibility.port.import,
		compatibility.parse,
		compatibility.parse._byTokens,
		compatibility['export.'],
		compatibility['import.'],
	]) {
		bindAll(funcs, compatibility);
	}
	Object.assign(compatibility.export, compatibility['export.']);
	Object.assign(compatibility.import, compatibility['import.']);
