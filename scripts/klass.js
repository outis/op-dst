	/*** HTML class ops */
	let klass = globals.klass = {
		reVar: /{([^}]+)}/,
		reVars: /{([^}]+)}/g,

		/*  */
		apply(fromTpl, toTpl, vals) {
			let env = this.extract(fromTpl, vals);
			return this.eval(toTpl, env);
		},

		/* Replace vars with values */
		eval(name, env, unbrace) {
			return name.replace(
				this.reVars,
				function (match, key) {
					if (key in env) {
						return env[key];
					}
					if (unbrace) {
						return key;
					} else {
						return `{${key}}`;
					}
				}
			)
		},
		
		/* Get values from a class */
		extract(tpl, vals) {
			let match = this.matches(tpl, vals);
			if (match) {
				return match.groups;
			}
		},

		hasVars(name) {
			return name.match(this.reVar);
		},

		matches(tpl, name) {
			return name.match(this.tplToRe(tpl));
		},

		matchesAny(tpls, name) {
			for (let tpl of tpls) {
				if (this.matches(tpl, name)) {
					return tpl;
				}
			}
		},

		name(tpl, name) {
			let matches = name.match(this.tplToRe(tpl));
			if (matches) {
				return matches[0];
			}
		},
		
		/* Get a named parameter ('name_value'). */
		param(elt, param) {
			let matches = elt.className.match(new RegExp(`\\b${param}_(?<value>\\S+)`));
			if (matches) {
				return matches.groups.value
			}
		},

		/* Get the part of a classname before template vars. */
		prefix: memoize(function (name) {
			let matches = name.match(/^[^{]+/);
			if (matches) {
				return matches[0];
			}
			return name;
		}),

		tplToRe(tpl, allowEmpty) {
			let quant = allowEmpty ? '*' : '+';
			return new RegExp('\\b' + tpl.replace(this.reVars, `(?<$1>[^ _]${quant}?)`) + '\\b');
		},
	
		/* Get variable names from a templated class (e.g. 'item{i}') */
		vars: memoize(function (name) {
			return name.match(/(?<={)[^}]+(?=})/g);
			/*
			let vars = name.match(this.reVars);
			return vars.map(v => v.replace(/^{|}$/g, ''));
			*/
		}),
	};
