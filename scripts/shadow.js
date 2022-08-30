	/*** */
	let shadow = globals.shadow = {
		postLoad(opts, $context) {
			let psyche_slug = dsf.value('psyche_slug');
			if (psyche_slug) {
				dsf.$dsf('psyche').wrap(`<a href="/characters/${psyche_slug}"></a>`);
			}
		}
	};
