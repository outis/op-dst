	/*** multi-page sheet */
	let tabs = globals.tabs = {
		/* TODO: features
		 * + store/retrieve current tab between sessions
		 * / support multiple tabs in one sheet
		 */

		/* DST event handlers */

		preLoad(opts, $context) {
			this.$context = $context;
			// TODO: refactor-find better name
			this.$tabGroups = this.$context.find('.tabs');
			this.$tabGroups.children().on('click', this.clicked.bind(this));

			this.$tabGroups.each(function (i, elt) {
				let $elt = $(elt),
					name = tabs.savedTab($elt) /*??*/|| tabs.name(elt.children[0]);
				tabs.select($elt, name);
			});
		},


		/* */
		groupName($tabGroup) {
			return this.name($tabGroup.parent()[0]);
		},

		is(elt) {
			return /\btabs\b/.test(elt.parentNode.className);
		},

		name(elt) {
			return elt.className.replace(/ .*/, '');
		},

		$pages(tab) {
			return $(tab).closestHaving('*', ':scope > .page').children('.page');
		},

		resolve($tabGroup, tab) {
			let $tab, name;
			if ('string' == typeof(tab)) {
				name = tab;
				$tab = this.$tab($tabGroup, tab);
			} else {
				$tab = $(tab);
				name = this.name($tab[0]);
			}
			return {$tab, name};
		},

		savedTab($tabGroup) {
			let groupName = this.groupName($tabGroup),
				hash = window.location.hash.replace(/^#/, '');
			if (hash && $tabGroup.find(`> .${hash}`).length) {
				return hash;
			} else if ('tabs' in localStorage && groupName in localStorage.tabs) {
				return localStorage.tabs[groupName];
			}
		},

		select($tabGroup, tab) {
			let {$tab, name} = this.resolve($tabGroup, tab);

			if (name !== $tabGroup.data('current')) {
				this.$tabs($tabGroup).removeClass('selected');
				this.$pages($tabGroup).hide();

				$tabGroup.data('current', name);
				$tab.addClass('selected');
				$tabGroup.parent().find(`.page.${name}`).show();
			}
		},

		tab(name) {
			return this.$context.find(`.tabs > .${name}`);
		},

		$tab($tabGroup, name) {
			return $tabGroup.children(`.${name}`);
		},

		// TODO: refactor-find better name
		$tabGroup(tab) {
			return $(tab).closest('.tabs');
		},

		$tabs($tabGroup) {
			return $tabGroup.children();
		},

		clicked(evt) {
			if (this.is(evt.target)) {
				let name = this.name(evt.target),
					$tabGroup = this.$tabGroup(evt.target);
				this.select($tabGroup, name);
			}
		},
	};
