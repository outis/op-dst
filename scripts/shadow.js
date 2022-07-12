	/*** */
	let shadow = globals.shadow = {
		postLoad(opts, $context) {
			let psyche_slug = $context.find('.dsf_psyche_slug').text();
			if (psyche_slug) {
				$context.find('.dsf_psyche').wrap(`<a href="/characters/${psyche_slug}"></a>`);
			}
		}
	};
