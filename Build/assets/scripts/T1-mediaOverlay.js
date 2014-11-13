var T1 = T1 || {};

/**
 *	mediaoverlayer: opens the images/video's in an overlayer window
 *
 */

T1.mediaOverlayer = (function () {
	'use strict';

	var _private = {
		carouselId: 'mediaOverlayerCarousel',
		data: null,
		galleryContainer: null,
		detachedIframes: [],

		/* initialize: init the event listeners */
		init: function(){
			var m = _private;
			PubSub.subscribe(T1.constants.GALLERY_ITEM_CLICK, m.show);
			PubSub.subscribe(T1.constants.IFRAME_DESTROY, m.destroyIframe);
		},
		/* function getMediaElement Builds the data collection */
		getMediaData: function (galleryContainer) {
			var m = _private,
				gallery = $(galleryContainer),
				galleryNodes = gallery.find('.gallery-item'),
				galleryNode = null,
				galleryLinkNode = null,
				sType = '',
				iItem = null,
				galleryMode = ($(window).width() > T1.constants.SCREEN_SMALL) ? 'desktop':'mobile',
				src = '',
				galleryData = [];
				if (galleryNodes.length === 0) galleryNodes = gallery.find('a');

			if (m.galleryContainer !== gallery) {
				m.galleryContainer = gallery;

				galleryNodes.each(function (iItem, galleryNode) {
					galleryNode = $(galleryNode);
					galleryLinkNode = galleryNode.hasClass('item-link') ? galleryNode : galleryNode.find('.item-link');
					if ((!galleryLinkNode) || (galleryLinkNode.length === 0)) { galleryLinkNode = galleryNode; }
					sType = galleryNode.data('type');
					switch (sType) {
						case 'image':
							// fetch the mobile or desktop source
							src = galleryLinkNode.data('src-' + galleryMode) || galleryLinkNode.attr('href');
							galleryData.push({'type': sType, 'src': src, 'isLazyLoad':true, 'dataNode': galleryNode});
							break;
						case 'video':
							galleryData.push({'type': sType,
								'srcMp4': galleryLinkNode.data('media-sourcemp4'),
								'srcOgv': galleryLinkNode.data('media-sourceogv'),
								'srcWebm': galleryLinkNode.data('media-sourcewebm'),
								'srcFlv': galleryLinkNode.data('media-sourceflv'),
								'srcVtt': galleryLinkNode.data('media-sourcevtt'),
								'srcVttLang': galleryLinkNode.data('media-sourcevttlang'),
								'poster': galleryLinkNode.data('media-poster'),
								'isLazyLoad':true,
								'dataNode': galleryNode
							});
							break;
						case 'iframe':
							galleryData.push({'type': sType, 'link': galleryLinkNode.attr('href'), 'isLazyLoad':true, 'dataNode': galleryNode});
							break;
						case 'external-video':
							//filter the youtube id and add to slide
							galleryData.push({'type': sType, 'youtubeId': T1.utilities.youtube.getYouTubeId(galleryLinkNode.attr('href')), 'isLazyLoad':true, 'dataNode': galleryNode});
							break;
					}
				});
				m.data = galleryData;
			}
			return m.data;
		},

		/* hides the media overlayer */
		hide: function(){
			var m = _private;
			//Stop keylistening
			$('body').off('onkeydown', m.captureKeys);
			//Close the pageoverlayer
			PubSub.publish(T1.constants.PAGEOVERLAYER_CLOSE);
			//Overlayer hide
			PubSub.publish(T1.constants.MEDIAOVERLAYER_HIDE);
			return true;
		},

		/* opens the media overlayer */
		show: function (evName, data) {
			var m = _private,
				iActiveSlide = data.index || 0,
				galleryContainer = $(data.el).closest('.gallery') || $('.gallery'),
				sectionTitle = $(data.el).closest('section').attr('data-section-title') || data.pageName,
				dataTypeVideo = ($(data.el).parent().attr('data-type') === 'video') ? true : false;

			// connect key listeners
			$('body').on('keydown', m.captureKeys);

			// open the page overlayer
			var dummyContainer = $('<div></div>');
			PubSub.publishSync(T1.constants.CAROUSEL_CREATE,{targetNode:dummyContainer,slides:m.getMediaData(galleryContainer),activeSlide:iActiveSlide, id: m.carouselId, type:'slide', options:{interval: false}, enableSwipe:true});

			var socialTools = null;


			if($('.social-tools').length > 0) {
				var btnShare = $('.social-tools').find('.share-button.clean').clone(true);
				btnShare.find('.sprite-share-arrow').attr('class','sprite-share-arrow-inverted');
				socialTools  = $('<div id="social-tools-gallery"></div>');
				btnShare.appendTo(socialTools);
				socialTools.appendTo(dummyContainer);
			}

			PubSub.publishSync(T1.constants.PAGEOVERLAYER_OPEN, {html:dummyContainer, 'styleClass':'mediaOverlayer', pageName:sectionTitle, fitImages:true});
			var onSlid = function(){
					var active 	 = $('#'+m.carouselId+' .carousel-inner .item.active');

					if (active.find('img').length == 1) {
						m.loadImage($('#'+m.carouselId+' .carousel-inner .item.active img'));
					}
					else if ( active.find('iframe').length == 1 || active.attr('data-detachedIframe') ) {
						m.attachIframe();
						m.loadIframe(active.find('iframe'));
					}
					else {
						if (active.find('iframe')) {
							$('#'+ m.carouselId + ' .item').not('.active').find('iframe').css({'display':'none'});
							PubSub.publish(T1.constants.IFRAME_DESTROY);
						}
					}
					if(socialTools) {
						var index = $('.item.active').index();
						socialTools.attr('data-link', location.href.replace(/[^/]+$/, index));
					}
				},
				onSlide = function(){
					$('#' + m.carouselId + ' .item').not('.active').find('img').css({'display':'none'});
					m.detachIframe();
					PubSub.publish(T1.constants.VIDEO_STOP, {});
				},
				onPageLoaded = function(){
					onSlid();
					var carousel = $('#' + m.carouselId);
					// bind carousel events
					carousel.on('slid.bs.carousel', onSlid);
					carousel.on('slide.bs.carousel', onSlide);
					//unsubscribe load event
					PubSub.unsubscribe(tokenPageOverlayerLoad);
				};
			var tokenPageOverlayerLoad = PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, onPageLoaded);
		},

		/*
		* Captures the keypress events
		* */
		captureKeys: function(ev){
			var m = _private,
				event = window.event || ev;
			if(event){
				switch(event.keyCode){
					case T1.constants.KEYCODE_ESC:
						m.hide();
						break;
				}
			}
		},

		loadImage: function(imageNode){
			var m = _private,
				imageNodes = [imageNode, imageNode.parent().next('.item').find('img'), imageNode.parent().prev('.item').find('img')],
				iImageNode = 0,
				loadFn = function(){
					PubSub.publish(T1.constants.PAGEOVERLAYER_RESIZE_IMAGE, {});
					m.hideLoader();
					if ($(this).parent().find('video').length === 0){
						$(this).fadeIn('slow').css({display:"block",position: "absolute",top:0});
					}
				};

			for(iImageNode in imageNodes){
				var node = imageNode,
					src = node.data("lazy-load");
				// WebKit needs to have an empty SRC otherwise it will infini-load
				node.attr("src", "");
				node.on("load", loadFn);
				node.attr("src", src);

			}
			m.showLoader();
		},

		showLoader: function(){
			var m = _private;
			if ($('.loaderLayer').length === 0){
				var loaderLayer = $("<div></div>").addClass('loaderLayer').appendTo('#'+ m.carouselId).show();
			}else{
				$('.loaderLayer').show();
			}
		},

		hideLoader: function(){
			$('.loaderLayer').hide();
		},

		loadIframe: function(iFrameNode_lint) {
			var iFrameNode = iFrameNode_lint,
				lazySrc = iFrameNode.attr('data-lazy-load'),
				sticky = iFrameNode.attr('sticky'),
				m = _private;
			if (!sticky) {
				if (lazySrc) {
					iFrameNode.attr('src',lazySrc);
					iFrameNode.on('load',function() {
						m.hideLoader();
						iFrameNode.fadeIn('slow');
					});
				}
				m.showLoader();
			}
		},

		/*
		* re-insert the iframe, if it was detached for the current slide
		* */
		attachIframe: function(){
			var m = _private,
				active = $('#' + m.carouselId + ' .item.active');

			if( active.attr('data-type') == 'external-video' && active.attr('data-detachedIframe') ){
				var index = parseInt(active.attr('data-detachedIframe'));
				if( m.detachedIframes[index] !== undefined ){
					m.detachedIframes[index].appendTo(active);
					m.detachedIframes[index] = undefined;
					active.removeAttr('data-detachedIframe');
				}
			}
		},
		/*
		* detach the an iframe if present in the current external video 
		* */
		detachIframe: function(item){
			var m = _private,
				active = $('#' + m.carouselId + ' .item.active');
			if( active.attr('data-type') == 'external-video' ){
				var iframe = active.find('iframe');
				if(iframe.length > 0){
					iframe = iframe.detach();
					m.detachedIframes.push(iframe);
					active.attr('data-detachedIframe',m.detachedIframes.length-1);
				}
			}
		},
		destroyIframe: function() {
			/*
			* use attribute 'sticky=true' or just 'sticky' to disable the destroying of the iFrame
			* */
			var m = _private,
				iFrameNode = $('#'+ m.carouselId + ' .item').not('.active').find('iframe'),
				lazySrc = iFrameNode.attr('src');
			if (iFrameNode) {
				if (!iFrameNode.attr('sticky')) {
					iFrameNode.data('lazy-load',lazySrc);
					iFrameNode.attr('src', '');
				}
			}
		}

	};
	return {
		init: _private.init,
		build: _private.build,
		show: _private.show,
		hide: _private.hide
	};

}());