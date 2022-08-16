	/**
	 * Bisected pips, used for Arcanoi in Wraith 20th
	 *
	 * Inserts itself as {@link pips.demi}. Without this module, `pips.demi` does nothing.
	 */
	const demipips = globals.demipips = {
		/**
		 * Serialized value for a demi-pipped DSF.
		 *
		 * Has the format 'v' or 'l / r', where 'l' represents the left demi-pips and 'r' the right. If 'l' and 'r' are the same, then only a single value is used ('v') with no '/' separator. Each is either a decimal number (which represents a count) or a hexadecimal number (which represtents a mask of which pips are filled).
		 *
		 * @typedef {string} DemiPip
		 */

		/* DSF event handlers */
		init($context) {
			//
			this.clicker = this.clicked.bind(this);
			this.marker = pips.marker;
			pips.demi = this;
			this.reDemi = pips.reDemi;
		},

		postLoad(opts, $context) {},

		/* */
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
		 * Differs from {@link pips.countPips} in that this method takes a pipped DSF, the other a pip.
		 *
		 * @param {HTMLElement} elt The DSF node.
		 *
		 * @returns {number}
		 */
		countPips(elt, chirality, marker) {
			//marker ??= this.marker;
			marker || (marker = this.marker);
			let $pips = this.$pips(elt, chirality),
				mask = 0;
			const reMark = pips.markRe(marker),
				  _pips = $pips.toArray();
			function marked(elt) {
				return reMark.test(elt.className);
			}
			// check whether there are any unmarked demi-pips preceding marked ones (skipping the "clear" box)
			if (_pips.slice(1).find(
				elt => marked(elt)
					&& ! marked(elt.previousElementSibling.previousElementSibling)))
			{
				for (let i = 0, m = 1; i < $pips.length; ++i, m <<= 1) {
					if ($pips.eq(i).hasClass(marker)) {
						mask |= m;
					}
				}
				return '0x' + mask.toString(16);
			} else {
				// ordinal to cardinal
				return 1 + _pips.findLastIndex(elt => reMark.test(elt.className));
			}
		},

		clicked(evt) {
			const {chirality, i} = this.locate(evt.target);

			if (   chirality
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
			//marker ??= this.marker;
			marker || (marker = this.marker);
			//marker ??= this.marker;
			marker || (marker = this.marker);
			const $pips = this.$pips($elt, chirality);

			if (/0x/.test(value)) {
				// can't convert value to number before hex test
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

		/**
		 * Returns a value representing the currently marked pips of <var>$elt</var>.
		 *
		 * Differs from the likes of {@link this.value}, {@link this.recalc} and {@link this.refresh} in that it doesn't change <var>$elt</var> and calculates the value by examining which pips are marked (rather than any stored value).
		 *
		 * @param {jQuery} $elt - demi-pipped DSF
		 * @param {string} [marker=this.marker] - HTML class for filled pips
		 *
		 * @returns {DemiPip}
		 */
		rating($elt, marker) {
			let left = this.countPips($elt, 'left', marker),
				right = this.countPips($elt, 'right', marker);
			return this.unparse(left, right);
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
			//value ??= this.value($elt);
			value || (value = this.value($elt));
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

		// hook called from pips.start(), in case pips.demi needs to perform any tasks when editing starts
		start() {
		},

		toggle(eltPip, chirality, iPip, marker) {
			//marker ??= this.marker;
			marker || (marker = this.marker);
			let $eltPip = $(eltPip);
			if ($eltPip.hasClass(marker)) {
				$eltPip.removeClass(marker);
			} else {
				$eltPip.addClass(marker);
			}

			this.recalc(eltPip.parentNode, chirality);
		},

		/**
		 * Returns a string encapsulating <var>left</var> & <var>right</var> pip values.
		 *
		 * Inverse of {@link this.parse}.
		 *
		 * @param {string|number} left Mask or count of left pips.
		 * @param {string|number} right Mask or count of right pips.
		 *
		 * @returns {DemiPip}
		 */
		unparse(left, right) {
			if (left == right) {
				return left;
			}
			return `${left} / ${right}`;
		},

		value(field, value) {
			if (field instanceof $) {
				field = field[0];
			}
			if (is_undefined(value)) {
				//value = {left: 0, right: 0, value: '0 / 0'};
			} else if (value || 0 == value) { // also handles '' == value
				value = this.parse(value);
				dsf.update(field, value.value, name);
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
	};
