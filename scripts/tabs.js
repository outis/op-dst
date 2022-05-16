	/*** multi-page sheet */
	let tabs = globals.tabs = {
		/* TODO:
		 * + store/retrieve current tab between sessions
		 * + support multiple tabs in one sheet
		 */

		/* DST event handlers */
		
		preLoad(opts, $context) {
			this.$context = $context;
			let firstTab = this.$context.find('.tabs > :first-child')[0];
			if (firstTab) {
				this.current = currTab || this.currTab() || firstTab.id || firstTab.className.replace(/ .*/, '');
				this.$tabs = this.$context.find('.tabs > *');
				this.$context.find('.tabs > *').on('click', tabs.clicked.bind(this));
				tabs.select(this.current);
			}
		},

		
		/* */
		
		currTab() {
		},
		
		is(elt) {
			return elt.parentNode.className.match(/\btabs\b/);
		},

		name(elt) {
			return elt.className;
		},

		pages(tab) {
			$(tab).parent().children('.page');
		},

		select(name) {
			this.tab(name).addClass('selected');
			this.$context.find(`.mll_sheet > .page.${name}`).show();
		},

		tab(name) {
			return this.$context.find(`.tabs .${name}`);
		},

		clicked(evt) {
			if (this.is(evt.target)) {
				this.current = this.name(evt.target);
				this.$tabs.removeClass('selected');
				this.pages(evt.target).hide();
				this.select(this.current);
			}
		},
	};
