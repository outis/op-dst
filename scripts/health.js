	/**
	 * Extra functionality for health:
	 * + More extensive damage types.
	 *
	 * @mixes resolver
	 */
	var health = globals.health = {
		/**
		 * Detailed damage types, encoded as a string.
		 *
		 * Each character index corresponds to a pip index; each character specifies a type of damage. There are two types of damage specifiers: symbols and letters. Symbols are:
		 *    '/': bashing
		 *    'x': lethal
		 *    '*': aggravated
		 *
		 * Letters use the first letter of each damage type. Spaces indicate no damag; with letters, 'X' can also indicate a filled-in (i.e. undamaged) pip.
		 *
		 * Letters are used internally, and are the preferred format.
		 *
		 * @typedef {string} DamageMarks
		 *
		 * Changes to length.
		 *
		 * @typedef {Object} LengthChange
		 * @property {number} length - new length
		 * @property {number} delta - how much the length is changing by
		 */
		classes: {
			// 'B' is there so it can be removed
			all: 'L A B',
			//bashing: 'B',
			lethal: 'L',
			aggravated: 'A',
			sequence: ['L', 'A', ' '],
			// alternate string markers
			' ': 'X',
			'/': ' ',
			'x': 'L',
			'*': 'A',
		},
		labels: {
			' ': 'Bashing',
			B: 'Bashing',
			L: 'Lethal',
			A: 'Aggravated',
			X: '',
		},

		get $health() {
			return dsf.$dsf('curr_health');
		},

		get details() {
			let $pips = this.$health.children(),
				state = '';
			for (let i = 1; i < $pips.length; ++i) {
				state += this.marker($pips[i]);
			}
			return state;
		},

		set details(details) {
			let $pips = this.$health.children();
			switch (this.classifyDetails(details)) {
			case 'letter':
				this.setClassDetails(details, $pips);
				break;
			case 'symbol':
				this.setSymbolDetails(details, $pips);
				break;
			default:
				console.error(`Could not parse health details: '${details}'`);
				break;
			}
		},

		get $details() {
			return dsf.$dsf('health_details');
		},

		get length() {
			// -1 for clear box
			return this.$health.children().length - 1;
		},

		/* DST event handlers */
		init($context) {
			this.$context = $context;
			this.clicker = this.clicked.bind(this);

			module.registerDependency('pips', 'preSave', ['health']);
		},

		preLoad() {
			if (! dsf.exists('health_details')) {
				$details = $('<span class="dsf dsf_health_details readonly hidden volatile"></span>');
				this.$health.after($details);
			}
		},

		postLoad() {
			module.waitFor('pips');

			if (authorize.can_edit()) {
				this.$context.redelegate('click', '.pips.current > span', '.pips.current:not(.health) > span');
				this.$context.on('click', '.page.stats .pips.health.current > span', this.clicker);
			}
			this.adjuster = this.adjusted.bind(this);
			this.$health.on('adjust.pips', this.adjuster);

			const details = dsf.override('health_details', dsa.data.health_details);
			if (details) {
				this.details = details;
			}
		},

		preSave() {
			dsf.value('health_details', this.details);
		},

		/* */

		adjusted(evt, change) {
			this.tamp(change);
		},

		classifyDetails(details) {
			if (/[BLA]+|^(X* *)$/.test(details)) {
				return 'letter';
			}
			if (/[*\/]+|^ +x/i.test(details)) {
				return 'symbol';
			}
			return;
		},

		clicked(evt) {
			if (evt.shiftKey || evt.altKey || evt.ctrlKey || evt.metaKey) {
				this.damage(evt.target);
				this.shiftState(evt.target);
			} else {
				this.heal(evt.target);
				pips.clicker(evt);
			}
			dsf.update(this.$details[0], newDetails, 'health_details');
		},

		/**
		 * Fit a damage detail string into the given length by shortening if necessary.
		 *
		 * Conditionally {@link this.repack repack}s the given string, doing so only if the new length is smaller than the current length.
		 *
		 * @param {DamageMarks} details - detailed damage types for pips
		 * @param {LengthChange} change - changes to length
		 *
		 * @returns {string}
		 */
		compact(details, change) {
			if (change.delta < 0) {
				return this.repack(details, change);
			}
			return details;
		},

		damage(pip) {
			if (this.isHealthy(pip)) {
				let {$elt:$pip} = this.resolve(pip);
				pips.fill(pip.previousElementSibling);
				// mark previously healthy pips with bashing damage (may be overriden by other types)
				//$pip.nextAll().add(pip).addClass(this.classes.bashing);
				$pip.nextAll().not('.L').not('.A').attr('title', this.labels.B);
			}
		},

		/**
		 * Clear statuses from the given element (and any preceding).
		 *
		 * TODO: rename
		 */
		heal(pip) {
			let {$elt:$pip} = this.resolve(pip);
			this.markUndamaged($pip.prevAll().add(pip));
			$pip.nextAll().not('.L').not('.A').attr('title', this.labels.B);
			//$pip.nextAll().addClass(this.classes.bashing);
		},

		isHealthy(elt) {
			return $(elt).hasClass(pips.marker);
		},

		marker(pip) {
			let {$elt:$pip} = this.resolve(pip);
			if ($pip.hasClass(this.classes.aggravated)) {
				return this.classes.aggravated;
			}
			if ($pip.hasClass(this.classes.lethal)) {
				return this.classes.lethal;
			}
			/*
			if (   $pip.hasClass(this.classes.bashing)
				|| ! $pip.hasClass(pips.marker))
			{
				return this.classes.bashing;
			}
			*/
			return ' ';
		},

		markDamaged($pips, state) {
			$pips.removeClass(this.classes.all)
				.addClass(state)
				.attr('title', this.labels[state || 'B']);
		},

		markUndamaged($pips, state) {
			$pips.removeClass(this.classes.all)
				.removeAttr('title')
		},

		nextState(iState) {
			return this.classes.sequence[this.nextStateIndex(iState)];
		},

		nextStateIndex(iState) {
			return (iState + 1) % this.classes.sequence.length;
		},

		normalizeDetails(details) {
			if ('symbol' == this.classifyDetails(details)) {
				return details.replace(/[*\/]/, m => this.classes[m]);
			}
			return details;
		},

		/**
		 * Reorder marks and shorten a damage detail string.
		 *
		 * If the length of the string already fits into the given length, nothing is done. Otherwise, fits a damage detail string into the given length by removing non-marks. Also {@link this.rerank reranks} the marks.
		 *
		 * @param {DamageMarks} details - detailed damage types for pips
		 * @param {LengthChange} change - changes to length
		 *
		 * @returns {string}
		 */
		realign(details, {length, delta}) {
			if (delta < 0) {
				return this.rerank(details).padStart(length);
			} else {
				return this.normalizeDetails(details);
			}
		},

		/**
		 * Resize a string of damage markers, placing marks at end.
		 *
		 * Fits a damage detail string into the given length by shifting marks to the end of the string and padding (or trimming, as necessary) with blanks.
		 *
		 * @param {DamageMarks} details - detailed damage types for pips
		 * @param {LengthChange} change - changes to length
		 *
		 * @returns {string}
		 */
		repack(details, {length, delta}) {
			return details.replace(/ +/g, '').padStart(length);
		},

		/**
		 * Reorder marks by severity, placing more severe marks later.
		 *
		 * Also {@link this.normalizeDetails converts} marks to letter notation.
		 *
		 * @param {DamageMarks} details - detailed damage types for pips
		 *
		 * @returns {string}
		 */
		rerank(details) {
			details = this.normalizeDetails(details);
			let nMark = {'L': 0, 'A': 0};
			for (let m of details) {
				++nMark[m];
			}
			delete nMark.B;
			details = '';
			for (let [mark, nMarks] of Object.entries(nMark)) {
				details += mark.repeat(nMarks);
			}
			return details;
		},

		/**
		 * Move damage markers to fit if a pipped field shrinks.
		 *
		 * @param {LengthChange} change
		 */
		tamp(change) {
			const details = dsf.value(this.$details),
				  newDetails = this.compact(details, change);
			if (newDetails !== details) {
				this.details = newDetails;
			}
		},

		_setDetails(details, $pips, classer) {
			//classer ??= x => x;
			classer || (classer = x => x);
			let collisions = [], iCollisions = [], collision = false;
			for (let i = 0; i < details.length; ++i) {
				let mark = classer(details[i]);
				if (! pips.isMarked($pips[i+1])) { //  ' ' !== details[i]
					this.markDamaged($pips.eq(i+1), mark);
					collisions[i] = ' ';
				} else if (' ' != mark) {
					collision = true;
					collisions[i] = mark;
					iCollisions.push(i);
				}
			}
			if (collision) {
				console.warn(`Some undamaged pips are marked for damage: ${iCollisions}; '${collisions.join("")}'. Ignoring damage markers.`);
			}
			dsf.update(this.$details[0], details, 'health_details');
		},

		setClassDetails(details, $pips) {
			this._setDetails(details, $pips, x => x);
		},

		setSymbolDetails(details, $pips) {
			this._setDetails(details, $pips, x => this.classes[x]);
		},

		shiftState(pip) {
			let {$elt:$pip} = this.resolve(pip),
				[iState, state] = this.state($pip);
			if (iState > -1) {
				$pip.removeClass(state);
				state = this.nextState(iState);
			} else {
				// No recognized state, which can happen for ' '.
				state = this.classes.sequence[0];
			}
			this.markDamaged($pip, state);
			return state;
		},

		state(pip) {
			let {$elt:$pip} = this.resolve(pip);
			// reverse order to give later states priority
			let iState = this.classes.sequence.findLastIndex(state => $pip.hasClass(state));
			if (iState > -1) {
				return [iState, this.classes.sequence[iState]];
			}
			return [-1];
			for (let iState = this.classes.sequence.length-1; iState >= 0; --iState) {
				let state = this.classes.sequence[iState];
				if ($pip.hasClass(state)) {
					return [iState, state];
				}
			}
			return [-1];
		},

		stateClass(pip) {
			return this.state(pip)[1];
		},
		stateIndex(pip) {
			return this.state(pip)[0];
		},
	};
	mixIn(health, resolver);
