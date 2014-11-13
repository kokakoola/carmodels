/**
 * Created with JetBrains WebStorm.
 * User: Duarte.Madueno
 * Date: 03-01-2014
 * Time: 15:16
 * To change this template use File | Settings | File Templates.
 * TODO:	- close dropdown when clicking outside container
 * 			- loader overlay
 */
T1.section = ( function() {
	'use strict';
	var _props = {
		childOptionTemplate: null,
		topicsCountTemplate: null,
		bigChildOptionTemplate: null,
		keepRequesting: true,
		currentBreakpoint: ''
	};
	var _private = {
		init: function(){
			var $childOptionTemplate = $('#section-childpage-option-template'),
				$bigChildOptionTemplate = $('#section-childpage-big-option-template'),
				$topicsCountTemplate = $('#section-filter-topics-count'),
				$sectionLatestArticles = $('.section-latest-articles'),
				$articlesFilter = $sectionLatestArticles.find('.dropdown'),
				$updateButton = $sectionLatestArticles.find('.dropdown-menu .btn-update'),
				$closeFilters = $sectionLatestArticles.find('.dropdown-menu .close-filters'),
				$typesCheckboxes = $sectionLatestArticles.find('.spotlights-filter .types-checkboxes input[type="checkbox"]'),
				$searchButton = $sectionLatestArticles.find('.input-search > a'),
				$searchText = $sectionLatestArticles.find('.input-search > input[type="text"]'),
				$showMore = $sectionLatestArticles.find('.list-buttons .show-more'),
				$jumpTo = $('.jump-top');
			if ($childOptionTemplate.length > 0 && $bigChildOptionTemplate.length > 0 && $topicsCountTemplate.length > 0 && $sectionLatestArticles.length > 0) {
				//templates
				_props.childOptionTemplate = $childOptionTemplate.html();
				$childOptionTemplate.remove();
				_props.topicsCountTemplate = $topicsCountTemplate.html();
				$topicsCountTemplate.remove();
				_props.bigChildOptionTemplate = $bigChildOptionTemplate.html();
				$bigChildOptionTemplate.remove();
				//filter
				$typesCheckboxes.on('change', _private.filter.onTypesChange);
				$updateButton.on('click', _private.filter.onUpdateClick);
				$closeFilters.on('click', _private.filter.onCloseFiltersClick);
				$searchButton.on('click', _private.filter.onFilterChange);
				$searchText.on('keypress', _private.filter.onSearchTextKeypress);
				//filter - dropdown
				$articlesFilter.on('click', _private.filter.dropdown.onClick);
				PubSub.subscribe(T1.constants.ON_DOC_CLICK, _private.filter.dropdown.onDOCClick);
				//buttons - show more
				$showMore.on('click', _private.buttons.showMore.onClick);
				_private.buttons.showMore.set();
				PubSub.subscribe(T1.constants.ON_BREAKPOINT_CHANGE, _private.buttons.showMore.set);
				//buttons - jump to
				$jumpTo.on('click', _private.buttons.jumpToClick);
				//general
				PubSub.subscribe(T1.constants.ON_BREAKPOINT_CHANGE, _private.onBreakPointChange);
			}
		},
		buttons: {
			showMore: {
				set: function() {
					var $sectionLatestArticles = $('.section-latest-articles'),
						$this = null,
						$invisibleElements = null,
						$showMore = null,
						sectionsLength = $sectionLatestArticles.length,
						count = 0;
					$sectionLatestArticles.each(function(){
						count++;
						$this = $(this);
						$invisibleElements = $this.find('.section-sub-spotlights .element').not(':visible');
						$showMore = $this.find('.list-buttons .show-more');
						if($invisibleElements.length > 0) {
							$showMore.show();
							$this.find('.list-buttons').show();
						} else {
							$showMore.hide();
							if(count === sectionsLength) {
								$this.find('.list-buttons').hide();
							}
						}
					});
				},
				onClick: function(e){
					e.preventDefault();
					var $parent = $(this).parents('.section-latest-articles'),
						$nextShowMore = $parent.find('.section-sub-spotlights .element').not(':visible'),
						$jumpTop = $parent.find('.list-buttons .jump-top'),
						$filterInput = $parent.find('input.filter'),
						isAjaxCalled = false,
						requestData = null,
						numShow = 0,
						auxString = '';

					if($filterInput.length > 0) {
						requestData = _private.getRequestData($parent, false);
					}
					numShow = T1.constants.SECTION_HOMEPAGE_CHILD_SHOW_MORE_OPTIONS;
					auxString = 'SECTION_HOMEPAGE_CHILD_SHOW_MORE_OPTIONS_' + _props.currentBreakpoint.toUpperCase();
					if(T1.constants[auxString]){
						numShow = T1.constants[auxString];
					}
					$nextShowMore = $($nextShowMore.slice(0, numShow));
					// this is necessary for responsive (from md to sm)
					$parent.find('.section-sub-spotlights .element:visible').css('display', 'block');
					// show actual hidden pages
					$nextShowMore.slideDown(T1.constants.ANIMATION_SPEED_SCROLL, function(){
						if(!isAjaxCalled) {
							if(!$jumpTop.is(':visible')) {
								$jumpTop.css({ opacity: 0, display: 'inline-block' }).animate({ opacity: 1 }, T1.constants.ANIMATION_SPEED_FADE);
							}
							if(_props.keepRequesting && requestData){
								ajaxCall();
							} else {
								_private.buttons.showMore.hide($parent);
							}
						}
					});
					// ajax post request for next pages
					function ajaxCall(){
						isAjaxCalled = true;
						$.ajax({
							dataType: 'jsonp',
							url: T1.constants.SECTION_HOMEPAGE_CHILD_PAGES,
							data: requestData,
							success: function(data){
								_private.fillHTML(data, $parent, true);
							},
							timeout: T1.constants.SECTION_HOMEPAGE_CHILD_FILTERING_REQ_TIMEOUT,
							error: function(jqXHR, textStatus) {
								_private.buttons.showMore.hide($parent);
							}
						});
					}
				},
				hide: function($parent) {
					if($parent.find('.section-sub-spotlights .element').not(':visible').length === 0) {
						$parent.find('.list-buttons .show-more').fadeOut(T1.constants.ANIMATION_SPEED_FADE);
					}
				}
			},
			jumpToClick: function(e) {
				e.preventDefault();
			}
		},
		filter: {
			dropdown: {
				toggle:function($collapse) {
					if(_props.currentBreakpoint === 'xs') {
						$collapse.slideToggle(666);
					} else {
						var menu = $collapse.find('.dropdown-menu'),
							border = $collapse.find('.dropdown-border');

						if(menu.is(':visible')) {
							if($('html').hasClass('lt-ie9')) {
								border.hide();
								$collapse.removeClass('open');
							} else {
								menu.slideUp(400, function(){
									border.slideUp(50, 'linear');
								});
							}
						} else {
							if($('html').hasClass('lt-ie9')) {
								border.show();
								$collapse.addClass('open');
							} else {
								border.slideDown(50, 'linear', function(){
									menu.slideDown(400);
								});
							}
						}
					}
				},
				onClick: function(e) {
					var $this = $(this),
						$parent = $this.parents('.section-latest-articles'),
						$collapse = $parent.find('.spotlights-filter .collapsed-menu'),
						$icon = $this.find('a i');
					e.preventDefault();
					if($icon.hasClass('icon-chevron-down')) {
						$icon.addClass('icon-chevron-up').removeClass('icon-chevron-down');
					} else {
						$icon.removeClass('icon-chevron-up').addClass('icon-chevron-down');
					}
					_private.filter.dropdown.toggle($collapse);
				},
				onDOCClick: function(event, e) {
					var $collapse = null,
						$icon = null,
						$this = $(e.target);
					if($this.parents('.collapsed-menu').length === 0 && $this.parents('.dropdown-container').length === 0){
						$collapse = $('.collapsed-menu');
						if($collapse.find('.dropdown-menu').is(':visible')){
							$icon = $collapse.parents('.dropdown-container').find('.dropdown a i');
							$icon.addClass('icon-chevron-down').removeClass('icon-chevron-up');
							_private.filter.dropdown.toggle($collapse);
						}
					}
				}
			},
			onSearchTextKeypress: function(e){
				if (e.keyCode == 13) {
					_private.filter.onFilterChange(null, this);
					return false;
				}
			},
			onCloseFiltersClick: function(e) {
				var $this = $(this),
					$collapse = $this.parents('.collapsed-menu');
				_private.filter.dropdown.toggle($collapse);
			},
			onUpdateClick: function(e) {
				var icon = $(this).closest('.dropdown-container').find('a i'),
					collapse = $(this).parents('.collapsed-menu');

				icon.removeClass('icon-chevron-up').addClass('icon-chevron-down');
				_private.filter.dropdown.toggle(collapse);
				_private.filter.onFilterChange(null, this);
			},
			onTypesChange: function(e) {
				var $this = $(this),
					$tag = $this.parents('.category-tag');
				if($this.prop('checked') === true) {
					$tag.removeClass('unchecked');
				} else {
					$tag.addClass('unchecked');
				}
				_private.filter.onFilterChange(null, this);
			},
			onFilterChange: function(e, control) {
				if(e) {
					e.preventDefault();
				}
				var $this = (control ? $(control) : $(this)),
					$parent = $this.parents('.section-latest-articles'),
					requestData = _private.getRequestData($parent, true);
				$parent.showT1Loader();
				$.ajax({
					dataType: 'jsonp',
					url: T1.constants.SECTION_HOMEPAGE_CHILD_PAGES,
					data: requestData,
					success: function(data){
						_private.fillHTML(data, $parent, false);
						$parent.hideT1Loader();
					},
					timeout: T1.constants.SECTION_HOMEPAGE_CHILD_FILTERING_REQ_TIMEOUT,
					error: function(jqXHR, textStatus) {
						_private.buttons.showMore.hide($parent);
						$parent.hideT1Loader();
					}
				});
			}
		},
		onBreakPointChange: function(event, data){
			_props.currentBreakpoint = data;
		},
		fillHTML: function(data, $parent, append) {
			if(!data.pages) return;
			var $topicsCount = $parent.find('.spotlights-filter .topics-count'),
				$bigSolightsList = $parent.find('.section-sub-spotlights .row.big'),
				$smallSpolightsList = $parent.find('.section-sub-spotlights .row.small'),
				$showMore = $parent.find('.list-buttons .show-more'),
				$jumpTop = $parent.find('.list-buttons .jump-top'),
				$elements = null,
				bigOptions = [],
				smallOptions = [],
				items = data.pages,
				counters = data.counters,
				count = 0,
				html = '';
				if(append === true) {
					if(items.length > 0) {
						count = $smallSpolightsList.find('.element').length;
						$smallSpolightsList.append(_.template(_props.childOptionTemplate, {options: items, count: count }));
					} else {
						_private.buttons.showMore.hide($parent);
					}
				} else {
					if(items.length > 0) {
						if(items.length > T1.constants.SECTION_HOMEPAGE_CHILD_NUM_BIG_OPTIONS) {
							bigOptions = items.slice(0, T1.constants.SECTION_HOMEPAGE_CHILD_NUM_BIG_OPTIONS);
							smallOptions = items.slice(T1.constants.SECTION_HOMEPAGE_CHILD_NUM_BIG_OPTIONS);
						} else {
							bigOptions = items;
							smallOptions = null;
						}
						//big options template
						$bigSolightsList.html(_.template(_props.bigChildOptionTemplate, {options:bigOptions}));
						if(smallOptions) {
							$smallSpolightsList.html(_.template(_props.childOptionTemplate, {options:smallOptions, count: count }));
						} else {
							$smallSpolightsList.html('');
						}
						$jumpTop.hide();
						_props.isJumpVisible = false;
						$elements = $parent.find('.section-sub-spotlights .element');
						if($elements.not(':visible').length > 0) {
							$showMore.show();
						} else {
							$showMore.hide();
						}

						html = _.template(_props.topicsCountTemplate, {counters: counters });
						try { html = html.trim(); } catch (event) { }
						//TODO: check with peter if he is already sending the totals
						if(html.length > 0) {
							$topicsCount.show();
							$topicsCount.html(html);
						} else {
							$topicsCount.hide();
						}
					} else {
						$topicsCount.hide();
						$bigSolightsList.html('');
						$smallSpolightsList.html('');
						_private.buttons.showMore.hide($parent);
					}
				}
				if(items.length < T1.constants.SECTION_HOMEPAGE_CHILD_FILTERING_COUNT) {
					_props.keepRequesting = false;
				} else {
					_props.keepRequesting = true;
				}
		},
		getRequestData: function($parent, newSearch) {
			var $filterInput = $parent.find('input.filter'),
				$elements = $parent.find('.section-sub-spotlights .element'),
				$typesCheckboxes = null,
				$keywordsCheckboxes = $parent.find('.spotlights-filter .dropdown-menu input[type="checkbox"]'),
				start = (newSearch === true ? 0 : $elements.length),
				count = (newSearch === true ? T1.constants.SECTION_HOMEPAGE_CHILD_FILTERING_COUNT_NEW_FILTER : T1.constants.SECTION_HOMEPAGE_CHILD_FILTERING_COUNT),
				types = '',
				keywords = '',
				selectedTypes = [],
				selectedKeywords = [];
			if(_props.currentBreakpoint === 'xs') {
				$typesCheckboxes = $parent.find('.spotlights-filter .types-checkboxes.mobile input[type="checkbox"]');
			} else {
				$typesCheckboxes = $parent.find('.spotlights-filter .types-checkboxes.desktop input[type="checkbox"]');
			}
			$typesCheckboxes.each(function() {
				var $this = $(this);
				if($this.prop('checked') === true) {
					selectedTypes.push($this.val());
				}
			});
			$keywordsCheckboxes.each(function() {
				var $this = $(this);
				if($this.prop('checked') === true) {
					selectedKeywords.push($this.val());
				}
			});
			if(selectedTypes.length < $typesCheckboxes.length) {
				if(selectedTypes.length === 0) {
					types = 'null';
				} else {
					types = selectedTypes.join('|');
				}
			}
			if(selectedKeywords.length < $keywordsCheckboxes.length) {
				keywords = selectedKeywords.join('|');
			}
			return {
				filter: encodeURIComponent($filterInput.val()), //a string that is looked for in the Pages 'title' or 'description'
				keywords: keywords, //a string of category keywords separated by '|' (pipe)
				types: types, //a string of page types separated by '|' (pipe)
				count: count, //the (maximum) number of pages that are returned
				start: start, //the start index of pages that are returned
				includePromos: T1.constants.SECTION_HOMEPAGE_CHILD_FILTERING_PROMOS //if 'true', promotion pages are included also in the result
			};
		}
	};
	/*returns the public methods of the component*/
	return {
		init:_private.init
	};
}());
