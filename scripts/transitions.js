	/**
	 * Animated transitions.
	 */
	const transitions = globals.transitions = {
		/**
		 * @typedef {Object} AnimateOptions
		 * @property {boolean} [reset=true] - whether to {@link this.reset reset} the transition animation
		 * @property {Object} [css] - additional styling to apply before the transition
		 */

		classes: {
			start: 'fade fade-in fade-out wipe wipe-in wipe-out',
			finished: 'faded faded-in faded-out wiped-in wiped-out',
			fade: 'fade fade-in fade-out faded faded-in faded-out',
			wipe: 'wipe wipe-in wipe-out wiped wiped-in wiped-out',
		},

		states: {
			fade: {start: 'fade-out', finished: 'faded-out'},
			wipe: {start: 'wipe', finished: 'wiped'},
		},

		/**
		 * Allows a delay before starting a transition animation.
		 *
		 * Await to resume after the transition animation finishes.
		 *
		 * Like {@wait}, but performs some internal housekeeping. Returns a promise, which can be `await`ed or given resolution & rejection callbacks. If the latter, the rejection is called if the transition is canceled with (e.g.) {@link this.cacel}.
		 *
		 * The intended use is as:
		 *
		 *     transitions.after($elt, 2).then(() => transitions.fade($elt));
		 *     // or
		 *     await transitions.after($elt, 2);
		 *     await transitions.fade($elt);
		 *     await transitions.wipe($elt);
		 *
		 * @param {jQuery} $elt - element that will have a transition animation
		 * @param {number} duration - how long, in seconds, to wait
		 *
		 * @async
		 * @returns {Promise.<>}
		 */
		after($elt, duration) {
			return new Promise((resolve, reject) => {
				$elt.data('timer.transition', setTimeout(
					() => {
						$elt.removeData('timer.transition');
						$elt.removeData('reject');
						resolve();
					},
					duration * 1000));
				$elt.data('reject', reject);
			});
		},

		async animate($elt, transition, {css, reset=false}={}) {
			const {start, finished} = this.states[transition];
			await this.reset($elt, transition, reset);
			this.prepare($elt);
			$elt.addClass(start);

			if (css) {
				await animationFrame();
				$elt.css(css);
				await animationFrame();
			} else {
				await animationPost();
			}
			// trigger transition animation
			$elt.addClass(finished);

			await $elt.waitOn('transitionend');
			$elt.removeClass(start);
			return;

		},

		/**
		 * Cancel the transition (if any) for the given transition classes for an element.
		 *
		 * @param {jQuery} $elt - the element
		 * @param {string} classes
		 */
		cancel($elt, transition) {
			const classes = this.classes[transition],
				  //reject = $elt.data('reject') ?? (() => {});
				  reject = $elt.data('reject') || (() => {});
			clearTimeout($elt.data('timer.transition'));
			reject();
			$elt.addClass('immediate')
				.off('transitionend')
				.removeClass(classes);
		},

		cancelFade($elt) {
			this.cancel($elt, 'fade');
		},

		cancelWipe($elt) {
			this.cancel($elt, 'wipe');
		},

		clear($elt, classes) {
			$elt.removeClass(classes);
		},

		clearFade($elt) {
			this.clear($elt, this.classes.fade);
		},

		clearWipe($elt) {
			this.clear($elt, this.classes.wipe);
		},

		/**
		 * Fade out the given element.
		 *
		 * Await to resume after the fade finishes.
		 *
		 * @param {jQuery} $elt - the element to fade out
		 * @param {AnimateOptions} opts
		 */
		async fade($elt, opts) {
			return await this.animate($elt, 'fade', opts);
		},

		fadeAfter($elt, duration) {
			$elt.data('timer.transition', setTimeout(
				() => this.fade($elt),
				duration * 1000));
		},

		is($elt, transition) {
			return $elt.hasClass(this.states[transition].start);
		},

		/**
		 * Prepare an element for a transition animation.
		 *
		 * Necessary after cancelling a transition.
		 *
		 * @param {jQuery} $elt - element to prepare for transition animation
		 */
		prepare($elt) {
			// in case a previous transition was cancelled
			$elt.css({transition: ''})
				.removeClass('immediate');
		},

		/**
		 * Optionally clear the given transition, so as to restart it.
		 */
		async reset($elt, transition, reset) {
			if (reset && this.is($elt, transition)) {
				this.cancel($elt, transition);
				await animationPost();
			}
		},

		/**
		 * Wipe away (reduce height to 0) the given element.
		 *
		 * Await to resume after the wipe finishes.
		 *
		 * @param {jQuery} $elt - the element to wipe away
		 * @param {AnimateOptions} opts
		 */
		async wipe($elt, opts) {
			return await this.animate(
				$elt, 'wipe',
				// set explicit height, so transition will trigger
				{ ...opts, css: {height: $elt.css('height')} }
			);
		},
	};
