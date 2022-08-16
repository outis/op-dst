	/**
	 * Name templates - useful to generate class names.
	 */
	let klass = globals.klass = {
		/**
		 * In templates, braces surround variables to be replaced. Variables can optionally be followed by a colon and then formatting information. For example:
		 *     name_{var}_{i:02}
		 *
		 * Currently, the only supported formatting information is a padding character and field width.
		 *
		 * @typedef {string} NameTemplate
		 */

		reVar: /{(?<name>[^:}]+)(?::(?<fmt>[^}]*))?}/,

		/**
		 * Copy values from a name matching one template into another template.
		 *
		 * Combines {@link this.extract} and {@link this.eval}.
		 *
		 * Example:
		 *
		 *    klass.apply(
		 *        'foo_{name}_{i}_{value}_{ignore}',
		 *        'bar_{i:02}_{name}_{value}_{extra}',
		 *        'foo_baz_5_qux_xuq');
		 *    // result: 'bar_05_baz_qux_{extra}'
		 *
		 * @param {NameTemplate} fromTpl - template used to extract values from <var>vals</var>
		 * @param {NameTemplate} toTpl - template to apply extracted values to
		 * @param {string} vals - a name to extract values from
		 *
		 * @returns {string}
		 */
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
		 * @param {NameTemplate} name - A name template.
		 * @param {object} env - Variable environment.
		 * @param {boolean} [unbrace] - Whether to remove braces from unmatched variables.
		 *
		 * @returns {string}
		 */
		eval(name, env, unbrace=false) {
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

		/**
		 * Replace vars with values on multiple name templates.
		 *
		 * @param {object|string[]} names - Name templates.
		 * @param {object} env - Variable environment.
		 * @param {boolean} [unbrace] - Whether to remove braces from unmatched variables.
		 * @returns {object|string[]} Same type as <var>names</var>
		 */
		evalAll(names, env, unbrace=false) {
			let results = new names.constructor();
			for (let [k, name] of Object.entries(names)) {
				results[k] = this.eval(name, env, unbrace);
			}
			return results;
		},

		/**
		 * Yield entries of a given object that match a template or regex.
		 *
		 * @param {object} obj - object to filter
		 * @param {NameTemplate|RegExp} include - property name filter
		 *
		 * @yields {*[]} `[name, property]` pairs
		 */
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

		/**
		 * Filter properties of a given object, based on a template or regex.
		 *
		 * @param {object} obj - object to filter
		 * @param {NameTemplate|RegExp} include - property name filter
		 *
		 * @yields {object}
		 */
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
		 * @param {NameTemplate} tpl class name template
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
			//return name.match(/(?<={)[^:}]+(?=(:[^}]*)?})/g) /*??*/|| [];
			let vars = name.match(this.reVars) || [];
			return vars.map(v => v.replace(/^{|}$/g, ''));
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

