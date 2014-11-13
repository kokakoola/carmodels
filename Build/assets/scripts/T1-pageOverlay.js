var T1 = T1 || {};

/**
 *	pageOverlayer: stacks multiple pages in overlayers
 *
 */

T1.pageOverlayer = ( function() {
	'use strict';

	/* PRIVATE METHODS - PROPERTIES */
	var _private = {
		pageStack: [],
		defaultHtml: '<div></div>',
		className: 'overlayerWrapper',
		mainContentId: 'pagecontent',
		animationDelay: 10,
		scrollTop: 0,
		disableScrollClass: 'no-scroll',
		disableResizeClass: 'no-resize',
		disableFitImageClass: 'no-fit-image',
		youtubeUrl: 'http://www.youtube.com/embed/<id>?rel=0&hd=1;autoplay=1;controls=0;modestbranding=1&wmode=opaque&html5=1',
		tokenOnResize: null,
		contentOnOverlay: $('.content-on-overlay'),

		//initialize the component (connect event listeners)
		init: function(){
			var m = _private;
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_OPEN, m.show);
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_CLOSE, m.hide);
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_RESIZE_IMAGE, m.fitImage);
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_RESIZE, m.resize);
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_DESTROY, m.destroy);
			if(m.contentOnOverlay.length > 0) {
				PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {html: m.contentOnOverlay, fitImages: true, noScroll: true});
			}
		},

		/* opens the pageoverlayer
		* data: {
		*	html: (string|object) html code to add in the overlayer,
		*	video: {
		*		srcOgv: path to the ogv source,
		*		srcWebm: path to the wbm source,
		*		srcFlv: path to the flv source,
		*		srcMp4: path to the mp4 source,
		*		srcVtt: path to the subtitle,
		*		autoplay: automatically play the video,
		*		poster: path to the poster image
		*	},
		*	inPage: (boolean) opens the overlayer in the same page (with the navigation still available) & updates the breadcrumb with the pagename,
		*	noResize: (boolean) prevents the resize function,
		*	html5id: (String) tcm id to the html5 component,
		*	noScroll: (boolean) disables scroll,
		*	el: (jQuery object) item that triggered the event
		*	youtubeId: id of the youtube video,
		*	ajax: url or element,
		*	pageName: overrules the name of the page,
		*	iframe: (Boolean) indicates that an iframe should be used in the overlayer,
		*	styleClass: (string) extra class that can be added on the overlayer node,
		*	backCaption: (string) close caption,
		*	backCaptionStrong: (string) bold close caption,
		*	preserveContent: move back the html content to it's original place (only use when the data.html refers to an element in the pagecontent),
		*	noFade: (boolean) disable the fade effect after slide
		*	noTransitions: (boolean) disables transitions
		*	fitImages: (boolean) automatically fits images to the right size
		* }*/
		show: function(eventName, data){
			var m = _private,
				html = data.html || m.defaultHtml,
				htmlObj = $(html),
				preserveContent = data.preserveContent || false,
				originalDataPosition = null,
				backCaption = data.backCaption || (T1.labels ? T1.labels.backTo : 'Back to '),
				pageName = data.pageName || $(data.el).closest('section').data('section-title'),
				backCaptionStrong = data.backCaptionStrong || pageName || (T1.labels ? T1.labels.page : 'page'),
				overlayerClass = ' ' + (data.styleClass || '') + (data.inPage ? ' inpage' : ''),
				pageContainer = $('<div></div>').addClass(m.className + overlayerClass),
				inPage = data.inPage || false,
				scrollClass = data.noScroll ? (' ' + m.disableScrollClass) : '',
				resizeClass = data.noResize ? (' ' + m.disableResizeClass) : '',
				fitImageClass = !(data.fitImages) ? (' ' + m.disableFitImageClass) : '',
				noFade = data.noFade || inPage || false,
				noTransitions = data.noTransitions || false,
				contentContainer = $('<div></div>').addClass('overlayerContent' + scrollClass + resizeClass + fitImageClass);


			//resize elements
			var onResize = function(){
				PubSub.publish(T1.constants.PAGEOVERLAYER_RESIZE, {});
				PubSub.publish(T1.constants.PAGEOVERLAYER_RESIZE_IMAGE, {});
			};
			if (!m.tokenOnResize) {
				m.tokenOnResize = PubSub.subscribe(T1.constants.ON_WIN_RESIZE, onResize);
			}

			//remember the scrolltop
			if (m.pageStack.length === 0) {
				m.scrollTop = $(document).scrollTop();
			}

			//check if the htmObj already is the overlayer container
			if (htmlObj.hasClass(m.className)) {

				pageContainer = htmlObj;

			} else {

				//check if the toolbar is already rendered in the htm part
				if(htmlObj.find('.toolbar').length===0 && !inPage){
					var toolbar = m.buildToolbar({
						backCaption: backCaption,
						backCaptionStrong: backCaptionStrong
					});
					toolbar.appendTo(pageContainer);
				}

				if(inPage){
					m.removeBackButtons();
					m.buildInPageToolbar().prependTo(contentContainer, pageContainer);
				}

				// before moving the html node, add a placeholder to the original data position; in case of preserveContent: the data will get restored to this position
				if (preserveContent) {
					originalDataPosition = $('<figure data-type=\'pageoverlayer-placeholder\'></figure>');
					htmlObj.before(originalDataPosition);
				}
				// append the html node to the content container -> move the content container to the secondary page container
				htmlObj.appendTo(contentContainer);
				contentContainer.appendTo(pageContainer);
			}

			//ADD SPECIAL CONTENT TO THE OVERLAYER
			if (data.html5id) {
				data.iframe = true;
				data.url = '/api/html/page' + location.pathname + '?id=' + data.html5id;
			}
			if (data.youtubeId) {
				m.addYouTube(htmlObj, data);
			}
			if (data.iframe) {
				m.addIFrame(htmlObj, data);
			}
			if (data.ajax) {
				m.addAjaxContent(htmlObj, data);
			}
			if (data.video) {
				m.addVideo(htmlObj, data);
			}

			//hide the child container divs (they need to fade in)
			pageContainer.find('> div').css({'display':'none'});

			//add the current overlayer to the stack of overlayers; the original data postition is used to restore the content to it's original place
			m.pageStack.push({name: pageName, el: pageContainer, originalDataPosition: originalDataPosition, noTransitions: noTransitions, noFade: noFade});
			pageContainer.appendTo($('body'));
			
			var fadeInCompleted = false,
				windowLoaded = false,
				overlayLoaded = false;
			//listen to the iframe ready state
			if(data.iframe && data.sync){
				try{
					//wait until the iframe is loaded
					var contentWin = contentContainer.find('iframe').get(0).contentWindow;
					$(contentWin).load(function () {
						windowLoaded = true;
						if(fadeInCompleted && !overlayLoaded)
						{
							PubSub.publish(T1.constants.PAGEOVERLAYER_LOAD, {el: pageContainer});
							overlayLoaded = true;
						}
					});
				}catch(e){
					data.sync = false;
				}
			}

			//start the slide in effect
			var fadeInCallback = function(){
				fadeInCompleted = true;
				contentContainer.scrollTop(0);
				//publish the pageoverlayer loaded event
				if(!(data.iframe && data.sync) || (windowLoaded && !overlayLoaded)){
					//send the load event
					PubSub.publish(T1.constants.PAGEOVERLAYER_LOAD, {el: pageContainer});
					overlayLoaded = true;
				}
			};
			var slideInCallback = function(){
				$('#nav-primary').hide();
				//hide the current overlayer pages + the original content
				$('#' + m.mainContentId).css({'display':'none'});
				$('.' + m.className + ':not(:last)').css({'display':'none'});
				//in case of inpage overlayer -> restore the window scroll
				if(inPage){
					pageContainer.css({'position':'static'});
					$(window).scrollTop(0);
				}
				//resize poster image/image
				PubSub.publish(T1.constants.PAGEOVERLAYER_RESIZE, {el: pageContainer});
				PubSub.publish(T1.constants.PAGEOVERLAYER_RESIZE_IMAGE, {el: pageContainer});
				//fade in the toolbar + content
				pageContainer.find('.toolbar').fadeIn(T1.constants.ANIMATION_SPEED_FADE);
				if(noFade || noTransitions){
					pageContainer.find('> div').css({'display':'block'});
					fadeInCallback();
				}else{
					pageContainer.find('.overlayerContent').fadeIn(T1.constants.ANIMATION_SPEED_FADE, fadeInCallback);
				}
			};
			if(noTransitions){
				pageContainer.css({'margin-left':0});
				slideInCallback();
			}else{
				pageContainer.animate({'margin-left': 0}, T1.constants.ANIMATION_SPEED_SCROLL, slideInCallback);
			}
		},

		/**
		 * add iframe to the targetelement
		 * @param targetEl (jquery element) the element where the iframe should be added to
		 * @param options (plain object) url options
		 */
		addIFrame: function(targetEl, options){
			var node = $('<iframe></iframe>', {
				src: options.url || $('#' + options.el).prop('href'),
				width: 100+'%',
				height: 100+'%'
			});

			targetEl.addClass('white');
			targetEl.append(node);
		},

		/**
		 * add content from an ajax request to the overlayer
		 * @param targetEl (jquery element) the element where the iframe should be added to
		 * @param options (plain object) url options
		 */
		addAjaxContent: function(targetEl, options){
			var url = options.url || $('#' + options.el).prop('href'),
				async = options.sync ? false : true;
			targetEl.addClass('white');
			$.ajax({
				url: url,
				async: async,
				success: function(response) {
					var htmlData = $('<div>' + response + '</div>'),
						fragment = htmlData.find('#pagecontent > *').length > 0 ? htmlData.find('#pagecontent > *') : htmlData.find('body > *');
					targetEl.append(fragment);
					$('.overlayerContent #nav-primary').remove();
				}
			});
		},

		/**
		 * adds a youtube video to the overlayer
		 * @param targetEl (jquery element) the element where the iframe should be added to
		 * @param options (plain object) youtube id options
		 */
		addYouTube: function(targetEl, options){
			var m = _private,
				youtubeNode = $('<iframe></iframe>', {
				src : m.youtubeUrl.replace(/<id>/g, options.youtubeId)
			});
			targetEl.addClass('youtubeWrapper');
			targetEl.append(youtubeNode);
		},

		/**
		 * adds a video to the overlayer
		 * @param targetEl
		 * @param options
		 */
		addVideo: function(targetEl, options){
			// add the videoplayer to the overlayer-content wrapper
			options.video.figure = targetEl;
			// create the video player
			PubSub.publishSync(T1.constants.VIDEO_CREATEPLAYER, options.video);
		},

		/* builds the close toolbar (left)
		 * data = {
		 *	backCaption: (string) close caption
		 *	backCaptionStrong: (string) bold close caption
		 *}
		 * */
		buildToolbar: function (data) {
			var m = _private,
				toolbarNode = $('<div onclick=""></div>'),
				closeLink = $('<a></a>').addClass('close-link'),
				backCaptionSpan = $('<span></span>').addClass('back-text').html(data.backCaption +' '),
				backCaptionStrong = $('<strong></strong>').html(data.backCaptionStrong);
			toolbarNode.addClass('toolbar');

			//build the containers
			closeLink.append('<div class="logo-logo-lvl2"></div>');
			//closeLink.append('<span class="close-icon" onclick=""><i class="icon-remove" data-icon="\f00d" onclick=""></i> </span>');
			closeLink.append('<div class="btn-back" onclick=""><div class="btn-graphic" onclick=""><i class="icon-angle-left" onclick=""></i></div></div>');
			backCaptionSpan.append(backCaptionStrong);
			closeLink.append(backCaptionSpan);
			toolbarNode.append(closeLink);
			var closeEvent = function(e){
				PubSub.publish(T1.constants.HASH_REMOVE, '');
			};
			toolbarNode.on('click', closeEvent);
			return toolbarNode;
		},
		buildInPageToolbar: function(){
			var bbut = $("<a/>").text(T1.labels.backTo+" "+T1.labels.page).addClass("btn btn-grey btn-full-width visible-xs page-overlayer-mobile-back").attr("href", "#");
			$("<i/>").addClass("icon-chevron-left").appendTo(bbut);
			bbut.on("click", function(e){
				e.preventDefault();
				PubSub.publish(T1.constants.HASH_REMOVE, "");
				$(this).remove();
			});
			return bbut;
		},
		/* closes the pageoverlayer and opens the previous one or the main content */
		hide: function(){
			if(_private.pageStack.length===0) return;
			var m = _private,
				iPage = m.pageStack.length- 1,
				page = m.pageStack[iPage], //fetches the last page
				pageContent = page.el.find('.overlayerContent').children(),
				noTransitions = page.noTransitions || false,
				noFade = page.noFade || false;
			//exit if there is nothing to close
			//hide the current page (fade the inner containers >
			var restoreScrollTop = function(e) {
					$(document).scrollTop(m.scrollTop);
				},
				slideOutCallack = function(){
					//display the previous content
					if(iPage===0){
						//stop resizing the overlayers
						PubSub.unsubscribe(m.tokenOnResize);
						m.tokenOnResize = null;
					}
					//remove the page from the stack
					m.pageStack.splice(iPage, 1);
					page.el.remove(); //remove the container
					PubSub.publish(T1.constants.PAGEOVERLAYER_CLOSED, {overlayer:this, content:pageContent});
				},
				fadeOutCallback = function(){
					//restore previous page
					if(iPage!==0) m.pageStack[iPage-1].el.css({'display':'block'});
					// preserve data -> move the pageoverlayer content back to it's original place
					if(page.originalDataPosition){
						page.originalDataPosition.replaceWith(pageContent);
					}
					// restore the maincontent
					if(iPage===0){
						$('#' + m.mainContentId).css({display:'block'});
						restoreScrollTop();
						// reopen the pagecontent
						PubSub.publish(T1.constants.PAGEOVERLAYER_REOPEN_MAINCONTENT);
					}
					// restore navigation
					$('#nav-primary').show();
					// close the pageconent
					if(noTransitions){
						page.el.css({'display':'none'});
						slideOutCallack();
					}else{
						// slide out the current overlayer
						page.el.animate({'margin-left':'100%'}, T1.constants.ANIMATION_SPEED_SCROLL, slideOutCallack);
					}


				};
			//.fadeOut(T1.constants.ANIMATION_SPEED_FADE, fadeOutCallback);
			var toolbar = page.el.find('> .toolbar'),
				pageContainer = page.el.find('> .overlayerContent');
			// overrule the static position @ inpage overlayer
			page.el.css({'position':'fixed'});

		//	FIX INC000000275293
		//	m.removeBackButtons();

			// close the page
			if(noTransitions || noFade){
				toolbar.css({'display':'block'});
				pageContainer.css({'display':'block'});
				fadeOutCallback();
			}else{
				pageContainer.fadeOut(T1.constants.ANIMATION_SPEED_FADE, fadeOutCallback);
				toolbar.fadeOut(T1.constants.ANIMATION_SPEED_FADE);
			}
		},
		removeBackButtons: function(containers) {
			$('.page-overlayer-mobile-back').remove();
		},
		/*
		* Resize image to fit the whole content container
		* data: {
		*	image: node
		* }
		* */
		fitImage: function(evName, data){
			var m =_private,
				contentNode = $('.overlayerContent').last();
			if(contentNode.hasClass(m.disableFitImageClass)) return;
			if(! contentNode.offset || contentNode.length === 0) return;

			var contentOffset = contentNode.offset(),
				vh = $(window).height() - contentOffset.top,
				vw = $(window).width() - contentOffset.left,
				imageNode = data.image || contentNode.find('.item.active img');
			if(imageNode.length===0) imageNode = contentNode.find('#content-on-overlay > img');

			//try to grab the video poster if there is no active image
			if(imageNode.length===0){imageNode =  contentNode.find('> .posterWrapper > img');}

			var ih = imageNode.height(),
				iw = imageNode.width(),
				aspectContainer = vw/vh,
				aspectImage = iw/ih;

			if(imageNode.length===0) return;

			if(aspectImage > aspectContainer){
				imageNode.css({
					'height': vh,
					'width': 'auto',
					'margin-top': 0,
					'margin-left': - Math.floor(vh * aspectImage - vw) / 2
				});
			}else{
				imageNode.css({
					'height': 'auto',
					'width': vw,
					'margin-top': - Math.floor(vw / aspectImage - vh) / 2,
					'margin-left': 0
				});
			}
		},

		/**
		 * Resizes the overlayer content
		 */
		resize: function(evName, data){
			if(! data) data={};
			var m = _private,
				overlayer = data.el || $('.overlayerWrapper').last(),
				content = overlayer.find('.overlayerContent');
			// if there is no content -> quit execution
			if(content.length===0) return;
			// exit if the no resize class is set
			if(content.hasClass(m.disableResizeClass)) return;
			//resize the content container
			var w = $(window),
				wWidth = w.width(),
				className = (wWidth >= T1.constants.SCREEN_SMALL) ? 'desktop' : ((w.height()> wWidth) ? 'portrait' : 'landscape');
			overlayer.removeClass('landscape portrait desktop');
			overlayer.addClass(className);
			var contentOffset = {'left': content[0].offsetLeft, 'top': content[0].offsetTop},
				width = (wWidth - contentOffset.left) + 'px',
				height = (w.height() - contentOffset.top) + 'px';
			content.css({'width':width, 'height':height});
		},

		/** destroys all pagestacks
		 * @param evName
		 */
		destroy: function(evName){
			var m = _private,
				page = null;
			for(var iPage=0; iPage < m.pageStack.length; iPage++){
				page = m.pageStack[iPage];
				// preserve data -> move the pageoverlayer content back to it's original place
				if(page.originalDataPosition){
					page.originalDataPosition.replaceWith(page.el.find('.overlayerContent').children());
				}
				//destroy layer
				page.el.remove();
			}
			//reopen the maincontent
			PubSub.publish(T1.constants.PAGEOVERLAYER_REOPEN_MAINCONTENT);
			//destroy stack
			m.pageStack = [];
			//show main content
			$('#' + m.mainContentId).css({display:'block'});
			//restore scrolltop
			$(document).scrollTop(m.scrollTop);
		}
	};

	/* EXPOSED METHODS - PROPERTIES */
	return {
		init: _private.init,
		show: _private.show,
		hide: _private.hide,
		fitImage: _private.fitImage,
		fitVideo: _private.fitVideo
	};

}());