/**
 * Created by Frederic.Arijs on 09/01/14.
 */

var T1 = T1 || {};

/**
 * Module for the homepage events
 */
T1.homepage = ( function() {

	var _private = {

		/**
		 * Initialize the homepage behavior
		 */
		init: function() {
			// adding a test to ensure we need to init?
			if ($('.content-navigation').length > 0) {
				// There is a navigation menu in the content
				// $('.content-navigation').on('click', 'a.pageContentInPage', _private.showInPageContent);
			}
		},

		/**
		 * Load the content of a div related to the clicked
		 * menu item to show it in a new page
		 *
		 * @param {object} e - the Event triggered
		 */
		showInPageContent: function(e) {
			e.preventDefault();

			var $elem = $(this);
			var contentid = $elem.data('contentid');
			//var content = $('#' + $elem.data('contentid')).html();

			//publish. .... loading with content
			if ($elem.length > 0) {

				location.hash = '/publish/pageoverlayer_open' +
								'/inPage=true/preserveContent=true/html=%23' +
								contentid +
								'%3E*/styleClass=' +
								contentid;

/*				PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {
					inPage: true,
					html: content,
					preserveContent: true
				}); */
			}
		}
	};

	// Public function exposed from the module
	return {
		init: _private.init
	};
}());