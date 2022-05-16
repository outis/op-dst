	/*** 
	 * User-defined
	 * 
	 * @requires dfs, klass, pips, reorder
	 */
	let udfs = globals.udfs = {
		// 
		itemNumberWidth: 2,
		udfSel: '.udf',

		/* DST event handlers */
		init() {
			version.register();
		},
		
		preLoad({slug}, $context) {
			this.$context = $context;
			this.slug = slug;
			this._createControls();
			this._subscribeListeners();

			this.createItems();
		},

		preSave() {
			udfs.reCountAll();
		},

		
		/* */
		
		_createControls() {
			this.$listControls = $('<div class="controls"><button class="add" title="add">+</button></div>'),
			// note: can't use button for "draggable" handle, as jQueryUI doesn't recognize it (click overrides drag).
			this.$itemControls = $('<span class="controls"><span class="del" title="delete">&ndash;</span><span class="drag" title="drag">&#x21C5;</span></span>');
		},

		/**
		 * Ensures that a UDF has a DSF to hold its size.
		 */
		_createSizeDsf(udf, {base, $udf}={}) {
			base ||= this.base(udf);
			$udf ||= $(udf);
			let $size = this.sizeField(udf, base);
			if (! $size.length) {
				$udf.before($(`<span class="dsf ${$size.name} readonly hidden"></span>`));
			}
		},

		_createSizeDsfs() {
			this.$context.find(this.udfSel).each(function (i, elt) {
				udfs._createSizeDsf(elt);
			});
		},

		_subscribeListeners() {
			$(document).on('click', '.udf + .controls button', function (evt) {
				evt.preventDefault();
			});
			
			$(document).on('click', '.udf + .controls .add', function (evt) {
				udfs.add($(evt.target).closest('.controls').prev()[0]);
			});

			$(document).on('click', '.udf .del', function (evt) {
				udfs.del($(evt.target).closest('.udf > *'));
			});
			
			$(document).on('drag', '.udf .drag', function (evt) {
			});
		},
		
		add(eltList, {tpl}={}) {
			tpl ||= this.template(eltList);
			let eltItem, $dsfs;
			eltItem = this.newItem(eltList);
			$(eltList).append(eltItem);
			if (   (pips.is(eltItem))
				&& ($dsfs = $(eltItem).find('span.dsf')).length >= 2)
			{
				pips.pippify($dsfs.last());
			}

			//this.renumberItem(eltItem, iItem);
			// handled during dataPreSave:
			//this.reCount(eltList)
			reorder.makeDraggable(eltItem);

			// make new fields editable
			dsf.editable(eltItem);
		},

		/**
		 * Return the base portion of a UDF name, given a list node.
		 */
		base(eltList) {
			let name = klass.param(eltList, 'list');
			if (! name) {
				name = eltList.dataset.base;
			}
			if (! name) {
				name = eltList.dataset.name;
			}
			if (! name) {
				name = $(eltList).parent().closest('[class]')[0].className.split(/\s+/)[0];
			}
			return name;
		},
		
		/**
		 * Return a list of the base field name for all UDFs.
		 */
		bases() {
			return this.$context.find(this.udfSel)
				.parent()
				.closest('[class]')
				.toArray()
				.map(elt => elt.className.replace(/ .*/, ''));
		},

		baseToRe: memoize(function (base) {
			return new RegExp(`^(?:dsf_)?dyn_${base}(?:_|$)`);
		}),

		countUdfItems(udfs) {
			udfs ||= window.dynamic_sheet_attrs;
			let fieldInfo = this.fieldInfo(),
				counts = {};
			for (let name of Object.keys(udfs)) {
				let base = this.dsfBase(name, fieldInfo),
					{key, i} = this.splitName(name, base);
				if (base && i) {
					// name is a UDF name
					if (base in counts) {
						counts[base] = Math.max(counts[base], +i);
					} else {
						counts[base] = +i;
					}
				}
			}
			return counts;
		},

		createItemsFor(eltList, nItems, {base}) {
			base ||= udfs.base(eltList);
			let $eltList = $(eltList),
				scion = this.newItem(eltList, {base}),
				clone;
			for (let i = 1; i <= nItems; ++i) {
				clone = scion.cloneNode(true);
				this.renumberItem(clone, i);
				$eltList.append(clone);
			}
		},

		createItems() {
			/* TODO:
			 * 1. for each stored DSF, if from UDF, record max index
			 * 2. for each UDF, add items up to max index
			 */
			let udfCounts = this.countUdfItems(window.dynamic_sheet_attrs);
			this.$context.find(this.udfSel).each(function (i, eltList) {
				let base = udfs.base(eltList);
				udfs.createItemsFor(eltList, udfCounts[base], {base});
			});
		},
		
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
		dsfBase: memoize(function (name, fieldInfo) {
			let {base} = this.udfField(name, fieldInfo) || {};
			return base;
		}),
		
		each(fn, self) {
			if (self) {
				fn = fn.bind(self);
			}
			this.$context.find(this.udfSel).each(function (i, elt) {
				fn.bind(this)(elt, i);
			});
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
		fieldInfo() {
			// TODO: find a better name
			// ? put field info in subproperty (so as to prevent collisions w/ 'shorthand')
			let fieldInfo = {
				shorthand: {},
				fields: {},
			};
			
			this.$context.find(this.udfSel).each(function (i, udf) {
				let base = udfs.base(udf),
					$udf = $(udf),
					parts, short;
				if ((short = udfs.shorthand(base))) {
					if (short in fieldInfo.shorthand) {
						fieldInfo.shorthand[short].push(base);
					} else {
						fieldInfo.shorthand[short] = [base];
					}
				}
				udfs._createSizeDsf(udf, {base, $udf});
				fieldInfo.fields[base] = udfs.fieldsFor(udf, {base});
			});

			// save results for future calls
			this.fieldInfo = function () {
				return fieldInfo;
			};

			return fieldInfo;
		},

		/**
		 * Extract names of fields for a given UDF.
		 *
		 * @returns {[string]} list of DSF names (w/o 'dsf_' prefix)
		 */
		fieldsFor(eltList, {base, tpl}={}) {
			base ||= this.base(eltList);
			if (base in this.fieldsFor) { // memoize result for base
				return this.fieldsFor[base];
			}
			// tpl may be a template node, or an actual node from eltList
			tpl ||= this.templateItem(eltList);
			let env = {base, name: base},
				$dsfs = $(tpl).find('.dsf'),
				// note: dsf.name removes 'dsf_' prefix
				names = $dsfs.toArray().map(elt => klass.eval(dsf.name(elt), env).replace(/\d+$/, '{i}'));
			this.fieldsFor[base] = names;
			return names;
		},

		/**
		 * The 1-based index of a UDF in the parent collection.
		 *
		 * @param {string} name
		 * @param {string} the template matching name
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
		inflate(dsfs=null) {
			let fieldInfo = this.fieldInfo(),
				base,
				data = {};
			dsfs ||= window.dynamic_sheet_attrs;
			for (let [name, value] of Object.entries(dsfs)) {
				if ((base = this.dsfBase(name, fieldInfo))) {
					// name is a UDF name
					let {key, i} = this.splitName(name, base);
					data[udfField.base] ||= [];
					data[udfField.base][+i] ||= {};
					data[udfField.base][+i][key || ''] = value;
				}
			}
			return data;
		},
		
		/** 1-based index number of an item. */
		itemNumber(eltItem) {
			return nodeIndex(eltItem) + 1;
		},

		nameRe: memoize(function (base) {
			return new RegExp(`^(?:dsf_)?dyn_(?<base>${base})_(?<i>\\d+)(?:_(?<key>.*))?$`);
		}),

		/*
		newItem(eltList, env={}) {
			let tpl = this.template(eltList),
				iItem = eltList.children.length + 1,
				eltItem, $dsfs;
			env.base ||= this.base(eltList);
			env.i ||= this.zeroPad(iItem);
			if (tpl) {
				eltItem = tpl.content.firstElementChild.cloneNode(true);
			} else {
				eltItem = eltList.children[0].cloneNode(true);
			}
			return eltItem;
		},
		*/

		// TODO: finish
		newItem(eltList, env={}) {
			let tpl = this.template(eltList),
				// 1-based index (used by other sheets & CSS)
				iItem = eltList.children.length + 1,
				eltItem;
			env.base ||= this.base(eltList);
			env.name ||= env.base;
			env.i ||= this.zeroPad(iItem);
			if (tpl) {
				eltItem = tpl.content.firstElementChild.cloneNode(true);
				this.renameItem(eltItem, env);
			} else {
				eltItem = eltList.children[0].cloneNode(true);
				$eltItem = $(eltItem);
				// TODO: clear values
				$eltItem.find('.dsf').each((i, elt) => dsf.clear(elt));
				// TODO: check that (what?)
				pips.clear($eltItem);
				// clear label of any content & add a DSF for the label
				$eltItem.find('label').empty().append($(`<span class="dsf dsf_dyn_${env.base}_label_${env.i}"></span>`));
				//$(eltItem).data('value', null);
				this.renumberItem(eltItem, iItem);
			}
			return eltItem;
		},

		reCount(eltList) {
			let base = this.base(eltList),
				n = eltList.children.length;
			this.sizeField(eltList, base).text(n);
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
		 * @param { (node) => null } addl Additional .
		 *
		 * TODO: update to handle digits within, rather than at end.
		 */
		renumberItem(eltItem, i, {width, addl}={}) {
			if (! i) {
				i = this.itemNumber(eltItem);
			}
			$(eltItem).find('.dsf').each(function (_, dsf) {
				dsf.className = dsf.className.replace(
					/\b(dsf_[^ ]*?)(?:_\d+)?\b/,
					'$1_' + udfs.zeroPad(i, width)
				);
			});
			addl && addl(eltItem);
		},

		renumberItems(eltItem, {addl}={}) {
			let iItem = this.itemNumber(eltItem);
			for (; eltItem; eltItem = eltItem.nextSibling) {
				// Note: 1-based index
				this.renumberItem(eltItem, iItem++, {addl});
			}
		},
		
		renumberList(eltList, addl) {
			let eltItem;
			for (let i = 0; i < eltList.children.length; ++i) {
				// Note: 1-based index
				this.renumberItem(eltList.children[i], i + 1, {addl});
			}
		},

		shorthand(name) {
			let parts = name.match(/^(?:dsf_)?([^_]+)_/);
			if (parts) {
				return parts[1];
			}
		},

		sizeField(eltList, base) {
			base ||= this.base(eltList);
			let name = `dsf_${base}_size`,
				$size = $(eltList).parent().find(`.${name}`);
			$size.name = name;
			return $size;
		},

		/**
		 * Split a UDF field name into base, key and index
		 */
		splitName: memoize(function (name, base) {
			let nameRe = this.nameRe(base),
				parts = name.match(nameRe) || {};
			return parts.groups || {};
		}),

		start() {
			this.$context.find('template.item').each(function (i, doc) {
				$(doc.content.firstElementChild).append(udfs.$itemControls.clone());
			});
		

			this.$context.find(this.udfSel).each(function(i, eltList) {
				let $list = $(eltList),
					$controls = $list.find('+ .controls');
				
				if ($controls.length) {
					$controls.show();
				} else {
					$list.after(udfs.$listControls.clone());
				}
			});

			this.$context.find('.udf > *').each(function (i, eltItem) {
				let $controls = $(eltItem).find('.controls');
				if ($controls.length) {
					$controls.show();
				} else {
					$(eltItem).append(udfs.$itemControls.clone());
				}
			});
		},

		stop() {
			/* handled via CSS
			this.$context.find('.udf .controls').hide();
			this.$context.find('.udf+.controls').hide();
			*/
		},

		template(eltList) {
			return $(eltList).parent()
				.closestHaving('[class]', ':scope > template')
				.children('template')[0];
			/* jQuery selectors don't seem to work on document fragments, so return 
			 * the template itself and let caller pull elements from it.
			 .children(':first-child')[0];
			 */
		},

		templateItem(eltList) {
			let tpl = this.template(eltList);
			if (tpl) {
				return tpl.content.firstElementChild;
			}
			/* Should dsf names be converted back to template classes? Or at least
			 * the item number be converted to a template param (`{i}`)?
			 */
			/*
			tpl = eltList.children[0].clone(true);
			$(tpl).find('.dsf');
			*/
			return eltList.children[0];
		},

		/**
		 * Search for UDF field info for the given field name.
		 *
		 * @returns {{base:string, field:string}} The base name for the UDF & the field template.
		 */
		udfField: memoize(function (name, fieldInfo) {
			let short = this.shorthand(name),
				candidates;
			// ? check fieldInfo.shorthand before fieldInfo.fields, in case `short` matches a UDF whose name is the prefix for another UDF that matches `name`.
			if (short in fieldInfo.shorthand) {
				for (let udf of fieldInfo.shorthand[short]) {
					let field = klass.matchesAny(fieldInfo.fields[udf], name);
					if (field) {
						return {base: udf, field};
					}
				}
			}
			if (short in fieldInfo.fields) {
				let field = klass.matchesAny(fieldInfo.fields[short], name);
				if (field) {
					return {base: short, field};
				}
			}
			for (let [udf, fields] of Object.entries(fieldInfo.fields)) {
				let re = this.baseToRe(udf);
				if (name.match(re)) {
					let field = klass.matchesAny(fields, name);
					if (field) {
						return {base: udf, field};
					}
				}
			}
		}),

		zeroPad(i, width) {
			return i.toString().padStart(width || this.itemNumberWidth, '0')
		},
	};
