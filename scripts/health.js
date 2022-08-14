	/**
	 * Extra functionality for health:
	 * + More extensive damage types.
	 *
	 * @mixes resolver
	 */
	var health = globals.health = {
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

			const details = dsf.override('health_details', dsa.data.health_details);
			if (details) {
				this.details = details;
			}
		},

		preSave() {
			dsf.value('health_details', this.details);
		},

		/* */

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

		_setDetails(details, $pips, classer) {
			classer ??= x => x;
			for (let i = 0; i < details.length; ++i) {
				if (! pips.isMarked($pips[i+1])) { //  ' ' !== details[i]
					this.markDamaged($pips.eq(i+1), classer(details[i]));
				}
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
