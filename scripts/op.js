	/**
	 * Obsidian Portal API.
	 */
	var op = globals.op = {
		get app() {
			return aisleten.characters;
		},
		
		/**/
		trigger(name, ...args) {
			if (args.length == 1 && Array.isArray(args[0])) {
				args = args[0];
			}
			name = name.replace(/^data/i, '');
			this.app.dstCallback(`${this.slug}_data${name.ucfirst()}`, ...args);
		}
	};
