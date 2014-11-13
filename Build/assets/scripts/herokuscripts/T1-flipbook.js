var T1 = T1 || {};

/**
 * Flipbook
 * User: MDA
 */

T1.flipBook = (function(){
	'use strict';

	var _private = {
		init: function(){
			if($("#fb5").size()) {
				if(Modernizr.csstransforms) {
					$.loadScript('/scripts/flipbook/turn.min.js').done(function(script, textStatus) {
						_private.loadFlipbook();
					});
				}
				else {
					$.loadScript('/scripts/flipbook/turn.html4.min.js').done(function(script, textStatus) {
						_private.loadFlipbook();
					});
				}
			}
		},
		loadFlipbook: function() {
			$.loadScript('/scripts/flipbook/flipbook.js');
		}
	};

	return {
		init: _private.init
	};
}());