(function($) {
	'use strict';

	/**
	 * check if element is in viewport (vertical)
	 * @returns {percentage: of element is in viewport}
	 */
	$.fn.inView = function(){
		var element = $(this),
			$window = $(window);

		var viewport = {
			top		: $window.scrollTop(),
			left	: $window.scrollLeft()
		};
		viewport.bottom = viewport.top + $window.height();
	//	viewport.right = viewport.left + $window.width();

		var position = element.offset();
	//	position.right = position.left + element.outerWidth();
		position.bottom = position.top + element.outerHeight();

		return (viewport.bottom > position.top && viewport.top < position.bottom) ? Math.round((viewport.bottom - position.top) / element.height() * 100) : 0;
	};
})(jQuery);