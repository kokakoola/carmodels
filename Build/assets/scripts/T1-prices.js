/**
 * Created by Frederic.Arijs on 04/12/13.
 */

var T1 = T1 || {};

/**
 * requires:
 * pubsub.js in /lib/
 *
 */
T1.prices = (function() {
	'use strict';

	// _private var
	var _private = {

		init: function() {

			// Subscribe the event
			$('body').on('click', '.view-prices', _private.showOverlayer);
		},

		/**
		 * Show a page in an overlayer
		 */
		showOverlayer: function(evt) {
			evt.preventDefault();
			var $this = $(this);
			var url = $this.attr('href');

			location.hash = "/publish/pageoverlayer_open/url=" + encodeURIComponent(url) +
							'/ajax=true/pageName=' + $this.closest('section').data('section-title');
		}
	};

	/**
	 * return the public methods of the component
	 */
	var _public = {
		"init" : _private.init
	};

	return _public;
}());