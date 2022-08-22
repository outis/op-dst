	/**
	 * Undo & redo sheet changes.
	 */
	const undo = globals.undo = {
		/**
		 * This module records changes in a simple way: functions that undo or redo the change. It's up to client code to define how to perform an undo or redo, which calls {@link this.record} to record these changes to `undo`'s history.
		 *
		 * The change functions can return an HTMLElement (or array of same), which will be highlighted with `{@link this.highlight}`.
		 *
		 * @typedef {object} undo.Change - A record of changes.
		 * @property {() => (HTMLElement?|HTMLElement?[])} undo - undoes some change
		 * @property {() => (HTMLElement?|HTMLElement?[])} redo - redoes some change
		 */
		// controls whether history is recorded
		freeze: false,
		_history: [],
		_future: [],
		_transactions: [],
		/* Guard against accidental modification during a freeze.
		 * With these accessors, checking `this.freeze` in history modification functions isn't necessary, but can be done to avoid performing operations that will have no effect.
		 */
		get history() {
			if (this.freeze) {
				return [];
			}
			return this._history;
		},
		set history(value) {
			if (this.freeze) {
				return;
			}
			this._history = value;
		},
		get future() {
			if (this.freeze) {
				return [];
			}
			return this._future;
		},
		set future(value) {
			if (this.freeze) {
				return;
			}
			this._future = value;
		},
		get transactions() {
			if (this.freeze) {
				return [];
			}
			return this._transactions;
		},
		set transactions(value) {
			if (this.freeze) {
				return;
			}
			this._future = value;
		},

		/* property aliases */
		get undos() {
			return this.history;
		},

		set undos(value) {
			this.history = value;
		},

		get redos() {
			return this.future;
		},

		set redos(value) {
			this.future = value;
		},

		/* DST event handlers */
		init($context, slug, isEditable) {
			this.freeze = true;
			this.$context = $context;
			this.keyPresser = this.keyPressed.bind(this);
			if (isEditable) {
				// doesn't catch ⌘-
				//$context.on('keypress', this.keyPresser);
				// catches ⌘-z, but not ⌘-Z
				$context.on('keydown', this.keyPresser);
			}
		},

		postLoad() {
			this.freeze = false;
		},


		/* */

		get isMac() {
			return /^Mac/.test(navigator.platform);
		},

		/**
		 * Report whether there's an active transaction ({@link this.begin} without a corresponding {@link this.commit}/{@link this.cancel}).
		 */
		get transactioning() {
			return this.transactions.length;
		},

		/**
		 * Apply a state change (undo/redo).
		 *
		 * To guard against accidentally not closing transactions, if there are any active transactions when applying an operation, the transactions are first {@link this.commit committed}. Consequently, those changes will be the ones applied (which, for a redo, means nothing will happen).
		 */
		apply(operation, changes, revert) {
			if (this.transactioning) {
				console.error(`undo.{$operation}: Some module did not finish combining changes for undoing, and ${caller.name} did not handle it; doing so now. However, this may leave undo/redo and the sheet in an inconsistent state. Please save now and then re-edit.`);
				// if there are any active transactions, close them
				this.commitAll();
			}
			if (changes.length) {
				let change = changes.pop();
				try {
					// suppress history recording
					this.freeze = true;
					let result = change[operation]();
					this.freeze = false;
					revert.push(change);
					if (result) {
						this.highlight(result);
					}
					return result;
				} catch (err) {
					console.error(`Error during ${operation}:`, err);
					alert(`Error during ${operation}: ${err}. Please save now & reopen for further edits. Redoes redoes may leave sheet with inconsistent data; redo at your own risk.`);
					// rest of redos might no longer apply & could leave in invalid state, so discard
					//this.future = [];
				}
			} else {
				alerts.info(`No more ${operation}s.`);
			}
			if (this.history.length) {
				dsf.dirty();
			} else {
				dsf.clean();
			}
		},

		/**
		 * Begin a set of changes.
		 *
		 * Treats operation registration as a transaction. While active, any registered undo (and redo) operations are combined into a single undo (or redo) when {@link this.commit} is called. Allows related changes to be undone/redone together.
		 *
		 * If called while another transaction is active, a new sub-transaction is created.
		 */
		begin() {
			if (this.freeze) { // optimization: early return
				return;
			}
			return this.transactions.push({undos:[], redos:[]});
		},

		cancel() {
			if (this.freeze) { // optimization: early return
				return;
			}
			return this.transactions.pop();
		},

		cancelAll() {
			if (this.freeze) { // optimization: early return
				return;
			}
			this.transactions = [];
		},

		/**
		 * Clear out history & future.
		 */
		clear() {
			this.history = [];
			this.future = [];
		},

		/**
		 * For a command keyboard event, returns the key letter.
		 *
		 * If not a command (iee. no command modifier), returns `undefined`.
		 */
		cmdKey(evt) {
			// browser doesn't fire keypress for ⌘-key sequences
			if (evt.metaKey || evt.ctrlKey /*this.isMac ? evt.metaKey : evt.ctrlKey*/) {
				return evt.key;
			}
			// no command key
			return;
		},

		/**
		 * Commit a set of changes.
		 *
		 * When called, any undo (and redo) operations registered since the most recent call to {@link this.begin} are combined into a single undo (or redo). Allows related changes to be undone/redone together.
		 *
		 * Note that change sets (and transactions) can be nested.
		 */
		commit() {
			if (this.freeze) { // optimization: early return
				return;
			}
			let changes = this.transactions.pop();
			if (changes) {
				if (changes.undos.length > 1) {
					let undos = () => callAllFunctions(changes.undos),
						redos = () => callAllFunctions(changes.redos);
					undos.undos = changes.undos;
					redos.redos = changes.redos;
					this.record(
						undos, // () => callAllFunctions(changes.undos),
						redos, // () => callAllFunctions(changes.redos)
					);
				} else {
					this.record(changes.undos[0], changes.redos[0]);
				}
			}
		},

		commitAll() {
			if (this.freeze) { // optimization: early return
				return;
			}
			//console.info(`undo.commitAll: committing ${this.transactions.length} transactions`);
			let changes = this.transactions.shift();
			if (changes) {
				for (let change of this.transactions) {
					changes.undo.push(...change.undo);
					changes.redo.push(...change.redo);
				}
				this.transactions = [changes];
				this.commit();
			}
		},

		/**
		 * Highlight an HTML element.
		 *
		 * This method will bring the element into view and draw a halo around the element, which gradually fades. If the element is hidden, finds first visible ancestor and, if it's a DSF or tipped, highlights it instead; if not, nothing is highlighted.
		 *
		 * Used to draw attention to an element that's being changed.
		 *
		 * @param {HTMLElement|jQuery} elt - element to highlight
		 * @param {jQuery} [$elt] - jQuery-wrapped element to highlight; pass only as an optimization so this method doesn't need to create one itself
		 */
		async highlight(elt, $elt) {
			if (Array.isArray(elt)) {
				elt.map(e => this.highlight(e));
				return;
			}
			// whether the element to highlight was the one requested
			let requested = true;
			if (elt instanceof $) {
				$elt = elt;
				elt = $elt[0];
			}
			//$elt ??= $(elt);
			$elt || ($elt = $(elt));
			while ('none' == $elt.css('display')) {
				// DFSs that are tips (specialties, notes) are generally hidden; this allows highlighting them by highlighting their first visible parent
				elt = elt.parentNode;
				$elt = $(elt);
				requested = false;
			}
			if (! (requested || $elt.closest('.dsf').length || $elt.hasClass('tipped'))) {
				// The user shouldn't be aware of internally used DSFs, and so shouldn't be alerted to their changes.
				return;
			}
			if (elt.scrollIntoView) {
				elt.scrollIntoView({behavior: 'smooth', block: 'nearest'});
				$elt.addClass('highlight');
				await transitions.fade($elt, {reset: true});
				$elt.removeClass('highlight');
				// removing highlight makes faded classes apply to the element itself, so make sure they're removed
				transitions.clearFade($elt);
				/*
				$elt.removeClass('highlight fade-out')
					.addClass('highlight');

				// ensure at least 1 repaint in-between adding classes
				await animationPost();
				$elt.addClass('fade-out');

				await waitOn(elt, 'transitionend');
				$elt.removeClass('highlight fade-out');
				*/
			}
		},

		keyPressed(evt) {
			switch (this.cmdKey(evt)) {
			case 'z':
				this.undo();
				evt.preventDefault();
				break;
			case 'Z':
			case 'y':
				this.redo();
				evt.preventDefault();
				break;
			}
		},

		/**
		 * Record a state change.
		 *
		 * As this will invalidate any redos, clears future.
		 */
		record(undo, redo) {
			if (this.freeze) { // optimization: early return
				return;
			}
			let transaction = this.transaction();
			if (transaction) {
				transaction.undos.push(undo);
				transaction.redos.push(redo);
			} else {
				this.history.push({undo, redo});
				this.future = [];
				dsf.dirty();
			}
		},

		redo() {
			if (this.transactioning) {
				console.warn(`undo.${operation}: Some module did not finish combining changes for undoing; doing so now. This invalidates all redoes.`);
				alert(`Cannot redo, as . Attempting to clean up, which discards future redoes.`);
				// if there are any active transactions, close them
				this.commitAll();
			} else {
				this.apply('redo', this.future, this.history);
			}
		},

		/**
		 * Collect changes created during a function call in a transaction.
		 *
		 * @param {() => *} fn - operations to perform
		 * @param {boolean} [commit] - whether to commit all transactions
		 *
		 * @returns {*}
		 */
		transact(fn, all=false) {
			let result;
			this.begin();
			try {
				result = fn();
			} finally {
				if (all) {
					this.commitAll();
				} else {
					this.commit();
				}
			}
			return result;
		},

		/**
		 * Returns the current transaction, if one exists.
		 */
		transaction() {
			return this.transactions[this.transactions.length-1];
		},

		undo() {
			if (this.transactioning) {
				console.warn(`undo.${operation}: Some module did not finish combining changes for undoing; doing so now (these changes will be the ones undone).`);
				// if there are any active transactions, close them
				this.commitAll();
			}
			this.apply('undo', this.history, this.future);
		},
	};
