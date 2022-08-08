	/***
	 * Reorder UDF list items by dragging.
	 */
	let reorder = globals.reorder = {
		active: [],
		itemClass: 'item',
		itemSel: '.item',

		/* DST event handlers */
		postLoad(opts, $context) {
			this.$context = $context;

			this.starter = this.started.bind(this);
			this.dragger = this.dragged.bind(this);
			this.stopper = this.stopped.bind(this);
			// for mobile
			this.swapStarter = this.swapStarted.bind(this);
			this.swapCanceller = this.swapCancelled.bind(this);
			this.swapEnder = this.swapEnded.bind(this);

			this.keyChecker = this.keyCheck.bind(this);

			let $udf = this.$context.find('.udf');
			$udf.find('li').prop('draggable', true).addClass(this.itemClass);
			$udf.find('tr').prop('draggable', true).addClass(this.itemClass);

			//$udf.on('dragstart', this.itemSel, this.starter);
			$udf.on('dragstart', this.itemSel, this.starter);
			$udf.on('dragenter', this.itemSel, this.dragger);
			$udf.on('dragend', this.stopper);

			$udf.on('click', '.drag', this.swapStarter);
		},

		/* */
		dragged(evt) {
			let draggable = $(evt.delegateTarget).data('payload'),
				target = reorder.target(evt.target);
			(evt.dataTransfer ?? {}).dropEffect = evt.dataTransfer?.effectAllowed;
			//console.info('dragged: dataTransfer', evt.originalEvent.dataTransfer);
			reorder.insertBefore(draggable, target);
			//console.info('evt', evt);
		},

		id(elt) {
			return elt
				&& (   elt.id
				    ?? $(elt).find('.dsf').filter((i, elt) => /_name$/.test(elt.className)).text());
		},

		insertBefore(elt, other) {
			if (elt != other && elt.parentNode == other.parentNode) {
				let parent = other.parentNode,
					iElt = nodeIndex(elt),
					iOther = nodeIndex(other);
				if (iElt < iOther) {
					other = other.nextSibling;
				}
				parent.insertBefore(elt, other);
			}
		},

		keyCheck(evt) {
			switch (evt.keyCode) {
			case 27:
				this.swapCanceller();
				break;
			}
		},

		makeDraggable(elt) {
			let $elt;
			if (elt instanceof $) {
				$elt = elt;
				elt = elt[0];
			} else {
				$elt = $(elt);
			}
			elt.draggable = true;
			$elt.addClass(this.itemClass);
		},

		started(evt) {
			(evt.dataTransfer ?? {}).effectAllowed = "move";
			let elt = reorder.target(evt.target);
			elt.style.opacity = 0.5;
			$(evt.delegateTarget).data('payload', elt);
			// don't prevent default
		},

		stopped(evt) {
			//console.info('stopped: dataTransfer', evt.dataTransfer);
			let elt = reorder.target(evt.target);
			elt.style.opacity = null;
			$(evt.delegateTarget).removeData('payload');

			/* As `reorder` is only to be used for UDFs, assume that calling 
			 * `udfs.renumberList` is appropriate. Alternatively, reorder could
			 * support callbacks registered for reorderable lists.
			 */
			udfs.renumberList(evt.delegateTarget);
		},

		swapCancelled(evt) {
			//console.log('cancel swap.', evt.target);
			if (evt) {
				this.swapOff(evt);
			} else {
				for (let delegateTarget of this.active) {
					this.swapOff({delegateTarget, stopPropagation: () => {}}, {keepActive: false});
				}
				this.active = [];
			}
		},

		swapEnded(evt) {
			//console.log('end swap.', evt.target);

			let other = reorder.target(evt.target),
				elt = $(evt.delegateTarget).data('payload');
			reorder.insertBefore(elt, other);
			this.swapOff(evt);
			udfs.renumberList(evt.delegateTarget);
		},

		swapOff(evt, {keepActive=true}={}) {
			// prevent trigger of other controls
			evt.stopPropagation();

			if (keepActive) {
				this.active = this.active.filter(elt => elt !== evt.delegateTarget);
			}

			let elt = $(evt.delegateTarget).data('payload');
			$(elt).removeClass('swapping');

			$(evt.delegateTarget).removeData('payload');
			$(evt.delegateTarget).removeClass('busy');
			$(evt.delegateTarget).on('click', '.drag', this.swapStarter);
			$(evt.delegateTarget).off('click', this.itemSel, this.swapEnder);

			$(document).off('click', this.swapCanceller);
			$(document).off('keydown', this.keyChecker);
		},

		swapStarted(evt) {
			// prevent swapCancelled from being called on account of this event.
			evt.stopPropagation();
			if ($(evt.delegateTarget).data('payload')) {
				return;
			}
			this.active.push(evt.delegateTarget);
			let elt = reorder.target(evt.target);
			$(evt.delegateTarget).data('payload', elt);
			$(elt).addClass('swapping');
			$(evt.delegateTarget).addClass('busy');
			$(evt.delegateTarget).off('click', '.drag', this.swapStarter);
			$(evt.delegateTarget).on('click', this.itemSel, this.swapEnder);
			$(document).on('click', this.swapCanceller);
			$(document).on('keydown', this.keyChecker);
		},

		target(elt) {
			return $(elt).closest(this.itemSel)[0];
		},
	};
