	/***
	 * Reorder UDF list items by dragging.
	 */
	let reorder = globals.reorder = {
		/* DST event handlers */
		postLoad(opts, $context) {
			this.$context = $context;
			
			// doesn't work on mobile
			this.starter = this.started.bind(this);
			this.dragger = this.dragged.bind(this);
			this.stopper = this.stopped.bind(this);
			
			let $udf = this.$context.find('.udf');
			$udf.find('li').prop('draggable', true);
			
			$udf.on('dragstart', this.starter);
			$udf.on('dragenter', 'li', this.dragger);
			$udf.on('dragend', this.stopper);
		},

		/* */
		dragged(evt) {
			let draggable = $(evt.delegateTarget).data('payload'),
				target = reorder.target(evt.target);
			reorder.swapWith(draggable, target);
		},

		makeDraggable(elt) {
			elt.draggable = true;
		},

		started(evt) {
			let elt = reorder.target(evt.target);
			elt.style.opacity = 0.5;
			$(evt.delegateTarget).data('payload', elt);
		},

		stopped(evt) {
			let elt = reorder.target(evt.target);
			elt.style.opacity = null;
			$(evt.delegateTarget).data('payload', null);

			/* As `reorder` is only to be used for UDFs, assume that calling 
			 * `udfs.renumberList` is appropriate. Alternatively, reorder could
			 * support callbacks registered for reorderable lists.
			 */
			udfs.renumberList(evt.delegateTarget);
		},

		swapWith(node, other) {
			if (node != other && node.parentNode == other.parentNode) {
				let parent = other.parentNode,
					iNode = nodeIndex(node),
					iOther = nodeIndex(other);
				if (iNode < iOther) {
					other = other.nextSibling;
				}
				parent.insertBefore(node, other);
			}
		},
		
		target(elt) {
			return $(elt).closest('li')[0];
		},
	};
