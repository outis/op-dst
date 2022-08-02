	/*** 
	 * Pipped fields 
	 *
	 * TODO: support different damage types for corpus: bashing (/), lethal (x), aggravated (*)
	 *
	 * @requires dsf, 
	 */
	let pips = globals.pips = {
		reDemi: /(?<left>(?<lmask>0x)?[\dA-F]+) *\/ *(?<right>(?<rmask>0x)?[\dA-F]+)/i,
		marker: 'X',

		/* DST event handlers */
		init($context) {
			this.$context = $context;
			this.clicker = this.clicked.bind(this);
			this.clickerInLimit = this.clickedInLimit.bind(this);
			this.demi.init($context);
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
					//const val = $elt.text() || elt.dataset.value || $elt.data('value');
					$elt.text('');
					this.pippify($elt, {name, value});
				}
			}, this);

			this.demi.postLoad(opts, $context);
			// use delegate, as pipped fields likely haven't been pippified yet
			//this.$context.on('click', '.pips.current > span', this.clickerInLimit);
			this.$context.on('click', '.pips.current > span', this.clicker);

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
		adjust($elt, delta) {
			const $kids = $elt.children();
			if (delta > 0) {
				for (let i = 0; i < delta; ++i) {
					$elt.append($(`<span></span>`));
				}
				this.refresh($elt);
			} else if (delta < 0) {
				// don't remove 1st child
				delta = Math.max(delta, 1-$kids.length);
				$kids.slice($kids.length + delta).remove();
			}
		},

		assemble($elt) {
			let nPips = this.count($elt[0]);
			if (this.demi.is($elt)) {
				nPips *= 2;
			}
			for (let i = 0; i <= nPips; ++i) {
				$elt.append($(`<span></span>`));
			}
			$elt.children().first().attr('title', 'click to clear pips');
			//$elt.children(':first-child').text('╳');
		},

		/* Mark pips as being "blocked" off. */
		block($elt, value) {
			value = +value;
			const $pips = $elt.find('span');
			$pips.slice(1, value+1).removeClass('D');
			$pips.slice(value+1).addClass('D');
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
				if (this.demi.is($elt)) {
					this.demi.value($elt, this.demi.zero());
				} else {
					this.value($elt, 0);
				}
			} else {
				$elt.find('.pips').each((i, elt) => pips.clear(elt));
			}
		},

		clicked(evt) {
			if (this.demi.is(evt.target)) {
				this.demi.clicked(evt);
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

		countPips: nodeIndex,

		demi: {
			init($context) {
				this.clicker = this.clicked.bind(this);
			},

			postLoad(opts, $context) {},

			assemble($elt) {
				const nPips = 2 * pips.count($elt[0]);
				for (let i = 0; i <= nPips; ++i) {
					$elt.append($(`<span></span>`));
				}
				//$elt.children(':first-child').text('╳');
			},

			/**
			 * Calculate the value for the given chirality of pips.
			 *
			 * @param {HTMLElement} elt The DSF node.
			 */
			countPips(elt, chirality, marker) {
				marker ??= this.marker;
				let $pips = this.$pips(elt, chirality),
					mask = 0;
				// check whether there are any unmarked demi-pips preceding marked ones (skipping the "clear" box)
				if ($(elt).find(`* + :not(.${marker}) + * + .${marker}`)) {
					for (let i = 0, m = 1; i < $pips.length; ++i, m <<= 1) {
						if ($pips.eq(i).hasClass(marker)) {
							mask |= m;
						}
					}
					return '0x' + mask.toString(16);
				} else {
					const pips = $pips.toArray(),
						  // ordinal to cardinal
						  i = 1 + pips.findIndex(elt => pips.markRe(marker).test(elt.className));
					// i == 0: none found, thus all marked
					return i || pips.length;
				}
			},

			clicked(evt) {
				const {chirality, i} = this.locate(evt.target);

				if (    chirality
					&& (evt.altKey || evt.metaKey || evt.shiftKey || evt.button == 1))
				{
					this.toggle(evt.target, chirality, i);
				} else {
					this.setPips(evt.target, chirality, i);
				}
			},

			has(elt) {
				return this.is(elt);
			},

			is(elt) {
				return $(elt).closest('.demi').length;
			},

			locate(pip) {
				// note: pips.countPips, not pips.demi.countPips
				const nPip = pips.countPips(pip);
				if (nPip > 0) {
					if (nPip % 2) {
						return {chirality: 'left', i: Math.ceil(nPip / 2)};
					} else {
						return {chirality: 'right', i: Math.ceil(nPip / 2)};
					}
				}
				return {i: nPip};
			},

			mark($elt, chirality, value, marker) {
				marker ??= this.marker;
				const $pips = this.$pips($elt, chirality);

				if (/0x/.test(value)) {
					value = +value;
					for (let i = 0, m = 1; i < $pips.length; ++i, m <<= 1) {
						if (m & value) {
							$pips.eq(i).addClass(marker);
						} else {
							$pips.eq(i).removeClass(marker);
						}
					}
				} else {
					value = +value;

					$pips.slice(0, value).addClass(marker);
					$pips.slice(value).removeClass(marker);
				}
			},

			parse(value) {
				// TODO: handle numeric & undefined value
				switch (typeof(value)) {
				case 'string':
					let values = value.match(pips.reDemi),
						_, left, right;
					if (values) {
						({left, right} = values.groups);
					} else if ((values = value.match(/(?:\b|0x)?[\dA-F]+\b/i))) {
						left = values[0];
						right = values[0];
					} else {
						if (! /click to /i.test(value)) {
							//debugger;
						}
						// In case value is editing placeholder.
						value = +value || 0;
					}
					value = {left, right, value};
					break;

				case 'number':
					value = {value, left: value, right: value};
					break;

				case 'object':
					if ('left' in value || 'right' in value) {
						value.value = `${value.left || 0} / ${value.right || 0}`;
					} else if ('value' in value) {
						// shouldn't be reached with current usage
						return this.parse(value.value);
					}
					break;

				case 'undefined':
				default:
					value = {left: 0, right: 0, value: 0};
					break;
				}
				return value;
			},

			pippify($elt, {name, value=0}={}) {
				// parses string & sets field value
				value = this.value($elt, value);
				this.assemble($elt);
				this.refresh($elt, value);
			},

			$pips(elt, chirality) {
				let $pips = $(elt).find('span').slice(1);
				switch (chirality) {
				case 'left':
					$pips = $pips.even();
					break;
				case 'right':
					$pips = $pips.odd();
					break;
				default: // all $pips
				}
				return $pips;
			},

			reassemble($elt) {
				const nPips = 2 * pips.count($elt[0]),
					  nKids = $(elt).children().length,
					  delta = nPips - nKids + 1; // 1 for clear box
				pips.adjust($elt, delta);
				//$elt.children(':first-child').text('╳');
			},

			/**
			 * Calculate & set the value for the given chiral pips.
			 *
			 * @param {HTMLElement} elt The DSF node.
			 */
			recalc(elt, chirality) {
				const val = this.value(elt);
				val[chirality] = this.countPips(elt, chirality);
				this.value(elt, val);
			},

			/**
			 * Update marked pips.
			 */
			refresh($elt, value) {
				value ||= this.value($elt);
				this.mark($elt, 'left', value.left);
				this.mark($elt, 'right', value.right);
			},

			setPips(eltPip, chirality, nPip) {
				const eltField = eltPip.parentNode,
					  $eltField = $(eltField),
					  val = this.value(eltField);

				if (chirality) {
					val[chirality] = nPip;
					// ensures recalculation
					delete val.value;
				} else {
					// no chirality means 1st child (clear box) was clicked
					this.zero(val);
				}
				// set the value
				this.value(eltField, val);
				this.mark($eltField, chirality, nPip);
			},

			start() {
			},

			toggle(eltPip, chirality, iPip, marker) {
				marker ??= this.marker;
				let $eltPip = $(eltPip);
				if ($eltPip.hasClass(marker)) {
					$eltPip.removeClass(marker);
				} else {
					$eltPip.addClass(marker);
				}

				this.recalc(eltPip.parentNode, chirality);
			},

			value(field, value) {
				if (field instanceof $) {
					field = field[0];
				}
				if (is_undefined(value)) {
					//value = {left: 0, right: 0, value: '0 / 0'};
				} else if (value || 0 == value) { // also handles '' == value
					value = this.parse(value);
					dsf.update(field, name, value.value);
					Object.assign(field.dataset, value);
				} else if (! ('left' in field.dataset)) {
					Object.assign(field.dataset, this.parse(field.dataset.value));
				}
				return field.dataset;
			},

			zero(value={}) {
				value.left = value.right = 0;
				value.value = '0/0';
				return value;
			},
		},

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

		mark($elt, value, marker) {
			marker ??= this.marker;
			value = +value;
			let $pips = $elt.find('span');
			$pips.slice(1, value+1).addClass(marker);
			$pips.slice(value+1).removeClass(marker);
		},

		markRe: memoize(function (marker='X') {
			return new RegExp(`\b${marker}\b`);
		}),

		pippify($elt, {name, value=0}={}) {
			if ($elt instanceof $) {
				if ($elt.length > 1) {
					return $elt.each((i, elt) => this.pippify(elt));
				}
			} else {
				$elt = $($elt);
			}
			name ||= dsf.name($elt[0]);
			// .readonly to disable DSF framework's click listener & field editor
			$elt.addClass('pips readonly');
			if (this.demi.is($elt)) {
				this.demi.pippify($elt, {name, value});
				return;
			}
			var pips;
			if (value) {
				[value, pips] = value.toString().split('/', 2);
				value = +value;
				if (+pips) {
					$elt[0].dataset.pips = +pips;
				}
			}
			this.assemble($elt);
			this.mark($elt, value);

			if (name) {
				this.ready(() => this.blockCurr(name, value));
			}
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
			if (this.demi.is($elt)) {
				nPips *= 2;
			}
			delta = nPips - nKids + 1; // 1 for clear box
			this.adjust($elt, delta);
		},

		refresh($elt) {
			if (this.demi.is($elt)) {
				this.demi.refresh($elt);
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
			dsf.update(eltField, name, value);
			this.mark($field, nPip);

			this.blockCurr(name, nPip);
		},

		start() {
			this.$context.find('input.dsf').prop('disabled', false);
			/* delegated handler, to catch UDFs */
			this.$context.find('.mll_sheet')
				.on('click', '.pips:not(.current) > span', this.clicker);

			this.demi.start();
		},

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
			value ||= dsf.value($elt) || $elt.find('.' + marker).length;
			$elt.empty();
			$elt.text(value);
		},

		value(elt, val) {
			if (elt instanceof $) {
				elt = elt[0];
			}
			if (this.demi.is(elt)) {
				return this.demi.value(elt, val);
			}
			if (val) {
				
			}
			return +dsf.value(elt) || 0;
		},
	};
	pips.postLoad.queue = [];
