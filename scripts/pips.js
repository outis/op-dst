	/* TODO: 
	 * + don't demi-ize UDF size DSFs.
	 */
	/*** 
	 * Pipped fields 
	 *
	 * @requires dsf, 
	 */
	let pips = globals.pips = {
		/* DST event handlers */
		init() {
			this.clicker = this.clicked.bind(this);
			this.clickerInLimit = this.clickedInLimit.bind(this);
			this.demi.init();
		},
		
		postLoad(opts, $context) {
			this.$context = $context;
			this.demi.postLoad(opts, $context);
			// use delegate, as pipped fields likely haven't been pippified yet
			//this.$context.on('click', '.pips.current > span', this.clickerInLimit);
			this.$context.on('click', '.pips.current > span', this.clicker);

			for (let fn of this.postLoad.queue) {
				fn();
			}
			this.postLoad.done = true;
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
			let $kids = $elt.children();
			if (delta > 0) {
				for (let i = 0; i < delta; ++i) {
					$elt.append($(`<span></span>`));				
				}
				// TODO: handle demi pips
				this.mark($elt, this.value($elt));
			} else if (delta < 0) {
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
			//$elt.children(':first-child').text('╳');
		},

		/* Mark pips as being "blocked" off. */
		block($elt, value) {
			value = +value;
			let $pips = $elt.find('span');
			$pips.slice(1, value+1).removeClass('D');
			$pips.slice(value+1).addClass('D');
		},

		/* Mark current pips beyond permanent pips as "blocked". */
		blockCurr(name, nPip) {
			let matches = name.match(/perm_(?<curr>.*)/);
			if (matches) {
				let curr = matches.groups.curr;
				this.block(this.$context.find(`.dsf_curr_${curr}`), nPip);
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
			} else {
				this.mark($elt.find('.pips'), 0);
			}
		},

		clicked(evt) {
			if (this.demi.is(evt.target)) {
				this.demi.clicked(evt);
			} else {
				let nPip = this.countPips(evt.target);
			
				this.setPips(evt.target, nPip);
			}
		},

		clickedInLimit(evt) {
			let name = dsf.name(evt.target.parentNode),
				maxPips = dsf.lookup(`perm_${name}`, 10),
				nPip = Math.min(this.countPips(evt.target), maxPips);
			
			this.setPips(evt.target, nPip);
		},
		
		count(elt, dflt) {
			let nPips = +elt.dataset.pips || +dflt || 5,
				name = dsf.name(elt),
				extra = dsf.linked.extra(name),
				nExtra = 0;
			if (extra) {
				nExtra = + dsf.value(extra);
			}
			return nPips + nExtra;
		},

		countPips: nodeIndex,

		demi: {
			init() {
				this.clicker = this.clicked.bind(this);
			},

			postLoad(opts, $context) {},
			
			assemble($elt) {
				let nPips = 2 * pips.count($elt[0]);
				for (let i = 0; i <= nPips; ++i) {
					$elt.append($(`<span></span>`));				
				}
				//$elt.children(':first-child').text('╳');
			},

			clicked(evt) {
				let {chirality, i} = this.locate(evt.target);
				
				this.setPips(evt.target, chirality, i);
			},
			
			is(elt) {
				return $(elt).closest('.demi').length;
			},

			locate(pip) {
				let nPip = pips.countPips(pip);
				if (nPip > 0) {
					if (nPip % 2) {
						return {chirality: 'left', i: Math.ceil(nPip / 2)};
					} else {
						return {chirality: 'right', i: Math.ceil(nPip / 2)};
					}
				}
				return {i: nPip};
			},

			mark($elt, chirality, value) {
				value = +value;
				let $pips = $elt.find(`span`).slice(1);
				switch (chirality) {
				case 'left':
					$pips = $pips.even();
					break;
				case 'right':
					$pips = $pips.odd();
					break;
				}

				$pips.slice(0, value).addClass('X');
				$pips.slice(value).removeClass('X');
			},

			parse(value) {
				if ('string' == typeof(value)) {
					let values = value.match(/(\d+) *\/ *(\d+)/),
						_, left, right;
					if (values) {
						[_, left, right] = values;
					} else if ((values = value.match(/\d+/))) {
						left = values[0];
						right = values[0];
					} else {
						debugger;
					}
					value = {left, right, value};
				} else if ('left' in value || 'right' in value) {
					value.value = `${value.left || 0} / ${value.right || 0}`;
				} else if ('value' in value) {
					// shouldn't be reached with current usage
					return this.parse(value.value);
				}
				return value;
			},
			
			pippify($elt, {name, value=0}={}) {
				// parses string & sets field value
				value = this.value($elt, value);
				this.assemble($elt);
				this.mark($elt, 'left', value.left);
				this.mark($elt, 'right', value.right);
			},
			
			reassemble($elt) {
				let nPips = 2 * pips.count($elt[0]),
					nKids = $(elt).children().length,
					delta = nPips - nKids + 1; // 1 for clear box
				pips.adjust($elt, delta);
				//$elt.children(':first-child').text('╳');
			},
			
			setPips(eltPip, chirality, nPip) {
				let eltField = eltPip.parentNode,
					$field = $(eltField),
					name = dsf.name(eltField),
					// get the value
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
			
			value(field, value) {
				if (field instanceof $) {
					field = field[0];
				}
				if (is_undefined(value)) {
					//value = {left: 0, right: 0, value: '0 / 0'};
				} else if (value) {
					value = this.parse(value);
					dsf.update(field, name, value.value);
					$.extend(field.dataset, value);
				} else if (! ('left' in field.dataset)) {
					$.extend(field.dataset, this.parse(field.dataset.value));
				}
				return field.dataset;
			},

			zero(value) {
				value.left = value.right = 0;
				value.value = '0/0';
				return value;
			},
		},

		is(elt, name, value) {
			let $elt = $(elt);
			return ! $elt.parent('label').length
				&& ! $elt.hasClass('hidden')//$elt.closest('.hidden').length
				&& ! $elt.closest('.nopips').length
				&& (   $elt.closest('.pips').length
					|| (is_kind(pippedKinds, elt) && ! is_flag(elt, name, value)));
		},
		
		mark($elt, value) {
			value = +value;
			let $pips = $elt.find('span');
			$pips.slice(1, value+1).addClass('X');
			$pips.slice(value+1).removeClass('X');
		},

		pippify($elt, {name, value=0}={}) {
			name ||= dsf.name($elt[0]);
			// .readonly to disable DSF framework's click listener & field editor
			$elt.addClass('pips readonly');
			if (this.demi.is($elt)) {
				this.demi.pippify($elt, {name, value});
				return;
			}
			value = +value;
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

		setKinds: setPippedKinds,

		setPips(eltPip, nPip) {
			let eltField = eltPip.parentNode,
				$field = $(eltField),
				name = dsf.name(eltField);
			
			dsf.update(eltField, name, nPip);
			this.mark($field, nPip);
			
			this.blockCurr(name, nPip);
		},

		start() {
			this.$context.find('input.dsf').prop('disabled', false);
			/* delegated handler, to catch UDFs */
			this.$context.find('.mll_sheet')
				.addClass('editing')
				.on('click', '.pips:not(.current) > span', this.clicker);

			this.demi.start();
		},

		stop() {
			this.$context.find('.mll_sheet')
				.off('click', '.pips:not(.current) > span', this.clicker)
				.removeClass('editing');
			this.$context.find('input.dsf').prop('disabled', true);
		},

		unpippify($elt, {name, value=0}={}) {
			//$elt.text($elt.data('value'));
			value ||= field.value($elt[0], name) || $elt.find('.X').length;
			$elt.find('span').remove();
			$elt.text(value);
		},

		value(elt) {
			if (elt instanceof $) {
				elt = elt[0];
			}
			return +field.value(elt) || 0;
		},
	};
	pips.postLoad.queue = [];
