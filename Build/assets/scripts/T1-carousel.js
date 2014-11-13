var T1 = T1 || {};

/**
 *	carousel:
 *
 */

T1.carousel = (function () {
	'use strict';

	var _private = {
		carouselId: 'T1Carousel',
		carouselIndex: 0,
		carouselClass: 'carousel-container',
		carouselInnerClass: 'carousel-inner',
		carouselExpanded: 'expanded',
		carouselType: 'slide',
		carouselInnerNode: null,
		youtubeUrl: 'http://www.youtube.com/embed/<id>?rel=0&hd=1;autoplay=1;controls=0;modestbranding=1&wmode=opaque',

		init: function(){
			$('.' + m.carouselClass).each(function(){
				m.initializeCarousel(this, $(this).data());
			});
			m.initializeCarouselExpanders();
			PubSub.subscribe(T1.constants.CAROUSEL_CREATE, m.buildCarousel);
			PubSub.subscribe(T1.constants.CAROUSEL_INITIALIZE, m.initializeCarousel);
			PubSub.subscribe(T1.constants.CAROUSEL_EXPAND, m.toggleExpand);
			m.animations.set();
			$('body').on('keydown', m.captureKeys);
		},

		animations: {
			set: function() {
				for (var animation in m.animations) {
					if (animation !== 'set' && m.animations[animation].init) {
						m.animations[animation].init();
					}
				}
			},
			fade: {
				init: function() {
					var $carouselFade = $('.carousel.fade');
					if (!Modernizr.csstransitions && $carouselFade.length > 0) {
						$carouselFade.find('.item').css({ zoom: 1, filter: 'alpha(opacity=0)', opacity: 0 });
						$carouselFade.find('.item.active').css({ zoom: 1, filter: 'alpha(opacity=100)', opacity: 1 });
						$carouselFade.on('slid.bs.carousel', function () {
							var $item = $(this).find('.item.active');
							$item.animate({ 'opacity': 1 }, 500);
						}).on('slide.bs.carousel', function() {
								var $item = $(this).find('.item.active');
								$item.animate({ 'opacity': 0 }, 500, function(){
									$(this).trigger("slid.bs.carousel");
								});
							});
					}
				}
			}
		},

		/*
		 * Shows the next slide in the carousel
		 * */
		next: function(){
			$('.carousel-control.right').trigger('click');
		},

		/*
		 * Shows the previous slide in the carousel
		 * */
		previous: function(){
			$('.carousel-control.left').trigger('click');
		},

		/*
		 * Captures the keypress events
		 * */
		captureKeys: function(ev){
			ev = window.event || ev;
			if(ev){
				switch(ev.keyCode){
					case T1.constants.KEYCODE_LEFT:
						m.previous();
						break;
					case T1.constants.KEYCODE_RIGHT:
						m.next();
						break;
					case T1.constants.KEYCODE_ESC:
						m.hide();
						break;
				}
			}
		},

		/**
		 * initializes a carousel object on already existing html containers
		 * @param selector (String / Object - jQuery object/DOM node/selector) the carousel DOM node
		 * @param options (Object) {
		 *     see http://getbootstrap.com/javascript/#carousel-usage,
		 *     enableswipe: (Boolean) enables swipe on the carousel
		 * }
		 */
		initializeCarousel: function(selector, options) {
			var carousel = $(selector),
				enableSwipe = options.enableswipe || true;
			//enable bright tagging
			m.enableBTTracking({prev: carousel.find('.carousel-control.left'), next: carousel.find('.carousel-control.right'), indicators: carousel.find('.carousel-indicators li')});
			//init carousel & DISABLE SCROLLS (JIRA 1620)
			if(! options) {
				options = {};
				options.interval = false; //disable interval options
			}
			carousel.carousel(options);
			m.animations.set();
			//enable swipe
			if(enableSwipe) m.enableSwipe({'carousel': carousel});

			carousel.on('slid.bs.carousel', function (e) {
				PubSub.publish(T1.constants.CAROUSEL_SLIDE, {
					carousel: carousel
				});
			});

			// publish carousel created element
			PubSub.publish(T1.constants.CAROUSEL_CREATED, carousel);
		},

		/**
		 * initializes carousels expanders
		 */
		initializeCarouselExpanders: function() {
			$('.carousel-expander[data-carousel]').unbind('click', m.toggleExpand).click(function(e){
				var $this = $(this);
				PubSub.publishSync(T1.constants.CAROUSEL_EXPAND, {
					expanded: !$this.hasClass(m.carouselExpanded),
					expander: $this,
					carousel: $($this.data('carousel')).find('.' + m.carouselClass)
				});
				e.preventDefault();
			});
		},

		/**
		 * toggle expand carousel
		 */
		toggleExpand: function(event, data) {
			data.expander.toggleClass(m.carouselExpanded, data.expanded);
			data.carousel.toggleClass(m.carouselExpanded, data.expanded);
			if(data.carousel.hasClass(m.carouselExpanded)){
				data.expander.text(T1.labels.viewLess);
				data.carousel.carousel('pause');
			}
			else {
				data.expander.text(T1.labels.viewAll + ' (' + data.expander.data('carousel-size') + ')');
				data.carousel.carousel('cycle');
			}
		},

		/**
		 * Builds a carousel from the data.slides
		 * @param evName (String) pubsub event name
		 * @param data (Object) {
		 *		activeSlide: (int) the index of the selected item,
		 *		targetNode: (jQuery Object)the node to which the carousel should be appended,
		 *		type: (String) fade/slide,
		 *		slides: Array [ (Object) {
		 *			type: (String) image/video/youtube/html/iframe
		 *			src: (String hyperlink) source to the image/iframe
		 *			html: (String/Object/jQuery Object/Selector)
		 *			lazyLoadPoster: (Boolean) lazy load the image/posternode
		 *		}],
		 *		enableswipe: (Boolean) enables swipe for the carousel object,
		 *		options: (Integer/Boolean) interval in ms to switch images
		 * }
		 */
		buildCarousel: function (evName, data) {
			if(!data.id){
				m.carouselIndex++;
			}
			var id = data.id ? data.id : m.carouselId + m.carouselIndex,
				iActiveSlide = data.activeSlide || 0,
				targetNode = data.targetNode || $('body'),
				carouselNode = $('<div></div>').attr('id', id),
				navNode = $('<div></div>').addClass('carouselNav'),
				controlPrevNode = $('<a></a>').addClass('carousel-control left').attr('data-slide', 'prev').attr('data-target', '#' + id),
				controlNextNode = $('<a></a>').addClass('carousel-control right').attr('data-slide', 'next').attr('data-target', '#' + id),
				enableSwipe = data.enableswipe || true,
				options = data.options || {};
			carouselNode.addClass(m.carouselClass + ' carousel ' + (data.type ? data.type : m.carouselType));

			// add the indicators
			navNode.append(m.buildIndicators(data.slides.length, iActiveSlide, id));
			// add the slide wrapper
			carouselNode.append(m.buildCarouselSlideWrapper(data.slides, iActiveSlide));

			// add the nav controls
			controlNextNode.append('<i class="icon-angle-right" data-icon="\f105"></i>');
			controlPrevNode.append('<i class="icon-angle-left" data-icon="\f104"></i>');
			navNode.append(controlPrevNode);
			navNode.append(controlNextNode);

			// append navigation
			carouselNode.append(navNode);
			targetNode.append(carouselNode);

			//enable brighttagging
			m.enableBTTracking({prev: controlPrevNode, next: controlNextNode, indicators: navNode.find('li')});

			//initialize carousel
			if(! options.interval) options.interval = false; //disable interval options JIRA 1620
			carouselNode.carousel(options);
					
			// enable swipe if needed
			if(enableSwipe) m.enableSwipe({carousel: carouselNode});

			carouselNode.on('slid.bs.carousel', function (e) {
				PubSub.publish(T1.constants.CAROUSEL_SLIDE, {
					carousel: carouselNode
				});
			});

			// publish carousel created element
			PubSub.publish(T1.constants.CAROUSEL_CREATED, carouselNode);
		},

		buildIndicators: function (iMax, iActiveSlide, id) {
			var indicatorContainer = $('<ol></ol>'),
				indicatorNode = null,
				i = null;
			indicatorContainer.addClass('carousel-indicators');
			for (i = 0; i < iMax; i++) {
				indicatorNode = $('<li></li>').attr('data-target', '#' + id).attr('data-slide-to', i.toString()).addClass(i === iActiveSlide ? 'active' : '');
				indicatorContainer.append(indicatorNode);
			}
			return indicatorContainer;
		},

		buildCarouselSlideWrapper: function (slides, iActiveSlide) {
			var m = _private,
				mediaElement = null,
			//iItem = null,
				carouselInnerNode = $('<div/>').addClass(m.carouselInnerClass),
				itemNode = null,
				mediaNode = null,
				attrObject = null;

			for (var iItem=0; iItem < slides.length; iItem++) {
				// console.loglog(iItem);
				//create a new item node
				itemNode = $('<div></div>').addClass('item').addClass(iItem === iActiveSlide ? 'active' : '');
				//get the mediaElement
				mediaElement = slides[iItem];

				if(mediaElement.dataNode) itemNode.data('dataNode', mediaElement.dataNode);

				switch (mediaElement.type) {
					case 'image':
						itemNode.attr('data-type', 'image');
						mediaNode = $('<img>');
						// WITH LAZY LOAD
						attrObject = mediaElement.isLazyLoad ? { 'data-lazy-load': mediaElement.src } : { 'src': mediaElement.src };
						mediaNode.attr(attrObject);
						itemNode.append(mediaNode);
						break;
					case 'video':
						itemNode.attr('data-type', 'video');
						// add the target to the mediaElement
						mediaElement.target = itemNode;
						mediaElement.lazyLoadPoster = true;
						if (iItem === iActiveSlide) { mediaElement.autoplay = true; }
						// call the videoCreate element
						PubSub.publishSync(T1.constants.VIDEO_CREATEPLAYER, mediaElement);
						break;
					case 'iframe':
						itemNode.attr('data-type', 'iframe');
						mediaNode = $('<iframe></iframe>');
						mediaNode.attr({'data-lazy-load': mediaElement.link, 'width': '100%', 'height': '100%', 'frameborder': '0'});
						itemNode.append(mediaNode);
						break;
					case 'external-video':
						itemNode.attr('data-type', 'external-video');
						mediaNode = $('<iframe></iframe>');
						mediaNode.attr({'data-lazy-load': m.youtubeUrl.replace(/<id>/gi, mediaElement.youtubeId), 'width': '100%', 'height': '100%', 'frameborder': '0'});
						itemNode.append(mediaNode);
						break;
					case 'html':
						mediaNode = $(mediaElement.html);
						itemNode.append(mediaNode);
						break;
					default:
						break;
				}
				carouselInnerNode.append(itemNode);
			}
			m.carouselInnerNode = carouselInnerNode;
			return carouselInnerNode;
		},

		/**
		 * enables swipe on a carousel object
		 * @param data (Object){
		 *     carousel: (Object/String - jQuery object / DOM node / selector) the carousel element which should be made swipe-enabled,
		 *     prevFn: (Function) optional - function on slide right
		 *     nextFn: (Function) optional - function on slide left
		 * }
		 */
		enableSwipe: function(data){
			var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));
			if(! (data.carousel) || ! isTouch) return;
			var carousel = $(data.carousel),
				prevFn = data.prevFn || function(){
					carousel.carousel('prev');
				},
				nextFn = data.nextFn || function(){
					carousel.carousel('next');
				};
			carousel.find('.'+ m.carouselInnerClass).swipe({
				swipeLeft: nextFn,
				swipeRight: prevFn,
				excludedElements: 'button, input, select, textarea, .noSwipe'
			});
		},

		enableBTTracking: function(controls){
			if(! controls) return;
			if(controls.next) controls.next.click(_private.runBTEvent);
			if(controls.prev) controls.prev.click(_private.runBTEvent);
			if(controls.indicators) controls.indicators.click(_private.runBTEvent);
		},

		runBTEvent: function(){
			//run BT event with an animation delay
			var that = this,
				hdlr = function(){
					PubSub.publish(T1.constants.STATS_TRACK_CAROUSEL, {el: that});
				};
			setTimeout(hdlr, T1.constants.ANIMATION_SPEED_FADE);
		}

	};
	var m = _private;
	return {
		init: _private.init
	};
}());