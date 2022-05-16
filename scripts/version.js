	/*** 
	 * Dynamic Sheet Fields 
	 *
	 * @requires field, klass, pips, aisleten
	 */
	let version = globals.dsf = {
		updaters: {},

		/* DST event handlers */
		preLoad(opts, $context) {
			this.$context = $context;
		},
		

		/* */
		
		dataVersion(version) {
			if (version) {
				this._version = version;
				dynamic_sheet_attrs.mll_version = version;
				if (this.$context) {
					/* If $context not yet set, then dsf_version also hasn't been 
					   set, so it doesn't matter if it's not updated right now.*/
					this.$context.find('.dsf_mll_version').text(version);
				}
				return;
			}
			if (not ('_version' in this)) {
				this._version = +dynamic_sheet_attrs.mll_version || 0;
			}
			return this._version;
		},

		/* requires preLoad to have fired */
		dstVersion() {
			if (this.$context) {
				return +this.$context.find('.mll_sheet')[0].dataset.version || 0;
			}
			// what do? For now, undefined.
		},

		register(sheet, version, updater) {
			if (version <= this.dataVersion()) {
				return;
			}
			sheet = this.sheetId(sheet);
			if (! (sheet in this.updaters)) {
				this.updaters[sheet] = [];
			}
			if (! (version in this.updaters[sheet])) {
				this.updaters[sheet][version] = [];
				this.updaters[sheet][version].version = version
			}
			this.updaters[sheet][version].push(updater);
		},

		/**
		 * @param {$ | HTMLElement | String} sheetId
		 */
		sheetId(context) {
			if (context instanceof $) {
				return context.containerId;
			}
			if ('id' in context) {
				return context.id;
			}
			return context;
		},

		update(sheet) {
			sheet = this.sheetId(sheet);
			if (! (sheet in this.updaters)) {
				return;
			}
			let dataVersion = this.dataVersion(),
				newVersion = 0;
			this.updaters[sheet].sort((a, b) => a.version - b.version);
			//this.updaters.filter(up => up.version > dataVersion);
			for (let updaters of this.updaters[sheet]) {
				for (let updater of updaters) {
					updater();
				}
				newVersion = updater.version;
			}
			this.dataVersion(newVersion);
			this.updaters[sheet] = [];
		},
    }
