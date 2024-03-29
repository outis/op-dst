	/**
	 * Inform the user.
	 */
	const alerts = globals.alerts = {
		current: {},
		defaultDuration: 5,
		ids: {},

		/* DST event handlers */
		init($context) {
			this.$context = $context;
			this.$alerts = $('<div class="alerts"></div>');
			this.$context.find('.mll_sheet').append(this.$alerts);
			this.clicker = this.clickedClose.bind(this);
			this.$alert = $('<div class="alert"><span class="close"></span><span class="text"></span>');
			this.$alerts.on('click', '.alert .close', this.clicker);
		},

		/* */
		alert(msg, opts={}) {
			//opts.id ??= this.id(msg);
			opts.id || (opts.id = this.id(msg));
			let $alert,
				{id, duration} = opts;

			if (this.current[id]) {
				$alert = this.current[id];
				duration = this.revive($alert);
			} else {
				({$alert, duration} = this.create(msg, opts));
			}
			if (! opts.sticky) {
				//duration ||= this.duration(msg) ?? this.defaultDuration;
				duration || (duration = this.duration(msg) || this.defaultDuration);
				transitions.after($alert, duration)
					.then(async () => this.fadeAlert($alert), () => {});
			}
			return $alert;
		},

		cancelFade($alert) {
			transitions.cancelFade($alert);
			transitions.cancelWipe($alert);
		},

		clickedClose(evt) {
			return this.closeAlert($(evt.target).closest('.alert'));
		},

		closeAlert($alert) {
			let id = $alert.data('id');
			delete this.current[id];
			$alert.remove();
		},

		create(msg, opts={}) {
			//opts.id ??= this.id(msg)
			opts.id || (opts.id = this.id(msg));
			//opts.duration ??= this.duration(msg);
			opts.duration || (opts.duration = this.duration(msg));

			opts.$alert = this.$alert.clone();

			opts.$alert.addClass(opts.classes);
			opts.$alert.attr('id', opts.id);
			this.textFor(opts.$alert, msg);
			opts.$alert.data('id', opts.id);
			opts.$alert.data('duration', opts.duration);
			this.current[opts.id] = opts.$alert;
			this.$alerts.append(opts.$alert);

			return opts;
		},

		/**
		 * How long to display a message, based on its length.
		 *
		 * @param {string} msg - a message for the user
		 *
		 * @returns {number} seconds to display the message
		 */
		duration(msg) {
			// 0.1s / word = 1 / 50
			// 0.5s / word = 1 / 10
			return (msg.length / 50);
		},

		async fadeAlert($alert) {
			// Chained transitions
			// fade-out
			await transitions.fade($alert);

			// fade-out done; wipe-out
			await transitions.wipe($alert, {prepare: false});

			// wipe done
			this.closeAlert($alert);
		},

		id: memoize((msg) => msg.replace(/\W+/g, '').toLowerCase()),

		/**
		 *
		 */
		info(msg, opts={}) {
			if (opts.classes) {
				opts.classes += ' info';
			} else {
				opts.classes = 'info';
			}
			return this.alert(msg, opts);
		},

		revive($alert) {
			//console.info(`reviving ${$alert[0].id}`);
			this.cancelFade($alert);
			return $alert.data('duration') /*??*/|| this.duration($alert.text() /*??*/|| this.defaultDuration);
		},

		textFor($alert, text) {
			return $alert.children('.text').text(text);
		},
	};
