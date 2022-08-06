	/**
	 * Name templates - useful to generate class names.
	 *
	 * In templates, braces surround variables to be replaced. Variables can optionally be followed by a colon and then formatting information. For example:
	 *     name_{var}_{i:02}
	 *
	 * Currently, the only supported formatting information is a padding character and field width.
	 */
	let klass = globals.klass = {
		reVar: /{(?<name>[^:}]+)(?::(?<fmt>[^}]*))?}/,

		/*  */
		apply(fromTpl, toTpl, vals) {
			let env = this.extract(fromTpl, vals);
			return this.eval(toTpl, env);
		},

		/**
		 * Replace vars with values.
		 *
		 * Any variable in the template that's present in the environment is replaced with the value. In other words, each substring matching `{name(:format)?}`, where 'name' is a property of <var>env</var>, is replaced with <var>env.name</var>.
		 *
		 * Unmatched template variables are handled in two different ways, depending on <var>unbrace</var>. If false, variables are left as-is. If true, the braces (and format) are removed, leaving the name.
		 *
		 * @param {string} name - A name template.
		 * @param {object} env - Variable environment.
		 * @param {boolean} [unbrace] - Whether to remove braces from unmatched variables.
		 *
		 * @returns {string}
		 */
		eval(name, env, unbrace) {
			return name.replace(
				this.reVars,
				function (match, key, fmt) {
					if (key in env) {
						let value = env[key];
						if (fmt) {
							value = klass.format(value, fmt);
						}
						return value;
					}
					if (unbrace) {
						return key;
					} else {
						return match;
					}
				}
			)
		},

		*entries(obj, include) {
			let tpl = include;
			if ('string' == typeof(include)) {
				include = name => klass.matches(name, tpl);
			} else if (tpl instanceof RegExp) {
				include = name => tpl.test(name);
			}
			for (let name in obj) {
				if (include(name)) {
					yield [name, obj[name]];
				}
			}
		},

		/* Get values from a class */
		extract(tpl, name) {
			let match = this.matches(tpl, name);
			if (match) {
				return match.groups;
			}
		},

		filter(obj, pred) {
			let filtered = {};
			for (let [name, value] of this.entries(obj, pred)) {
				filtered[name] = value;
			}
			return filtered;
		},

		/**
		 * Apply a format to a value.
		 */
		format(value, fmt) {
			let width = +fmt,
				padChar = ' ';
			if (/^[^1-9]/.test(fmt)) {
				padChar = fmt[0];
			}
			return value.toString().padStart(width, padChar);
		},

		hasVars(name) {
			return this.reVar.test(name);
		},

		matches(tpl, name) {
			return name.match(this.tplToRe(tpl));
		},

		matchesAny(tpls, name) {
			return tpls.find(tpl => this.matches(tpl, name));
		},

		/**
		 * Extract the name matching a template from HTML classes.
		 *
		 * @param {string} tpl class name template
		 * @param
		 */
		name(tpl, className) {
			let matches = this.matches(tpl, className);
			if (matches) {
				return matches[0];
			}
		},

		/**
		 * Get a named parameter ('name_value').
		 */
		param(elt, param) {
			let matches = elt.className.match(new RegExp(`\\b${param}_(?<value>\\S+)`));
			if (matches) {
				return matches.groups.value
			}
		},

		/**
		 * Get the part of a classname before template vars.
		 */
		prefix: memoize(function (name) {
			let matches = name.match(/^[^{]+/);
			if (matches) {
				return matches[0];
			}
			return name;
		}),

		/**
		 * Convert an HTML class name template to a RegExp.
		 */
		tplToRe(tpl, allowEmpty) {
			let quant = allowEmpty ? '*' : '+';
			return new RegExp('\\b' + tpl.replace(this.reVars, `(?<$1>[^ _]${quant}?)`) + '\\b');
		},

		/**
		 * Get variable names from a templated class (e.g. 'item{i}') 
		 */
		vars: memoize(function (name) {
			return name.match(/(?<={)[^:}]+(?=(:[^}]*)?})/g) ?? [];
			/*
			let vars = name.match(this.reVars);
			return vars.map(v => v.replace(/^{|}$/g, ''));
			*/
		}),

		// TODO: refactor-find better name
		_varify(name, suffix) {
			let base, tpl;
			if (klass.hasVars(name)) {
				tpl = name;
				base = klass.prefix(name).replace(/_+$/, '');
			} else {
				base = name;
				tpl = name + suffix.replace(/^_*/, '_');
			}
			return {base, tpl};
		},
	};
	klass.reVars = new RegExp(klass.reVar, 'g');

