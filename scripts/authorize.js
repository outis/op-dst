	/**
	 * Basic protection.
	 */
	const authorize = globals.authorize = {
		init($context, slug, isEditable) {
			this.$context = $context;
			this.set_owner();
			Object.defineProperties(this, {
				isEditable: {
					configurable: false,
					writeable: false,
					enumerable: true,
					value: isEditable,
				},
			});
		},

		set_owner() {
			if (! this.owner) {
				const owner = (dynamic_sheet_attrs.player ?? '').replace(/<[^>]*>/g, '');
				if (owner) {
					Object.defineProperty(authorize, 'owner', {
						configurable: false,
						writeable: false,
						enumerable: true,
						value: owner,
					});
				} else {
					// skip self removal
					return;
				}
			}
			this.set_owner = () => {};
		}
	};
	Object.defineProperties(authorize, {
		user: {
			configurable: false,
			writeable: false,
			enumerable: true,
			value: $('head meta#current-user-login').attr('content'),
		},
		is_owner: {
			configurable: false,
			writeable: false,
			enumerable: false,
			value: function() {
				return this.owner && this.user === this.owner;
			}
		},
		can_edit: {
			configurable: false,
			writeable: false,
			enumerable: false,
			value: function() {
				return this.isEditable || this.is_owner();
			}
		}
	});
	$(function() {
		authorize.set_owner();
	});
