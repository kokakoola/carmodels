var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *
 */
T1.toast = ( function() {

	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		content: null,
		init: function(){
			_private.content = (T1.labels) ? T1.labels.toastText : '';
			PubSub.subscribe(T1.constants.TOAST_CUSTOM,_private.prepare);
			$(window).on('orientationchange', _private.resetPos);
		},
		prepare: function(evName, data){

			if (!data.customContainer) {
				return;
			}

			var m = _private,
				container = data.customContainer,
				content = data.customText || _private.content,
				cssHide = {'display': 'none'},
				timeout = data.timeout || false;

			$('.toast', container).hide();

			var toast = $('<div/>');

			if (!data.removeDefaultClass) {
				toast.addClass('toast');
			}
			if (data.customClass) {
				toast.addClass(data.customClass);
			}

			toast.html(content);
			toast.css(cssHide).appendTo(container);

			if(! data.noPosition){
				var pos = (data && data.centerScreen) ? m.centerScreen(toast) : m.getPos(toast, container);
				toast.css({
					'position':(data && data.centerScreen) ? 'fixed' : 'absolute',
					'top': data.top || pos.y,
					'left': data.left || pos.x
				});

				if (data.css) {
					toast.css(data.css);
				}
			}

			toast.css({'cursor': 'pointer'});
			m.show(toast, data.immediate);

			if (timeout && typeof timeout === 'number') {
				setTimeout(function () {
					m.hide(toast);
				}, timeout);
			} else {
				container.on('mousedown touchstart', function () {
					m.hide(toast);
				});
			}
		},
		getPos: function(el, container){
			var top = (container.height() / 2) - (el.innerHeight() / 2);
			var left = (container.width() / 2) - (el.innerWidth() / 2);
			return {"x": left + "px", "y": top + "px"};
		},
		centerScreen: function(el){
			return _private.getPos(el, $(window));
		},
		show: function(el, immediate){
			if (immediate) {
				el.show();
			} else {
				el.fadeIn(T1.constants.ANIMATION_SPEED_FADE);
			}
		},
		hide: function(el){
			el.fadeOut(T1.constants.ANIMATION_SPEED_FADE, function(){
				$(this).remove();
			});
		},
		resetPos: function() {
			var m = _private,
				toast = $('.toast'),
				container = toast.closest('section'),
				pos = m.getPos(toast, container);

			toast.css({
				'top': pos.y,
				'left': pos.x
			});
		}
	};
	return {
		"init":_private.init
	};
})();