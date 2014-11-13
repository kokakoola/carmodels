var T1 = T1 || {};

/**
 * Created with JetBrains WebStorm.
 * User: Hendrik.De.Permentie
 * Date: 6/12/13
 * Time: 9:56
 * To change this template use File | Settings | File Templates.
 */

T1.carouselResponsive = (function(){
	'use strict';

	var _private = {
		breakpoints: ['lg', 'md', 'sm', 'xs'],
		currentBreakpoint: 'xs',


		init: function(){
			var m = _private;
			PubSub.subscribe(T1.constants.CAROUSEL_CREATERESPONSIVE, m.buildResponsiveCarousels);
			PubSub.subscribe(T1.constants.ON_BREAKPOINT_CHANGE, m.rebuildResponsiveCarousels);
			m.buildResponsiveCarousels('init', {});
		},

		/**
		 * Creates the carousel object to pass to the CREATECAROUSEL event
		 * @param data (Object) {
		 *     container: (Object - jQuery object) Node which needs to be converted to a carousel - contains all the slide data,
		 *     breakpoint: (String) current breakpoint (xs/sm/md/lg) - used to overrule the breakpoint if needed
		 *     maxCols: (Integer) maximum number of columns per slide
		 * }
		 * @returns {{}}
		 */
		getCarouselData: function(data){
			if(! data.container) return;
			var m = _private,
				slideNodes = data.container.find('.responsive-item').get(),
				currentBreakpoint = data.currentBreakpoint || m.currentBreakpoint || 'xs',
				slides = [],
				maxCols = data.maxCols || 12,
				carousel = data.container.parent().data();

			// create the slides object (add elements until maxCols columns are reached)
			var i=0, iE= 0, iColSize=0, slideContainer =$('<div></div>').addClass('container'), slide=$('<div></div>').addClass('row'), thisNode=null;
			for(i; i<slideNodes.length; i++){
				thisNode = $(slideNodes[i]);
				if (!thisNode.hasClass('hide')) {
					iColSize =  m.getColumnSize({node: thisNode, breakpoint: currentBreakpoint});
					iE += iColSize;
					if(iE <= maxCols) slide.append(slideNodes[i]);
					// create new slide if the number of elements has been reached
					if(iE >= maxCols){
						slideContainer.append(slide);
						slides.push({'type':'html','html': slideContainer});
						data.container.append(slideContainer);
						slideContainer =$('<div></div>').addClass('container');
						slide=$('<div></div>').addClass('row');
						if(iE > maxCols){ // bigger than a 12 col row, move the last item to the next slide
							slide.append(slideNodes[i]);
							iE = iColSize;
						} else { // exactly maxCols col row, create a new slide and start counting @ col-length 0
							iE = 0;
						}
					}
				}
			}

			//push all remaining slides
			if(iE!==0){
				slideContainer.append(slide);
				slides.push({'type':'html','html': slideContainer});
				data.container.append(slideContainer);
			}

			// create the carousel parameter object
			carousel.slides = slides;
			carousel.targetNode = data.container;

			return carousel;
		},

		/**
		 * Rebuilds all current carousels for a certain breakpoint
		 * @param evName (String) name of the event
		 * @param breakpoint (String) name of the breakpoint (xs/sm/md/lg)
		 */
		rebuildResponsiveCarousels: function(evName, breakpoint){
			var m = _private;
			m.currentBreakpoint = breakpoint;
			m.buildResponsiveCarousels(evName, {});
		},

		/**
		 *
		 * @param evName
		 * @param data {
		 *     container: (Object - jQuery object) build a responsive carousel for this container,
		 *     breakpoint: (String) build the carousels for this breakpoint (xs/sm/md/lg)
		 * }
		 */
		buildResponsiveCarousels: function(evName, data){
			var m = _private,
				dataContainer = data.container|| $('.responsive-carousel');
			m.currentBreakpoint = data.breakpoint || m.currentBreakpoint || 'xs';
			dataContainer.each(m.createCarousel);
		},

		/**
		 * get the size of the element in column numbers (1 -> 12)
		 * @param (Object) {
		 *     node: (Object) the node for which we need to find the size
		 *     breakpoint: (String) the current breakpoint -> xs sm md lg
		 * }
		 */
		getColumnSize: function(data){
			if(! data.node) return;
			var m = _private,
				breakpoint = data.breakpoint || m.currentBreakpoint || 'xs',
				classes = data.node.attr('class') || '',
				iBreakPoint= m.breakpoints.indexOf(breakpoint);
			for(iBreakPoint; iBreakPoint < m.breakpoints.length; iBreakPoint++){
				if(classes.indexOf('col-' + m.breakpoints[iBreakPoint])!==-1){
					return parseInt(classes.replace(new RegExp('.*col-' + m.breakpoints[iBreakPoint] + '-| .*', 'g'), ''), 10);
				}
			}
			return 12;
		},

		/**
		 * Builds 1 carousel (multiple carousels can be present in 1 page)
		 * @param key (String) index of the carousel object (x in page)
		 * @param containerNode (Object) node that should be transformed to a responsive carousel
		 */
		createCarousel: function(key, containerNode){
			// create a clone of the container (if needed)
			var m = _private,
				container = $(containerNode),
				contentCopy = container.find('.orig-data-copy'),
				content = container.find('.carousel-wrapper'),
				loaderNode = container.find('.loader'),
				cssHide = {'display': 'none'},
				cssShow = {'display': 'block'},
				expanded = container.find('.carousel').hasClass('expanded');


			var excludeBpsStr = container.attr('data-excluded-bps');
			var excludedBps   = excludeBpsStr !== undefined  ? excludeBpsStr.split(',') : [];
			var hidecarousel  = false;

			for (var i = 0; i < excludedBps.length; i++) {
				if(m.currentBreakpoint === excludedBps[i]){
					hidecarousel = true;
					break;
				}
			}

			if(hidecarousel === false){

				//hide the current content (to prevent browser rendering while building the carousel)
				content.css(cssHide);

				//destroy the previous child nodes of multi-element-carousel
				content.children().remove();

				// clone the original content if needed
				if(contentCopy.length===0){
					contentCopy = $('<div></div>').addClass('orig-data-copy').append(container.children());
					container.append(contentCopy);
				}

				// create a working container or read the data to the content container
				if(content.length===0){
					content = $('<div></div>').addClass('carousel-wrapper');
					container.append(content);
				}
				content.append(contentCopy.children().clone());

				// (re)create the carousel-object from the content container
				var carousel = m.getCarouselData({container: content, maxCols: container.data('maxcols')});

				// create the carousel (if needed; >1 slide)
				if(carousel.slides.length > 1){
					// create carousel
					PubSub.publishSync(T1.constants.CAROUSEL_CREATE, carousel);
					var carouselNode = content.find('.carousel');
					PubSub.publishSync(T1.constants.CAROUSEL_EXPAND, {
						expanded: expanded,
						expander: $('.carousel-expander[data-carousel="#' + container.attr('id') + '"]'),
						carousel: carouselNode
					});
				}

				//hide loader and show new carousel
				content.css(cssShow);
				contentCopy.hide();
				content.show();
			}
			else{
				contentCopy.show();
				content.hide();
			}

		}

	};

	return {
		init: _private.init
	};

}());