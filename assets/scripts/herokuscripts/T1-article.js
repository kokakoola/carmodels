var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *
 */
T1.article = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		/* *
		 * initializes the main container
		 * @return {void} void
		 * */
		init: function(){
			_private.setVideoButton();
			_private.setAjaxRequest();
			_private.setIFrameContent();
		},
		setVideoButton: function(){
			var videoBtn = $('.sprite-videoplayer-start-button');
			videoBtn.on('click', function(){
				var that = $(this),
					movieLink = that.data('youtubeid') || that.data('video');
				location.hash = '/youtube/' + movieLink.replace(/(.*v=|&.*)|(.*embed\/|\?.*)/g,'');
			});
		},
		setAjaxRequest: function() {
			var el = $('#articleAjax');
			el.on('click', function(e) {
				location.hash = '/ajax/' + this.id;
				if(location.hash) {
					e.preventDefault();
				}
			});
		},
		setIFrameContent: function() {
			var el = $('#articleIFrame');
			el.on('click', function(e) {
				location.hash = '/iframe/' + encodeURIComponent($(this).prop('href'));
				if(location.hash) {
					e.preventDefault();
				}
			});
		}
	};

	/*returns the public methods of the component*/
	var _public = {
		"init"      :_private.init
	};
	return _public;
}());