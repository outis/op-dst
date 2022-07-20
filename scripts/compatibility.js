	/***
	 * DSFs from other DSs
	 *
	 * @requires dsf, klass, range, udfs
	 */
	let compatibility = globals.compatibility = {
		/**
		 * @typedef {Object} AliasOptions
		 * @property {boolean} [prefix] Whether to prefix names with the DSF prefix.
		 * @property {boolean} [skipCorrections] Whether to skip simple aliases that are spelling corrections.
		 *
		 * @typedef {Object} MyAliasEntry
		 * @property {string} mine DSF name for this DST
		 * @property {string} value DSF value
		 * @property {string} theirs DSF name for other DST
		 * @property {string} [env] For template aliases, contains variables extracted from name.
		 *
		 * @typedef {MyAliasEntry} MyTemplateEntry
		 * @property {string} theirs DSF template for other DST
		 * @property {string} env
		 */
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
			aliases.export.dst ||= {};
			for (let [name, dst] of Object.entries(aliases.dst)) {
				bindAll(dst.import, this);
				Object.assign(aliases.import, dst.import);
				aliases.export.dst[name] = dst.export || {};
				if (is_function(dst.override)) {
					this.import.dst[name] = dst.override;
				}
			}

			this._sesalia.simple = flipObject(this.aliases.simple);
			this._sesalia.templates = flipObject(this.aliases.templates);
		},

		_merge(port) {
			// first, merge the main properties
			this._aliases[port] ||= {};
			bindAll(this._aliases[port], this);
			// copy global port functions
			Object.assign(this._aliases[port], this.port[port]);

			// then, work on sub-objects
			if ((port+'.') in this._aliases) {
				// check & merge dst separately so as not to either overwrite it or miss copying the properties
				if ('dst' in this._aliases[port+'.']) {
					this[port].dst ||= {};					
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
				/* Entry points for my DSFs/UDFs */
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
			
			all(names, values, mine) {
				for (let key in names) {
					this.export.dynamicField(names[key], values[key], {mine});
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
					} else {
						console.warn(`Cannot export field to ${slug}: no exporter matching any of ${bases.join(',')}.`, args);
					}
				}
			},
			
			equipment(names, values) {
				this.export.generic('equipment', ...arguments);
			},

			dynamicField(theirs, value, extra={}) {
				if (extra.classes) {
					extra.classes += 'dyn';
				} else {
					extra.classes = 'dyn';
				}
				return this.exportField(theirs, value, extra);
			},

			field(name, value, mine, options={}) {
				if (! options && is_object(mine)) {
					options = mine;
					delete mine;
				}
				let theirs = dsf.nextName(name, options);

				this.export.dynamicField(theirs, value, {mine});
			},

			flavor(name, values, mine, options={}) {
				let value = values.name;
				if (values.value) {
					value += ': ' + values.value;
				}
				compatibility.export.field(name, value, mine, options);
			},
			
			generic(base, ...args) {
				this.export.each([base, 'generic'], ...args);
			},

			linked(mine, base) {
				let perm = dsf.value('perm_' + mine),
					curr = dsf.value('curr_' + mine);
				this.export.simple(base || mine, `${curr} / ${perm}`);
			},

			paired(names, values, mine, options={}) {
				if (! options && is_object(mine)) {
					options = mine;
					delete mine;
				}
				let theirs = dsf.nextName(names, options);

				this.export.all(theirs, values, mine);
			},
			
			simple(mine, value) {
				// TODO: behavior-only rename certain aliased fields
				// power -> pathos, curr_health -> corpus
				let name = this.sesalia.simple[mine] || mine;

				if (Array.isArray(name)) {
					name = name[0];
				}
				this.export.each([mine, 'simple'], mine, name, value);
			},
		},

		// copied to function `import`; `this` will get bound to `compatibility`
		'import.': {
			dst: {},
			
			_udf(parsed, names, base) {
				base ||= parsed.base || words.pluralize(parsed.type);
				udfs.addDsa(names, parsed, base);
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
				parsed.value ||= parsed.points;
				this.import._udf(parsed, names);
				/*
				udfs.addDsa(names, parsed, parsed.base);
				parsed.imported = parsed.base;
				*/
				return parsed;
			},

			arcanoi(parsed, names) {
				names = {name: 'dyn_arcanoi_{i:02}_name', value: 'dyn_arcanoi_{i:02}'};
				parsed.name = parsed.name.titleCase();
				this.import._udf(parsed, names, 'arcanoi');
				/*
				udfs.addDsa(names, values);
				parsed.imported = 'arcanoi';
				*/
				return parsed;
			},

			associates(parsed, names) {
				let base = parsed.base;
				names = {
					name: `dyn_${base}_{i:02}`,
					notes:`dyn_${base}_{i:02}_notes`,
				};
				parsed.name ||= parsed.value
				this.import._udf(parsed, names);
				/*
				udfs.addDsa(names, parsed, base);
				parsed.imported = base;
				*/
				let bg = {
					base: 'backgrounds',
					name: parsed.type,
					value: parsed.points || parsed.value,
					specialty: parsed.name,
				};
				this.import.backgrounds(bg);
			},

			backgrounds(parsed) {
				let names = {
						name: 'dyn_backgrounds_{i:02}_name',
						value: 'dyn_backgrounds_{i:02}',
						specialty: 'dyn_backgrounds_{i:02}_specialty',
					},
					label = parsed.name,
					values = {
						value: parsed.value || parsed.points,
					};
				if (parsed.type) {
					//label = `${parsed.type} (${parsed.name})`;
					values.name = parsed.type;
					values.specialty = parsed.name;
				} else {
					values.name = parsed.name;
					if (parsed.specialty) {
						values.specialty = parsed.specialty;
					}
				}
				this.import._udf(values, names, 'backgrounds');
				/*
				udfs.addDsa(names, values, 'backgrounds');
				parsed.imported = 'backgrounds';
				*/
				return parsed;
			},

			categorize(parsed, categories) {
				//console.info(`Choosing importer for ${parsed.base}.`);
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
					//console.info(`chose ${section}`);
					return [section, base];
				}
				if (dsf.exists(parsed.base)) {
					return ['simple', base];
				}
				if (udfs.exists(parsed.base)) {
					return ['udfs', base];
				}
				return ['generic', base];
			},
			
			dispatch(parsed, names) {
				//console.info(`Choosing importer for ${parsed.base}.`);
				try {
				let [category, base] = this.import.categorize(parsed, this.import),
					importer = this.import[category],
					imported = importer(parsed, names);
				if (imported && ! ('imported' in parsed)) {
					if ('string' == typeof(imported)) {
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
					'type': 'dyn_equipment_{i:02}_type',
					'name': 'dyn_equipment_{i:02}_name',
					'points': 'dyn_equipment_{i:02}_points',
					'description': 'dyn_equipment_{i:02}_description',
					'charge': 'dyn_equipment_{i:02}_charge',
				};
				this.import._udf(parsed, names, 'equipment');
				/*
				udfs.addDsa({
					'type': 'dyn_equipment_{i:02}_type',
					'name': 'dyn_equipment_{i:02}_name',
					'points': 'dyn_equipment_{i:02}_points',
					'description': 'dyn_equipment_{i:02}_description',
					'charge': 'dyn_equipment_{i:02}_charge',
				}, parsed, 'equipment');
				parsed.imported = 'equipment';
				*/
				/*
				let bg = {
					base: 'backgrounds',
					name: parsed.type,
					value: parsed.points,
					specialty: parsed.name,
				};
				this.import.backgrounds(bg);
				*/
				return parsed;
			},

			generic(parsed, names) {
				if (udfs.exists(parsed.base)) {
					return this.import.udfs(parsed, names);
				}
				let base = this.normalize(parsed.name);
				if (dsf.exists(base)) {
					parsed.base = base;
					delete parsed.name;
					return this.import.simple(parsed, names);
				}
				return this.import.advantage(parsed, names);
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
			
			split(value, names, base) {
				let parsed = this.parse.split(value, {base});
				if (parsed) {
					if (is_numeric(parsed.value)) {
						parsed.value = +parsed.value;
					}
					this.import._udf(parsed, names, base);
					/*
					udfs.addDsa(names, parsed, base);
					parsed.imported = base;
					*/
				}
				return parsed;
			},

			udfs(parsed, names) {
				// get template for `.{$parsed.base}`
				let base = parsed.base,
					$tpl = udfs.$template(base);
				
				if ($tpl) {
					tpls = udfs.keyedFieldsFor(base, {$tpl});
					this.import._udf(parsed, tpls);
					/*
					udfs.addDsa(tpls, parsed, base);
					parsed.imported = base;
					*/
					return parsed;
				}
			},
		},

		// `this` will get bound to `compatibility`
		parse: {
			_patterns: {
				ability: [
					/^(?:(?<base>knowledge|skill|talent)s?[-: ]+)?(?<name>[^:()]+) +(?:\((?<specialty>[^)]*)\))?(?:[-: ]+\(?(?<value>\d+)(?: *pts?)?\)?)?$/i,
					/* covers:
					   /^(?<name>[^:()]+) +\((?<specialty>[^)]*)\)[-: ]+\(?(?<value>\d+)(?: *pts?)?\)?$/i,
					   /^(?<name>[^:()]+)[-: ]+\(?(?<value>\d+)(?: *pts?)?\)?$/i,
					   /^(?<name>[^:()]+) +\((?<specialty>[^)]*)\)$/i,
					*/
				],
				arcanoi: [
					/^(?:(?<type>arcan(?:oi|um))[-: ]+)?(?<name>[^:\/]+)[-: ]+\(?(?<value>(?:0x[\dA-F]+|\d+) *\/ *(?:0x[\dA-F]+|\d+))\)?$/i,
					/^(?:(?<type>arcan(?:oi|um))[-: ]+)?(?<name>[^:\/]+)[-: ]+\(?(?<value>(?:\d+|0x[\dA-F]+)) *\)?$/i,
					// value only
					/^\W*(?<value>(?:\d+|0x[\dA-F]+)(?: *\/ *(?:\d+|0x[\dA-F]+))?)\W*$/i,
				],
				equipment: [
					/^(?<points>\d+)(?: *pts?)?[-: ]+(?<name>[^-:\/]*\w) *(?:\((?<description>[^)]*)\)?)?(?:[-: ]+(?<charge>\d+(?: *\/ *\d+)?))?$/i,
					/^(?:(?<type>(?:relic|art[ei]fact|equipment))[-: ]+)?\(?(?<name>[^:()]+\w)[-:) ]+\(?(?<description>[^:()]+\w)\)?[-: ]+\(?(?<points>\d+)(?: *pts?)?\)?[-,:; ]+\(?(?<charge>\d+(?: *\/ *\d+)?)\)?$/i,
					// will this ever match if the previous fails?
					/^(?:(?<type>(?:relic|art[ei]fact|equipment))[-: ]+)?\(?(?<name>[^:()]+\w)[-:) ]+(?:\((?<description>[^:()]+\w)\)[-: ]+)?\(?(?<points>\d+)(?: *pts?)?\)?[-,:; ]+\(?(?<charge>\d+(?: *\/ *\d+)?)\)?$/i,
					/^(?:(?<type>(?:relic|art[ei]fact|equipment))[-: ]+)?\(?(?<name>[^:()]+\w)[-:) ]+(?:\((?<description>[^:()]+\w)\)[-: ]+)?\(?(?<points>\d*)(?: *pts?)?\)?[,; ]+\(?(?<charge>\d*(?: *\/ *\d+)?)\)?$/i,
					/^(?:(?<type>(?:relic|art[ei]fact|equipment))[-: ]+)?\(?(?<name>[^:()]+\w)[-:) ]+(?:\((?<description>[^:()]+\w)\)[-: ]+)?\(?(?<charge>\d+ *\/ *\d+)\)?$/i,
					/^(?:(?<type>(?:relic|art[ei]fact|equipment))[-: ]+)?\(?(?<name>[^:()]+\w)[-:) ]+(?:\((?<description>[^:()]+\w)\)[-: ]+)?\(?(?<value>\d+)\)?$/i,
					/(?<name>[^()]*?[^ ()]+)\)? *\((?:(?<points>\d+)(?: pts?)?)\)(?:[-,:; ]+\(?(?<charge>\d+(?: *\/ *\d+)?))?\)?/,
					/(?<name>.*)/ //default: all to name
				],
				generic: [
					/^(?:(?:(?<base>fetter|passion)|(?<type>relic|art[ei]fact))s?[-: ]+)?(?<name>[^:]+)[-: ]+(?<value>(?:\d+|0x[\dA-F]+))?(?: *pts?)?[-:; ]+\(?(?<charge>(?:\d+|0x[\dA-F]+) *\/ *(?:\d+|0x[\dA-F]+))?\)?$/i,
					/^(?:(?:(?<base>fetter|passion)|(?<type>relic|art[ei]fact))s?[-: ]+)?(?<name>[^:]+)[-: ]+\(?(?<value>(?:\d+|0x[\dA-F]+))(?: *pts?)?\)?$/i,
					/^(?<value>\d+)[-: ]+(?<name>.*)$/i,
					/^\W*(?<value>\d+)\W*$/,
					/^\W*(?<name>.*\w)\W*$/,
				],
				simple: [
					/^(?<name>[^-:]*)[-: ]+(?<value>.+)/,
					/^\W*(?<value>\d+)\W*$/,
				],
				split: [
					/^\W*(?<name>\b.*\w)\W*\( *(?<value>[-+]?\d+) *\) *$/,
					/^\W*(?<name>\b[^-:*]*\w(?: *\([^)]*\))?)[-: ]+(?<value>[-+]?\d+)\W*$/,
					/^\W*(?<name>\b.*?\w)\W*$/,
				],
			},

			_byValues: {
				abilities(base, values, defaults={}) {
					/*
					  values[0] should be ability & can be ignored in favor of 'base'
					  values[1] should hold ability name, & maybe value
					  values[2] may hold value
					*/
					defaults = { base:words.pluralize(base), ...defaults };
					let parsed = this.parse.byPatterns(values[1], 'ability', defaults);
					if (parsed) {
						// in case base was pulled from values[1]
						parsed.base = words.pluralize(parsed.base);
						if (! parsed.value && is_real(values[2])) {
							// in case rating is in separate field from name & specialty
							parsed.points = parsed.value = values[2];
						}
					} else {
						if (values.length > 2 && is_real(values[2])) {
							parsed = mergeObjects({
								name: values[1],
								value: values[2],
								points: values[2],
							}, defaults);
						}
					}
					return parsed;
				},

				arcanoi(base, values, defaults={}) {
					if (/arcan(oi|um)\W*$/i.test(values[0])) {
						values.shift();
					}
					let value = values[1];
					if (! value) {
						value = values[0];
					}
					let parsed = this.parse.byPatterns(value, 'arcanoi', defaults);
					if (parsed) {
						if (! parsed.name) {
							// found levels, but not name
							if (values[1]) {
								// name is 1st, levels 2nd
								parsed.name = base || words.singulize(values[0]);
							} else {
								// found value, but no name; what do?
							}
						}
						parsed.base = 'arcanoi';
					} else {
						console.warn(`No name found for arcanoi in '${values}'.`);
					}
					return parsed;
				},

				associates(base, values, defaults={}) {
					let parsed = this.parse._byValues.generic(base, values, defaults);
					parsed.base = base;
					return parsed;
				},

				backgrounds(base, values, defaults={}) {
					let parsed = this.parse._byValues.generic(base, values, defaults),
						section = dsf.sectionName(`.${base}`);
					parsed.base = 'backgrounds';
					//if (section && ) {
						parsed.base = base;
					//}
					return parsed;
				},

				equipment(base, values, defaults={}) {
					let charge = 10, parsed;
					
					defaults = {...defaults, type:values[0], points:values[2], charge},
					parsed = this.parse.byPatterns(values[1], 'equipment', defaults);
					if (parsed) {
						parsed.base = 'equipment';
						parsed.type = this.normalize(parsed.type || base);
						if (! parsed.value && parsed.charge <= 5) {
							parsed.value = parsed.charge;
							parsed.charge = charge;
						}
						// for BG value
						parsed.value ||= parsed.points;
					}
					return parsed;
				},
				
				generic(base, values, defaults={}) {
					if (! base) {
						// base couldn't be determined by categorization, so guess a base based on 1st value
						base = this.standardize(values[0].replace(/\W.*/, ''));
					}
					defaults = {
						base,
						type: this.normalize(values[0].replace(/\W.*/, '')),
							...defaults
					};
					if (is_real(values[2])) {
						defaults.points = values[2];
					}
					let parsed = this.parse.byPatterns(values[1], 'generic', defaults)
						|| this.parse.byPatterns(values[0], 'generic', defaults);
					if (parsed.name) {
						parsed.name = parsed.name.trim().replace(/^\((.*)\)$/, '$1');
					}
					/*
					// another round
					base = this.parse.categorize(parsed.type);
					*/
					return parsed;
				},

				simple(base, values, defaults={}) {
					defaults = {base, ...defaults};					
					let parsed = this.parse.byPatterns(values[1], 'simple', defaults)
							  || this.parse.byPatterns(values[0], 'simple', defaults),
						value = values[1] || values[0];
					if (! parsed) {
						parsed = mergeObjects({ value }, defaults);
					}
					return parsed;
				},
			},
			
			byPatterns(value, patterns, defaults) {
				if (! value) {
					return;
				}
				let parts, dbg = false;
				if (patterns in this.parse._patterns) {
					dbg = /^equipment/.test(patterns);
					patterns = this.parse._patterns[patterns];
				}
				for (let pattern of patterns) {
					if ((parts = value.match(pattern))) {
						if (dbg) {
							console.debug(`Matched ${value} to ${pattern}.`);
						}
						return mergeObjects(parts.groups, defaults);
					}
				}
			},

			categorize(base, categories) {
				base = words.pluralize(this.normalize(base));
				if (base in categories) {
					return [base, base];
				}
				let type = this.normalize(base);
				if (type in categories) {
					return [type, type];
				}

				let section = dsf.sectionName(`.${base}`);
				if (section in categories) {
					return [section, base];
				}
				
				const sections = {
					artifact: 'equipment',
					relic: 'equipment',
				};
				section = type;
				if (section in sections) {
					section = sections[section];
				}
				if (section in categories) {
					// use `type`, even though it may be singular; parser will correct
					return [section, type];
				}
				
				if (dsf.exists(type)) {
					return ['simple', type];
				}
				if (dsf.exists(base)) {
					return ['simple', base];
				}
								
				let advantage = this.advantage(type);
				if (advantage) {
					if (udfs.exists(type)) {
						return [advantage, type];
					}
					if (udfs.exists(base)) {
						return [advantage, base];
					}
					if (advantage in categories) {
						return [advantage, type];
					}
					return ['generic', advantage];
				}
				
				if (udfs.exists(type)) {
					return ['generic', type];
				}
				if (udfs.exists(base)) {
					return ['generic', base];
				}
				
				return ['generic', null];
			},

			dispatch(base, values, categories) {
				let [category, base_] = this.parse.categorize(base, categories),
					parsed = categories[category](base_, values);

				if (parsed) {
					parsed.type ||= words.singulize(parsed.base);
					if (is_real(parsed.value)) {
						parsed.points ||= parsed.value;
					}
				}
				return parsed;
			},

			/**
			 * Parse a field from oWoD generic.
			 */
			outOf3(values) {
				let [base, name] = breakString(
					this.scrub(values[0]) /* || '' */, /[-: ]+/,
					{limit: 2, include:false});
				// store scrubbed version
				values[0] = this.normalizes(base);
				//name &&= name.replace(/^ *\((.*)\) *$/g, '$1');
				name &&= name.trim();
				if (name) {
					values.splice(1, 0, name);
				} else if ('backgrounds' == values[0]) {
					// replace 'backgrounds' to get more specific base
					[values[0], values[1]] = breakString(values[1], /[-: ]+/, {limit: 2, include:false});
					// no need to scrub here
					base = values[0];
				}
				return this.parse.dispatch(base, values, this.parse._byValues);
			},

			split(value, defaults={}) {
				return this.parse.byPatterns(value, 'split', defaults);
			},

			glueRe: memoize(function (glue) {
				return new RegExp(` *${glue} *`);
			}),
			
			tagged(values, glue=';') {
				let parsed = {};
				for (let value of values) {
					let fields = value.split(this.parse.glueRe(glue));
					for (let field of fields) {
						let [name, value] = breakString(field, / *: */, {limit: 2, include: false});
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
						if (udfs.exists(names) || dsf.exists(names)) {
							base = names;
							bases = [names, name];							
						} else if (udfs.exists(name) || dsf.exists(name)) {
							base = name;
							bases = [name, names];
						} else {
							continue;
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
			// wait for udfs to recount
			module.waitFor('udfs');
			this.export();
		},

		

		/*  */

		advantage(base) {
			//console.info(`Trying to import ${parsed.base} as a background.`);
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
		 * @param {string} segment Segment name.
		 * @param {AliasOptions} [options]
		 */
		*aliasEntries(segment, options={}) {
			let include = entry => true;
			if ('simple' == segment && options.skipCorrections) {
				include = entry => !this.aliases.import[entry[1]];
			}
			for (let entry of Object.entries(segment)) {
				if (options.prefix) {
					entry[0] = dsf.addPrefix(entry[0]);
					entry[1] = dsf.addPrefix(entry[1]);
				}
				// skip simple aliases corresponding to complex ones, as the former are spelling corrections (`mine` isn't actually mine)
				if (include) {
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
		
		createField(theirs, {mine, attrs='', classes=''}={}) {
			theirs = dsf.addPrefix(theirs);
			if (mine) {
				mine = dsf.addPrefix(mine);
				attrs += ` data-for="${mine}"`;
			}
			
			let $field = this.$context.find(`.${theirs}`);
			if (! $field.length) {
				$field = $(`<span class="dsf ${theirs} ${classes}"${attrs}></span>`);
				this.$aliases.append($field);
			} else if (mine) {
				$field.attr('data-for', mine).addClass(classes);
			}
			return $field;
		},

		/* Ensure DSFs for aliases exist by creating any missing ones. */
		/* no longer used: done as needed, rather than up-front
		createFields() {
			let $sheet = this.$sheet;
			if (! dsf.exists('last_dst')) {
				$sheet.append($('<span class="hidden dsf dsf_last_dst"></span>'));
			}

			this.createSimpleFields();
			this.createTemplatedFields();
		},

		createSimpleFields() {
			// eachSimple
			for (let [theirs, mine] of this.simpleAliases()) {
				this.createField(theirs, {mine});
			}
		},

		createTemplatedFields() {
			// eachTemplate
			for (let [theirs, mine] of this.templateAliases()) {
				let vars = klass.vars(theirs),
					envs = range.forVars(vars, {pad:2}),
					t = theirs, m = mine,
					$mine;
				// expandTo will add prefixes
				for (let {theirs, mine} of this.expandTo(t, m, envs)) {
					$mine = $(`.${mine}`);
					if ($mine.length) {
						this.createField(theirs, {mine});
					} else {
						break;
					}
				}
			}
		},
		*/

		/**
		 * Remove any backing fields after the last non-empty field for the given templated alias.
		 */
		/* Not currently used
		cullTemplate(theirs, mine) {
			let vars = klass.vars(theirs),
				k = vars.shift(),
				range = range.forVar(k),
				env = {};
			for (let v of vars) {
				// check only 1st field for each item
				env[v] = 1;
			}
			/* Currently, this considers each DSF from a UDF template separately.
			 * The result may be ragged (i.e. missing backing DSFs for some UDF
			 * items). Should all the DSFs for each UDF item from other DST be
			 * checked together?
			 * /
			for (let i of range.forVar(k, {step:-1})) { // loop down
				env[k] = i;
				let name = klass.eval(theirs, env),
					$dsf = this.$context.find(`.${name}`);
				if ($dsf.length && ! $dsf.is(':empty')) {
					// remove all fields after .${name}
					this.removeAfter(name, theirs);
					break;
				}
			}
		},
		*/
		
		/**
		 * Remove any backing fields after the last non-empty field for templated aliases.
		 *
		 * As createItems() overproduces, this cleans up.
		 */
		/* Not currently used
		cullTemplates() {
			if (! this.shouldCull) {
				return;
			}
			this.eachTemplate(function (theirs, mine) {
				this.cullTemplate(theirs, mine);
			}, this);
		},
		*/

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
			return this.eachEntry(fn, this.aliases.simple, self, options);
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
			return this.eachEntry(fn, this.aliases.templates, self, options={});
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
			this.$aliases.find('.dsf.dyn').remove();
			for (const dst of Object.values(this.export.dst)) {
				if (is_function(dst._start)) {
					dst._start();
				}
			}
			//this.createFields();
			for (const [theirs, mine] of this.simpleAliases({prefix:false, skipCorrections:true})) {
				this.exportField(theirs, dsf.value(mine), {mine});
			}
			/*
			this.eachSimple(function (theirs, mine) {
				this.exportField(theirs, dsf.value(mine), {mine});
			}, this, {prefix:true});
			*/
			for (let {mine, value, theirs, env} of this.myTemplateEntries({prefix:false})) {
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

			// handle complex cases
			for (let base in this.aliases.export) {
				// dereference exporters (done when compatibility is first created, but do again in case a client has added more)
				while ('string' == typeof(this.aliases.export[base]) && this.aliases.export[base] in this.aliases.export) {
					base = this.aliases.export[base];
				}
				if (! is_function(this.aliases.export[base])) {
					// ignore non-function properties
					continue;
				}
				let {name, elt, $elt} = dsf.resolve(base),
					fn = this.aliases.export[base];//.bind(this);
				if ($elt.length) {
					fn(dsf.value(elt));
				} else if (($elt = udfs.$udf(base)).length) {
					// TODO: behavior-skip more general exporters when there's a more specific exporter
					for (let entry of udfs.entries($elt)) {
						fn(entry.names, entry.values);
					};
				}
			}
			/*
			for (let udf of udfs.$udfs) {
				let base = [udfs.base(udf), dsf.sectionName(udf)].find(name => name in this.aliases.export),
					fn = this.aliases.export[base];
				if (fn) {
					for (let entry in udfs.entries(udf)) {
						fn(entry.names, entry.values);
					}
				}
			}
			*/
			for (const dst of Object.values(this.export.dst)) {
				if (is_function(dst._finish)) {
					dst._finish();
				}
			}
		},

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
			// 
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
					fn.call(this, name, value, env);
				}
			}
			
			data.last_dst = this.slug;
		},

		/*
		import_equipment(type, value, points) {
			let parsed = this.parse._byValues.equipment([type, value, points]);
			return this.import.equipment(parsed);
		},

		import_equipments(type, value, points) {
			type = this.standardize(type);
			switch (type) {
			case 'artifact':
			case 'relic':
				let values = value.split(/ *[,;] * /); // remove space if uncommented
				for (let value of values) {
					this.import_equipment(type, value, points);
				}
				break;
			default:
				this.import_equipment(type, value, points);
				break;
			}
		},
		*/

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

		loopOptions(tpl, defaults={}) {
			defaults = {from: 0, to: udfs.maxCount, continuous: true, ...defaults};
			let options = {};
			if (tpl in this.aliases.options) {
				options = this.aliases.options[tpl];
				if (range.hasEnd(options)) {
					// 'to' will override other ends, so remove it
					delete defaults.to;
				}
				return {...defaults, ...options};
			}
			return defaults;
		},
		
		/**
		 */
		loopVars(tpl, defaults={}) {
			let opts = this.loopOptions(tpl, defaults),
				vars = klass.vars(tpl),
				envs = range.keyed(fillObject(vars, opts));
			return {vars, envs, opts};
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
		
		scrub: memoize(function (name) {
			return name.replace(/ *\((cont('d|inued)?\.*|misc\.?|\.+)\)$/i, '');
		}),
		
		standardize: memoize(function (name) {
			const standardized = {
				'artefact': 'artifact',
				'artefacts': 'artifacts',
				'bg': 'background',
				'corups': 'corpus',
				// TODO: design-what type should generic equipment have?
				//'equipment': '',
			};
			name = name.toLowerCase();
			if (name in standardized) {
				return standardized[name];
			}
			if (name in this.aliases.simple) {
				return this.aliases.simple[name];
			}
			return name;
		}),
		

		/**
		 * Remove generated DSFs after the given number.
		 */
		// TODO: test
		/* Not currently used
		removeAfter(name, tpl, n) {
			if (! n) {
				// extract i from name
				n = udfs.indexOf(name, tpl);
			}
			let pre = klass.prefix(tpl);
			this.$context.find(`.compatibility .dsf`)
				.filter((i, elt) => klass.matches(tpl, elt.className)
						&& udfs.indexOf(elt.className, tpl) > n)
				.remove()
			;
		},
		*/

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
				values.value = rating;
				udfs.addDsa(names, values, base);
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
			return this.nameFor(name, aliases) || name;
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
		 * Generate pairs of simple aliases.
		 *
		 * @param {AliasOptions} [options]
		 */
		*simpleAliases(options={}) {
			yield* this.aliasEntries(this.aliases.simple, options);
		},
		
		/**
		 * Generate pairs of (unexpanded) templated aliases.
		 *
		 * @param {AliasOptions} [options]
		 */
		*templateAliases(options={}) {
			// should options be copied first?
			delete options.skipCorrections;
			yield* this.aliasEntries(this.aliases.templates, options);
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
				|| this.templateFor(name, this.sesalia);
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
	};
	/*
	for (let slug in compatibility.complex.export.dst) {
		let dst = compatibility.complex.export.dst[slug];
		derefProperties(dst);
	}
	*/
	for (let funcs of [
		compatibility.port.export,
		compatibility.port.import,		
		compatibility.parse,
		compatibility.parse._byValues,
		compatibility['export.'],
		compatibility['import.'],
	]) {
		bindAll(funcs, compatibility);
	}
	Object.assign(compatibility.export, compatibility['export.']);
	Object.assign(compatibility.import, compatibility['import.']);
