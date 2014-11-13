/*
 * jQuery touchToScroll Plugin
 * version: 1.0 (01-Sep-2011)
 * Copyright (c) 2011 Alex Griciuc
 * http://blog.almz.org/search/label/jquery
 * 
 * This plugin allows to scroll scrollable page elements by touch-dragging on touch devices.
 * This overrides default behavior, which is to scroll the whole page.
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */
(function ($) {
	$.fn.touchToScroll = function (enable) {

		var touchToScrollHandlers = {
			touchStart: function (event) {
				var e = $(this);
				var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
				var data = { element: e, x: touch.pageX, y: touch.pageY, scrollX: e.scrollLeft(), scrollY: e.scrollTop() };
				$(document).bind("touchend", data, touchToScrollHandlers.touchEnd);
				$(document).bind("touchmove", data, touchToScrollHandlers.touchMove);
			},
			touchMove: function (event) {
				event.preventDefault();
				var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
				var delta = {x: (touch.pageX - event.data.x), y: (touch.pageY - event.data.y) };
				event.data.element.scrollLeft(event.data.scrollX - delta.x);
				event.data.element.scrollTop(event.data.scrollY - delta.y);
			},
			touchEnd: function (event) {
				$(document).unbind("touchmove", touchToScrollHandlers.touchMove);
				$(document).unbind("touchend", touchToScrollHandlers.touchEnd);
			}
		};

		if (enable === true) {
			this.on("touchstart", touchToScrollHandlers.touchStart);
		}
		else if (enable === false) {
			this.off("touchstart", touchToScrollHandlers.touchStart);
		}
		return this;
	};
})(jQuery);
