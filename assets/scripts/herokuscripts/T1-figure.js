var T1 = T1 || {};

/**
 *	figure:
 *		detect figure tags to replace with iframe/object/embedded video
 *
 */
T1.figure = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		isDocumentLoad: false,
		/**
		 * init: get all external video containers & call replace
		 * <figure data-type="ajax-video" data-url="urltothejsonobjec" data-preventdefaultload=true>
		 */
		init : function() {
			var m = _private;
			m.isDocumentLoad = true;
			m.processFigures();
			PubSub.subscribe(T1.constants.FIGURE_LOAD, m.callbackFigures);
			m.isDocumentLoad = false;
		},
		/**
		 * publish callback
		 * @param msg
		 * @param data: container jquery object
		 */
		callbackFigures : function(msg, data) {
			_private.processFigures(data);
		},
		/**
		 * process figure tags in page.
		 * @param container: container for figures
		 */
		processFigures : function(container) {
			var figures;
			if (!(container && container.length > 0)) container = $('body');
			figures = container.find('figure');
			figures.each(_private.replaceTag);
			PubSub.publishSync(T1.constants.EPRIVACY_LOAD_COMPONENT, {defer: false});
		},
		/**
		 * replace figure tag with iframe
		 */
		replaceTag : function() {
			var m = _private,
				figure = $(this),
				figureData = figure.data(),
				sType = figureData.type.toLowerCase(),
				bNeedsLoad = figure.data('preventdefaultload');

			//some figures should not get replaced on document load
			if(bNeedsLoad && m.isDocumentLoad) return;

			switch(sType) {

				case 'ajax-video':
					var videoData = {figure:figure};
					$.getJSON(figureData.url, function(data) {
						$.each(data.movie.sources, function(key, value) {
							var url = value.binary.url;
							videoData['src' + value.ext.capitalize()] = url;
						});
						videoData.poster = data.movie.poster.binary.url;
						PubSub.publishSync(T1.constants.VIDEO_CREATEPLAYER, videoData);
					});
					break;

				case 'eprivacy':
					PubSub.publishSync(T1.constants.EPRIVACY_LOAD_COMPONENT, {figures: figure, defer: true});
					break;

				default:
					var src = figureData.src || '',
					ytb = src.indexOf('youtube') > -1;
					if(!ytb || !figureData.eprivacy || T1.ePrivacy.validateLevel(figureData.eprivacy)) {
						var frame = _private.initIframe(sType, figure, figureData, ytb);
						if(ytb && figureData.eprivacy && T1.ePrivacy.validateLevel(figureData.eprivacy)) {
							T1.ePrivacy.registerComponent(frame, figure, figureData.eprivacy);
						}
					}
			}
		},
		initIframe: function(type, figure, figureData, ytb) {
			var frame = $('<iframe>'),
				paramsObj = null,
				queryString = '',
				isLazyLoad = false;

			if(figure.attr('data-copy-querystring')){
				paramsObj = T1.request.getQueryStringParameters();
				if(! $.isEmptyObject(paramsObj)) queryString = '?' + $.param(paramsObj);
			}

			$.each(figureData, function(key, value) {

				if(key === 'src'){
					if(typeof value==='string' && value.indexOf('?')!==-1) queryString = queryString.replace(/\?/, '&');
					value += queryString;
				}

				if(key.indexOf('lazyload')!==-1){
					key = 'data-lazyload-' + key.replace('lazyload', '');
					if(typeof value==='string' && value.indexOf('?')!==-1) queryString = queryString.replace(/\?/, '&');
					value += queryString;
					isLazyLoad = true;
				}

				frame.attr(key, value);
			});

			// add scroll tracking for lazyloading the iframe
			if(isLazyLoad) PubSub.publish(T1.constants.SCROLL_TRACK_ADD, {elements: frame, options:{once:true}});

			if(ytb){
				frame.attr('src', T1.utilities.youtube.getEmbedUrl(figureData.src, {'autoplay': '0'}));
			}

			figure.replaceWith(frame);

			if(type==='responsive-iframe'){
				frame.addClass('iframe-responsive');
				PubSub.publish(T1.constants.IFRAME_LOAD, frame);
			}

			return frame;
		}
	};

	return {
		init	: _private.init
	};

}());