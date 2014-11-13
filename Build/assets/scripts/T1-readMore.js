var T1 = T1 || {};

/**
 *	readMore: opens a tooltip window
 *
 */

T1.readMore = (function () {
	'use strict';

	var _private = {
		lastPlaceRef:null,
		lastExpanded:null,
		lastActiveButton: null,
		isOpen: false,
		lastOpenedToolTip: null,
		isMobile: false,
		inOverlayer: false,
		menuHeight: null,
		pubsubHideToken: null,
		pubsubReadMoreToken: null,
		closestCarousel: '',
		init: function(){
			var m = _private;

			// Globally register the click events for tooltip
			$('body').on('tap click', '.expansion-content .closelink', function(e){
				e.preventDefault();
			});

			$('body').on('tap click', '.readMore', function(e) {
				e.preventDefault();
				PubSub.publish(T1.constants.READMORE_SHOW, {target: $(this), e: e});
			});

			m.pubsubReadMoreToken = PubSub.subscribe(T1.constants.READMORE_SHOW, m.show);
			m.pubsubHideToken = PubSub.subscribe(T1.constants.ON_DOC_CLICK, m.hideAll);
			PubSub.subscribe(T1.constants.READMORE_HIDE_SELECTED, m.readMoreHideSelected);
		},
		switchDesktop: function(){
			_private.isMobile = false;
		},
		switchMobile: function(){
			_private.isMobile = true;
		},
		/*
		 *shows the tooltip
		 *data = {
		 *	target: targetcontainer which will be displayed in the tooltip
		 *	event: the original event
		 *}
		 **/
		show: function(evName, data){

			var m = _private,
				targetNode = data.target || $('.readMore'),
				containerNode = targetNode.closest('.container'),
				w = $(window);

			//calculate the height of the menu (once)
			if(! m.menuHeight) m.menuHeight = $('#nav-primary').height();

			//copy the tooltip, place it in the right container (body/overlayer) & calculate offset
			m.inOverlayer = targetNode.parents(".overlayerWrapper").length>0;
			var tooltipWrapper = (m.inOverlayer) ? ".overlayerContent" : "body",
				tt = containerNode.find(targetNode.attr('data-tooltip-selector')).last().appendTo(tooltipWrapper),
				expansionMargin = (tt.height() + 10),
				targetOffset = targetNode.offset(),
				closestCarousel = targetNode.closest('.carousel');

			//do mobile action
			if(_private.isMobile){
				if( m.lastExpanded !== null ){
					m.hideAll('byHand',{target:m.lastExpanded});
				}
				m.isOpen = true;
				var content = tt.html();
				var theight = tt.height();
				var tooltip = $("<div/>").addClass("mobile-expansion expansion-content").html(content).prependTo($("body")).height(0);
				$(".expansion-arrow", tooltip).remove();
				tooltip.animate({
					"height":theight+"px"
				}, T1.constants.ANIMATION_SPEED_FADE);
				m.lastExpanded = tt;
				m.lastActiveButton = targetNode;
				m.lastPlaceRef = targetNode.parent();
				targetNode.toggleClass('active-state');	

				PubSub.unsubscribe(m.pubsubHideToken);
				PubSub.unsubscribe(m.pubsubReadMoreToken);

				var tm = setTimeout(function(){
					m.pubsubHideToken = PubSub.subscribe(T1.constants.ON_DOC_CLICK, m.hideAll);
					m.pubsubReadMoreToken = PubSub.subscribe(T1.constants.READMORE_SHOW, m.show);
				},500);

				return;
			}


			//show readmore in overlayer
			if(m.inOverlayer){
				targetOffset.left -= tt.closest('.overlayerContent').offset().left;
				tt.addClass("expansion-pageovelayer-content");
			}else{
				tt.removeClass("expansion-pageovelayer-content");
			}

			//hide the previous tooltips
			m.hideAll('showReadMore', {target: m.lastPlaceRef});

			//reset the inline style & remove classes
			tt.attr('style','display: block');
			tt.removeClass('top bottom left right');
			m.lastExpanded = tt;

			//calculate the position & bottom/top offset
			if(containerNode.length===0){containerNode = w;}
			var containerOffset = containerNode.offset();
			if(! containerOffset){containerOffset = {left:0, top:0};}
			var position = (targetOffset.top - expansionMargin < (w.scrollTop() + m.menuHeight) ? 'bottom' : 'top') + ' ' + ((((containerOffset.left + containerNode.width()) > (targetOffset.left + tt.width()) || containerNode.width() < tt.width()) ) ? 'right' : 'left');
			tt.addClass(position);

			var ttTop = position.indexOf('bottom')!==-1 ? targetOffset.top + targetNode.height() + 5 : targetOffset.top - expansionMargin - 5;
			var ttLeft = position.indexOf('right')!==-1 ? targetOffset.left : ((targetOffset.left+targetNode.width())-tt.width());

			if(m.inOverlayer){
				ttTop += $(tooltipWrapper).scrollTop();
			}

			tt.css({
				top: ttTop,
				left: ttLeft
			});

			// pause the carousel when the read more is opened
			if (closestCarousel.length > 0) {
				closestCarousel.carousel('pause');
				m.closestCarousel = closestCarousel;
			}

			if (m.lastActiveButton) m.lastActiveButton.removeClass('active-state');
			m.lastPlaceRef = targetNode.parent();
			m.lastOpenedToolTip = tt;

			targetNode.toggleClass('active-state');
			m.lastActiveButton = targetNode;
			m.isOpen = true;

			// show this tooltip
			setTimeout(function(){
				tt.addClass('active');
			},1);
		},

		hideAll: function(evName, data){
			if (_private.isOpen === true) {
				var target = $(data.target);
				if(!target.parent().hasClass("readMore") && !target.hasClass("readMore") && (!target.parents().hasClass('expansion-inner') || target.hasClass("closelink"))){
					if(_private.isMobile){
						_private.hideMobile(data.animation);
					}
					else{
						var expandedContent = _private.lastOpenedToolTip;
						expandedContent.removeClass('active');
					}
					PubSub.publish(T1.constants.READMORE_HIDE, {target: target});
					_private.lastExpanded.attr('style', '');
					if (_private.lastPlaceRef) _private.lastPlaceRef.after(_private.lastExpanded);
					if (_private.closestCarousel.length > 0) _private.closestCarousel.carousel('cycle');
					_private.lastActiveButton.toggleClass('active-state');
					_private.isOpen = false;
				}
			}
		},

		hideMobile: function(animation){
			$(".mobile-expansion").animate({
				"height": 0
			}, T1.constants.ANIMATION_SPEED_FADE, function(){
				$(this).remove();
			});		
			return;
		},

		readMoreHideSelected: function(evName, data) {
			// check if there is anything open before closing, GO COMMON SENSE GO :D
			if (_private.isOpen === true && !_private.isMobile) {
				_private.hideAll('byHand',data);
			}
		}
	};

	return {
		init: _private.init,
		switchMobile: _private.switchMobile,
		switchDesktop: _private.switchDesktop
	};
}());