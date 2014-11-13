var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *  jQuery bootstrap pagination
 */
T1.mainSearch = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		mainContainer: null,
		searchAPI: "/api/search/",
		filterToggle: null,
		filterPane: null,
		optionTagHolder: null,
		optionCheckboxes: null,
		updateButton: null,
		searchButton: null,
		searchField: null,
		searchLegend: null,
		results: null,
		pagination: null,

		options: [],
		phrase: null,
		pageSize: 10,
		startIndex: 0,
		endIndex: 10,
		pagLimit: 10,
		total: null,
		inOverlayer: false,
		initialQuery: null,
		/**
		 * initializes the container
		 */
		init: function(){
			// bind the search event
			PubSub.subscribe(T1.constants.SEARCH, _private.search);
			var hasSearchComponent = $('#searchcomponent').length>0; //only connect events if this is the searchpage itself
			if(hasSearchComponent) _private.updateGlobalProperties();
			//global events
			PubSub.subscribe(T1.constants.ON_BREAKPOINT_CHANGE, function(event, data){
				_private.fixLayout(data);
			});
			if(hasSearchComponent){
				_private.subscribeButtonEvents();
				_private.optionCheckboxes.prop("checked", false).trigger("change");
				_private.searchLegend.hide();
			}
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_CLOSED, function(evt, data){
				_private.inOverlayer = false;
				_private.initialQuery = null;
			});
			PubSub.subscribe(T1.constants.TABS_SWITCH, function(evt, data){
				if(data === "pane-search") _private.updateGlobalProperties();
			});
		},
		search: function(evName, data){
			if(!data) data={};
			else { _private.initialQuery = data; }

			//Open the overlayer with the search form
			if(!_private.inOverlayer){
				_private.inOverlayer = true;
				var destination = (T1.settings.mock) ? "/mockups/forms/forms.html" : "/forms/forms.json";
				PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {ajax: true, url: destination, sync: true});
				//Wait for sync until the page is downloaded and added to the overlayer
				var tokenOpenOverlayer = PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, function(){
					PubSub.publish(T1.constants.TABS_SWITCH, 'pane-search');
					_private.updateGlobalProperties();
					_private.subscribeButtonEvents();
					if(data.q){
						_private.searchField.val(data.q);
						_private.phrase = data.q;
						_private.performSearch();
					}
					_private.optionCheckboxes.prop("checked", false).trigger("change");
					_private.searchLegend.hide();
					PubSub.unsubscribe(tokenOpenOverlayer);
					_private.toggleFilterPrefix();
				});
			}
		},
		updateGlobalProperties: function(){
			//define the containers
			_private.mainContainer		= $(".search-component");
			_private.filterToggle		= $(".filter-pane-button", _private.mainContainer);
			_private.filterPane			= $(".search-filter-options", _private.mainContainer);
			_private.optionTagHolder	= $(".search-result-selected-filters", _private.mainContainer);
			_private.optionCheckboxes	= $("input[type='checkbox']", _private.filterPane);
			_private.updateButton		= $(".btn-update", _private.filterPane);
			_private.searchButton		= $(".perform-search-button", _private.mainContainer);
			_private.searchField		= $(".main-search-field", _private.mainContainer);
			_private.searchLegend		= $(".search-result-counts", _private.mainContainer);
			_private.searchNoResults	= $(".search-no-results", _private.mainContainer);
			_private.results			= $(".search-results-inner", _private.mainContainer);
			_private.pagination			= $(".search-pagination", _private.mainContainer);

			_private.optionCheckboxes.prop("checked", false).trigger("change");

			_private.subscribeButtonEvents();

			if(T1.breakpoints.returnCurrentBreakPoint) _private.fixLayout(T1.breakpoints.returnCurrentBreakPoint);
		},
		subscribeButtonEvents: function(){
			//assign the event handlers
			_private.filterToggle.unbind("click").on("click", _private.onFilterToggle);
			_private.updateButton.unbind("click").on("click", function(e){
				_private.onFilterToggle(e);
				if(_private.phrase) {
					_private.performSearch();
					_private.publishFullSearchEvent();
				}
			});
			_private.optionCheckboxes.unbind("change").on("change", _private.onFilterCheckboxChange);
			_private.searchButton.unbind("click").on("click", _private.onSearchButtonClick);
			_private.searchField.unbind("keydown").on("keydown", function(e){
				if(e.which === 13 && $(this).val().length>0){
					//_private.phrase = $(this).val();
					_private.performSearch();
					_private.publishFullSearchEvent();
				}
			});
		},
		/**
		 * tweaks the layout according to the breakpoint
		 * @param bp (String) name of the breakpoint (xs, sm, md, lg)
		 */
		fixLayout: function(bp){
			switch(bp){
				case "lg":
				case "md":
					$(".search-filter-options-inner").css({
						"width":"206%"
					});
				break;
				case "sm":
					$(".search-filter-options-inner").css({
						"width":"100%"
					});
				break;
				default:
				break;
			}
		},
		/**
		 * callback for the filter options in dropdown
		 * @param e (Object) the event object
		 */
		onFilterToggle: function(e){
			e.preventDefault();
			var bridge  = $(".dropdown-border", _private.filterPane);
			var content = $(".search-filter-options-inner", _private.filterPane);
			var iconArr = $("i", _private.filterToggle);
			if(_private.filterPane.hasClass("expanded")){
				iconArr.removeClass("icon-chevron-up").addClass("icon-chevron-down");
				_private.filterPane.removeClass("expanded");
				_private.expandCollapse(content, bridge);
			}else{
				iconArr.removeClass("icon-chevron-down").addClass("icon-chevron-up");
				_private.filterPane.addClass("expanded");
				_private.expandCollapse(bridge, content);
			}
		},
		/**
		 * callback for the checkbox change event
		 * @param e (Object) the event object
		 */
		onFilterCheckboxChange: function(e){
			if($(this).is(":checked")){
				_private.addOption($(this).val());
			}else{
				_private.removeOption($(this).val());
			}
		},
		/**
		 * callback for the search button
		 * @param e (Object) the event object
		 */
		onSearchButtonClick: function(e){
			e.preventDefault();
			if(_private.searchField.val().length === 0) return;
			//_private.phrase = _private.searchField.val();
			_private.performSearch();
			_private.publishFullSearchEvent();
		},
		/*
		*  not called in performSearch function because performSearch is already linked to SEARCH event.
		* */
		publishFullSearchEvent: function() {
			PubSub.publish(T1.constants.FULL_SEARCH, {
				origin: _private.initialQuery ? 'overlayer' : 'empty-overlayer',
				q: _private.phrase,
				options: _private.options,
				initialQuery: _private.initialQuery,
				pageIndex: _private.startIndex
			});
		},
		/**
		 * callback for the pagination
		 * @param event (Object) the modified event object
		 * @param orgEvent (Object) original event object
		 * @param type (String) type of the event (page, first, last, next, prev)
		 */
		onPaginationClick: function(event, orgEvent, type, page){
			switch(type){
				case "page":
					_private.startIndex = page-1;
				break;
				case "first":
					_private.startIndex = 0;
				break;
				case "last":
					_private.startIndex = Math.floor(_private.total/_private.pageSize);
				break;
				case "prev":
					_private.startIndex--;
				break;
				case "next":
					_private.startIndex++;
				break;
				default:
				break;
			}
			_private.performSearch(true);
			_private.publishFullSearchEvent();
		},
		/**
		 * compiles the url for the search service with the needed params
		 * @return url (String) the compiled url
		 */
		buildURL: function(pagination){
			if(typeof pagination === "undefined") pagination = false;
			var url = _private.searchAPI+_private.phrase;
			if(_private.options.length>0 && !pagination) _private.startIndex = 0;
			var index = _private.startIndex*_private.pageSize;
			var query = "?count="+_private.pageSize+"&start="+index;
			if(_private.options.length>0){
				query += "&keywords=";
				query += _private.options.join("|");
			}
			return url+query;
		},
		/**
		 * concanates the related strings with a dot for the result description
		 * @param arr (Array) array of the strings
		 * @return desc (String) concanated description string
		 */
		concatDesc: function(arr){
			var desc = "";
			for(var i=0; i<arr.length; i++){
				if(i>0) desc+=". ";
				desc+=arr[i];
			}
			return desc;
		},
		/**
		 * fires a call to the search service
		 * @return void
		 */
		performSearch: function(pagination){
			if(_private.searchField.val().length>0 && _private.phrase !== _private.searchField.val()){
				_private.startIndex = 0;
				_private.phrase = _private.searchField.val();
			}
			if(!_private.phrase) return;
			//PubSub.publish(T1.constants.HASH_REWRITE, "#/publish/search/q="+_private.phrase);

			var url = _private.buildURL(pagination);
			$.getJSON(url, _private.onGetSearchData);
		},
		/**
		 * callback for the search services response
		 * @param data (Object) the response from the search service
		 */
		onGetSearchData: function(data){
			if(!data) return;
			if(!data.pages) _private.handleEmptyResult();
			$(".empty-result-holder").hide();
			_private.total = (data.pages.length === 0) ? data.pages.length : data.total;
			_private.endIndex = (_private.startIndex*_private.pageSize)+_private.pageSize;
			_private.generateLegend();
			if(_private.total>_private.pageSize){
				_private.generatePagination();
			}else{
				_private.pagination.empty();
			}
			_private.results.empty();
			if(_private.total === 0){
				_private.handleEmptyResult();
			}else{
				_private.searchLegend.show();
				_private.searchNoResults.hide();
			}
			for(var i=0; i<data.pages.length; i++){
				var node = data.pages[i];
				//var bodyTXT = (node.highlight) ? _private.concatDesc(node.highlight.html) : "";
				var bodyTXT = (node.content) ? _private.concatDesc(node.content) : "";
				//var resultNode = _private.generateResultNode(node.source.url, node.source.title, node.source.pubDate, bodyTXT, false);
				var resultNode = _private.generateResultNode(node.url, node.title, node.date, bodyTXT, false);
				_private.results.append(resultNode);
			}
			$(".overlayerContent").animate({
				scrollTop: (_private.mainContainer.offset().top)
			}, T1.constants.ANIMATION_SPEED_SCROLL);
		},
		handleEmptyResult: function(){
			_private.searchLegend.hide();
			_private.pagination.empty();
			_private.searchNoResults.show();
			return;
		},
		/**
		 * concanates the related strings with a dot for the result description
		 * @param arr (Array) array of the strings
		 * @return desc (String) concanated description string
		 */
		expandCollapse: function(firstEl, secondEl) {
			/*
			var menu = $collapse.find('.dropdown-menu'),
				border = $collapse.find('.dropdown-border');
			*/
			var $collapse = firstEl.parent();
			var border = (firstEl.is(".dropdown-border")) ? firstEl : secondEl;
			var menu   = (firstEl.is(".dropdown-border")) ? secondEl : firstEl;

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
		},
		/**
		 * toggles the prefix in the "optionTagHolder".
		 * the prefix will be hidden if no tags are present.
		 */
		toggleFilterPrefix: function(){
			var filterprefix = _private.optionTagHolder.find('.filter-prefix');
			if( filterprefix.length > 0 ){
				if(_private.optionTagHolder.children().length === 1){
					_private.optionTagHolder.find('.filter-prefix').hide();
				}
				else{
					_private.optionTagHolder.find('.filter-prefix').show();
				}
			}
		},
		/**
		 * adds a filter parameter for the search results
		 * @param val (String) the filter option that needs to be added
		 */
		addOption: function(val){
			_private.options.push(val);
			var span = $("<span/>").attr("data-filter-keyword", val).addClass("search-result-selected-filter").text(val).appendTo(_private.optionTagHolder);
			var icon = $("<i/>").addClass("icon-remove search-result-remove-filter").appendTo(span);
			icon.on("click", function(e){
				$("input[value='"+val+"']", _private.filterPane).prop("checked", false).trigger("change");
				_private.removeOption(val);
				_private.performSearch();
				_private.publishFullSearchEvent();
			});
			_private.toggleFilterPrefix();
		},
		/**
		 * removes a filter parameter from the present filter options
		 * @param val (String) the filter option that needs to be removed
		 */
		removeOption: function(val){
			var index = _private.options.indexOf(val);
			if(index === -1) return;
			_private.options.splice(index, 1);
			$(".search-result-selected-filter[data-filter-keyword='"+val+"']").remove();
			_private.toggleFilterPrefix();
		},
		/**
		 * generates the pagination ui according t the results
		 */
		generatePagination: function(){
			var numberOfPages = Math.ceil(_private.total/_private.pageSize);
			_private.pagination.empty().bootstrapPaginator({
				"numberOfPages":numberOfPages,
				"currentPage":(_private.startIndex+1),
				"totalPages":(numberOfPages>_private.pagLimit) ? _private.pagLimit : numberOfPages,
				"onPageClicked":_private.onPaginationClick,
				"alignment":"center"
			});
		},
		/**
		 * updates the text that shows the start and end index of the shown results
		 */
		generateLegend: function(){
			var startIn = _private.startIndex*_private.pageSize;
			if(startIn === 0) startIn++;
			$(".search-start-index", _private.searchLegend).text(startIn);
			$(".search-end-index", _private.searchLegend).text((_private.total<_private.pageSize || _private.endIndex>_private.total) ? _private.total : _private.endIndex);
			$(".search-total-count", _private.searchLegend).text(_private.total);
			$(".search-count-phrase", _private.searchLegend).text(_private.phrase);
			_private.searchLegend.show();
		},
		/**
		 * compiles a single result node according to the given data
		 * @param link (String) the link that goes to the page the node is crawled from
		 * @param title (String) the title of the search result node
		 * @param date (Date) the publication date of the search result node
		 * @param description (String) the description of the search result node
		 * @param active (Boolean) whether the search result node featured or not
		 * @return node (HTML) returns the compiled result node
		 */
		generateResultNode: function(link, title, date, description, active){
			if(typeof active === "undefined") active = false;
			var fdate = Globalize.parseDate(date.replace(/\.[0-9]+/, ""), "yyyy-MM-ddTHH:mm:ss");
			var node = $("<a/>").attr("href", link).addClass("search-result-node").append($("<div/>").addClass("search-result-title").text(title));
			$("<div/>").addClass("search-result-date").text(globalize.format(fdate, "d")).appendTo(node);
			$("<div/>").addClass("search-result-body").html(description).appendTo(node);
			return node;
		}
	};
	//public methodes
	return {
		init: _private.init
	};
})();
