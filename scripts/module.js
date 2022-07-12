	/**
	 * Prototype object for modules. 
	 *
	 * Mostly stubs so modules don't have to define certain functions.
	 */
	let module = {
		modules: {},
		dependencies: {},
		handlers: {},
		_done: {},

		base: {
			init($context, slug) {
				this.$context = $context;
				this.slug = slug;
			},
			preLoad(opts, $context) {
				this.$context = $context;
				this.slug = opts.slug;
			},
			postLoad() {},
			change() {},
			preSave() {},
		},

		/**
		 * Invoke a handler on all registered modules.
		 *
		 * WARNING: while this method guards against infinite loops caused by
		 * circular dependencies, it won't invoke the handlers when there's
		 * a circular dependency.
		 * 
		 * WARNING: can't be called recursively, else will get confused as to 
		 * which modules' handlers have already been invoked.
		 */
		all(func, ...args) {
			let done = {},
				now = Object.keys(this.modules),
				later = [],
				errs = {};
			this._done[func] = done;
			this._current = { func };
			try {
			while (now.length) {
				for (let name of now) {
					try {
						if (this.delay(name, func, done)) {
							later.push(name);
						} else {
							// mark as done before invoking so as not to repeat the handler if it throws an exception
							done[name] = true;
							this._current.module = name;
							this.modules[name][func](...args);
							delete this._current.module;
						}
					} catch (err) {
						if (err.delay) {
							later.push(name);
						} else if (err.missing) {
							err.message = `Missing dependencies for ${name}.${func}: ${err.missing}.`;
							console.log(err.message);
							throw err;
						} else {
							console.log(`Error running ${name}.${func}: ${err.message}`);
							errs[name] = err;
						}
					}
				}
				if (now.length > later.length) {
					now = later;
					later = [];
				} else {
					let message = `Cyclic dependency with ${func}; have to skip ${now}.`;
					console.log(message);
					//now = [];
					throw {
						message,
						skipped: now,
					};
				}
			}
			} finally {
				this._current = {};
			}
			
			this.fire(func, args);
			
			switch (Object.keys(errs).length) {
			case 0:
				break;
			case 1:
				throw Object.values(errs)[0];
			default:
				throw errs;
			}
		},

		/**
		 * Answers whether some of the modules of a dependent haven't yet been invoked, and thus it should be delayed.
		 */
		delay(dependent, event, done) {
			let dependencies = this.dependencies[event] || {};
			if (dependent in dependencies) {
				return dependencies[dependent].some(m => ! (m in done));
			}
			return false;
		},

		fire(func, args=[]) {
			let errs = {};
			this._current = { func };
			
			if (func in this.handlers) {
				for (let id in this.handlers[func]) {
					try {
						this.handlers[func][id](...args);
					} catch (err) {
						errs[id] = err;
					}
				}
			}
			
			this._current = {};

			switch (Object.keys(errs).length) {
			case 0:
				break;
			case 1:
				throw Object.values(errs)[0];
			default:
				throw errs;
			}
		},

		on(event, handler, id) {
			if ('string' === typeof(handler)) {
				[handler, id] = [id, handler];
			}
			if (! id) {
				id = handler.toString();
			}
			if (! (event in this.handlers)) {
				this.handlers[event] = {};
			}
			this.handlers[event][id] = handler;
			return id;
		},

		off(event, id) {
			if (event in this.handlers) {
				delete this.handlers[event][id];
			}
		},

		/**
		 * Register an object as a module.
		 *
		 * Records the module, and adds some base handlers.
		 */
		register(name, mod) {
			this.modules[name] = mod;
			mixIn(mod, this.base);
		},

		/**
		 * Record that one module's event handler requires certain others to run first.
		 *
		 * WARNING: circular dependencies aren't detected.
		 *
		 * An alternative is to use {@link this#waitFor}/{@link this#tarryFor} from within handlers.
		 */
		registerDependency(dependent, event, principles) {
			if (! (event in this.dependencies)) {
				this.dependencies[event] = {};
			}
			this.dependencies[event][dependent] = principles;
		},

		/**
		 * Wait to invoke a handler until after the handlers for the named modules have been invoked.
		 *
		 * If any of the modules are missing, they're ignored.
		 *
		 * Called from within a handler to delay it until later. Alternative to registering a dependency with {@link this#registerDependency}.
		 */
		tarryFor(...names) {
			let missing = names.filter(name => ! (name in this.modules));
			if (missing.length) {
				console.info(`Ignoring missing requirements for ${this._current.module}.${this._current.func}: ${missing}.`);
			}
			if (names.some(name => name in this.modules && ! (name in this._done[this._current.func]))) {
				throw {delay: true, 'for': names};
			}
		},
		
		/**
		 * Wait to invoke a handler until after the handlers for the named modules have been invoked.
		 *
		 * If any of the modules are missing, throws to abort the .
		 *
		 * Called from within a handler to delay it until later. Alternative to registering a dependency with {@link this#registerDependency}.
		 */
		// should this be named 'after'?
		waitFor(...names) {
			let missing = names.filter(name => ! (name in this.modules));
			if (missing.length) {
				throw {missing, message: `Missing dependencies: ${missing}`};
			}
			if (names.some(name => ! (name in this._done[this._current.func]))) {
				throw {delay: true, 'for': names};
			}
		},
	};

