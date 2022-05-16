	/**
	 * Prototype object for modules. 
	 *
	 * Mostly stubs so modules don't have to define certain functions.
	 */
	let module = {
		modules: {},

		base: {
			init() {},
			preLoad(opts, $context) {
				this.$context = $context;
			},
			postLoad() {},
			change() {},
			preSave() {},
		},
		
		all(func, args=[]) {
			for (let mod of modules) {
				mod[func](...args);
			}
		},
		
		register(name, mod) {
			this.modules[name] = mod;
			mixIn(mod, this.base);
		},

		/**
		 * Record that one module's event handler requires certain others to run first.
		 *
		 * TODO: implement 
		 */
		registerDependency(dependent, event, principles) {
			
		},
	};

