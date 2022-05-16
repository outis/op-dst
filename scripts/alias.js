	/***
	 * DSFs from other DSs
	 *
	 * @requires dsf, klass, range, udfs
	 */
	let alias = globals.alias = {
		_sesalia: {
			simple: flipObject(aliases.simple),
			templates: flipObject(aliases.templates),
		},

		/* DST event handlers */
		preLoad(opts, $context) {
			this.$context = $context;
			this.createFields();
		},

		postLoad(opts, $context) {
			this.cullTemplates();
			this.import();
		},

		change({containerId, fieldName, fieldValue}, $context) {
			if (this.is(fieldName)) {
				
			}
		},

		preSave(opts, $context) {
			this.update();
		},

		

		/*  */
		
		createField(theirs, mine) {
			theirs = dsf.addPrefix(theirs);
			mine = dsf.addPrefix(mine);
			
			let $field = this.$context.find(`.${theirs}`);
			if (! $field.length) {
				this.$aliases.append($(`<span class="dsf ${theirs}" data-for="${mine}"></span>`));
			} else {
				$field.attr('data-for', `dsf_${mine}`);
			}
		},

		/* Ensure DSFs for aliases exist by creating any missing ones. */
		createFields() {
			let $aliases = this.$context.find('.aliases');
			if (! $aliases.length) {
				$aliases = $('<div class="aliases"></div>');
				this.$context.find('.mll_sheet').append($aliases);
			}
			this.$aliases = $aliases;

			if (0 && window.dynamic_sheet_attrs) {
				this.shouldCull = false;
				let entries = this.extract(window.dynamic_sheet_attrs);
				for (let {theirs, mine, value} of entries) {
					this.createField(name, mine);
				}
			} else {
				this.shouldCull = true;
				this.createSimpleFields();
				this.createTemplatedFields();
			}
		},

		createSimpleFields() {
			this.eachSimple(function (theirs, mine) {
				this.createField(theirs, mine);
			}, this);
		},

		createTemplatedFields() {
			this.eachTemplate(function (theirs, mine) {
				let vars = klass.vars(theirs),
					range = this.rangesFor(vars),
					t = theirs, m = mine;
				for (let {theirs, mine} of this.expandTo(t, m, range)) {
					this.createField(theirs, mine);
				}
			}, this);
		},

		/**
		 * Remove any backing fields after the last non-empty field for the given templated alias.
		 */
		cullTemplate(theirs, mine) {
			let vars = klass.vars(theirs),
				k = vars.shift(),
				range = this.rangeFor(k),
				env = {};
			for (let v of vars) {
				// check only 1st field for each item
				env[v] = 1;
			}
			/* Currently, this considers each DSF from a UDF template separately.
			 * The result may be ragged (i.e. missing backing DSFs for some UDF
			 * items). Should all the DSFs for each UDF item from their sheet be
			 * checked together?
			 */
			for (let i of this.rangeFor(k, {step:-1})) { // loop down
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
		
		/**
		 * Remove any backing fields after the last non-empty field for templated aliases.
		 *
		 * As createItems() overproduces, this cleans up.
		 */
		cullTemplates() {
			if (! this.shouldCull) {
				return;
			}
			this.eachTemplate(function (theirs, mine) {
				this.cullTemplate(theirs, mine);
			}, this);
		},

		/**
		 * Iterate over all aliased DSFs.
		 *
		 * Won't expand any templates into actual DSFs.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 */
		eachAlias(fn, self) {
			if (self) {
				fn = fn.bind(self);
			}
			this.eachSimple(fn);
			this.eachTemplate(fn);
		},

		/**
		 * Iterate over each entry of some alias segment (simple or templates).
		 */
		eachEntry(fn, segment, self) {
			if (self) {
				fn = fn.bind(self);
			}
			for (let [theirs, mine] of Object.entries(segment)) {
				theirs = dsf.addPrefix(theirs);
				mine = dsf.addPrefix(mine);
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
		eachOf(fn, expander, self) {
			if (self) {
				fn = fn.bind(self);
			}
			for (let [theirs, mine] of Object.entries(aliases.simple)) {
				theirs = dsf.addPrefix(theirs);
				mine = dsf.addPrefix(mine);
				fn(theirs, mine);
			}
			for (let [theirs, mine] of Object.entries(aliases.templates)) {
				theirs = dsf.addPrefix(theirs);
				mine = dsf.addPrefix(mine);

				let aliases = expander(mine, theirs);
				for (let {theirs, mine} of aliases) {
					fn(theirs, mine);
				}
			}
		},
		/**
		 * Iterate over all my aliased DSFs.
		 *
		 * Will expand any templates into actual DSFs.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 */
		eachOfMine(fn, self) {
			this.eachOf(fn, this.expandMine.bind(this), self);
		},

		/**
		 * Iterate over all their aliased DSFs.
		 *
		 * Will expand any templates into actual DSFs.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 */
		eachOfTheirs(fn, self) {
			this.eachOf(fn, this.expandTheirs.bind(this), self);
		},

		/**
		 * Iterate over simple (i.e. non-templated) aliases.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 */
		eachSimple(fn, self) {
			return this.eachEntry(fn, aliases.simple, self);
		},

		/**
		 * Iterate over template aliases.
		 *
		 * Won't expand any templates into actual DSFs.
		 *
		 * @param {(string, string) => null} fn Passed theirs & local field names.
		 */
		eachTemplate(fn, self) {
			return this.eachEntry(fn, aliases.templates, self);
		},


		/**
		 * For templated aliases, return a collection of field names matching those templates. 
		 */
		expandMine(theirs, mine) {
			theirs = dsf.addPrefix(theirs);
			mine = dsf.addPrefix(mine);
			let pre = klass.prefix(mine);
			return this.$context.find(`[class*=" ${pre}"]`)
				.toArray()
				.filter(elt => klass.matches(mine, elt.className))
				.map(function (elt) {
					let env = klass.extract(mine, elt.className),
						mine = klass.eval(mine, env),
						theirs = klass.eval(theirs, env);
					if (klass.hasVars(theirs)) {
						// TODO: theirs has free variables; how to handle?
						fillObject(klass.vars(theirs), '', env);
						theirs = klass.eval(theirs, env);
					}
					return {theirs, mine};
				});
		},
		
		/**
		 * For templated aliases, return a collection of field names matching those templates. 
		 */
		expandTheirs(theirs, mine) {
			theirs = dsf.addPrefix(theirs);
			mine = dsf.addPrefix(mine);
			let pre = klass.prefix(theirs);
			return this.$context.find(`[class*=" ${pre}"]`)
				.toArray()
				.filter(elt => klass.matches(theirs, elt.className))
				.map(function (elt) {
					let env = klass.extract(theirs, elt.className),
						theirs = klass.eval(mine, env)
						mine = klass.eval(mine, env);
					if (klass.hasVars(mine)) {
						// TODO: mine has free variables; how to handle?
						fillObject(klass.vars(mine), '', env);
						mine = klass.eval(mine, env);
					}
					return {theirs, mine};
				});
		},

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

		/**
		 * Get aliased DSFs. 
		 *
		 * @returns {{theirs, mine, value}}: their name, my name, field value
		 */
		extract(stored) {
			let entries = [], mine;
			// 
			for (let [theirs, value] of Object.entries(stored)) {
				// check aliases.simple, aliases.templates
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
		// TODO: rename
		extract_(stored, aliases) {
			let entries = [];
			for (let [name, value] of Object.entries(stored)) {
				// check aliases.simple, aliases.templates
				if (   name in aliases.simple
				    || this.isInstance(name, aliases.templates))
				{
					entries.push({name, value});
				}
			}
			return entries;
		},

		/* Get aliased DSFs for this sheet out of storage. */
		extractMine(stored) {
			return this.extract_(stored, this._sesalia);
		},
		
		/* Get aliased DSFs for other sheets out of storage. */
		extractTheirs(stored) {
			return this.extract_(stored, aliases);
		},

		/* Copy from their fields to mine. */
		import() {
			this.eachOfTheirs(function (theirs, mine) {
				let local = `.${mine}`,
					$local = this.$context.find(local),
					foreign = `.${theirs}`;
				if (! $local.length) {
					$local = $(`<span class="dsf ${mine}"></span>`);
					// TODO: add $local
					/** /
					let $items;
					$items.append($local);
					/**/
				}
				dsf.value(local, dsf.value(foreign));
			});
		},
		
		/** Reports whether the given field name is aliased. */
		is: memoize(function (name) {
			name = dsf.stripPrefix(name);
			return this.isSimple(name) || this.isInstance(name);
		}),
		
		isInstance(name, aliases) {
			return this.templateFor(name, aliases);
		},

		isInAUdf(name, udfs) {
			return this.udfField(name, udfs);
		},

		isSimple: memoize(function (name) {
			name = dsf.stripPrefix(name);
			return name in aliases.simple || name in this._sesalia.simple;
		}),

		/**
		 * If `theirs` is an aliased field from another sheet, return my name for it.
		 *
		 * @param {string} theirs A field name (not a template).
		 */
		myNameFor: memoize(function (theirs) {
			return this.nameFor(theirs, aliases);
		}),

		/**
		 * If `name` is in the given aliases, return the other name for it.
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

		rangeFor(v, {base, step}={}) {
			switch (v) {
			case 'i':
				return range.over(1, 100, step);
			case 'j':
				return range.over(1, 4, step);
			default:
				return range.over(1, 10, step);
			}
		},
		
		rangesFor(vars, base) {
			let ranges = {};
			for (let v of vars) {
				ranges[v] = this.rangeFor(v, {base});
			}
			return range.keys(ranges);
		},

		/**
		 * Remove generated DSFs after the given number.
		 */
		// TODO: test
		removeAfter(name, tpl, n) {
			if (! n) {
				// extract i from name
				n = udfs.indexOf(name, tpl);
			}
			let pre = klass.prefix(tpl);
			this.$context.find(`.aliases .dsf`)
				.filter((i, elt) => klass.matches(tpl, elt.className)
						&& udfs.indexOf((elt.className, tpl) > n))
				.remove()
			;
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
			return this.resolve(name, aliases);
		}),

		/**
		 * Convert a DSF name to one on another sheet by resolving the alias (if any).
		 *
		 * Differs from `nameForTheirs` in that this method will return the original name if it's not aliased, while `nameForTheirs` will only return the aliased field for the given name.
		 */
		resolveToTheirs: memoize(function (name) {
			return this.resolve(name, this._sesalia);
		}),

		/**
		 * Return the template alias matching the given name (if any).
		 *
		 * If no aliases are given, checks fields for this sheet & others.
		 *
		 * @param {srting} name A field name.
		 * @param {{simple:{...}, templates:{...}}} als simple & templated aliases
		 */
		templateFor(name, als) {
			name = dsf.stripPrefix(name);
			if (als) {
				return Object.keys(als.templates).find(tpl => klass.matches(tpl, name))
			}
			return this.templateFor(name, aliases)
				|| this.templateFor(name, this._sesalia);
		},
		
		/**
		 * If `mine` is an aliased field from this sheet, return their name for it
		 *
		 * @param {string} mine A field name (not a template).
		 */
		theirNameFor: memoize(function (mine) {
			return this.nameFor(mine, this._sesalia);
		}),

		update() {
			this.eachOfMine(function (theirs, mine) {
				let value = this.$context.find(`.${mine}`);
				dsf.value(theirs, value);
			});
		},
	};
