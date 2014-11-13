var T1 = T1 || {};

T1.ctaBar = (function() {
	'use strict';

	var _private = {
		container: $('#ctaBar'),
		mainFocus: $('#mainfocus'),
		contractedClass: 'contracted',
		expandedClass: 'expanded',
		tolerance: 0,
		buffers: {viewPort: null, expireDelay: null},
		breakpoints: {
			xs: T1.constants.SCREEN_XTRASMALL,
			sm: T1.constants.SCREEN_SMALL,
			md: T1.constants.SCREEN_MEDIUM,
			lg: T1.constants.SCREEN_LARGE
		},

		init: function() {
			if(m.container.size() && T1.statistics.getPlatform() == 'pc') {
				PubSub.subscribe(c.ON_BREAKPOINT_CHANGE, m.breakpointChanged);
				m.container.find('a').hover(m.expandOne, m.contractOne);
			}
		},
		isContracted: function() {
			return m.container.hasClass(m.contractedClass);
		},
		enable: function() {
			if(m.container.size()) {
				$(window).bind('scroll', m.checkViewPort);
				m.checkViewPort();
			}
		},
		disable: function() {
			if(m.container.size()) {
				m.clearBuffer('viewPort');
				$(window).unbind('scroll', m.checkViewPort);
				m.container.hide();
			}
		},
		contractAll: function() {
			if(!m.isContracted()) {
				setTimeout(function() {
					$.when(m.container.find('a:not(.' + m.expandedClass + ')>span').animate(
							{ right: - m.container.find('a >span:first').width() }
						)).done(function() {
							m.container.addClass(m.contractedClass);
							m.container.find('a >span').addClass(m.contractedClass);
						});
				}, 4000);
			}
		},
		expandOne: function(e) {
			var target = $(e.currentTarget).find('span');
			if(!target.is(':animated')) {
				target.parent().addClass(m.expandedClass);
				if(m.isContracted()) {
					$.when(target.animate(
						{ right: target.parent().width() }
					));
				}
			}
		},
		contractOne: function(e) {
			var target = $(e.currentTarget).find('span');
			if(m.isContracted()) {
				if(target.parent().hasClass(m.expandedClass)) {
					$.when(target.animate(
							{ right: - target.width() }
						)).done(function() {
							target.parent().removeClass(m.expandedClass);
						});
				}
			}
			else {
				target.parent().removeClass(m.expandedClass);
			}
		},
		resetPosition: function() {
			m.container.css({
				top: ($(window).height() - m.container.outerHeight() + m.tolerance) / 2
			});
		},
		breakpointChanged: function(event, breakpoint) {
			m.resetTolerance();
			if(m.breakpoints[breakpoint] >= c.SCREEN_LARGE) { m.enable(); }
			else { m.disable();	}
		},
		resetTolerance: function() {
			m.tolerance = $('#nav-primary').height() + $('#nav-secondary-level').outerHeight();
		},
		checkViewPort: function() {
			if(!m.buffers.viewPort) {
				m.buffers.viewPort = setTimeout(function() {
					if(!T1.utilities.viewport.inView(m.mainFocus, m.tolerance)) {
						if(!m.container.is(':visible')) {
							m.resetPosition();
							m.container.fadeIn({ complete: m.contractAll });
						}
						/*else {
						 m.resetExpireDelay();
						 }*/
					}
					else {
						m.container.fadeOut();
					}
					m.clearBuffer('viewPort');
				}, 300);
			}
		},
		/*resetExpireDelay: function() {
		 if(m.container.is(':visible')) {
		 m.clearBuffer('expireDelay');
		 m.buffers.expireDelay = setTimeout(function() {
		 m.container.fadeOut();
		 m.clearBuffer('expireDelay');
		 }, 3000);
		 }
		 },*/
		clearBuffer: function(key) {
			clearTimeout(m.buffers[key]);
			m.buffers[key] = null;
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		init: _private.init
	};
}());