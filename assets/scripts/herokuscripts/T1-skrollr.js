var T1 = T1 || {};

/**
 * skrollr wrapper
 */
T1.skrollr = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		/**
		 * initializes skrollr when lib loaded
		 * @returns {skrollr initiated object}
		 */
		initDesktop: function () {
			if(location.hash.indexOf('disableSkrollr')>-1) return;
			if (! Modernizr.touch && T1.utilities.ieVersion() > 8) {
				PubSub.subscribe(T1.constants.SKROLLR_REFRESH, _private.refreshSkrollr);
				skrollr.init({
					forceHeight: false,
					smoothScrolling: false,
					edgeStrategy: 'ease',
					easing: 'quadratic'
				});
			}
		},

		refreshSkrollr: function(evName) {
			var currentSkrollr = skrollr.get();
			if(currentSkrollr) currentSkrollr.refresh();
		}

	};
	return {
		initDesktop: _private.initDesktop
	};
}());
