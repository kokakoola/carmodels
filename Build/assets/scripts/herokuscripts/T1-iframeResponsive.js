var T1 = T1 || {};

/**
 *	iframeresponsive:
 *		detect figure tags to replace with iframe/object/embedded video
 *
 */
T1.iframeresponsive = ( function() {
	'use strict';

	var _private = {
		init: function() {
			var m = _private;
			PubSub.subscribe(T1.constants.ON_WIN_RESIZE, m.resizeIframes);
			PubSub.subscribe(T1.constants.IFRAME_LOAD, m.initResponsiveIframe);
			$(window).on('message', m.resizeIframes);
		},

		initResponsiveIframe: function(evtName, el) {
			var m = _private,
				frames = $(el);
			$(el).off('load', m.resizeIframes).on('load', frames, m.resizeIframes);
			m.resizeIframes({'data':frames});
		},

		resizeIframes: function(evt) {
			var m = _private,
				frame = null;

			if(evt.type==='message'){
				// message received via post messages (might be cross domain)
				frame = m.findIframe(evt.originalEvent.source);
				if(frame){
					//size if the response is not comming from an overlayer iframe
					if(! frame.is('.overlayerContent > div > iframe')){
						frame.height(evt.originalEvent.data);
					}
				}
			}else{
				// iframe loaded || parent document sized
				var frames = evt.data || $('.iframe-responsive');
				for(var i=0; i<frames.length; i++){
					frame = frames.eq(i);
					if(frame.attr('crossdomain') !== 'true') frame.height(frame.contents().find('body').height()+60);
				}
			}

		},

		findIframe: function(window) {
			var frames = $('iframe');
			for(var iFrame=0; iFrame<frames.length; iFrame++){
				if(frames[iFrame].contentWindow === window) return frames.eq(iFrame);
			}
		}
	};

	return {
		init	: _private.init
	};

}());

