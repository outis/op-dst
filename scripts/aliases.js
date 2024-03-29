	const aliases = globals.aliases = {
		options: {
			'other_trait_{i}': {
				from: 1,
				through: 7,
				continuous: false,
			},
			'misc_trait{i}': {
				from: 1,
				through: 8,
				continuous: false,
			},
			'bg{i}': {
				from: 1,
				to: 10,
				continuous: false,
			},
			'bg{i}_expanded{j}': {
				from: 1,
				i: {
					to: 10,
				},
				j: {
					thru: 3,
				},
				continuous: false,
			},
			'flaw{i}': {
				from: 1,
				continuous: false,
				to: 9,
			},
			'merit{i}': {
				from: 1,
				continuous: false,
				to: 9,
			},
			'misc{i}': {
				from: 1,
				through: 5,
				continuous: false,
			},

			'jp12x_splat': {
				start: 0,
			},

			'numina_type_{i:02}': {
				start: 0,
				noExport: true,
			},
			'numina_value_{i:02}': {
				start: 0,
				noExport: true,
			},

			'backgrounds_type_{i:02}': 'jp12x_splat',
			'backgrounds_value_{i:02}': 'jp12x_splat',
			'equipment_name_{i:02}': 'jp12x_splat',
			'equipment_tootip_{i:02}': 'jp12x_splat',
			'flaw_{i:02}': 'jp12x_splat',
			'specialty_type_{i:02}': 'jp12x_splat',

			'traits_type_{i:02}': 'jp12x_splat',
			'traits_value_{i:02}': 'jp12x_splat',

			'ability_type_{i:02}': 'jp12x_splat',
			'ability_value_{i:02}': 'jp12x_splat',
			'talent_type_{i:02}': 'jp12x_splat',
			'talent_value_{i:02}': 'jp12x_splat',
			'knowledge_type_{i:02}': 'jp12x_splat',
			'knowledge_value_{i:02}': 'jp12x_splat',

			'contact_type_{i:02}': 'jp12x_splat',
			'contact_tootip_{i:02}': 'jp12x_splat',
		},

		typos: { // typos in DSF names
			// cWoD_Revised
			'misctrait2': 'misc_trait2',
			'misctrait4': 'misc_trait4',
			'misctrait4_value': 'misc_trait4_value',

			// old_wod_generic
			'dodge__specialty': 'dodge_specialty',
			'empathy__specialty': 'empathy_specialty',
			'other_trait_7a': 'other_trait_7',

			// jp12x_splat
			'experiance': 'experience',
		},

		simple: {
			// attributes
			'presence': 'charisma',
			'composure': 'appearance',

			'str': 'strength',
			'dex': 'dexterity',
			'sta': 'stamina',
			'stam': 'stamina',

			'cha': 'charisma',
			'man': 'manipulation',
			'manip': 'manipulation',
			'app': 'appearance',

			'per': 'perception',
			'int': 'intelligence',

			// abilities
			'craft': 'crafts',

			// assets
			'pathos': 'power',
			'oboli': 'money',
			'cash': 'money',

			'inventory': 'equipment',

			// jp12x_splat (nWoD Reloaded!)
			'willpower': 'perm_willpower',
			'current_will': 'curr_willpower',
			'health': 'perm_health',
			'corpus': 'curr_health',
			// old_wod_generic
			'perm_willpower_value': 'perm_willpower',
			'temp_willpower_value': 'curr_willpower',
			'chealth': 'curr_health',

			// old_wod_generic
			/// bio
			'sex': 'gender',
			/// attributes
			'strength_value': 'strength',
			'dexterity_value': 'dexterity',
			'stamina_value': 'stamina',

			'charisma_value': 'charisma',
			'manipulation_value': 'manipulation',
			'appearance_value': 'appearance',

			'perception_value': 'perception',
			'intelligence_value': 'intelligence',
			'wits_value': 'wits',

			/// abilities
			//// talents
			'alertness_value': 'alertness',
			'athletics_value': 'athletics',
			'awareness_value': 'awareness',
			'brawl_value': 'brawl',
			'dodge_value': 'dodge',
			'empathy_value': 'empathy',
			'leadership_value': 'leadership',
			'persuasion_value': 'persuasion',
			'streetwise_value': 'streetwise',
			'subterfuge_value': 'subterfuge',

			//// skills
			'crafts_value': 'crafts',
			'drive_value': 'drive',
			'etiquette_value': 'etiquette',
			'firearms_value': 'firearms',
			'melee_value': 'melee',
			'performance_value': 'performance',
			'security_value': 'security',
			'stealth_value': 'stealth',
			'survival_value': 'survival',
			'technology_value': 'technology',

			//// knowledges
			'academics_value': 'academics',
			'computer_value': 'computer',
			'enigmas_value': 'enigmas',
			'investigation_value': 'investigation',
			'law_value': 'law',
			'linguistics_value': 'linguistics',
			'medicine_value': 'medicine',
			'occult_value': 'occult',
			'politics_value': 'politics',
			'science_value': 'science',

			/// advantages
			'humanity_value': 'health', /* potential issue: all DST exporters 
				* will get 'humanity_value' as their local name. In balance, if 
				* they have their own local field name, it will be added as an 
				* alias, and so all DST exporters will then get a list of all
				* aliases as their local name.
				*/

			// Nightbat13131
			/// attributes
			'attribute_strength': 'strength',
			'attribute_dexterity': 'dexterity',
			'attribute_stamina': 'stamina',

			'attribute_presence': 'presence',
			'attribute_manipulation': 'manipulation',
			'attribute_composure': 'composure',

			'attribute_intelligence': 'intelligence',
			'attribute_wits': 'wits',
			'attribute_resolve': 'resolve',

			/// abilities
			//// mental
			'skill_academics_dots': 'academics',
			'skill_computer_dots': 'computer',
			'skill_craft_dots': 'craft',
			'skill_investigation_dots': 'investigation',
			'skill_medicine_dots': 'medicine',
			'skill_occult_dots': 'occult',
			'skill_politics_dots': 'politics',
			'skill_science_dots': 'science',

			//// physical
			'skill_athletics_dots': 'athletics',
			'skill_brawl_dots': 'brawl',
			'skill_drive_dots': 'drive',
			'skill_firearms_dots': 'firearms',
			'skill_larceny_dots': 'larceny',
			'skill_stealth_dots': 'stealth',
			'skill_survival_dots': 'survival',
			'skill_weaponry_dots': 'weaponry',

			//// social
			'skill_animal_ken_dots': 'animal_ken',
			'skill_empathy_dots': 'empathy',
			'skill_expression_dots': 'expression',
			'skill_intimidation_dots': 'intimidation',
			'skill_persuasion_dots': 'persuasion',
			'skill_socialize_dots': 'socialize',
			'skill_streetwise_dots': 'streetwise',
			'skill_subterfuge_dots': 'subterfuge',
		},

		templates: {
			// old_wod_generic
			/*
			'flaw{i}': 'dyn_flaws_{i:02}_name',
			'merit{i}': 'dyn_merits_{i:02}_name',
			*/

			/*
			'bg{i}': 'bg_{i}_name',
			'bg{i}_value': 'bg_{i}_value',
			'bg{i}_expanded{j}': 'bg_{i}_descr',
			*/
			// cWoD-Revised
			// TODO: robustness-compatibility.js-check 'powers_value' to determine category (rather than assuming arcanoi)
			'power{i}': 'dyn_arcanoi_{i:02}_name',
			'power{i}_value': 'dyn_arcanoi_{i:02}',

			// jp12x_splat (nWoD Reloaded!)
			// TODO: switch to complex (to combine Common/Initiate)
			'numina_type_{i:02}': 'dyn_arcanoi_{i:02}_name',
			'numina_value_{i:02}': 'dyn_arcanoi_{i:02}',

			'ability_type_{i:02}': 'dyn_talents_{i:02}_name',
			'ability_value_{i:02}': 'dyn_talents_{i:02}',
			'talent_type_{i:02}': 'dyn_skills_{i:02}_name',
			'talent_value_{i:02}': 'dyn_skills_{i:02}',
			'knowledge_type_{i:02}': 'dyn_knowledges_{i:02}_name',
			'knowledge_value_{i:02}': 'dyn_knowledges_{i:02}',

			'backgrounds_type_{i:02}': 'dyn_backgrounds_{i:02}_name',
			'backgrounds_value_{i:02}': 'dyn_backgrounds_{i:02}',
		},

		// copied to compatability.import
		'import.': {
			tryStream(values, names) {
				let parsed = this.import.stream(values, names);
				if (parsed) {
					if (! parsed.imported) {
						console.warn(`Could not import ${names}: '${values.join("','")}'`, parsed);
					}
				} else if (false !== parsed) { // `false` means ignore this one
					// TODO: can't parse theirs; what do?
					console.warn(`Could not parse ${names}: '${values.join("','")}'`);
				}
				return parsed;
			},
		},

		'parse.': {
		},

		/**
		 * Structure:
		 *     [slug]: {
		 *         // called if last_dst was slug instead of main import function
		 *         override(data) { … }
		 *
		 *         // Functions called on foreign fields in the dynamic sheet data.
		 *         // Native fields are added to the data.
		 *         import: { // destined for aliases.import
		 *		       // `this` will get bound to compatability module
		 *             [UDF name template]: function(theirs, value, env) { … },
		 *		   }
		 *
		 *         // Functions to export fields by creating foreign DSFs & setting the values.
		 *         export: { // destined for aliases.export.dst[slug]
		 *		       // `this` isn't rebound
		 *             [DSF name]: function(value) { … },
		 *             [UDF base]: function(names, values) { … },
		 *		   }
		 *     },
		 *     …
		 *
		 * The basis for [slug].import going to aliases.import and [slug].export going to aliases.export.dst[slug] is that when importing there is only a single instance of any given field matching a template (hence only a single import function is allowed), wherease when exporting a field may be exported separately to different fields for different DSTs (hence separate functions for each DST).
		 *
		 * Property names of [slug].import are used to generate entries of 
		 * `dynamic_sheet_attrs`, and so must be name templates. To import the 
		 * data, these functions should modify `dynamic_sheet_attrs` (or 
		 * `dsa.data`, including by using {@link dsa.rename()} and
		 * {@link udf.addDsa()}).
		 *
		 * Property names of [slug].export ar DSF names or UDF bases. Values
		 * are taken from sheet and passed to these functions for export.
		 * Ultimately, these functions should add DSFs to the sheet (as children of {@link compatibility.$aliases}) and set their values, which can be done with the likes of:
		 * + {@link compatibility.export.all}
		 * + {@link compatibility.export.dynamicField}
		 * + {@link compatibility.export.field}
		 * + {@link compatibility.export.fields}
		 * + {@link compatibility.exportField}
		 *
		 */
		dst: {
			mll_wraith2e: {
				// importing handled by edition module, so prevent compatibility import
				override(data) {},
			},

			mll_wraith20: {
				// importing handled by edition module, so prevent compatibility import
				override(data) {},
			},

			cWoD_Revised: {
				export: {
					_start() {
						compatibility.exportField('powers_value', 'Arcanoi');
					},

					_finish() {
						compatibility.createFields('misc_trait{i}', aliases.options['other_trait_{i}']);
						compatibility.createFields('misc_trait{i}_value', aliases.options['other_trait_{i}']);
					},

					// prevent "Cannot export" warning
					partial: true,
				},
			},

			old_wod_generic: {
				/**
				 * Entry points to import only from the given DST.
				 *
				 * These functions override compatibility.import and are responsible for importing all DSFs.
				 * /
				 override() {
				 }
				*/

				import: {
					// old_wod_generic; 1-based
					'flaw{i}': function (theirs, value, env) {
						this.import.split(
							value, {
								name: 'dyn_flaws_{i:02}_name',
								value: 'dyn_flaws_{i:02}',
							}, 'flaws'
						);
					},
					'merit{i}': function (theirs, value, env) {
						this.import.split(
							value, {
								name: 'dyn_merits_{i:02}_name',
								value: 'dyn_merits_{i:02}',
							}, 'merits'
						);
						/*
						  let nameTpl = 'dyn_merits_{i:02}_name',
						  valueTpl = 'dyn_merits_{i:02}',
						  parsed = this.parse._byValues.simple('flaws', [value]);
						  this.import.udf(parsed);
						*/
					},

					'other_trait_{i}': function (theirs, label, env) {
						let valueTpl = `other{i}_value`,
							valueName = klass.eval(valueTpl, env),
							parsed = this.import.tryStream([label], [theirs, valueName]);
					},

					'bg{i}': function (theirs, name, env) {
						if (   dsa.exists(theirs + '_expanded1')
							|| dsa.exists(theirs + '_expanded2')
							|| dsa.exists(theirs + '_expanded3'))
						{
							return;
						}
						// no expanded fields, so process here.
						/*
						  let parsed = this.parse.background();
						  this.import.background([theirs, theirs + '_value'], [name]);
						*/
						let names = {
							name: 'dyn_backgrounds_{i:02}_name',
							value: 'dyn_backgrounds_{i:02}',
						};
						udf.addDsa(
							names,
							{name, value: dsa.data[theirs + '_value']},
							'backgrounds');
						console.debug(`Imported ${theirs} as BG ${name}`);
					},

					'bg{i}_expanded{j}': function (theirs, expanded, env) {
						let baseTpl = `bg{i}`,
							valueTpl = `bg{i}_value`,
							baseName = klass.eval(baseTpl, env),
							valueName = klass.eval(valueTpl, env),
							parsed = this.import.stream([undefined, expanded, undefined], [baseName, theirs, valueName]);

						// check whether there's a `.${base} > .udf`

						// BG -> background
						// if can't find rating, check 'bg{i}_value'
						if (parsed) {
							if (! parsed.imported) {
								// assume background named `base`
								//({value, rating}) = this.parse;
								let names = {
									name: 'dyn_backgrounds_{i:02}_name',
									value: 'dyn_backgrounds_{i:02}'
								};
								udf.addDsa(names, parsed, 'backgrounds');
							}
						} else if (false !== parsed) { // `false` means ignore this one
							// couldn't parse
							console.warn(`Could not parse '${theirs}': '${expanded}'`);
						}
					},

					/*
					  'flaw{i}': function function(theirs, value, env) {
					  },
					*/

					'misc{i}': function(theirs, value, env) {
						let parsed = this.import.tryStream([value], [theirs]);
					},
				},

				export: { // oWoD generic
					_items: {},
					_inventory: {}, // stores equpment by name, to avoid duplicates from BGs
					_flags: {},
					_max: {
						bg: 9,
						bg_expanded: 3,
						other: 7,
						misc: 5,
					},

					_start() {
						this._items = {};
						this._inventory = {};

						const tpls = {
							'talents': 'talents',
							'skills': 'skills',
							'knowledges': 'knowledges',
						};

						compatibility.export.staticToDynamic(
							'abilities',
							this._abilities,
							tpls, {
								exporter: (type, values) => {
									values.type = 'abilities';
									values.name = words.singulize(type) + ': ' + values.name;
									if (values.specialty) {
										values.name += ` (${values.specialty})`;
									}
									this._addTheirItem('abilities', values);
								},
							}
						);
					},

					_addTheirItem(category, item, names) {
						this._gather(...arguments);
					},

					_finish() {
						try {
							if (Object.keys(this._items).length) {
								this._store();
							}
						} finally {
							compatibility.createFields('bg{i}');
							compatibility.createFields('bg{i}_expanded{j}');
							compatibility.createFields('other_trait_{i}');
							compatibility.createFields('other_value_{i}', aliases.options['other_trait_{i}']);
							compatibility.createFields('misc{i}');
						}
					},

					_flavor(names, values, base) {
						compatibility.export.flavor(
							base + '{i}', values, names.value
						);
						/*
						let value = values.name;
						if (values.value) {
							value += ': ' + values.value;
						}
						compatibility.export.field(
							`${base}{i}`, value, names.value
						);
						*/
					},

					_gather(category, item, names) {
						if (names) {
							item.mine = compatibility.aliasFor(names);
						}
						item.name = item.name.ucfirst();
						// adding their items is delayed, so register a handler to actually store them in DSFs when done collecting
						// Handled via this._finish instead of preSave handler
						//module.on('preSave', 'old_wod_generic._store', this._store.bind(this));
						if (! (category in this._items)) {
							this._items[category] = [];
						}
						this._items[category].push(item);
					},

					_nBg(items) {
						return Math.ceil(items.length / 3);
					},

					_fragmentation(items) {
						return ((-items.length) % 3 + 3) % 3;
					},

					_preserve: Object.assign(
						function (item, ...bases) {
							let preserved;
							if (   item.type
								&& bases.length
								&& ! bases.map(words.pluralize).includes(words.pluralize(item.type)))
							{
								let type = words.singulize(item.type),
									types = words.pluralize(item.type),
									reTyped = new RegExp(`^(${type}|${types})\\b`, 'i');
								if (! reTyped.test(item.name)) {
									item.name = `${item.type} ${item.name}`;
								}
							}
							for (let [i, base] of bases.entries()) {
								if (base in this._preserve) {
									return this._preserve[base](item, bases.slice(i+1));
								}
							}
							return item;
						},
						{
							bg(item, category) {
								let value = [item.name];
								if (item.description) {
									value.push(' (', item.description, ')');
								}
								if (item.value) {
									value.push(': ', item.value);
								}
								if (item.notes) {
									value.push(' (', item.notes, ')');
								}
								return value.join('');
							},
							misc(item) {
								return {
									value: `${item.name}: ${item.value}`,
								};
							},
							other(item) {
								return {
									name: item.name,
									value: item.value,
								};
							},
						}
					),

					_store() {
						// Relics & artifacts might have entries both in BGs and equipment; filter them out from BGs
						this._items.backgrounds = this._items.backgrounds
							.filter(
								bg => ! (bg.specialty in this._inventory)
							);
						let entries = Object.entries(this._items).sort(
							function (a,b) {
								/** /
								// (length, category)
								let cmp = b[1].length - a[1].length;
								if (! cmp) {
									cmp = a[0].cmp(b[0]);
								}
								return cmp;
								/*/
								// (category)
								return a[0].cmp(b[0]);
								/**/
							});
						this._entries = entries;
						let nBgs = entries.reduce((a, entry) => a += this._nBg(entry[1]), 0);
						if (nBgs <= this._max.bg) {
							this._store_bgs(entries);
							return;
						}

						// check whether merging inventory groups into single one will reduce fragmentation & number of BGs required
						let equip_frag = 0,
							equip_frags = {},
							nInventory = 0,
							inv_frag;
						;
						const equip_types = ['artifacts', 'relics', 'equipment'];
						for (let category of equip_types) {
							if (category in this._items) {
								equip_frags[category] = this._fragmentation(this._items[category]);
								if (equip_frags[category]) {
									// `category` has fragmentation, so it can benefit from being merged
									// calculate the merged size & total current fragmentation
									nInventory += this._items[category].length;
									equip_frag += equip_frags[category];
								}
							}
						}
						// calculate the fragmentation after merging
						inv_frag = this._fragmentation({length: nInventory});
						if (equip_frag > inv_frag) {
							// merging should reduce fragmentation; will it reduce # of BGs required?
							let inventory = [],
								merged = {},
								nBgs1 = nBgs;
							for (let category of equip_types) {
								// don't merge any equipment types with 0 fragmentation
								if (equip_frags[category]) {
									// 1st stage merge
									inventory.push(...this._items[category]);
									merged[category] = this._items[category];
									// will remove this BG, so remove it from new BG count
									nBgs1 -= this._nBg(this._items[category]);
								}
							}
							// will add merged background, so add it to new BG count
							nBgs1 += this._nBg(inventory);
							if (nBgs1 < nBgs) {
								// merging reduces # of BGs; finalize merger
								nBgs = nBgs1;
								this._items.equipment = inventory;
								// remove record of 'equipment' from merger, so loop won't remove it from items
								delete merged.equipment;
								for (let category in merged) {
									delete this._items[category];
								}
								entries = Object.entries(this._items);
								if (nBgs <= this._max.bg) {
									this._store_bgs(entries);
									return;
								}
							}
						}

						// not enough expanded backgrounds for even merged items, so try splitting them up into the other_trait_{i}/other{i}_value and misc{i} DSFs
						entries.sort((function (a,b) {
							// (fragmentation, length, category)
							let a_fragmentation = this._fragmentation(a[1]),
								b_fragmentation = this._fragmentation(b[1]),
								result = a_fragmentation - b_fragmentation;
							if (result) {
								return result;
							}
							if ((result = a[1].length - b[1].length)) {
								return result;
							}
							return a[0].cmp(b[0]);
							//return 0;
						}).bind(this));
						this._store_spillover(entries);
					},

					_store_bgs(entries) {
						let names = {
							'cat': 'bg{i}',
							'item': 'bg{i}_expanded{j}',
						}, i = 0, j;

						const advance_bg = (function (category, item) {
							if (++i > this._max.bg) {
								// shouldn't happen, due to checks in _store()
								throw {
									category, items, iItem,
									message: `Ran out of backgrounds when exporting ${category} #${iItem} to old_wod_generic.`,
									outOfRoom: true,
									toString() {
										return this.message;
									},
								};
							}
							j = 1;
							compatibility.export.dynamicField(
								klass.eval(names.cat, {i}),
								category,
								{mine: item.mine}
							);
						}).bind(this);

						// must declare iEntry & iItem outside of loop, so outOfRoom handler can use them
						let category, items, iEntry, iItem;
						try {
							for (iEntry = 0; iEntry < entries.length; ++iEntry) {
								[category, items] = entries[iEntry];
								j = this._max.bg_expanded + 1; // force advance_bg in 1st iteration
								for (iItem = 0; iItem < items.length; ++j, ++iItem) {
									let item = items[iItem];
									if (j > this._max.bg_expanded) {
										advance_bg(category, item);
									}
									compatibility.export.dynamicField(
										klass.eval(names.item, {i,j}),
										this._preserve(item, 'bg', category),
										{mine: item.mine}
									);
								}
							}
						} catch (err) {
							if ('outOfRoom' in err) {
								entries = entries.slice(iEntry);
								entries[0][1] = entries[0][1].slice(iItem);
								return entries;
							} else {
								throw err;
							}
						}
						return [];
					},

					_store_spillover(entries) {
						entries = this._store_bgs(entries);
						let sections = ['misc'],
							sectionTpls = {
								other: {
									name: 'other_trait_{i}',
									value: 'other{i}_value',
								},
								misc: {
									value: 'misc{i}',
								},
							},
							cwodTpls = {
								other: {
									name: 'misc_trait{i}',
									value: 'misc_trait{i}_value',
								},
							},
							section = 'other',
							tpls = sectionTpls.other,
							maxI = this._max.other,
							category, items, names;
						if (! entries) {
							return;
						}
						for (let iEntry = 0; iEntry < entries.length; ++iEntry) {
							[category, items] = entries[iEntry];
							for (let [iItem, item] of items.entries()) {
								//iItem = 0; iItem < items.length; ++iItem
								//item = items[iItem];
								names = dsf.nextName(tpls);
								while (names.i > maxI) {
									entries = entries.slice(iEntry);
									entries[0][1] = entries[0][1].slice(iItem);
									if (! sections.length) {
										throw `Ran out of fields when exporting ${category} to old_wod_generic; could not export ${entries.map(entry => entry[0])}.`;
									}
									section = sections.shift();
									maxI = this._max[section];
									tpls = sectionTpls[section];
									names = dsf.nextName(tpls);
								}
								let preserved = this._preserve(item, section);
								compatibility.export.all(
									names,
									preserved,
									item.mine
								);
								if (cwodTpls[section]) {
									// cover cWoD_Revised
									names = dsf.nextName(cwodTpls[section]);
									compatibility.export.all(
										names,
										preserved,
										item.mine
									);
								}
							}
						}
					},

					// UDF exporters
					_abilities: {
						'alertness': 'talents',
						'athletics': 'talents',
						'awareness': 'talents',
						'brawl': 'talents',
						'dodge': 'talents',
						'empathy': 'talents',
						'leadership': 'talents',
						'persuasion': 'talents',
						'streetwise': 'talents',
						'subterfuge': 'talents',

						'crafts': 'skills',
						'drive': 'skills',
						'etiquette': 'skills',
						'firearms': 'skills',
						'melee': 'skills',
						'performance': 'skills',
						'security': 'skills',
						'stealth': 'skills',
						'survival': 'skills',
						'technology': 'skills',

						'academics': 'knowledges',
						'computer': 'knowledges',
						'enigmas': 'knowledges',
						'investigation': 'knowledges',
						'law': 'knowledges',
						'linguistics': 'knowledges',
						'medicine': 'knowledges',
						'occult': 'knowledges',
						'politics': 'knowledges',
						'science': 'knowledges',
					},

					abilities(names, values) {
						const slug = abilities.normalizeName(values.name);
						if (slug in this._abilities) {
							compatibility.exportField(`${slug}_value`, values.value, {mine:names.value});
							compatibility.exportField(`${slug}_specialty`, values.specialty, {mine:names.specialty});
						} else {
							//values.type = udf.parseName(names.name)?.base;
							values.type = (udf.parseName(names.name) || {}).base;
							values.name = words.singulize(values.type) + ': ' + values.name;
							if (values.specialty) {
								values.name += ` (${values.specialty})`;
							}
							this._addTheirItem('abilities', values, names);
						}
					},

					arcanoi(names, values) {
						this._addTheirItem('arcanoi', values, names);
					},

					associates(names, values) {
						values.notes = stripHtml(values.notes).trim();
						this._addTheirItem('associates', values, names);
					},

					backgrounds(names, values) {
						if (compatibility.parse._byTokens.associates.reAssociates.test(values.name)) {
							// let associates exporter handle this one
							return;
						}
						this._addTheirItem('backgrounds', values, names);
					},

					equipment(names, values) {
						let item = {
							type: values.type /*??*/|| 'equipment',
							name: values.name,
							value: values.points,
						};
						this._inventory[item.name] = item;
						if (values.description) {
							item.name += ' (' + stripHtml(values.description).trim() + ')';
						}
						if (values.charge) {
							item.value += ', ' + values.charge;
						}

						this._addTheirItem(words.pluralize(item.type), item, names);
						//this._addTheirItem('inventory', item, names);
					},

					experience(value) {
						this.simple('Experience', value, 'experience');
					},

					// TODO: test
					fetters(names, values) {
						this._addTheirItem('fetters', values, names);
					},

					flaws(names, values) {
						return this._flavor(names, values, 'flaw');
					},

					generic(base, ...args) {
						this._addTheirItem(base, args[1] /*??*/|| args[0]);
					},

					health(name, value) {
						compatibility.exportField('humanity_value', value.value /*??*/|| value, {mine: 'health'});
					},

					merits(names, values) {
						return this._flavor(names, values, 'merit');
					},

					money(value) {
						this.simple('Oboli', value, 'money');
					},

					passions(names, values) {
						this._addTheirItem('passions', values, names);
					},

					shadow(value) {
						this.simple('Shadow', value, 'shadow');
					},

					simple(name, value, mine) {
						let theirs = dsf.nextName({name: 'other_trait_{i}', value: 'other{i}_value'});

						if (theirs.i <= 7) {
							compatibility.export.dynamicField(theirs.name, name, {mine});
							compatibility.export.dynamicField(theirs.value, value, {mine});
							if (theirs.name in compatibility.sesalia.simple) {
								// also create misspelled fields
								theirs.name = compatibility.sesalia.simple[theirs.name];
								compatibility.export.dynamicField(theirs.name, name, {mine});
							}

							// cover cWoD_Revised
							compatibility.export.fields(
								{name: 'misc_trait{i}', value: 'misc_trait{i}_value'},
								{name, value},
								mine
							);
						} else {
							theirs = dsf.nextName('misc{i}');
							if (theirs.i > 5) {
								console.warn(`Cannot export ${mine /*??*/|| 'to misc{i}'}: ran out of fields.`);
								return;
							}
							compatibility.export.dynamicField(theirs, `${name}: ${value}`, {mine});
						}
					},

					// handled via aliases, so NOOP
					willpower() {},
				}, // /export
			}, // /old_wod_generic

			jp12x_splat: {
				import: {
					// nWoD Reloaded!; 0-based
					'flaw_{i:02}': function (theirs, value, env) {
						let which,
							parts = value.match(/(?<sign>[-+]?) *(?<lvl>\d+)(?: *pts?)?\W*$/),
							lvl;
						if (/merit/i.test(value)) {
							which = 'merits';
							value = value.replace(/\bmerits?: */i, '');
						} else if (/flaw/i.test(value)) {
							which = 'flaws';
							value = value.replace(/\bflaws?: */i, '');
						} else if (parts) {
							which = '-' == parts.groups.sign ? 'flaws' : 'merits';
						} else {
							// Assume it's a flaw. User can correct. Highlight?
							which = 'flaws';
						}
						if (parts) {
							lvl = parts.groups.lvl;
							value = value.replace(/[:@(]? *[-+]? *\d+(?: *pts?)?\W*$/, '');
						}

						let names = {
							name: `dyn_${which}_{i:02}_name`,
						}, values = {
							name: value,
						};
						if (lvl) {
							names.value = `dyn_${which}_{i:02}`;
							values.value = lvl;
						}
						// rename is insufficient, as value may be modified
						udf.addDsa(names, values, which);
						delete dsa.data[theirs];
					},

					'specialty_type_{i:02}': function (theirs, value, env) {
						let parts = value.match(/^(?<attribute>[^:]*)(?:: *\(?| *\()(?<specialty>.*[^)])\)?$|^\s*(?<attr>[^- ]+)[- ]+(?<spec>[^- ]+)\s*$/);
						if (parts) {
							let attr = (parts.groups.attribute /*??*/|| parts.groups.attr).trim().toLowerCase(),
								specialty = (parts.groups.specialty /*??*/|| parts.groups.spec).trim();
							if (attr in aliases.simple) {
								attr = aliases.simple[attr];
							}
							// TODO: detect dynamic abilities, rather than assuming attr is the base
							dsa.data[`${attr}_specialty`] = specialty;
							if (! dsa.exists(attr)) {
								let ability = abilities.find(attr);
								if (ability) {
									ability.specialty = specialty;
								}
							}
						}
					},

					'traits_type_{i:02}': function (theirs, value, env) {
						let names,
							rating = theirs.replace('_type_', '_value_'),
							values = value.split(/\W+/).map(v => {
								v = words.pluralize(v.toLowerCase());
								return aliases.simple[v] /*??*/|| v;
							}),
							mine = values.find(dsf.exists);

						if (mine) {
							dsa.rename(rating, mine);
						} else for (let base of ['fetter', 'passion', 'talent', 'skill', 'knowledge']) {
							if (this.renameSplat(base, theirs, rating, value)) {
								break;
							}
						}
					},

					'equipment_name_{i:02}': function (theirs, value, env) {
						let parsed = this.import.tryStream(
							['equipment', value],
							[klass.eval('equipment_{i:02}', env), theirs, klass.eval('equipment_tootip_{i:02}', env)]
						);
					},

					'attack_weapon_{i:02}': function (theirs, value, env) {
						let values = {},
							tpls = {
								name: 'attack_weapon_{i:02}',
								difficulty: 'attack_difficulty_{i:02}',
								damage: 'attack_damage_{i:02}',
								range: 'attack_range_{i:02}',
								rate: 'attack_rate_{i:02}',
								clip: 'attack_clip_{i:02}',
								conceal: 'attack_conceal_{i:02}',
							},
							names = klass.evalAll(tpls, env);
						dsa.getAll(names, values);
						console.log(values);
						this.parse.normalize(values);

						let description = Object.keys(tpls);
						description.shift(); // remove 'name'
						for (let i = 0; i < description.length; ++i) {
							description[i] += ': ' + values[description[i]];
						}
						values.description = description.join('; ');

						values.type = 'weapon';
						values.charge = 10;

						this.import.equipment(values, names);
					},

					'contact_type_{i:02}': function (theirs, name, env) {
						const notes = dsa.data[klass.eval('contact_tootip_{i:02}', env)] /*??*/|| '';
						this.import.partial({base: 'associates', type: 'Contact', name, notes}, [name], 'associates');
					},
				},

				export: {
					// nWoD Reloaded!
					/* TODO:
					 * + check that createTemplatedFields doesn't create any fields that are handled by compatibility.export.fields
					 * + export ability specialties (replace template alias?)
					 */
					templates: {
						'ability_type_{i:02}': 'abilities',
						'ability_value_{i:02}': 'abilities',
						'talent_type_{i:02}': 'abilities',
						'talent_value_{i:02}': 'abilities',
						'knowledge_type_{i:02}': 'abilities',
						'knowledge_value_{i:02}': 'abilities',

						//// export as dynamic items
						// talents
						'alertness': 'ability',
						'awareness': 'ability',

						// skills
						'etiquette': 'talent',
						'leadership': 'talent',
						'meditation': 'talent',
						'melee': 'talent',
						'performance': 'talent',

						// knowledges
						'bureaucracy': 'knowledge',
						'enigmas': 'knowledge',
						'technology': 'knowledge',
					},

					_start() {
						const tpls = {
							'talents': {
								name: `ability_type_{i:02}`,
								value: `ability_value_{i:02}`
							},
							'skills': {
								name: `talent_type_{i:02}`,
								value: `talent_value_{i:02}`
							},
							'knowledges': {
								name: `knowledge_type_{i:02}`,
								value: `knowledge_value_{i:02}`
							},
						};

						compatibility.export.staticToDynamic(
							'abilities',
							this._abilities,
							tpls, {
								normalize: values => {
									if (values.specialty) {
										values.name += ` (${values.specialty})`;
									}
									values;
								},
							}
						);
					},

					_finish() {
						compatibility.prune(/^((ability|talent|knowledge|backgrounds|numina|specialty|traits)_(type|value)|equipment_(name|tootip)|attack_\w+|flaw)_\d+$/);
					},

					_flavor(names, values) {
						compatibility.export.flavor(
							'flaw_{i:02}', values,
							compatibility.aliasFor(names),
							{ start:0 }
						);
						/*
						let value = values.name;
						if (values.value) {
							value += ': ' + values.value;
						}
						compatibility.export.field(
							'flaw_{i:02}', value,
							compatibility.aliasFor(names),
							{ start:0 }
						);
						*/
					},

					backgrounds(names, values) {
						// TODO: finish
					},

					// static abilities
					_abilities: {
						'athletics': 'ability',
						'brawl': 'ability',
						'drive': 'ability',
						'firearms': 'ability',
						'larceny': 'ability',
						'stealth': 'ability',
						'survival': 'ability',
						'weaponry': 'ability',

						'animalken': 'talent',
						'empathy': 'talent',
						'expression': 'talent',
						'intimidation': 'talent',
						'persuasion': 'talent',
						'socialize': 'talent',
						'streetwise': 'talent',
						'subterfuge': 'talent',

						'academics': 'knowledge',
						'computer': 'knowledge',
						'craft': 'knowledge',
						// treat alias as ability in foreign sheet
						'crafts': 'knowledge',
						'investigation': 'knowledge',
						'medicine': 'knowledge',
						'occult': 'knowledge',
						'politics': 'knowledge',
						'science': 'knowledge',
					},

					abilities(names, values) {
						const slug = values.name.toLowerCase().replace(/\s+/, '');
						values.name = values.name.titleCase();
						if (slug in this._abilities) {
							compatibility.exportField(slug, values.value);
							if (values.specialty) {
								compatibility.export.field(
									'specialty_type_{i:02}',
									`${values.name}: ${values.specialty}`,
									names.specialty,
									aliases.options.jp12x_splat
								);
							}
						} else {
							const {base} = udf.parseName(names.value),
								  abilities = {
									  'talents': 'ability',
									  'skills': 'talent',
									  'knowledges': 'knowledge',
								  },
								  ability = abilities[base] || words.singulize(base || 'ability');

							if (values.specialty) {
								values.name += ` (${values.specialty})`;
							}

							compatibility.export.fields(
								{
									// fix this: wrong field names
									name: `${ability}_type_{i:02}`,
									value: `${ability}_value_{i:02}`
								}, values, names.value, aliases.options.jp12x_splat
							);
						}
					},

					arcanoi(names, values) {
						let parts = values.value.match(pips.reDemi),
							mine = names.value /*??*/|| Object.values(names)[0];
						values.name = values.name.ucfirst();
						if (parts) {
							let {left, right, lmask, rmask} = parts.groups;
							if (lmask) {
								left = Math.bits(+left);
							}
							if (rmask) {
								right = Math.bits(+right);
							}
							//value = Math.max(+left, +right);
							// TODO: prevent loss of info
							// store in other fields? splat traits? 2nd numina?
							compatibility.export.fields(
								{
									name: 'numina_type_{i:02}',
									value: 'numina_value_{i:02}'
								}, {name: values.name+' (common)', value:+left},
								mine, {start:0}
							);
							/**/
							values.name += ' (initiate)';
							values.value = right;
						} else if ((parts = values.value.match(/(?<mask>(?:0x[\dA-F]+))/i))) {
							value = Math.bits(parts.groups.mask);
						}
						compatibility.export.fields(
							{
								name: 'numina_type_{i:02}',
								value: 'numina_value_{i:02}'
							}, values, mine, {start:0}
						);
					},

					associates(names, values) {
						values.notes = stripHtml(values.notes).trim();
						if (values.type) {
							values.name = `${values.type}-${values.name}`;
						}
						if (values.value) {
							values.name += ': ' + values.value;
						}
						compatibility.export.fields(
							{
								name: 'dsf_contact_type_{i:02}',
								notes: 'dsf_contact_tootip_{i:02}'
							}, values, {for: names}, {start:0}
						);
					},

					equipment(names, values) {
						let line = [],
							theirs = {
								name: 'equipment_name_{i:02}',
								description: 'equipment_tootip_{i:02}'
							},
							theirValues = {};
						if (values.type) {
							if ('weapon' === values.type) {
								return this.weapon(names, values);
							}
							line.push(`${values.type}: `);
						}
						line.push(`${values.name}: `);
						if (values.points) {
							line.push(`${values.points}`);
							if (values.charge) {
								line.push('; ');
							}
						}
						// TODO: evaluate whether this format will allow charge to be correctly reimported (after switching to NWoD Reloaded! and back) if points is missing
						if (values.charge) {
							line.push(`${values.charge}`);
						}
						theirValues.name = line.join('');
						theirValues.description = stripHtml(values.description);
						compatibility.export.fields(
							theirs, theirValues,
							compatibility.aliasFor(names), {start:0});
					},

					flaws(names, values) {
						if (values.value) {
							values.value = '-' + values.value;
						} else {
							values.name = 'Flaw: ' + values.name;
						}
						return this._flavor(names, values);
					},

					merits(names, values) {
						if (values.value) {
							values.value = '+' + values.value;
						} else {
							values.name = 'Merit: ' + values.name;
						}
						return this._flavor(names, values);
					},

					fetters(name, value, mine, opts={}) {
						return this.splat(name, value, mine, {...opts, category: 'Fetter'});
					},

					passions(name, value, mine, opts={}) {
						return this.splat(name, value, mine, {...opts, category: 'Passion'});
					},

					// TODO: investigate "Object" values in traits_*_{i}
					splat(name, value, mine, opts={}) {
						/** /
						this.simple(names.value, values.name, values.value, opts);
						/*/
						if (! mine && is_object(name)) {
							/* (names, values) */
							[{name, value}, mine] = [value, name.value];
						}
						name = name.ucfirst();
						if (opts.category) {
							name = `${opts.category}: ${name}`;
						}
						let theirs = {
							name: 'traits_type_{i:02}',
							value: 'traits_value_{i:02}'
						};
						compatibility.export.fields(
							theirs, {name, value}, mine, {...opts, start:0}
						);
						/**/
					},

					simple(name, value, mine, opts={}) {
						/** /
						let theirs = {
							name: 'traits_type_{i:02}',
							value: 'traits_value_{i:02}'
						};
						compatibility.export.fields(
							theirs, {name, value}, mine, {...opts, start:0}
						);
						/*/
						this.splat(name, value, mine, opts);
						/**/
					},

					weapon(names, values) {
						const parsed = compatibility.parse.tagged([values.description]),
							  theirs = {
								  name: 'attack_weapon_{i:02}',
								  difficulty: 'attack_difficulty_{i:02}',
								  damage: 'attack_damage_{i:02}',
								  range: 'attack_range_{i:02}',
								  rate: 'attack_rate_{i:02}',
								  clip: 'attack_clip_{i:02}',
								  conceal: 'attack_conceal_{i:02}',
							  };
						parsed.name = values.name;
						compatibility.export.fields(theirs, parsed, {
							for: {
								name: names.name,
							},
							mine: names.description,
						});
					},

					// handled via aliases, so NOOP
					health() {},
					willpower() {},
				},
			}, // /jp12x_splat
		},
	};
