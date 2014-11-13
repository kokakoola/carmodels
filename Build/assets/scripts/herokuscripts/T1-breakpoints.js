var T1 = T1 || {};

/**
 * version 0.2
 * Date: 05-12-2013
 * Time: 21:45
 *
 * DMA: set current breakpoint on load
 * DMA: fixed a viewport width problem
 * DMA: stopped sending events on breakpoint === ''
 *
 * SCREEN_XTRASMALL	: 480,
 * SCREEN_SMALL		: 768,
 * SCREEN_MEDIUM	: 992,
 * SCREEN_LARGE		: 1200,
 */

T1.breakpoints = (function () {
	'use strict';
	var _props = {
		currentBreakpoint: '',
		breakpoints: {
			xs: T1.constants.SCREEN_XTRASMALL,
			sm: T1.constants.SCREEN_SMALL,
			md: T1.constants.SCREEN_MEDIUM,
			lg: T1.constants.SCREEN_LARGE
		}
	};
	var _private = {
		init: function () {
			_private.setCurrentBreakpoint();
			PubSub.subscribe(T1.constants.ON_WIN_RESIZE, _private.setCurrentBreakpoint);
		},
		setCurrentBreakpoint: function(){
			var viewportWidth = window.innerWidth || $(window).innerWidth(),
				biggestBreakpoint = 0,
				auxCurrentBreakpoint = '';
			for(var bk in _props.breakpoints) {
				if(viewportWidth >= _props.breakpoints[bk] && biggestBreakpoint < _props.breakpoints[bk]){
					auxCurrentBreakpoint = bk;
					biggestBreakpoint = _props.breakpoints[bk];
				}
			}
			if(auxCurrentBreakpoint === ''){
				auxCurrentBreakpoint = 'xs';
			}
			if(auxCurrentBreakpoint != _props.currentBreakpoint){
				_props.currentBreakpoint = auxCurrentBreakpoint;
				PubSub.publish(T1.constants.ON_BREAKPOINT_CHANGE, _props.currentBreakpoint);
			}
		},
		returnCurrentBreakPoint: function() {
			return _props.currentBreakpoint;
		}
	};
	return {
		init: _private.init,
		currentBP: _private.returnCurrentBreakPoint
	};
}());