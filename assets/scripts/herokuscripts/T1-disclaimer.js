var T1 = T1 || {};

/**
 *	Disclaimer v1.1
 *
 *	KGH: Add fade effect
 *
 *  requires:
 *  pubsub.js in /lib/
 */
T1.disclaimer = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		/* *
		 * initializes the main container
		 * @return {void} void
		 * */
		init: function(){
			_private.setDisclaimer();

		},
		setDisclaimer: function(){
			var fadeLength = 666;

			$('.disclaimer-view').on('click', function(e) {
				e.preventDefault();
				$(this).prev().fadeIn(fadeLength);
				$(this).hide();
			});
			$('.disclaimer-close').on('click', function(e) {
				e.preventDefault();
				var disclaimer = $(this).parents('.disclaimer');
				disclaimer.hide();
				disclaimer.next().fadeIn(fadeLength);
			});
		}
	};

	/*returns the public methods of the component*/
	var _public = {
		"init"      :_private.init
	};
	return _public;
}());