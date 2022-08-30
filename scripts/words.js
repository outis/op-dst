	/**
	 * Methods on words.
	 */

	const words = globals.words = {
		_pluralize: {
			'arcanum': 'arcanoi',
			'obolus': 'oboli',
			'money': 'money',
			'equipment': 'equipment',
			// should status be pluralized?
			//'status': 'statuses',
		},
		_typos: {
			'corups': 'corpus',
			// in case 'corups' has been singulized
			'corup': 'corpus',
			'memorium': 'memoriam',
			'permenant': 'permanent',
		},
		// singles from _pluralize will be copied to here
		_singles: {
			'corpus': 'corpus',
			'pathos': 'pathos',
			'status': 'status',
			'obolus': 'obolus',
		},
		_standards: {
			'artefact': 'artifact',
			'artefacts': 'artifacts',
			'bg': 'background',
			'xp': 'experience',
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
			return this.lookup(word, this._typos);
		},

		is_plural(word) {
			return (word in this._plurals)
				|| (! (word in this._singles) && /s$/.test(word));
		},

		/**
		 * Return entry for <var>word</var> from <var>thesaurus</var>, if any.
		 */
		lookup(word, thesaurus) {
			return thesaurus[word.toLowerCase()] /*??*/|| word;
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
				/*??*/|| word.replace(/s?$/, 's').replace(/ys\b/, 'ies');
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
			if (word.toLowerCase() in this._singles) {
				return word;
			}
			// Intentionally doesn't singulize latin words, such as 'arcanoi' (rather than tranlating to 'arcanum').
			return /* this._singulize[word] ?? */ word.replace(/ies\b/, 'y').replace(/s\b/, '');
		},

		standardize(word) {
			return this.lookup(
				this.correct(word),
				this._standards);
		},
	};
	//words._singulize = flipObject(words._pluralize);
	for (let [single, plural] of Object.entries(words._pluralize)) {
		words._plurals[plural] = plural;
		words._singles[single] = single;
		words._singulize[plural] = single;
	}
	for (let [name, fn] of Object.entries(words)) {
		// note: won't catch variadic functions in the 2nd argument
		if (is_function(fn) && fn.length < 2) {
			words[name] = memoize(fn.bind(words));
		}
	}
