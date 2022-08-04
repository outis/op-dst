	/**
	 * Adds a `reset` method to a generator.
	 */
	/*
	 *
	 * Based off of https://medium.com/@anywhichway/resetable-javascript-generators-ae233db71779
	function ResettableGenerator(generator, self) {
		function make(target, that, args) {
			let items = target.apply(self ?? that, args),
				next = items.next.bind(items);
			return {items, next};
		}
	
		const proxy = new Proxy(generator, {
			apply(target, that, args) {
				let {items, next} = make(...arguments);
				// bounce to `next`, allowing the actual generator to be changed
				items.next = value => next(value);
				Object.defineProperty(items, 'reset', {
					enumerable:false,
					// replace the actual generator & next
					value: () => ({items, next} = make(...arguments)),
				});
				return items;
			},
		});
	
		return proxy;
	};
	globals.ResettableGenerator = ResettableGenerator;
	*/
	function resettableGenerator(generator, reset) {
		reset ??= () => {};
		
		function Resettable(...args) {
			let items;

			/*
			Object.defineProperty(this, 'args', {
				value: args,
			});
			Object.defineProperty(this, 'generator', {
				get() {
					return items;
				},
				set(value) {
					items = value;
				}
			});
			*/
			this.args = args;
			this.init();
		}

		Resettable.prototype = {
			base: generator,
			init() {
				this.generator = generator.apply(this, this.args);
			},
			reset() {
				if (! reset.call(this)) { // allow custom resetter to cancel initialization
					this.init();
				}
			},
			// iterator
			next(value) {
				return this.generator.next(value);
			},
			// iterable
			[Symbol.iterator]() {
				return this;
			},
		};

		return function (...args) {
			return new Resettable(...args);
		};
	}
	globals.resettableGenerator = resettableGenerator;
