var T1 = T1 || {};

/**
 * bubble component
 * version 1.0
 * KGH: init
 */
T1.bubble = ( function () {
	'use strict';

	// private vars for facade pattern (return public vars/functions)
	var _bubble = {
		initDesktop: function() {
			var m = _bubble,
				c = T1.constants;

			PubSub.subscribe(c.PAGEOVERLAYER_LOAD, m.initOnDemand);

			m.initOnDemand();
		},
		initOnDemand: function() {
			var m = _bubble,
				triggers = $('[data-bubble]');

			triggers.unbind().bind('click', m.toggle);
		},
		toggle: function(e) {
			var m = _bubble,
				trigger = $(e.target),
				position = trigger.position(),
				width = trigger.width(),
				bubble = $('.' + trigger.data('bubble')),
				isActive = bubble.hasClass(T1.constants.CLASS_ACTIVE);

			e.preventDefault();

			m.hideAll();

			bubble.css('left', position.left + (width / 2) - 48);

			if (!isActive) {
				bubble.addClass(T1.constants.CLASS_ACTIVE);
			}
		},
		hideAll: function() {
			var bubbles = $('.bubble');

			bubbles.removeClass('active');
		}
	};
	return {
		initDesktop				: _bubble.initDesktop,
		initMobile				: _bubble.initMobile
	};
}());