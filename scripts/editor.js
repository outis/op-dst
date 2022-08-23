	/**
	 */
	const editor = globals.editor = {
		_$editors: {},
		custClass: 'custedit',

		_$inputs: {
			input($dsf) {
				// default
				return $(`<input />`);
			},
			list($dsf) {
				let name = editor.listFor($dsf);
				return $(`<input list="${name}" />`);
			},
			text($dsf) {
				return $('<textarea></textarea>');
			},
		},

		/* DST event handlers */
		init($context, slug) {
			this.$context = $context;
			this.slug = slug;
		},

		preLoad(opts) {
			this.opts = {...opts};
		},

		postLoad({isEditable}) {
			if (isEditable) {
				this.keyChecker = this.keyCheck.bind(this);
				this.clicker = this.clicked.bind(this);
				this.submitter = this.submitted.bind(this);
				this.blurrer = this.blurred.bind(this);

				$('.udf').on('add.mll.udf', (evt, ...args) => this.setup(...args));
				this.setup(this.$context);
				//$context.find('.udf').on('click', '.dsf.' + this.custClass, this.clicker);
			}
		},

		/* event handlers */
		blurred(evt) {
			this.save(evt.target);
		},

		clicked(evt) {
			const $dsf = $(evt.target).closest('.dsf'),
				  name = dsf.name($dsf); //evt.target.getAttribute('list'),
			let $editor;
			console.debug(`editor.clicked ${name}`);
			if (! $dsf.hasClass('editing')) {
				$editor = this.start($dsf);
			} else {
				evt.stopPropagation();
				$editor = $dsf.data('$editor') /*??*/|| this.$active;
			}
			if ($editor) {
				$editor.data('$input').trigger('focus');
			}
		},

		editCancelled(evt) {
			let $dsf = this.resolve(evt);
			this.stop($dsf);
			this.restore($dsf);
		},

		keyCheck(evt) {
			switch (evt.keyCode) {
			case 27:
				this.editCancelled(evt);
				break;
			}
		},

		submitted(evt) {
			evt.preventDefault();
			$(evt.target).find('.value').trigger('blur');
			return false;
		},

		/* */
		addBreaks(value) {
			return value.replace(/(?:<br\/?>)*\n/g, '<br/>\n');
		},

		delBreaks(value) {
			return value.replace(/(?:<br\/?>)*\n/g, '\n');
		},

		$editor($dsf) {
			let name = dsf.name($dsf),
				type = this.type($dsf);
			if (! type) {
				return;
			}
			if (! (type in this._$editors)) {
				let $form = $('<form></form>'),
					$input = this._$inputs[type]($dsf);
				$input.addClass('value');
				$form.append($input);
				$form.data('$input', $input);
				$form.value = function (val) {
					this.data('$input').val(val); //.html(val);
				};

				$input.on('keydown', this.keyChecker);
				$input.on('blur', this.blurrer);
				$form.on('submit', this.submitter);

				this._$editors[type] = $form;
			}
			return this._$editors[type];
		},

		$input($elt) {
			let $editor;
			if (! $elt) {
				return;
			}
			if ('FORM' == $elt[0].tagName) {
				$editor = $elt;
			} else {
				$editor = $elt.data('$editor') /*??*/|| this.$editor($elt);
			}
			return $editor.data('$input')
				/*??*/|| $editor.find('input').add('textarea', $editor).add('select', $editor);
		},

		listFor($dsf) {
			if ($dsf instanceof $) {
				return $dsf.attr('list');
			} else {
				return $dsf.getAttribute('list');
			}
		},

		resolve(dsf) {
			if ('target' in dsf) {
				dsf = dsf.target;
			}
			if (! (dsf instanceof $)) {
				dsf = $(dsf);
			}
			return dsf.closest('.dsf')
		},

		restore($dsf) {
			let value = $dsf.data('old-value'),
				$input = this.$input($dsf);
			// should get ignored, but just in case, set edited value to old value
			$input.val(value);
			this.store($dsf, value);
		},

		save($dsf) {
			$dsf = this.resolve($dsf);
			if (! $dsf.hasClass('editing')) {
				// edit was cancelled earlier
				return;
			}
			console.debug(`editor.save ${dsf.name($dsf)}`);
			this.stop($dsf);
			let $editor = $dsf.data('$editor'),
				val = $editor.find('.value').val(),
				oldVal = dsf.value($dsf);

			this.store($dsf, val);

			this.opts.fieldName = dsf.name($dsf);
			this.opts.fieldValue = val;
			this.opts.oldValue = oldVal;
			//op.trigger('change', [this.opts]);
		},

		setup($context) {
			if (! ($context instanceof $)) {
				$context = $($context);
			}
			$context.find('.dsf[list]')
				.add('.dsf.notes', $context)
				.addClass('readonly ' + this.custClass)
				.on('click', this.clicker);
			// could also use `.one('click', this.clicker)`, but must then rebind after edit finishes
		},

		start($dsf) {
			$dsf = this.resolve($dsf);
			let val = this.delBreaks($dsf.html()),
				$editor = this.$editor($dsf),
				$input = this.$input($dsf);

			console.debug(`editor.start ${dsf.name($dsf)}`);
			if (! $editor) {
				console.debug(`editor: skipping; no editor for ${dsf.name($dsf)}`);
				// TODO: return default editor?
				return;
			}

			if (val == editMarker) {
				val = '';
			}
			//console.log('start', val);

			$dsf.addClass('editing');
			$input.val(val); //.html(val);

			//$(document).on('keydown', this.keyChecker);

			$dsf.data('old-value', val);
			$dsf.text('');
			// TODO? if $dsf is tip, add editor to .tipped ancestor
			/** /
			if ($dsf.hasClass('.tip')) {
				$dsf.closest('.tipped').append($editor);
			} else {
			/**/
			$dsf.append($editor);
			//}
			$dsf.data('$editor', $editor);

			this.$active = $editor;
			return $editor;
		},

		stop($dsf) {
			console.debug(`editor.stop ${dsf.name($dsf)}`);
			$dsf = this.resolve($dsf);
			let $editor = $dsf.data('$editor');
			$dsf.removeClass('editing');
			//$(document).off('keydown', this.keyChecker);
			$editor.detach();
		},

		store($dsf, value) {
			console.debug(`editor.store ${dsf.name($dsf)} <- ${value}`);
			if (! /<p\b/.test(value)) {
				value = this.addBreaks(value);
			}
			//$dsf.html(value);
			dsf.value($dsf, value);

			$dsf.removeData('old-value');
		},

		type($dsf) {
			if ($dsf.attr('list')) {
				return 'list';
			}
			if ($dsf.hasClass('notes') || $dsf.hasClass('text')) {
				return 'text';
			}
			return 'input';
		},
	};
