
var T1 = T1 || {};
/**
 *
 * requires:
 * iscroll.js in /lib/
 * pubsub.js in /lib/
 *
 */
T1.gallery = ( function() {
	'use strict';
// _private var for facade pattern (return public vars/functions)
	var _private = {
		/*mainContainer wraps the gallery rows*/
		mainContainer: $(".gallery-horizontal"),
		rows: null,
		lastHeight: 0,
		highestHeight: 0,
		isIE8: T1.utilities.ieVersion()<=8,
		mobileIdSeq: 0,
		IE8: {
			drag: false,
			startPoint: 0,
			moved: false,
			lastX: 0,
			arrowInterval: 200,
			lastNode: null,
			lastDate: new Date().getTime(),
			on: function(){return;},
			options: {}
		},
		/*scroll settings are needed and being called statically for the iscroll instance*/
		scrollSettings : {
			scrollX: true,
			scrollY: false,
			momentum: true,
			eventPassthrough: true
		},
		isIpad: T1.utilities.isIOS(),
		/**
		 * Builds the desktop version of gallery
		 */
		initDesktop: function(){
			//init the desktop gallery
			var m = _private;
			//initialize the desktop resources
			m.initSources(m.mainContainer, 'desktop');
			//show the maincontent (otherwise there will be height & width calculation issues)
			m.mainContainer.css({'display':'block'});
			m.mainContainer.addClass('hidden-xs');
			if($('.overlayerWrapper').length ===0){
				$('#pagecontent').css({'display':'block'});
			}
			// Remove display: none from '.gallery-horizontal'
			m.mainContainer.css('visibility','visible');
			//build desktop version of the gallery component
			m.mainContainer.on("dragstart", function () { return false; });
			/*The component supports multiple rows and each row works independently*/
			m.rows = $(".gallery-horizontal-row", m.mainContainer);
			m.rows.each(m.loadRow);
			for (var i = 0; i < m.mainContainer.length; i++) {
				var highestheight = $(m.mainContainer[i]).attr('data-highest-height');
				$(m.mainContainer[i]).find('.gallery-item').css('height', highestheight );
			}
			//m.mainContainer.find('.gallery-item').css('height', m.highestHeight);
			var paddingHeight = $('.gallery-item .item-content').height();
			$('.gallery-item .item-content').css('padding-bottom', paddingHeight-40);
			//fix IE8 event listeners
			if(m.isIE8) {
				m.fixIe8();
			}
			if(T1.utilities.isIpad) _private.scrollSettings.momentum = false;
			// If there's ***any*** item-content within the page, make it unselectable.
			if ($('.item-content').length > 0) { $('.item-content *').attr('unslectable','on'); }
			m.mainContainer.each(function(){
				PubSub.publish(T1.constants.TOAST_CUSTOM,{'customContainer': $(this)});
			});
		},

		/**
		 * switch to desktop version
		 */
		switchDesktop: function(){
			//initialize the desktop code
			var m = _private,
				section = m.mainContainer.closest('section');
			section.addClass('gallery-horizontal');
		},

		/**
		 * Builds the mobile version of gallery
		 * @param section (string / object) the section where the mobile gallery needs to be build
		 */
		initMobile: function(){
			var m = _private,
				section = m.mainContainer.closest('section');
			section.each(m.buildMobileThumbGrid);
		},

		/**
		 * Switch to the mobile version of this component
		 */
		switchMobile: function(){
			var m = _private,
				section = m.mainContainer.closest('section');
			section.removeClass('gallery-horizontal');
		},

		/**
		 * Loads all mobile or desktop images
		 * @param container (String) The container for which the sources need to be loaded
		 * @param mode (String) The mode for which the sources need to be loaded (mobile/desktop)
		 */
		initSources: function(container, mode){
			var m = _private,
				images = container.find('img'),
				loadSource = function(key, imgNode){
					var img = $(imgNode),
						imageSource = img.data('src-' + mode);
					if(imageSource) img.attr('src', imageSource);
				};
			images.each(loadSource);
		},

		buildMobileThumbGrid: function(skey, sectionNode){
			//first grab or create the mobile thumbnail grid
			var m = _private,
				section = $(sectionNode),
				mobileContainer = section.find('.mobile.gallery');
			if(mobileContainer.length===0){
				//create the mobile grid
				mobileContainer = $('<div></div>').addClass('mobile gallery container visible-xs');
				//add data to the mobile grid
				var mobileTitle = $('<h1>' + (section.data('section-title') || 'Gallery') + '</h1>').appendTo(mobileContainer),
					mobileRow = $('<div></div>').addClass('row'),
					mobileCell = $('<div></div>').addClass('col-xs-12 thumbnail-grid'),
					galleryItems = section.find('.gallery-item'),
					//copies the original gallery item to the mobile gallery
					copyGalleryItem = function(key, galleryItemNode){
						// check if the gallery item has a mobile thumbnail
						var galleryItem = $(galleryItemNode);
						if(! galleryItem.find('img').data('src-mobile')) return;
						// clone the item and re-attach it to the mobile container
						var galleryItemCopy = galleryItem.clone(),
							galleryItemCopyLink = galleryItem.hasClass('item-link') ? galleryItemCopy : galleryItemCopy.find('.item-link'),
							itemId = galleryItemCopyLink.attr('id');
						if(itemId){galleryItemCopyLink.attr('id', 'mobile_' + itemId);}
						galleryItemCopy.attr('style','');
						galleryItemCopy.find('img').removeAttr('width').removeAttr('height');
						// remove the content
						galleryItemCopy.find('.item-content').css({'display':'none'});
						// connect the events
						galleryItemCopyLink.click(function(ev){
							ev.preventDefault();
							PubSub.publish(T1.constants.HASH_ADD, '/gallery/' + itemId + '/' + key);
						});
						//append the copied item to the row
						mobileCell.append(galleryItemCopy);
					};
				//add a copy of the gallery items to the mobile gallery
				galleryItems.each(copyGalleryItem);
				//add the bootstrap cell & row to container
				mobileRow.append(mobileCell);
				mobileContainer.append(mobileRow);
				//drop the mobile container in the current section
				section.append(mobileContainer);
				//initialize the desktop resources
				m.initSources(mobileContainer, 'mobile');
			}
			//add sizing on the gallery grid, but remove when the main-content reopens
			var tokenResize = PubSub.subscribe(T1.constants.ON_WIN_RESIZE, m.resizeMobileGrid);
			var tokenUnsubscribeResize = PubSub.subscribe(T1.constants.PAGEOVERLAYER_REOPEN_MAINCONTENT, function(){
					PubSub.unsubscribe(tokenResize);
					PubSub.unsubscribe(tokenUnsubscribeResize);
			});
			m.resizeMobileGrid('init mobile grid');
		},

		/** resizes the mobile thumbnail grid
		 * @param evName
		 */
		resizeMobileGrid: function(evName){
			var m = _private,
				w = $(window),
				grid = $('.thumbnail-grid'),
				itemWidth = grid.find('.gallery-item:first').width() || 78;
			grid.css({
				'width': Math.floor(w.width()/itemWidth)*itemWidth
			});
		},

		/**
		 Adds drag behaviour on IE8 (not supported by IScroller)
		 */
		fixIe8: function(){
			var m = _private,
				d = $(document),
				gallery = $('.gallery'),
				// move the row (use ev.delta to move the row without drag)
				move = function(ev){
					var d = new Date().getTime();
					if(!ev.delta && (d - m.IE8.lastDate < 100)) return;
					var delta = ev.delta || (ev.pageX - m.IE8.lastX),
						row = m.IE8.lastNode,
						newPosX = row.offset().left + delta,
						maxPosX = - (row[0].scrollWidth - $(window).width());
					m.IE8.lastDate = d;
					m.IE8.lastX = ev.pageX;
					if(delta > 10){m.IE8.hasMooved=true;}
					if(newPosX>0) newPosX = 0;
					if(newPosX<maxPosX) newPosX = maxPosX;
					row.css({'margin-left': newPosX + 'px'});
					$(".left", row).css("margin-left", Math.abs(newPosX)+"px");
				},
				// move the row x px to the left (used by the arrow buttons)
				moveLeftFn = function(ev){
					m.IE8.lastNode = $(this).closest('.gallery-horizontal-row');
					ev.delta = m.IE8.arrowInterval;
					move(ev);
				},
				// move the row x px to the right (used by the arrow buttons)
				moveRightFn = function(ev){
					m.IE8.lastNode = $(this).closest('.gallery-horizontal-row');
					ev.delta = -m.IE8.arrowInterval;
					move(ev);
				},
				// mouse release -> stop the drag and capture the the user moved the mouse
				mouseUpFn = function(ev){
					// wait until the click event has finished
					m.IE8.drag = false;
					if(Math.abs(m.IE8.startPoint - ev.pageX)>10){
						PubSub.publish(T1.constants.GALLERY_SCROLL, this);
						m.IE8.moved=true;
					}
				},
				// mouse down -> start the drag event
				mouseDownFn = function(ev){
					//start IE8 drag
					m.IE8.drag = true;
					m.IE8.lastX = ev.pageX;
					m.IE8.startPoint = ev.pageX;
					m.IE8.lastNode = $(this);
					m.IE8.moved = false;
				},
				// move the row on drag
				mouseMoveFn = function(ev){
					if(m.IE8.drag) move(ev);
				};
			// connect the functions to the events
			m.rows.mousedown(mouseDownFn);
			gallery.find('.gallery-nav-arrow.left').click(moveLeftFn);
			gallery.find('.gallery-nav-arrow.right').click(moveRightFn);
			gallery.mouseup(mouseUpFn);
			gallery.mousemove(mouseMoveFn);
		},
		/* *
		 * initializes the gallery rows
		 * @param {number} index
		 * @param {DOM element} el
		 * @return {void} void
		 * */
		loadRow: function(index, el){
			var m = _private,
				currentRow = $(this);
			/*adding next and prev buttons for each row*/
			var controls = _private.addControls();
			currentRow.append(controls);
			/*An absolute positioned element is needed for scrolling the images*/
			var scrollHolder = $("<div/>").addClass("iscroller");
			var rowDimensions = _private.getRowHeight(currentRow);
			currentRow.height(rowDimensions.height);
			scrollHolder.width(rowDimensions.width);
			var inner = $(".gallery-horizontal-row-inner", this);
			inner.wrap(scrollHolder);
			/*The instance of the iscroll which is being saved in the row DOM element itself*/
			var iscroll = m.isIE8 ? m.IE8 : new IScroll(el, m.scrollSettings);
			iscroll.options.tap = true;
			m.checkBoundaries(".iscroller", currentRow, iscroll);
			PubSub.subscribe(T1.constants.ON_WIN_RESIZE, function(msg, data){
				if(typeof iscroll.refresh == "function"){
					iscroll.refresh();
				}
			});
			//the resize won't be triggered after resizing the page opverlay. quick fix
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_CLOSED, function(msg, data){
				$(window).trigger("resize");
			});
			iscroll.on("scrollStart", function(){
				$(".gallery-horizontal-row-inner a", currentRow).css("cursor", "move");
				currentRow.css("cursor", "move");
			});
			iscroll.on("scrollEnd", function(){
				//publish the gallery scroll event
				PubSub.publish(T1.constants.GALLERY_SCROLL, this.wrapper);
				$(".gallery-horizontal-row-inner a", currentRow).css("cursor", "pointer");
				currentRow.css("cursor", "default");
				m.checkBoundaries(".iscroller", currentRow, iscroll);
				/*if($(".iscroller", currentRow).position().left === 0){
					$(".gallery-horizontal-row .left", currentRow).css({
						"opacity" : "0.69",
						"cursor" : "default"
					});
					$(".left", currentRow).addClass("inactive");
				}else{
					$(".gallery-horizontal-row .left", currentRow).css({
						"opacity" : "1",
						"cursor" : "pointer"
					});
					$(".left", currentRow).removeClass("inactive");
				}
				if($(".iscroller", currentRow).position().left === this.maxScrollX){
					$(".gallery-horizontal-row .right", currentRow).css({
						"opacity" : "0.69",
						"cursor" : "default"
					});
					$(".right", currentRow).addClass("inactive");
				}else{
					$(".gallery-horizontal-row .right", currentRow).css({
						"opacity" : "1",
						"cursor" : "pointer"
					});
					$(".right", currentRow).removeClass("inactive");
				}*/
			});
			currentRow.data("iscroll", iscroll);
			//if(!m.isIE8) iscroll._execEvent("scrollEnd");
			/*we publish the custom event globally so other components can catch and use it*/
			/* choose between touchend or click, the first refers to touchy hardware */
			var handleClick= m.isIOS ? 'touchend': 'click';
			$("a", inner).on(handleClick, function(e){
				e.preventDefault();
				if(!iscroll.moved){
					var el = $(this).hasClass('gallery-item') ? $(this) : $(this).closest('.gallery-item');
					location.hash = '/gallery/' + this.id + '/' + $(this).closest('.gallery').find('.gallery-item').index(el);
				}else{
					e.stopPropagation();
				}
			});
			if(!m.isIE8) _private.loadNavigation(currentRow);
		},
		checkBoundaries: function(iscroller, row, el) {
			if($(iscroller, row).position().left === 0) {
				$(".left", row).addClass("inactive");
			} else {
				$(".left", row).removeClass("inactive");
			}
			if($(iscroller, row).position().left === el.maxScrollX) {
				$(".right", row).addClass("inactive");
			} else {
				$(".right", row).removeClass("inactive");
			}
		},
		/* *
		 * calculate the maximum height
		 * @param {DOM element} row
		 * @return {object} rowDimensions
		 * */
		getRowHeight: function(row){
			var rowHeight = 0;
			var rowWidth = 0;
			var m = _private;
			$(".gallery-item", row).each(function(i, e){
				//if(!$(this).hasClass("item-link")) $(this).addClass("item-link");
				var imgWidth = $("img", this).width();
				$(this).width(imgWidth);
				var elHeight = $(this).height();
				var elWidth = $(this).width();
				if(elHeight>rowHeight) rowHeight = elHeight;
				rowWidth += elWidth;
				var parent = row.closest('.gallery');
				var highestHeight = parent.attr('data-highest-height') ?  parent.attr('data-highest-height') : 0;
				if (rowHeight> highestHeight) parent.attr('data-highest-height', rowHeight);
				if (rowHeight> m.highestHeight) m.highestHeight = rowHeight;
			});
			return {"height":rowHeight, "width":rowWidth};
		},
		/* *
		 * adds controls to the slide row
		 * @return {DOM element} controls
		 * */
		addControls: function(){
			var navContainer = $("<div/>").addClass("navigation-arrows");
			/*just generating the dom structure of the control buttons*/
			var aPrev = $("<a/>").addClass("gallery-nav-arrow left")
				.append($("<span/>").addClass("icon-angle-left").attr('data-icon','\f104'))
				.appendTo(navContainer);
			var aNext = $("<a/>").addClass("gallery-nav-arrow right")
				.append($("<span/>").addClass("icon-angle-right").attr('data-icon','\f104'))
				.appendTo(navContainer);
			return navContainer;
		},
		/* *
		 * implements the correct click event behavior for controls
		 * @param {DOM element} row
		 * @return {void} void
		 * */
		loadNavigation: function(row){
			var m = _private,
				aNext = $("a.left", row), aPrev = $("a.right", row), that=this;
			/* choose between touchend or click, the first refers to touchy hardware */
			var handleClick= m.isIOS ? 'touchend': 'click';
			aNext.on(handleClick, function(event){
				if(!$(this).is(".inactive")) that.goTo(row, true);
			});
			aPrev.on(handleClick, function(event){
				if(!$(this).is(".inactive")) that.goTo(row, false);
			});
		},
		/* *
		 * generic function for sliding to the next/previous item
		 * @param {DOM element} row
		 * @param {boolean} isNext
		 * @return {void} void
		 * */
		goTo: function(row, isNext){
			isNext = (typeof isNext === "undefined") ? false : isNext;
			/*implementing the correct click behavior for the controls*/
			var target, that = this;
			var iscroll = row.data("iscroll");
			var pages = $(".gallery-item", row),
				pos = 0,
				targetX = 0;
			pages.each(function(i, e){
				if(that.inViewPort(e)){
					target = e;
					return false;
				}
			});
			var nextTarget = (isNext) ? $(target).prev() : $(target).next();
			if(nextTarget.length === 0) {
				pos = nextTarget.width();
				targetX = pos;
			}
			else {
				pos = nextTarget.position();
				targetX = pos.left+1;
			}
			iscroll.scrollTo(-targetX, 0, 500);
		},
		/* *
		 * checks whether the element is visible in the viewport
		 * @param {DOM element} el
		 * @return {boolean} boolean
		 * */
		inViewPort: function(el){
			var win = $(window);
			var element = $(el);
			var viewport = {
				top : win.scrollTop(),
				left : win.scrollLeft()
			};
			viewport.right = viewport.left + win.width();
			viewport.bottom = viewport.top + win.height();
			var bounds = element.offset();
			bounds.right = bounds.left + element.outerWidth();
			bounds.bottom = bounds.top + element.outerHeight();
			//console.log((!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom)));
			return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
		}
	};
	/*returns the public methods of the component*/
	var _public = {
		"initDesktop":_private.initDesktop,
		"initMobile":_private.initMobile,
		"switchMobile":_private.switchMobile,
		"switchDesktop":_private.switchDesktop,
		"scroll": _private.iscrollObj
	};
	return _public;
}());
