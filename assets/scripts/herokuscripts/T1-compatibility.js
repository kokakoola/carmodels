var T1 = T1 || {};

/**
 * browser specific functionalities
 */
T1.compatibility = (function() {
	'use strict';

	var _private = {
		init: function() {
			var isIncompatible = T1.settings.showIncompatibleBrowser === "true";

			if (isIncompatible && T1.utilities.ieVersion() < 10) {
				_private.showFallbackMessage();
			}
		},
		showFallbackMessage: function() {
			PubSub.publish(T1.constants.TOAST_CUSTOM, {
				customContainer: $('body'),
				customText: T1.labels.wrongBrowser.incompatibleBrowser,
				centerScreen: true,
				immediate: true,
				css: {
					'width': '80%',
					'left': '0',
					'margin-left': '10%',
					'margin-right': '10%'
				}
			});
		}
	};

	return {
		init: _private.init
	};

}());