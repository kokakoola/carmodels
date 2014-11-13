var T1 = T1 || {};

/**
 * navigation related behaviour
 * version 2.0
 * KGH: refactor + cleanup
 */
T1.navigation = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		isSmallLogo: false,
		isPrimaryNavOpen: false,
		scrollSpyList: [],
		isSecondLevelVisible: false,
		currentSpy: null,
		isMoreSelected: false,
		moreOptionSecondIteration: false,
		breadcrumbLinkTemplate: false,
		currentDropdown: null,
		/**
		 * initialize
		 * @returns null
		 */
		init: function () {
			var m = _private,
				c = T1.constants,
				dropDown = $('#nav-primary .navbar-inner .dropdown'),
				navSecondary = $('#nav-secondary-level'),
				breadcrumbLi = $('#menu-breadcrumb li'),
				searchContainer = $('#menu-search, .navigation-menu .input-search, .content-navigation-cta .input-search'),
				searchField = searchContainer.find('input.search'),
				searchButton = searchContainer.find('a');

			searchField.on('keydown', m.handleSearch);
			searchButton.on('click', m.handleSearch);

			// handle scroll event
			if (Modernizr.touch) {
				PubSub.subscribe(c.GLOBAL_SWIPE, m.handleWindowScroll);
			} else {
				PubSub.subscribe(c.GLOBAL_SCROLL, m.handleWindowScroll);
			}

			// handle hide dropdown - if touchTarget is the input field, ignore the click outside event which closes the dropdown.
			var touchTarget, menuClick;
			$('input.search').on('touchstart',function(e){
				touchTarget = $(e.currentTarget);
			});
			$('.navigation-menu').on('click', function(e){
				menuClick = $(e.currentTarget);
			});
			dropDown.on('hide.bs.dropdown', function(e){
				if((touchTarget !== undefined && touchTarget.hasClass('search')) || menuClick){
					touchTarget = undefined;
					menuClick = undefined;
					return false;
				}
				else{
					m.handleHideDropdown(e);
				}
			});
			dropDown.on('show.bs.dropdown', m.handleShowDropdown);

			// handle scrollTo for sec nav
			PubSub.subscribe(T1.constants.NAVIGATION_SET_SCROLLTO, m.setScrollTo);

			$('body').on(T1.utilities.clickEvent, '.scrollTo', _private.scrollToClick);

			// set logo on refresh
			m.setLogo();

			if (navSecondary.length > 0) {
				m.initSecondLevel();

				var pageDisclaimer = $('.page-disclaimer');
				if (pageDisclaimer.length > 0) {
					m.setDisclaimerPosition(pageDisclaimer);
				}
			}

			if (breadcrumbLi.length > 0) {
				m.initBreadCrumb();
			}

			//enable bright tagging
			$('.dropdown-menu').find('[data-bt-track]').on(T1.utilities.clickEvent, m.runBTEvent);

			return null;
		},
		/**
		 * enables custom touch scroll on the expanded menu. This prevents scrolling of the body for touch devices.
		 */
		switchDesktop: function() {
			$('#dropdown-menu-car').touchToScroll(true);
		},
		/**
		 * disable custom touch scroll on the expanded menu. On XS screens, we don't need this behaviour.
		 */
		switchMobile: function() {
			$('#dropdown-menu-car').touchToScroll(false);
		},
		initSecondLevel: function() {
			var m = _private,
				c = T1.constants,
				navSecondary = $('#nav-secondary-level'),
				secondLevelLi = navSecondary.find('li'),
				secondLevelLiDropdownLink = navSecondary.find('.dropdown > a'),
				secondLevelLinks = secondLevelLi.find('a'),
				secondLevelA;

			m.isSecondLevelVisible = true;

			// handle nav-secondary-level a clicks
			secondLevelLi.on(T1.utilities.clickEvent, m.handleSecondLevelClick);
			secondLevelLiDropdownLink.on(T1.utilities.clickEvent, _private.onMoreOptionClick);

			PubSub.subscribe(c.ON_DOC_CLICK, _private.onDOCClick);

			// check if should create "more" option or not
			PubSub.subscribe(c.ON_BREAKPOINT_CHANGE, m.setMoreLi);

			// create a list of scrollpy ids
			for(var i = 0; i < secondLevelLinks.length; i++){
				secondLevelA = $(secondLevelLinks[i]);
				if(secondLevelA.attr('href') && secondLevelA.attr('href').substr(0,1) === '#' && m.scrollSpyList.indexOf(secondLevelA.attr('href')) === -1) {
					m.scrollSpyList.push(secondLevelA.attr('href'));
				}
			}
		},
		initBreadCrumb: function() {
			var m = _private,
				c = T1.constants,
				breadcrumbLink = $('#menu-breadcrumb .active > a'),
				breadcrumbLinkTemplate = $('#breadcrumb-link-template');

			// set arrow position for breadcrumb
			m.setBreadcrumbsArrowPosition();

			PubSub.subscribe(c.ON_BREAKPOINT_CHANGE, m.setBreadcrumbsVisibleItems);
			PubSub.subscribe(c.ON_WIN_RESIZE, m.setBreadcrumbsArrowPosition);

			// handle add and remove breadcrumb element
			PubSub.subscribe(c.NAVIGATION_ADD_BREADCRUMB_LINK, m.addBreadcrumbLink);
			PubSub.subscribe(c.NAVIGATION_REMOVE_BREADCRUMB_LINK, m.removeLastBreadcrumbLink);

			breadcrumbLink.on('click', _private.onBreadcrumbActiveLinkClick);

			if(breadcrumbLinkTemplate) {
				m.breadcrumbLinkTemplate = breadcrumbLinkTemplate.html();
				breadcrumbLinkTemplate.remove();
			}
		},

		setDisclaimerPosition: function(pageDisclaimer) {
			pageDisclaimer.css('margin-top', '130px');
		},

		/**
		 * enables bright tagging for the menu elements (stopPropagation fix)!
		 * @param e
		 */
		runBTEvent: function(e){
			PubSub.publish(T1.constants.STATS_TRACK_CAROUSEL, {el: this});
		},

		/**
		 * setScrollTo: set scrollTo events
		 * @param event
		 * @param selector
		 */
		setScrollTo: function (event, selector) {
			var $selector = $(selector);

			$selector.off(T1.utilities.clickEvent);
			$selector.on(T1.utilities.clickEvent, _private.scrollToClick);
		},
		/**
		 * execute scrollTo
		 */
		scrollToClick: function(e) {
			var $this = $(this),
				options = $this.data('scrollTo') || $this.data('scrollto'),
				configs = {},
				$parent = null,
				navPrimary = $('#nav-primary'),
				topBarHeight = 0;
			if(typeof options === "string") {
				try {
					options = $.parseJSON(options);
				} catch(event){ }
			}
			if (options && (options.jumpTo || options.animation || options.animation === false)) {
				if(options.animation === false) {
					$(document).scrollTop(options.top || 0);
				} else {
					// We need an offset if the navbar is fixed on top of the screen
					if (navPrimary.css('position') === 'fixed') {
						if(_private.isSecondLevelVisible){
							topBarHeight += $('#nav-secondary-level').height();
						}
						topBarHeight += navPrimary.find('.navbar-inner').height();
						configs = {"offset": - topBarHeight};
					}
					$parent = $(options.parent).size() === 0 ? $('body') : $(options.parent);
					
					if(T1.utilities.isIOS() === true){ //jump to pos on ios, jquery scroll causes flickering on nav
						var pos = $(options.jumpTo).offset().top;
						if(configs.offset !== undefined) pos += configs.offset;
						$(window).scrollTop(pos);
					}
					else{
						$parent.scrollTo(options.jumpTo, options.easing || 500, configs);
					}
				}
			} else {
				var link = $this.attr('href'),
					target = $this.attr('target');
				if(target === '_blank') {
					window.open(link, '_blank');
				} else {
					location.href = link;
				}
			}
		},
		/**
		 * windowscroll handler
		 */
		handleWindowScroll: function() {
			setTimeout(_private.setLogo, 150);
			setTimeout(_private.setScrollSpyActive, 50);
		},
		/**
		 * handles dropdown open
		 * @param e
		 */
		handleShowDropdown: function(e) {
			if(T1.utilities.currentBreakpoint() !== 'xs' && $(e.currentTarget).hasClass('my-toyota') === false ){
				var tm = setTimeout(function(){
					$('body').addClass('noscroll');
				},T1.constants.ANIMATION_SPEED_FADE);
			}
			$(e.target).attr('data-bt-state', '');
			_private.toggleDropdown(e, true);
		},
		/**
		 * handles dropdown close
		 */
		handleHideDropdown: function(e) {
			$('body').removeClass('noscroll');
			$(e.target).attr('data-bt-state', 'collapse');
			_private.toggleDropdown(e, false);
		},
		toggleDropdown: function(event, isExpanding) {
			var m = _private,
				menuContainer = $(event.target),
				menuButton = menuContainer.children('.dropdown-toggle'),
				dropDownTarget = menuContainer.children(menuButton.attr('data-action-target')),
				searchBox = menuContainer.find('.input-search input.search'),
				menuXSmall = dropDownTarget.find('.navigation-menu.visible-xs');

			if (isExpanding) {
				PubSub.publish(T1.constants.NAVIGATION_PRIMARY_EXPAND, event);

				//dropDownTarget.not('.navigation-menu').on('click', m.stopPropagation);

				if (!m.isSmallLogo) {
					m.toggleFadeLogo();
				}

				if (searchBox.length > 0) {
					searchBox.show();
					searchBox.on(T1.utilities.clickEvent, function(e) {
						_private.stopPropagation(e);

						searchBox.removeAttr('readonly');
					});
				}
			} else {
				if (searchBox.length > 0) {
					searchBox.hide();
					searchBox.attr('readonly', '');
				}
			}

			m.isPrimaryNavOpen = isExpanding;
			m.currentDropdown = dropDownTarget;

			if (menuXSmall.length < 1 || menuXSmall.is(':hidden')) {
				m.setMenuSize();

				if (m.isPrimaryNavOpen) {
					PubSub.subscribe(T1.constants.ON_WIN_RESIZE, m.setMenuSize);
				} else {
					PubSub.unsubscribe(T1.constants.ON_WIN_RESIZE, m.setMenuSize);
				}
			}
		},
		/**
		 * perform the search
		 * @return void
		 */
		handleSearch: function(e) {
			var searchField,
				searchValue;

			if ((e.eventType || e.type)=== 'click') {
				e.preventDefault();
				_private.stopPropagation(e);
				searchField = $(e.target).closest('.input-search').find('input.search');
			} else {
				if (e.which === 13) {
					searchField = $(e.target);
				} else {
					return;
				}
			}

			searchValue = searchField.val();

			if (searchValue.length > 0) {
				PubSub.publish(T1.constants.HASH_CHANGE, '/publish/search/origin=menu/q=' + searchValue);
			}
		},
		/**
		 * stop event propagation
		 * @param e {event}: the event to stop
		 */
		stopPropagation: function(e) {
			e.stopPropagation();
		},
		/**
		 * set logos
		 */
		setLogo: function() {
			var scrollPosition = $(window).scrollTop(),
				navPrimary = $('#nav-primary'),
				mainFocus = $('#mainfocus'),
				HEIGHT_TOPBAR = navPrimary.height(),
				SCROLLSTOP_LOGO = mainFocus.length > 0 ? mainFocus.height() : HEIGHT_TOPBAR + 1;
			//	SCROLLSTOP_LOGO = HEIGHT_TOPBAR + 1;

			// position big logo
			if (!_private.isSmallLogo) {
				navPrimary.find('#logo-big').css('margin-top', -1 * scrollPosition * (SCROLLSTOP_LOGO) / SCROLLSTOP_LOGO);
				// toggle small logo
				if (scrollPosition >= SCROLLSTOP_LOGO - HEIGHT_TOPBAR) {
					_private.toggleFadeLogo();
				}
			}
		},
		/**
		 * set menu dropdown size
		 */
		setMenuSize: function() {
			var m = _private,
				menu = m.currentDropdown,
				isFullHeight = menu.attr('data-expand-height') !== 'content';

			if (m.isPrimaryNavOpen) {
				if (isFullHeight) {
					var menuheight = T1.utilities.currentBreakpoint() === 'sm' ? 56 : 70;
					menu.css('height', $(window).height() - menuheight);
				} else {
					menu.css('height', menu.children('.container').outerHeight());
				}
			} else {
				menu.css('height', 0);
			}
		},
		/**
		 * toggle logo big/small
		 */
		toggleFadeLogo: function() {
			var m = _private;

			$('#logo-big').css('opacity', m.isSmallLogo ? 1 : 0);
			$('#logo-medium').css('opacity', m.isSmallLogo ? 0 : 1);
			m.isSmallLogo = !m.isSmallLogo;
		},
		/**
		 * handles link clicks
		 */
		handleSecondLevelClick: function(e){
			var $secondLevelLi = $('#nav-secondary-level li'),
				$subMenu = $('#nav-secondary-level .dropdown .sub-menu'),
				$this = $(this);

			if(!$this.hasClass('dropdown')){
				$secondLevelLi.removeClass('active');
				$this.addClass('active');
				if(!$this.parent().hasClass('dropdown')){
					$subMenu.removeAttr('style');
					_private.isMoreSelected = false;
				}
				e.preventDefault();
			}
		},
		/**
		 * check if should create "more" option or not
		 */
		setMoreLi: function() {
			var $secondLevel = $('#nav-secondary-level'),
				$container = $secondLevel.find('.container'),
				$dropdown = $secondLevel.find('li.dropdown');

			$secondLevel.css('overflow', 'hidden');

			if ($secondLevel.is(':visible') && $secondLevel.height() < $container.height()) {
				var $secondLeveLi = $('#nav-secondary-level > ul > li').not('.dropdown'),
					$subMenu = $dropdown.find('.sub-menu'),
					$finalList,
					width = 0,
					containerWidth = $container.width();

				$dropdown.css('display', 'inline-table');

				var dropdownWidth = ($dropdown.length === 0) ? 0 : $dropdown[0].clientWidth,
					amountOfItems = $secondLeveLi.length;

				for (var i = 0; i < amountOfItems; i++) {
					width += $secondLeveLi[i].clientWidth;
					if ((width + dropdownWidth) > containerWidth) {
						break;
					}
				}
				$finalList = $secondLeveLi.slice(i, amountOfItems);
				//append all components outside nav-secondary-level bar + 1 on "more" option
				$finalList.prependTo($subMenu);

				//this is necessary if we want to see the "more" option's options :|
				$secondLevel.css('overflow', 'visible');
				_private.moreOptionSecondIteration = false;

				//possible samsung bug solving
				if($finalList.length === 0) {
					$dropdown.css('display', 'none');
				}
			} else {
				$secondLevel.css('overflow', 'visible');
				if(_private.moreOptionSecondIteration === false) {
					_private.moreOptionSecondIteration = true;

					var dropdownItem = $dropdown.find('li');

					dropdownItem.appendTo($secondLevel.find('ul'));
					dropdownItem.remove();

					$dropdown.insertAfter($secondLevel.find('li:last'));

					_private.setMoreLi();
				} else {
					_private.moreOptionSecondIteration = false;
				}
			}
		},
		/**
		 * set active class for the link related to second level link
		 */
		setScrollSpyActive: function(){
			var scrollPosition = $(window).scrollTop(),
				scrollSpyList = _private.scrollSpyList,
				$secondLevelLi = $('#nav-secondary-level li'),
				$element = null,
				elementOffsetTop = 0,
				selectedId = null,
				biggestOffset = 0,
				menuOffset = $('#nav-primary .navbar-inner').height();

			if (_private.isSecondLevelVisible) {
				menuOffset +=  $('#nav-secondary-level').height();
			}

			scrollPosition += menuOffset;

			// get which is the most accurate id depending on scrollTop position
			var lastElement = scrollSpyList[scrollSpyList.length - 1];
			for (var i = 0; i < scrollSpyList.length; i++) {
				$element = $(scrollSpyList[i]);
				if ($element.length < 1) {
					continue;
				}
				elementOffsetTop = Math.floor($element.offset().top);

				// add a 300px margin to the elementOffset. 
				var elementOffsetTopMargin = elementOffsetTop - 300;
				if (elementOffsetTopMargin <= scrollPosition && elementOffsetTop > biggestOffset) {
					biggestOffset = elementOffsetTop;
					selectedId = $element.attr('id');
				}
				// select the last element in case the document scroll position is at the bottom
				if ($(window).scrollTop() === $(document).height() - $(window).height()){
					biggestOffset = elementOffsetTop;
					selectedId = $(lastElement).attr('id');
				}
			}
			// add active class to links poiting to the focused id
			if (_private.currentSpy !== selectedId) {
				_private.currentSpy = selectedId;
				$secondLevelLi.removeClass('active');
				$secondLevelLi.find('a[href="#' + selectedId + '"]').each(function () {
					$(this).parent().addClass('active');
				});
			}
		},
		/**
		 * set arrow position for breadcrumb
		 */
		setBreadcrumbsArrowPosition: function(){
			var $activeEl = $('#menu-breadcrumb li.active');
			if($activeEl.length > 0){
				$activeEl.find('i.sprite-menu-dark-arrow').css('left', ($activeEl.position().left + (($activeEl.find('a').width() / 2) - ($activeEl.find('i.sprite-menu-dark-arrow').width() / 2))) + 'px');
			}
		},
		/**
		 * set breadcrumbs visible items
		 */
		setBreadcrumbsVisibleItems: function(event, breakpoint){
			var menuBreadCrumb = $('#menu-breadcrumb'),
				$breadcrumbsEl = menuBreadCrumb.find('li'),
				$breadcrumbsElVisible = $breadcrumbsEl.filter(':visible'),
				maxWidth = (menuBreadCrumb.width() * 2),
				arrayDiff = 0,
				totalWidth = function(array) {
					var auxWidth = 0;
					for(var i = 0; i < array.length; i++){
						auxWidth += $(array[i]).outerWidth(true);
					}
					return auxWidth;
				};

			if(breakpoint === 'xs') {
				maxWidth = (menuBreadCrumb.width() * 1);
			}
			if(totalWidth($breadcrumbsElVisible) > maxWidth){
				for(var i = 0; i < $breadcrumbsElVisible.length; i++){
					$breadcrumbsElVisible.eq(i).hide();
					$breadcrumbsElVisible = $breadcrumbsEl.filter(':visible');
					i--;
					if(totalWidth($breadcrumbsElVisible) <= maxWidth){
						_private.setBreadcrumbsArrowPosition();
						break;
					}
				}
			} else {
				arrayDiff = ($breadcrumbsEl.length - $breadcrumbsElVisible.length);
				for(var x = arrayDiff; x >= 0; x--){
					if(totalWidth($breadcrumbsElVisible) + $breadcrumbsEl.eq(x).width() <= maxWidth){
						$breadcrumbsEl.eq(x).show();
						$breadcrumbsElVisible = $breadcrumbsEl.filter(':visible');
					} else {
						break;
					}
				}
			}
		},
		addBreadcrumbLink: function(event, elementObject) {
			var html = '',
				$breadcrumb = $('#menu-breadcrumb');
			if(_private.breadcrumbLinkTemplate && $breadcrumb.length > 0 && _private.checkExistence(elementObject.name, $breadcrumb)) {
				html = _.template(_private.breadcrumbLinkTemplate, {element: elementObject });
				$breadcrumb.find('.active').removeClass('active').find('> a').off('click');
				$breadcrumb.append(html);
				$breadcrumb.find('.active > a').on('click', _private.onBreadcrumbActiveLinkClick);
			}
		},
		checkExistence: function(str, breadcrump){
			var curPath = breadcrump.text();
			return (curPath.indexOf(str) === -1);
		},
		removeLastBreadcrumbLink: function(event, elementObject) {
			var $breadcrumb = $('#menu-breadcrumb');
			if($breadcrumb.length > 0) {
				$breadcrumb.find('.active').remove();
				$breadcrumb.find('li').last().addClass('active').find('> a').on('click', _private.onBreadcrumbActiveLinkClick);
			}
		},
		onBreadcrumbActiveLinkClick: function(){
			return false;
		},
		/**
		 * on more option click, opens sub menu
		 */
		onMoreOptionClick: function(e){
			var $subMenu = $('#nav-secondary-level .dropdown .sub-menu');
			if(_private.isMoreSelected){
				_private.isMoreSelected = false;
				$subMenu.removeAttr('style');
			} else {
				$subMenu.css('opacity', '1');
				$subMenu.css('display', 'block');
				_private.isMoreSelected = true;
			}
		},
		/**
		 * on doc click, hides sub menu
		 */
		onDOCClick: function(event, e){
			var $subMenu = $('#nav-secondary-level .dropdown .sub-menu'),
				$this = $(e.target);
			if($this.parents('#nav-secondary-level').length === 0 || ($this.parents('#nav-secondary-level').length > 0 && $this.parents('.dropdown').length === 0)){
				$subMenu.removeAttr('style');
				_private.isMoreSelected = false;
			}
		}
	};
	return {
		init: _private.init,
		initDesktop: _private.initDesktop,
		switchDesktop: _private.switchDesktop,
		switchMobile: _private.switchMobile
	};
}());
