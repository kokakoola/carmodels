/**
 * Created by Frederic.Arijs on 17/12/13.
 */

var T1 = T1 || {};

/**
 * Module for the HTML5 component
 */
T1.html5 = ( function() {
	var _private = {
		init: function() {
			$('body').on('click', '.html5-overlayer', _private.openHtml5);
		},

		/**
		 * opens the HTML5 component in an overlayer window
		 * @param e the click event
		 */
		openHtml5: function(e) {
			e.preventDefault();

			var html5id = $(this).data('html5id');

			if (! html5id) {
				return;
			}

			location.hash = '/publish/pageoverlayer_open/html5id=' + html5id + '/el=.html5-overlayer/noScroll=true';
		}
	};

	// Public function exposed from the module
	return {
		init: _private.init
	};
}());