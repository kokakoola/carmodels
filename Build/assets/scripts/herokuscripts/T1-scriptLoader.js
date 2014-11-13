var T1 = T1 || {};

/**
 *	script loader (modernizr yepnope)
 */
T1.scriptLoader = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _modern = {
		load : function() {
			var c = T1.constants,
				arrVideo	= [c.JS_VIDEOJS];

			Modernizr.load({
				test: !(T1.utilities.isIOS() || T1.utilities.isMobileAndroid()),
				yep : arrVideo
			});
		},

		loadScript: function(url, attributes) {
			var script = $('<script>');

			script.attr('type', 'text/javascript');
			script.attr('href', url);

			$.each(attributes, function(key, value) {
				script.attr(key, value);
			});

			$('body').append(script);
		},

		loadStyle: function(url, attributes) {
			var style = $('<link>');

			style.attr('rel', 'stylesheet');
			style.attr('type', 'text/css');
			style.attr('href', url);

			$.each(attributes, function(key, value) {
				style.attr(key, value);
			});

			$('head').append(style);
		}
	};

	return {
		init : _modern.load,
		loadScript: _modern.loadScript,
		loadStyle: _modern.loadStyle
	};

}());