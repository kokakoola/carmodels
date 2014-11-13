/**
 * Created by Frederic.Arijs on 10/12/13.
 *
 * This isn't needed if the complete html of the button group of bootstrap is used.
 * But at this time it require a lot of html/css changes.
 *
 * So, at least, for now, I'm grouping the behavior.
 *
 * This is currently used in:
 * - carchapter-prices.html
 * - poc-review.html
 *
 */

var T1 = T1 || {};

T1.filterbar = (function() {
	'use strict';

	var _private = {

		init: function() {

			$('body').on('click', '.filter-bar a.btn', function(e) {
				if($(this).data('nopreventdefault')) return;
				e.preventDefault();
				_private.setButtonFocus($(this));
			});
		},

		/**
		 * Toggle the 'active" class on the filter bar buttons
		 * @param $elem jQuery object representing the element that was clicked
		 */
		setButtonFocus: function($elem) {
			var container = $elem.parents(".filter-bar");
			if($('a.btn', container).length === 1 || $elem.hasClass('fb-toggle')) return;
			$elem.closest('section').find('.filter-bar a.btn').removeClass('active');
			$elem.addClass('active');
		}
	};

	var _public = {
		"init": _private.init
	};

	return _public;
}());