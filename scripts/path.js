	/*** 
	 * Supports hierarchical DSF names by operating on path components.
	 * 
	 * @requires dsf, klass
	 */
	let path = globals.path = {
		_sep: '_',
		//reSeparator: /_(\d+)(?:_|$)/,
		reSeparator: /_/,
		get separator() {
			return this._sep;
		},
		set separator(value) {
			this._sep = value;
			this.reSeparator = new RegExp(`${value}(\d+)${value}`);
		},

		join(...parts) {
			return parts.join(this.separator);
		},

		split(name) {
			return dsf.stripPrefix(name).split(this.reSeparator);
		},
	}
