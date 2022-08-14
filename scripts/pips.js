	/***
	 * Pipped fields
	 */
	let pips = globals.pips = {
		reDemi: /(?<left>(?<lmask>0x)?[\dA-F]+) *\/ *(?<right>(?<rmask>0x)?[\dA-F]+)/i,
		marker: 'X',
		blocked: 'D',

		/* DST event handlers */
		init($context) {
			this.$context = $context;
			this.clicker = this.clicked.bind(this);
			this.clickerInLimit = this.clickedInLimit.bind(this);
		},

		postLoad(opts, $context) {
			module.waitFor('dsf');
			dsf.each(function (elt, $elt, name, value) {
				value = dsf.override(name, value)
				if ($elt.closest('.equipment').length) {
					//debugger;
				}
				if (   ! is_flag(elt, name, value)
					&& this.is(elt, name, value)
				) {
					//const val = $elt.text() ?? elt.dataset.value ?? $elt.data('value');
					$elt.text('');
					this.pippify($elt, {name, value});
				}
			}, this);

			if (authorize.can_edit()) {
				// use delegate, as pipped fields likely haven't been pippified yet
				//this.$context.on('click', '.pips.current > span', this.clickerInLimit);
				this.$context.on('click', '.pips.current > span', this.clicker);
			}

			for (const fn of this.postLoad.queue) {
				fn();
			}
			this.postLoad.queue = [];
			this.postLoad.done = true;
		},

		preSave() {
			/* convert back to numeric fields */
			dsf.each(function (elt, $elt, name, value) {
				if (pips.is(elt, name, value)) {
					pips.unpippify($elt, {name, value});
				}
			});
		},

		/* */
		addKinds: addPippedKinds,

		/**
		 * Change the number of pips.
		 *
		 * Currently doesn't work for demi-pipped fields (not that there are any in practice that should be adjustable).
		 *
		 * @param {jQuery} $elt DSF containing pips.
		 * @param {int} delta Amount to change pips by.
		 */
		adjust($elt, delta, blocker) {
			const $kids = $elt.children();
			// -1 for clear box
			let length = $kids.length - 1;
			if (delta > 0) {
				length += delta;
				let attrs='';
				blocker ??= this.blocked;
				if (dsf.linked.isCurr(dsf.name($elt))) {
					attrs = ` class="${blocker}"`;
				}
				for (let i = 0; i < delta; ++i) {
					$elt.append($(`<span${attrs}></span>`));
				}
				this.refresh($elt);
			} else if (delta < 0) {
				// don't remove 1st child
				delta = Math.max(delta, -length);
				length += delta;
				// 1 for clear box
				$kids.slice(length + 1).remove();
			}
			$elt.trigger('adjust.pips', {length, delta});
		},

		assemble($elt) {
			let nPips = this.count($elt[0]);
			if (this.demi?.is($elt)) {
				nPips *= 2;
			}
			for (let i = 0; i <= nPips; ++i) {
				$elt.append($(`<span></span>`));
			}
			$elt.children().first().attr('title', 'click to clear pips');
			//$elt.children(':first-child').text('╳');
		},

		/* Mark pips as being "blocked" off. */
		block($elt, value, blocker) {
			blocker ??= this.blocked;
			value = +value;
			const $pips = $elt.find('span');
			$pips.slice(1, value+1).removeClass(blocker);
			$pips.slice(value+1).addClass(blocker);
		},

		/* Mark current pips beyond permanent pips as "blocked". */
		blockCurr(name, nPip) {
			const matches = name.match(/perm_(?<curr>.*)/);
			if (matches) {
				const curr = matches.groups.curr;
				this.block(dsf.$dsf(`curr_${curr}`), nPip);
			}
		},

		/* Remove all marks from pips. */
		clear(elt) {
			let $elt;
			if (elt instanceof $) {
				$elt = elt;
				elt = elt[0];
			} else {
				$elt = $(elt);
			}
			if ($elt.hasClass('pips')) {
				this.mark($elt, 0);
				if (this.demi?.is($elt)) {
					this.demi?.value($elt, this.demi?.zero());
				} else {
					this.value($elt, 0);
				}
			} else {
				$elt.find('.pips').each((i, elt) => pips.clear(elt));
			}
		},

		clicked(evt) {
			if (this.demi?.is(evt.target)) {
				this.demi?.clicked(evt);
			} else {
				this.fill(evt.target);
			}
		},

		clickedInLimit(evt) {
			const name = dsf.name(evt.target.parentNode),
				maxPips = dsf.lookup(`perm_${name}`, 10),
				nPip = Math.min(this.countPips(evt.target), maxPips);

			this.setPips(evt.target, nPip);
		},

		/**
		 * Determine how many pips (filled or unfilled) the given DSF element should have.
		 */
		count(elt, dflt) {
			const nPips = +elt.dataset.pips || +dflt || 5,
				  name = dsf.name(elt),
				  extra = dsf.linked.extra(name);
			let nExtra = 0;
			if (extra) {
				nExtra = + dsf.value(extra);
			}
			return nPips + nExtra;
		},

		/**
		 * Count pips up to the given pip.
		 *
		 * Differs from {@link demipips.countPips} in that this method takes a pip, the other a pipped DSF.
		 *
		 * @param {HTMLElement} pip - Pip to count to.
		 *
		 * @returns {number}
		 */
		countPips: nodeIndex,

		/**
		 * Fill pips up to an element, clear after.
		 *
		 * Distinguished from {@link this.mark()} and {@link this.setPips()} in that this method determines where to fill based upon the passed element.
		 */
		fill(elt) {
			const nPip = this.countPips(elt);
			this.setPips(elt, nPip);
		},

		has(elt) {
			let $elt = $(elt),
				closer = $elt.closer('.pips', '.nopips');

			return closer == '.pips'
				|| $elt.find('.pips').length
				|| (! closer && is_kind(pippedKinds, elt));
		},

		is(elt, name, value) {
			let $elt = $(elt),
				closer = $elt.closer('.pips', '.nopips');
			return closer != '.nopips'
				&& ! $elt.parent('label').length
				//&& ! $elt.closest('.hidden').length
				&& ! $elt.hasSomeClass('hidden', 'specialty', 'notes')
				&& ! /_(name|description|specialty|size)\b/.test($elt[0].className)
				&& (   closer == '.pips'
					|| (   is_kind(pippedKinds, elt)
						&& ! is_flag(elt, name, value)))
			;
		},

		/**
		 * Report whether the given pip is marked.
		 */
		isMarked(elt) {
			let $elt = $(elt);
			return $elt.hasClass(this.marker);
		},

		mark($elt, value, marker) {
			marker ??= this.marker;
			value = +value;
			let $pips = $elt.find('span');
			$pips.slice(1, value+1).addClass(marker);
			$pips.slice(value+1).removeClass(marker);
		},

		markRe: memoize(function (marker='X') {
			return new RegExp(`\\b${marker}\\b`);
		}),

		pippify($elt, {name, value=0}={}) {
			if ($elt instanceof $) {
				if ($elt.length > 1) {
					return $elt.each((i, elt) => this.pippify(elt));
				}
			} else {
				$elt = $($elt);
			}
			name ??= dsf.name($elt[0]);
			// .readonly to disable DSF framework's click listener & field editor
			$elt.addClass('pips readonly');
			if (this.demi?.is($elt)) {
				this.demi?.pippify($elt, {name, value});
				return;
			}
			var pips;
			if (value) {
				[value, pips] = value.toString().split('/', 2);
				value = +value;
				if (+pips) {
					$elt[0].dataset.pips = +pips;
				}
				// ensure value is stored in data attribute
				dsf.update($elt[0], value, name);
			}
			this.assemble($elt);
			this.mark($elt, value);

			if (name) {
				this.ready(() => this.blockCurr(name, value));
			}
		},

		/**
		 * Calculate the value for the given pipped DSF.
		 *
		 * @param {jQuery} $elt - pipped DSF
		 * @param {string} [marker=this.marker] - HTML class for filled pips
		 *
		 * @returns {number}
		 */
		rating($elt, marker) {
			if (this.demi?.is($elt)) {
				return this.demi?.rating($elt);
			}
			marker ??= this.marker;
			return $elt.find(`.${marker}`).length;
		},

		ready(fn) {
			if (this.postLoad.done) {
				fn.bind(this)();
			} else {
				this.postLoad.queue.push(fn.bind(this));
			}
		},

		/** alter the number of pips */
		reassemble($elt) {
			let nPips = this.count($elt[0]),
				nKids = $elt.children().length,
				delta;
			if (this.demi?.is($elt)) {
				nPips *= 2;
			}
			delta = nPips - nKids + 1; // 1 for clear box
			this.adjust($elt, delta);
		},

		refresh($elt) {
			if (this.demi?.is($elt)) {
				this.demi?.refresh($elt);
			} else {
				this.mark($elt, this.value($elt));
			}
		},

		setKinds: setPippedKinds,

		setPips(eltPip, nPip) {
			let eltField = eltPip.parentNode,
				$field = $(eltField),
				name = dsf.name(eltField),
				value = nPip,
				parts;

			// check for charge max
			if (   eltField.dataset.value
				&& (parts = eltField.dataset.value.match(/( *\/ *(?:0x[\dA-F]+|\d+))$/i)))
			{
				value = nPip + parts[1];
			}
			dsf.update(eltField, value, name);
			this.mark($field, nPip);

			this.blockCurr(name, nPip);
		},

		/**
		 * Enable editing.
		 */
		start() {
			this.$context.find('input.dsf').prop('disabled', false);
			/* delegated handler, to catch UDFs */
			this.$context.find('.mll_sheet')
				.on('click', '.pips:not(.current) > span', this.clicker);

			this.demi?.start();
		},

		/**
		 * Disable editing.
		 */
		stop() {
			this.$context.find('.mll_sheet')
				.off('click', '.pips:not(.current) > span', this.clicker);
			this.$context.find('input.dsf').prop('disabled', true);
		},

		toggle(eltPip, marker) {
			marker ??= this.marker;
			let $eltPip = $(eltPip);
			if ($eltPip.hasClass(marker)) {
				$eltPip.removeClass(marker);
			} else {
				$eltPip.addClass(marker);
			}
		},

		unpippify($elt, {value=0, marker}={}) {
			marker ??= this.marker;
			//$elt.text($elt.data('value'));
			value ??= dsf.value($elt) ?? $elt.find('.' + marker).length;
			$elt.empty();
			$elt.text(value);
		},

		value(elt, val) {
			if (elt instanceof $) {
				elt = elt[0];
			}
			if (this.demi?.is(elt)) {
				return this.demi?.value(elt, val);
			}
			if (val) {

			}
			return +dsf.value(elt) || 0;
		},
	};
	pips.postLoad.queue = [];
