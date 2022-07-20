	/**
	 * Methods on words.
	 */

	const words = globals.words = {
		_pluralize: {
			'arcanum': 'arcanoi',
			'obolus': 'oboli',
			// should status be pluralized?
			//'status': 'statuses',
		},
		_typos: {
			'corups': 'corpus',
			// in case 'corups' has been singulized
			'corup': 'corpus',
			'permenant': 'permanent',
		},
		// singles from _pluralize will be copied to here
		_singles: {
			'corpus': 'corpus',
			'pathos': 'pathos',
			'status': 'status',
		},
		// filled from _pluralize
		_plurals: {},
		_singulize: {},

		/**
		 * Corrects common typos.
		 *
		 * Also converts to lower case (if corrected).
		 */
		correct(word) {
			//let lower = word.toLowerCase();
			return this._typos[word.toLowerCase()] || word;
		},
		
		is_plural(word) {
			return (word in this._plurals)
				|| (! (word in this._singles) && /s$/.test(word));
		},

		/**
		 * Convert a word to its plural form.
		 *
		 * Can be applied to plural words.
		 */
		pluralize(word) {
			if (this.is_plural(word)) {
				return word;
			}
			return this._pluralize[word]
				|| word.replace(/s?$/, 's').replace(/ys\b/, 'ies');
		},

		/**
		 * Convert plural words to singular.
		 *
		 * Shouldn't be applied to singular words.
		 *
		 * Doesn't singulize certain (latin) words, as the singular forms aren't used in sheets.
		 */
		singulize(word) {
			word = this.correct(word);
			if (word in this._singles) {
				return word;
			}
			// Intentionally doesn't singulize latin words, such as 'arcanoi' (rather than tranlating to 'arcanum').
			return /* this._singulize[word] || */ word.replace(/ies\b/, 'y').replace(/s\b/, '');
		},
	};
	//words._singulize = flipObject(words._pluralize);
	for (let [single, plural] of Object.entries(words._pluralize)) {
		words._plurals[plural] = plural;
		words._singles[single] = single;
		words._singulize[plural] = single;
	}
	for (let [name, fn] of Object.entries(words)) {
		if (is_function(fn)) {
			words[name] = memoize(fn.bind(words));
		}
	}
