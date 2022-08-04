	/*** 
	 * Dynamic Sheet Fields 
	 *
	 * @requires field, klass, pips, aisleten
	 */
	let version = globals.version = {
		_byver: {},
		_inorder: [],
		_resort: true,
		// so other MLL clients can override for their own versioning
		versionKey: 'mll_version',

		/* DST event handlers */
		preLoad(opts, $context) {
			this.$context = $context;
		},


		/* */

		dataVersion({version, data}={}) {
			// don't use dsa.data, so as to avoid the dependency
			data ??= dynamic_sheet_attrs;
			if (version) {
				this._version = version;
				data[this.versionKey] = version;
				if (this.$context) {
					/* If $context not yet set, then dsf_mll_version also hasn't been 
					   set, so it doesn't matter if it's not updated right now.*/
					// Don't use dsf.$dsf, to avoid adding a dependency
					this.$context.find(`.dsf_${this.versionKey}`).text(version);
				}
				return;
			}
			if (! ('_version' in this)) {
				this._version = +data[this.versionKey] || 0;
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

		register(version, updater) {
			version = +(version.toString().match(/\d+(?:\.\d+)?/) ?? [version])[0];
			/*
			if (version <= this.dataVersion()) {
				return;
			}
			*/
			if (! (version in this._byver)) {
				let updaters = [];
				this._byver[version] = updaters;
				Object.defineProperty(
					updaters, 'version',
					{
						value: version,
						writeable: false,
						enumerable: false,
					});
				this._inorder.push(updaters);
				this._resort = true;
			}
			this._byver[version].push(updater);
		},

		registerModule(module) {
			for (let [version, updater] of Object.entries(module.updaters ?? {})) {
				let {name} = updater;
				updater = updater.bind(module);
				updater.name = name;
				this.register(version, updater);
			}
		},

		/**
		 * Apply registered updaters to the given data.
		 *
		 * Doesn't require dataPreLoad to have fired, but updaters might. 
		 */
		update(data) {
			data ??= dynamic_sheet_attrs;
			let dataVersion = this.dataVersion({data}),
				newVersion = 0;
			if (this._resort) {
				this._inorder.sort((a, b) => a.version - b.version);
			}
			let toapply =  this._inorder.filter(up => up.version > dataVersion);
			for (let updaters of toapply) {
				for (let updater of updaters) {
					try {
						updater(data);
					} catch (err) {
						console.log(`Error running updater ${updater.name} for ${updaters.version}: ${err.message}`, err);
					}
				}
				newVersion = updaters.version;
			}
			this.dataVersion({data, version: newVersion});
		},
    }
