	/*** 
	 * User-defined
	 */
	const udfs = globals.udfs = {
		//
		itemNumberWidth: 2,
		// maximum number of items allowed in a UDF
		maxCount: 100,
		udfSel: '.udf',
		get $udfs() {
			if (! this._$udfs && this.$context) {
				// exclude UDFs outside of page elements so as to exclude compatibility fields
				//this._$udfs = this.$context.find('.page ' + this.udfSel);
				this._$udfs = this.$context.find(this.udfSel);
			}
			return this._$udfs;
		},

		/* DST event handlers */
		preLoad({slug}, $context) {
			module.tarryFor('compatibility');
			module.tarryFor('edition');

			this.slug = slug;
			this._createControls();
			this._subscribeListeners();

			this.createItems();
		},

		preSave() {
			udfs.reCountAll();
		},

		/* Update old versions */
		updaters: {
			'1': function (data) {
				//console.log('v1');
				let parts;
				for (let name in data) {
					parts = this.parseOld(name);
					if (parts) {
						this.renameField(data, name, parts);
					}
				}
			},
		},


		/** Determines whether the given field name uses an old format ({base}_{}_{i}). */
		parseOld(name) {
			const parts = name.match(/^(?:dsf_)?(?<base>(?:thorn|dark_passion|attribute)s?)(?:_(?<sub>\w+))?_(?<i>\d+)$/);
			return (parts /*??*/|| {}).groups;
		},

		renameField(data, name, {base, sub, i}) {
			const rename = {
				'label': 'name',
				'value': '',
			};
			base = words.pluralize(base.dromedaryCase());
			let updated = `dyn_${base}_${i}`;
			if (rename[sub]) {
				sub = rename[sub];
			}
			if (sub) {
				updated += '_' + sub;
			}
			dsa.rename(name, updated, {data});
		},

		/*  */
		/**
		 */
		_appendItem(eltList, item) {
			$(eltList).append(item);
			$(eltList).trigger('add.mll.udfs', item);
		},

		/**
		 * Creates list & item controls.
		 */
		_createControls() {
			this.$listControls = $('<div class="controls"><button class="add" title="add"></button></div>');
			// note: can't use button for "draggable" handle, as jQueryUI doesn't recognize it (click overrides drag).
			this.$itemControls = $('<span class="controls"><span class="del" title="delete"></span><span class="drag" title="click or drag to move"></span></span>');
		},

		/**
		 * Ensures that a UDF has a DSF to hold its size.
		 *
		 * @param {HTMLElement} udf
		 * @param {Object} [options]
		 * @param {base} [options.base] Base portion of `udf`'s name.
		 * @param {jQuery} [options.$udf] `$(udf)`. If not provided, created from `udf`.
		 */
		_createSizeDsf(udf, {base, $udf}={}) {
			this.$size(udf, {base, $udf});
		},

		_createSizeDsfs() {
			this.$udfs.each(function (i, elt) {
				udfs._createSizeDsf(elt);
			});
		},

		_subscribeListeners() {
			$(document).on('click', '.udf + .controls button', function (evt) {
				// prevent form submission
				evt.preventDefault();
				return false;
			});

			// for list-based UDFs
			$(document).on('click', '.udf + .controls .add', function (evt) {
				udfs.add(udfs.udfFor(evt.target));
				// prevent form submission.
				// For some reason, generic button.click above doesn't prevent
				evt.preventDefault();
				return false;
			});

			// for table-based UDFs
			$(document).on('click', '.udf + * .controls .add', function (evt) {
				udfs.add(udfs.udfFor(evt.target));
				// prevent form submission.
				evt.preventDefault();
				return false;
			});

			$(document).on('click', '.udf .del', function (evt) {
				// ignore click if currently taking another action
				if (! $(evt.target).closest(udfs.udfSel).hasClass('busy')) {
					let $item = $(evt.target).closest('.udf > *');
					switch ($item) {
					case 'dd':
						udfs.del($item.prev('dt'));
						break;
					case 'dt':
						udfs.del($item.next('dd'));
						break;
					}
					udfs.del($item);
				}
				// prevent form submission.
				evt.preventDefault();
				return false;
			});
		},

		/**
		 * Create & add a new item to a list, setting behavior.
		 *
		 * @param {HTMLElement} eltList Dynamic list to add to.
		 */
		add(eltList) {
			let eltItem, $dsfs, $toPip;
			eltItem = this.newItem(eltList);
			this._appendItem(eltList, eltItem);
			if (   (pips.has(eltItem))
				&& ($dsfs = $(eltItem).find('span.dsf')).length >= 2)
			{
				$toPip = $dsfs.filter('.pips');
				if (! $toPip.length) {
					$toPip = $dsfs.last();
				}
				//$toPip.each((i, elt) => pips.pippify($elt));
				pips.pippify($toPip);
			}

			//this.renumberItem(eltItem, iItem);
			// handled during dataPreSave:
			//this.reCount(eltList)
			reorder.makeDraggable(eltItem);

			// make new fields editable
			dsf.editable(eltItem);
		},

		addDsa(names, values, base) {
			let result = dsa.add(...arguments);
			if (result.base) {
				// TODO? feature-support different index bases (0- vs. 1-)
				udfs.updateSize(result.base, result.i);
			}
		},

		addItemControls(eltItem, $placeholder) {
			let $controls = udfs.$itemControls.clone();
			//$placeholder ??= $(eltItem).find('.controls');
			$placeholder || ($placeholder = $(eltItem).find('.controls'));
			if ($placeholder.length) {
				$placeholder.replaceWith($controls);
			} else switch (eltItem.tagName) {
			case 'TR':
				$(eltItem).append(
					$('<td></td>')
						.append($controls)
				);
				break;
			default:
				$(eltItem).append($controls);
				break;
			}
		},

		addListControls(eltList, $placeholder) {
			let $controls = udfs.$listControls.clone();
			//$placeholder ??= $(eltList).find('+ .controls');
			$placeholder || ($placeholder = $(eltList).find('+ .controls'));
			if ($placeholder.length) {
				$placeholder.replaceWith($controls);
			} else switch (eltList.tagName) {
			case 'TBODY':
				$(eltList).after(
					$('<tfoot></tfoot>')
						.append(
							$('<tr></tr>')
								.append($('<td></td>')
										.append($controls)))
				);
				break;
			default:
				$(eltList).after($controls);
				break;
			}
		},

		/**
		 * Return the base portion of a UDF name, given a list node.
		 */
		base(eltList) {
			return klass.param(eltList, 'list')
				/*??*/|| eltList.dataset.base
				/*??*/|| eltList.dataset.name
				/*??*/|| dsf.sectionName(eltList)
			;
		},

		/**
		 * Return a list of the base field name for all UDFs.
		 */
		bases() {
			return this.$udfs
				.parent()
				.closest('[class]')
				.toArray()
				.map(elt => elt.className.replace(/ .*/, ''));
		},

		baseToRe: memoize(function (base) {
			return new RegExp(`^(?:dsf_)?dyn_${base}(?:_|$)`);
		}),

		/**
		 * Close any gaps in a sequence of UDF field templates by moving existing fields to lower indices.
		 *
		 * Scans existing data, stopping when certain conditions are met. There are various types of stop conditons & ways stop conditions are calculated:
		 * + by gap: stop when consecutive nonexistent fields exceeds a threshhold (the "gap")
		 * + by index: stop at the first nonexistent field of index higher than provided
		 * + by size: if there's a size field for the given base, that is set as the stop index, overriding any provided stop condition
		 *
		 * @param {string} base UDF base; used to look up UDF size (if exists).
		 * @param {} [tpls] Templates for fields to rename. If not provided,  {@this.}.
		 * @param {object | number} [stop] Stop conditions. A number is interpreted as a stop-by-index
		 * @param {number} [stop.gap] Stop after consecutive nonexistent fields exceeds this gap.
		 * @param {number} [stop.index] Stop at the first nonexistent field after this index.
		 */
		compact(base, tpls, stop={gap:5}) {
			let sizeName = this.sizeName(base);

			if (! tpls) {
				tpls = this.keyedFieldsFor(base);
				if (! tpls.length) {
					tpls = {
						name: `dyn_${base}_{i:02}_name`,
						value: `dyn_${base}_{i:02}`,
					};
				}
			}

			if (dsa.exists(sizeName) && is_numeric(dsa.data[sizeName])) {
				stop = dsa.data[sizeName]
			}

			let size = dsa.compact(tpls, stop);

			if (dsa.exists(sizeName) && is_numeric(size)) {
				dsa.data[sizeName] = size;
			}
			return size;
		},

		countUdfItems(data) {
			//data ??= dsa.data;
			data || (data = dsa.data);
			let counts = {},
				uncounted = {},
				scan = false;
			for (let udf of this.$udfs) {
				let base = this.base(udf),
					name = this.sizeName(base);
				if (dsa.exists(name, data) && is_real(data[name])) {
					counts[base] = data[name];
				} else {
					// in case it's non-numeric, delete to scan instead
					delete data[name];
					uncounted[base] = base;
					scan = true;
				}
			};

			if (scan) {
				console.log('Scanning data to determine size of UDFs without a stored size field:', Object.values(uncounted));
				// some fields don't have counts; scan for specific fields
				for (let base in uncounted) {
					let tpl = `dyn_${base}_{i:02}`,
						name, i;
					for (i = 1; i < this.maxCount; ++i) {
						name = klass.eval(tpl, {i});
						if (! (   dsa.exists(name, data)
							   || dsa.exists(name + '_name', data)))
						{
							break;
						}
					}
					if ((counts[base] = i-1)) {
						delete uncounted[base];
					}
				}
			}
			if (Object.keys(uncounted).length) {
				// some fields still don't have counts; scan all data
				for (let name of Object.keys(data)) {
					let {base, i} = this.parseName(name) /*??*/|| {};
					if (base && i) { // name is a UDF name
						/* don't exclude UDFs with size fields (i.e. those not in `uncounted`; check their counts */
						if (base in counts) {
							counts[base] = Math.max(counts[base], +i);
						} else {
							counts[base] = +i;
						}
					}
				}
			}

			return counts;
		},

		/**
		 * Add multiple (empty) items to a list.
		 *
		 * @param {HTMLElement} eltList Dynamic list to add to.
		 * @param {number} nItems Number of items to add.
		 * @param {Object} [options]
		 * @param {string} [options.base] Base name of dynamic list.
		 */
		createItemsFor(eltList, nItems, {base}) {
			//base ??= udfs.base(eltList);
			base || (base = udfs.base(eltList));
			let $eltList = $(eltList),
				$scion = this.newItem(eltList, {base}),
				$clone;
			this._createSizeDsf(eltList, {base, $udf: $eltList});
			for (let i = 1; i <= nItems; ++i) {
				$clone = $scion.clone();
				this.renumberItem($clone, i);
				this._appendItem($eltList, $clone);
			}
		},

		/**
		 * Create dynamic list items to store dynamic DSFs.
		 */
		createItems() {
			let udfCounts = this.countUdfItems();
			for (let udf of this.$udfs) {
				let base = udfs.base(udf);
				udfs.createItemsFor(udf, udfCounts[base], {base});
			}
		},

		/**
		 * Remove an item from a dynamic list.
		 */
		del(item) {
			let eltNext = $(item).next()[0];
			$(item).remove();
			if (eltNext) {
				this.renumberItems(eltNext);
			}
		},

		/**
		 * Returns the base portion of a UDF name, given a DSF name & field info.
		 */
		/*
		dsfBase: memoize(function (name, fieldInfo) {
			let {base} = this.udfField(name, fieldInfo) ?? {};
			return base;
		}),
		*/

		/**
		 * Call a function for each UDF element in the sheet.
		 */
		each(fn, self) {
			if (self) {
				fn = fn.bind(self);
			}
			this.$udfs.each(function (i, elt) {
				fn.bind(this)(elt, i);
			});
		},

		eachEntry(udf, fn) {
			function entry(item) {
				return fn(this.entry(item));
			}
			this.eachItem(udf, entry.bind(this));
		},

		eachItem(udf, fn) {
			// TODO? feature-support templates/items without a unique root
			let {$elt} = this.resolve(udf);
			$elt.children().each(fn);
		},

		entry(item) {
			let entry = dsf.$dsfs(item)
				.toArray()
				.map(elt => ({
					name: dsf.name(elt),
					value: dsf.value(elt),
				}));
			return entry.reduce(function (accum, b) {
				let key = udfs.key(b.name);
				accum.names[key] = b.name;
				accum.values[key] = b.value;
				return accum;
			}, {names:{}, values:{}})
		},

		*entries(udf) {
			for (let item of this.items(udf)) {
				yield this.entry(item);
			};
		},

		exists(name, $context) {
			if (name) {
				return ($context /*??*/|| this.$context).find(`.${name} .udf`).length;
			}
		},

		/**
		 * Field information for UDFs on this sheet.
		 *
		 * Field info has the structure:
		 *     {
		 *     	shorthand: {
		 *     		short: [base],
		 *    	},
		 *     	fields: {
		 *     		base: [templates],
		 *     	}
		 *     }
		 *
		 * base: UDF base name.
		 * short: short name for UDF; if UDF base name is compound (i.e. has underscores; e.g. 'some_thing'), the short name is the first component (e.g. 'some'). This eases finding the UDF for a DSF.
		 * templates: the classname templates for DSFs in a UDF item template, without the 'dsf_' prefix.
		 */
		/* Not currently used */
		fieldInfo() {
			// TODO: refactor-find a better name
			let fieldInfo = new ShorthandDict({
				shorthand: this.shorthand,
				matches(full, key) {
					return klass.matchesAny(this.full[full], key);
				},
				value({full, match}) {
					return {base: full, field: match};
				},
			});

			this.$udfs.each(function (i, udf) {
				let base = udfs.base(udf),
					$udf = $(udf),
					parts, short;
				fieldInfo[base] = udfs.fieldsFor(udf, {base});
			});

			// save results for future calls
			this.fieldInfo = function () {
				return fieldInfo;
			};

			return fieldInfo;
		},
		/**/

		/**
		 * Extract names of fields for a given UDF.
		 *
		 * @param {HTMLElement|string|$} eltList Dynamic list.
		 * @param {Object} [kwargs]
		 * @param {string} [kwargs.base] Base name of dynamic list.
		 * @param {HTMLElement} [kwargs.tpl] Template for an item of `eltList`.
		 *
		 * @returns {[string]} list of DSF names (w/o 'dsf_' prefix)
		 */
		fieldsFor(eltList, {base, tpl, $tpl}={}) {
			let resolved = this.resolve(eltList);
			eltList = resolved.elt;
			//base ??= resolved.base;
			base || (base = resolved.base);
			if (base in this.fieldsFor) { // memoize result for base
				return this.fieldsFor[base];
			}
			// tpl may be a template node, or an actual node from eltList
			//$tpl ??= tpl ? $(tpl) : this.$templateItem(eltList);
			$tpl || ($tpl = tpl ? $(tpl) : this.$templateItem(eltList));
			let env = {base, name: base},
				$dsfs = dsf.$dsfs($tpl),
				// note: dsf.name removes 'dsf_' prefix
				names = $dsfs.toArray().map(elt => klass.eval(dsf.name(elt), env).replace(/\d+$/, '{i:02}'));
			this.fieldsFor[base] = names;
			return names;
		},

		/**
		 * The 1-based index of a UDF in the parent collection.
		 *
		 * @param {string} name
		 * @param {string} the template for the UDF
		 */
		indexOf(name, tpl) {
			let parts;
			if (tpl && (vars = klass.extract(tpl, name)) && 'i' in vars) {
				return +vars.i;
			} else if ((parts = name.match(/\d+$/))) {
				return +parts[0];
			}
		},

		/**
		 * Get all UDFs from stored DSFs.
		 * 
		 * Turns a flattened list (i.e. the DSFs stored as key-values in `dynamic_sheet_attrs`) into nested. For example, converts {'base_key_01':value, 'base_key_02':value, } to:
		 *     {
		 *     	base: [{key:value}, {key:value}],
		 *     	...
		 *     }
		 */
		/* Not currently used
		inflate(dsfs=null) {
			let fieldInfo = this.fieldInfo(),
				base,
				data = {};
			dsfs ??= window.dynamic_sheet_attrs;
			for (let [name, value] of Object.entries(dsfs)) {
				if ((base = this.dsfBase(name, fieldInfo))) {
					// name is a UDF name
					let {key, i} = this.parseName(name, base) ?? {};
					data[udfField.base] ??= [];
					data[udfField.base][+i] ??= {};
					data[udfField.base][+i][key ?? ''] = value;
				}
			}
			return data;
		},
		*/

		/**
		 * Answers whether `name` is a dynamic DSF name.
		 */
		isName(name) {
			return /^(dsf_)?dyn_/.test(name);
		},

		isTemplate(name) {
			return /^(dsf_)?dyn_.*\{.*\}/.test(name);
		},

		*items(udf) {
			// TODO? feature-support templates/items without a unique root
			let {$elt} = this.resolve(udf);
			yield* $elt.children();
		},

		/** 1-based index number of an item. */
		itemNumber(eltItem) {
			return nodeIndex(eltItem) + 1;
		},

		key(name, dflt='value') {
			let {key} = this.parseName(name);
			return key /*??*/|| dflt;
		},

		/**
		 * Extract names of fields for a given UDF.
		 *
		 * Differs from {@link this.fieldsFor} in the latter returns a list of only field names, while this also extracts field keys and uses them for indices.
		 *
		 * @param {HTMLElement|string|$} eltList Dynamic list.
		 * @param {Object} [kwargs] `this.fieldsFor` keyword arguments
		 *
		 * @returns {Object} DSF names (w/o 'dsf_' prefix), indexed by field key
		 */
		keyedFieldsFor(eltList, kwargs={}) {
			let fields = this.fieldsFor(eltList, kwargs).map(dsf.stripPrefix),
				tpls = {},
				nTpls = 0;
			for (let field of fields) {
				let key = this.key(field);
				tpls[key] = field;
				++nTpls;
			}
			Object.defineProperty(tpls, 'length', {
				enumerable:false,
				value: nTpls,
			});
			Object.defineProperty(tpls, 'size', {
				enumerable:false,
				value: nTpls,
			});
			return tpls;
		},

		/* Not currently used
		nameRe: memoize(function (base) {
			return new RegExp(`^(?:dsf_)?dyn_(?<base>${base})_(?<i>\\d+)(?:_(?<key>.*))?$`);
		}),
		*/

		/**
		 * Create a new item for a dynamic list.
		 *
		 * Note this only creates the basic HTML elements by filling out a template. It does not set any behaviors or other sheet features (such as pips).
		 *
		 * @param {HTMLElement} eltList Dynamic list.
		 * @param {Object} [env] variables for templated HTML classes
		 */
		newItem(eltList, env={}) {
			let $tpl = this.$template(eltList),
				// 1-based index (used by other sheets & CSS)
				iItem = eltList.children.length + 1,
				$eltItem;
			if ($tpl.length) {
				//env.base ??= this.base(eltList);
				env.base || (env.base = this.base(eltList));
				//env.name ??= env.base;
				env.name || (env.name = env.base);
				//env.i ??= iItem;
				env.i || (env.i = iItem);
				$eltItem = $tpl.clone(true);
				this.renameItem($eltItem, env);
			} else {
				$eltItem = $(eltList.children[0].cloneNode(true));
				this.resetItem($eltItem, iItem);
			}
			return $eltItem;
		},

		parseName: memoize(function (name) {
			let parts = this.splitName(name);
			if (parts.length) {
				return {base: parts[0], i: parts[1], key: parts[2]};
			}
		}),

		reCount(eltList) {
			let n = eltList.children.length;
			this.$size(eltList).text(n);
		},

		reCountAll() {
			this.each(function (eltList) {
				this.reCount(eltList);
			}, this);
		},

		renameItem(eltItem, env) {
			$(eltItem).find('.dsf').each(function (i, node) {
				node.className = klass.eval(node.className, env);
			});
		},

		/**
		 * Update the UDF item number portion of DSF names.
		 *
		 * The first number in a DSF name is assumed to be the index. Consequently, doesn't handle inner UDFs (if nested) or other uses of numbers in DSF names (if they precede the UDF item index).
		 *
		 * @param {HTMLElement} eltItem A dynamic list item
		 * @param {number} i New index of item
		 * @param {Object} [options]
		 * @param {number} [options.width] width of numeric index in name; determines zero-padding
		 * @param { (node) => null } [options.addl] Additional renumbering operations (if any).
		 */
		renumberItem(eltItem, i, {width, addl}={}) {
			if (! i) {
				let iLast = eltItem.length - 1;
				if ('length' in eltItem && iLast in $tpl) {
					// template doesn't have a solo root 
					i = this.itemNumber(eltItem[iLast]) / eltItem.length;
				} else {
					i = this.itemNumber(eltItem);
				}
			}
			$(eltItem).find('.dsf').each(function (_, dsf) {
				let vars = (klass.vars(dsf.className) /*??*/|| []).filter(v => 1 == v.length);
				if (vars.length) {
					dsf.className = klass.eval(dsf.className, {[vars[0]]: i});
				} else {
					// replace the 1st number, or append if no numbers
					dsf.className = dsf.className.replace(
						/\b(dsf_[^ \d]*[^_ \d])(?:_\d+)?/,
						'$1_' + udfs.zeroPad(i, width)
					);
				}
			});
			addl && addl(eltItem);
		},

		/**
		 * Update the UDF item number portion of DSF names for the given HTML element and all following siblings.
		 *
		 * @param {HTMLElement} eltItem A dynamic list item
		 * @param {Object} [options]
		 * @param { (node) => null } [options.addl] Additional renumbering operations (if any).
		 */
		renumberItems(eltItem, {addl}={}) {
			let iItem = this.itemNumber(eltItem);
			for (; eltItem; eltItem = eltItem.nextSibling) {
				// Note: 1-based index
				this.renumberItem(eltItem, iItem++, {addl});
			}
		},

		/**
		 * Update item numbers in DSF field names for all items in a dynamic list.
		 *
		 * @param {HTMLElement} eltList A dynamic list
		 * @param {Object} [options]
		 * @param { (node) => null } [options.addl] Additional renumbering operations (if any).
		 */
		renumberList(eltList, {addl}={}) {
			let eltItem;
			for (let i = 0; i < eltList.children.length; ++i) {
				// Note: 1-based index
				this.renumberItem(eltList.children[i], i + 1, {addl});
			}
		},

		/**
		 *
		 */
		resetItem(eltItem, iItem) {
			let $eltItem = $(eltItem);
			$eltItem.find('.dsf').each((i, elt) => dsf.clear(elt));
			// TODO: check that (what?)
			pips.clear($eltItem);
			this.renumberItem(eltItem, iItem);
		},

		resolve(list) {
			let base, elt, $elt;
			if ('string' == typeof(list)) {
				base = list;
				$elt = this.$udf(base);
				elt = $elt[0];
			} else {
				if (list instanceof $) {
					$elt = list;
					elt = list[0];
				} else {
					elt = list;
					$elt = $(list);
				}
				base = this.base(elt);
			}
			return {base, elt, $elt};
		},

		/**
		 * Extract the first component of a compound name.
		 */
		/* Not currently used */
		shorthand: memoize(function (name) {
			let parts = name.match(/^(?:dsf_)?(?:dyn_)?([^_]+)_/);
			if (parts) {
				return parts[1];
			}
		}),
		/**/

		/**
		 * The number of items in the given list.
		 */
		size(list) {
			let {base, elt, $elt} = this.resolve(list),
				size = this.sizeName(base);
			return dsf.value(size) /*??*/|| dsa.data[size];
		},

		/**
		 * Returns the DSF that holds the size of the given list, creating it if it doesn't exist.
		 *
		 * @param {HTMLElement eltList Dynamic list element.
		 * @param {Object} [options]
		 * @param {string} [options.base] Base name for list.
		 * @param {jQuery} [options.$udf] `$(eltList)`. If not provided, created from `eltList`.
		 *
		 * @returns {jQuery}
		 */
		$size(eltList, {base, $udf}={}) {
			//base ??= this.base(eltList);
			base || (base = this.base(eltList));
			//$udf ??= $(eltList);
			$udf || ($udf = $(eltList));
			let $size = this.sizeField(eltList, {base, $udf});
			if (! $size.length) {
				$size = $(`<span class="dsf ${$size.name} readonly hidden nopips"></span>`);
				switch (eltList.tagName) {
				case 'TR':
					$udf.closest('table').before($size);
					break;
				default:
					$udf.before($size);
					break;
				}
			}
			return $size;
		},

		/**
		 * Returns the DSF that holds the size of the given list, if it exists.
		 *
		 * @param {HTMLElement eltList Dynamic list element.
		 * @param {Object} [options]
		 * @param {string} [options.base] Base name for list.
		 * @param {jQuery} [options.$udf] .
		 *
		 * @returns {jQuery}
		 */
		sizeField(eltList, {base, $udf}) {
			//base ??= this.base(eltList);
			base || (base = this.base(eltList));
			//$udf ??= $(eltList);
			$udf || ($udf = $(eltList));
			let name = `dsf_${base}_size`,
				$size = $udf.parent().find(`.${name}`);
			$size.name = name;
			return $size;
		},

		sizeName(base) {
			return base + '_size';
		},

		/**
		 * Split a UDF field name into base, key and index
		 */
		splitName: memoize(function (name) {
			if (this.isName(name)) {
				return path.split(this.stripPrefix(name));
			}
			return [];
		}),

		start() {
			// add item controls to templates
			this.$context.find('template.item').each(function (i, doc) {
				let item = doc.content.firstElementChild;
				udfs.addItemControls(item);
			});

			// add list controls to UDFs
			this.$udfs.each(function(i, eltList) {
				let $list = $(eltList),
					$controls = $list.find('+ .controls');

				if ($controls.length && $controls[0].childElementCount) {
					$controls.show();
				} else {
					udfs.addListControls(eltList, $controls);
				}
			});

			// add item controls to existing items (those created during preLoad)
			this.$context.find('.udf > *').each(function (i, eltItem) {
				let $controls = $(eltItem).find('.controls');
				if ($controls.length && $controls[0].childElementCount) {
					$controls.show();
				} else {
					udfs.addItemControls(eltItem, $controls);
					//$(eltItem).append(udfs.$itemControls.clone());
				}
			});
		},

		stop() {
			/* handled via CSS
			this.$context.find('.udf .controls').hide();
			this.$context.find('.udf+.controls').hide();
			*/
		},

		stripPrefix(name) {
			return name.replace(/^(dsf_)?dyn_/, '');
		},

		template(eltList) {
			let $eltList;
			if ('string' == typeof eltList) {
				$eltList = this.$udf(eltList);
			} else {
				$eltList = $(eltList);
			}
			let tpl = $eltList.parent()
				.closestHaving('[class]', ':scope > template')
				.children('template')[0];
			if (tpl && 'content' in tpl) {
				tpl = tpl.content;
			}
			return tpl;
			/* jQuery selectors don't seem to work on document fragments, so return 
			 * the template itself and let caller pull elements from it.
			 .children(':first-child')[0];
			 */
		},

		$template(eltList) {
			return $((this.template(eltList) /*??*/|| {}).children);
		},

		$templateItem(eltList) {
			let $tpl = this.$template(eltList);
			if ($tpl.length) {
				return $tpl;
			}
			/* Should dsf names be converted back to template classes? Or at least
			 * the item number be converted to a template param (`{i}`)?
			 */
			/*
			tpl = eltList.children[0].clone(true);
			$(tpl).find('.dsf');
			*/
			return $(eltList.children[0]);
		},

		$udf(base) {
			// only look in .page to exclude compatibility fields
			return this.$context.find(`.page .${base} .udf`);
		},

		/**
		 * Search for UDF field info for the given field name.
		 *
		 * Implemented as a function (rather than fetched directly from `fieldInfo`) for caching.
		 *
		 * @returns {{base:string, field:string}} The base name for the UDF & the field template.
		 */
		/* Not currently used */
		udfField: memoize(function (name, fieldInfo) {
			return fieldInfo[name];
		}),
		/**/

		udfFor(elt) {
			//$(elt).closest('.controls').prev()[0];
			// controls are after UDF, so check previous sibling while traversing upwards
			while (elt && ! (elt.previousElementSibling && /\budf\b/.test(elt.previousElementSibling.className))) {
				elt = elt.parentNode;
			}
			return elt && elt.previousElementSibling;
		},

		updateSize(base, size) {
			let sizeName = this.sizeName(base);
			if (sizeName in dsa.data) {
				// in case size isn't a number, default it to 0
				dsa.data[sizeName] = Math.max(dsa.data[sizeName], size);
			}
		},

		zeroPad(i, width) {
			return i.toString().padStart(width /*??*/|| this.itemNumberWidth, '0')
		},
	};
