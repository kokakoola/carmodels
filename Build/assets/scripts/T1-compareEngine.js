var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *
 */
T1.engineCompare = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)

	var _private = {
		engineNodesMainContainer: $(".compare-equipment"),
		allCompare: $(".compare-button"),
		compareButtons: null,
		compareCheckboxes: null,
		selectedEngines: [],
		engines: [],
		engineImages: {},
		engineTitles: {},
		enginePayments: {},
		fuelTypes: {},

		overlayContent: null,
		gridContainer: null,
		controlContainer: null,
		editSelect: null,
		filterContainer: null,
		changeCompareMenu: null,
		data: null,
		titles: {},
		bodyTypes: null,
		currentBodyType: null,
		currentFuelType: false,
		modal: null,
		pageName: $('.enginecompare').attr('data-section-title'),
		hidePrices: null,
		minWarningText: null,
		maxWarningText: null,
		exceptionsLegendId: 'engines-exceptions-legend',

		/* *
		 * initializes the main container
		 * @return {void} void
		 * */
		initDesktop: function(){
			_private.hidePrices = (T1.settings.hidePrices === "true");
			if(_private.engineNodesMainContainer.length === 0) return;
			_private.isTrackingEnabled = typeof(window.t1DataLayer) === 'object';
			_private.minWarningText = T1.labels.comparator.compareMinEng;
			_private.maxWarningText = T1.labels.comparator.compareMaxEng;
			//init the containers and ignitors
			_private.compareButtons = $(".compare-btn", _private.engineNodesMainContainer);
			_private.compareCheckboxes = $(".compare-check", _private.engineNodesMainContainer);

			_private.overlayContent = $(".compare-data");
			_private.gridContainer = $(".ec-grid-container", _private.overlayContent);
			_private.controlContainer = $(".compare-top-controls", _private.overlayContent);
			_private.editSelect = $(".engine-model-options", _private.overlayContent);
			_private.filterContainer = $(".other-options", _private.overlayContent);

			_private.compareButtons.on("click", _private.onCompareBtnClick);
			_private.allCompare.on("click", _private.onAllCompare);
			_private.compareCheckboxes.prop("checked", false);
			//send ajax request to get the needed data
			_private.getData();
			//subscribe for needed events
			PubSub.subscribe(T1.constants.ENGINE_COMPARE_CHANGE, function(msg, data){
				_private.compareCheckboxes.prop("checked", false);
				_private.compareButtons.removeClass("btn-dark");
				for(var i=0; i<_private.selectedEngines.length; i++){
					var engine =  _private.selectedEngines[i];
					$("input[data-engine-select-type='"+engine+"']").prop("checked", true).parent().addClass("btn-dark");
				}
				_private.compareCheckboxes.trigger("change");
			});
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_OPEN, function(data){
				if($(".overlayerWrapper").is(".compare-overlay-wrapper") && $(".compare-data", ".compare-overlay-wrapper").length > 0 && _private.modal === null){
					_private.modal = $("<div/>").addClass("ec-select-modal").css("width", $(window).width()+"px").hide().prependTo($(".overlayerContent"));
					_private.modal.on("click", _private.onJustCloseClick);
				}
			});
			PubSub.subscribe(T1.constants.ON_WIN_RESIZE, function(event, data){
				var newWidth = $(window).width()-15;
				$(".ec-select-modal").css("width", newWidth+"px");
			});
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_CLOSED, function(data){
				if(_private.modal !== null) _private.modal.remove();
				_private.overlayContent.find('.scrollcontainer').remove();
			});
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_RESIZE, _private.setScrollContainerSize);
			PubSub.subscribe(T1.constants.ENGINE_COMPARE_PRINT, _private.print);

			_private.compareCheckboxes.slice(0, 3).prop("checked", true).trigger("change");
			_private.compareButtons.slice(0, 3).removeClass("btn-grey").addClass("btn-dark");
			_private.compareCheckboxes.on("change", _private.onCheckboxChange);
		},
		/*
		 * print selection
		 * */
		print: function(event, data) {
			PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {
				url: decodeURIComponent($('#enginecompare').data('print-url')),
				ajax: true,
				styleClass: 'print-overlay-wrapper',
				pageName: _private.pageName
			});
			var token = PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, function(event, data) {
				if($(data.el).find('#printEnginesCompare')) {
					_private.loadPrintContent();
					window.print();
					PubSub.unsubscribe(token);
				}
			});
		},
		/*
		 * create content to print
		 * */
		loadPrintContent: function() {
			var clone = $('.compare-data').children().clone(),
				group = clone.find('#panelGroup-engines'),
				container = $('#printEnginesCompare');

			clone.find('.filter-holder, .selection-trigger-holder, .icon-remove-container, .buttonrow, .mini-edit-selection-menu, td[data-filtered=false]').remove();
			clone.find('i.exceptions').each(function(key, val){
				var $this = $(val),
					label = '(*' + (key + 1) + ') ' + $this.closest('tr').find('td:first()').text(),
					panel = $('<div id="exceptionsPanel-' + key + '" class="exceptions panel panel-default"><div class="panel-heading"><h4><b>' + label + '</b></h4></div><div id="mc_pane-exceptions' + key + '" class="panel-collapse collapse"></div></div>'),
					exceptions = $($this.attr('data-tooltip-selector')).find('.expansion-inner').clone();

				$this.text($this.text() + ' (*' + (key + 1) + ')');
				exceptions.find('.row > div').attr('class', '').addClass('col-lg-6 col-md-6 col-sm-6');
				panel.find('.panel-collapse').addClass('exceptions-panel').append(exceptions.children('.row'));
				panel.appendTo(group);
			});
			clone.find('.expansion-content').remove();
			clone.appendTo(container);

			container.find('.section-title').
				prepend(('<h4>' + T1.labels.comparator.printDate + '</h4>').replace('{date}', globalize.format(new Date(), 'F'))).
				prepend($('<img class="logo"/>').attr("src", container.attr("data-logo-url")));
		},
		/* *
		 * event handler for the engine types on main page
		 * @param e event object
		 * @return {void} void
		 * */
		onCompareBtnClick: function(e){
			e.preventDefault();
			var cb = $("input", $(this).parent());
			cb/*.prop("checked", !cb.is(":checked"))*/.trigger("change");
		},
		/* *
		 * event handler for compare button on the mainpage
		 * @param e event object
		 * @return {void} void
		 * */
		onAllCompare: function(e){
			$(this).trigger("blur");
			_private.renderTable();
			//location.hash = "/compare/compare-engines";
			PubSub.publish(T1.constants.HASH_CHANGE, '/publish/pageoverlayer_open/html=.compare-data/preserveContent=true/styleClass=compare-overlay-wrapper/pageName='+_private.pageName);
		},
		/* *
		 * renders the tables in the collapsibles
		 * @return {void} void
		 * */
		renderTable: function(){
			_private.selectedEngines = [];
			for (var i = 0; i < _private.compareCheckboxes.length; i++) {
				if (_private.compareCheckboxes.get(i).checked) {
					_private.selectedEngines.push(_private.compareCheckboxes.eq(i).attr('data-engine-select-type'));
					_private.sortSelectedEngines();
				}
			}
			_private.filterColumns();
			_private.generateSelectionControls();
		},
		/* *
		 * event handler for the update button in change engine comparison menu
		 * @param e event object
		 * @return {void} void
		 * */
		onEditSelection: function(e){
			_private.filterColumns();
			_private.generateSelectionControls();
		},
		/* *
		 * event handler for the checkboxes in change engine comparison menu
		 * @param e event object
		 * @return {void} void
		 * */
		onCheckboxChange: function(e){
			var bt = $(this).parent();
			_private.extendCheckboxChange(_private, bt, $(this), e);
		},
		/* *
		 * makes event handler usable by model compare component
		 * @param instance {object} instance of the main constructor
		 * @param bt {DOM} the button which is clicked
		 * @param cb {DOM} checkbox in the triggered button
		 * @param e {Event object} event object
		 * @return {void} void
		 * */
		extendCheckboxChange: function(instance, bt, cb, e){
			if(cb.is(':checked')){
				//check if the limit for comparing items are exceeded
				if(!_private.checkCompareSize(instance)){
					//prevent to action and show a message
					PubSub.publish(T1.constants.TOAST_CUSTOM, {
						customContainer : $('body'),//instance.engineNodesMainContainer || instance.modelNodesMainContainer,
						customText      : instance.maxWarningText,
						timeout         : 2000,
						centerScreen    : true
					});
					cb.prop('checked', false).trigger('change');
					e.preventDefault();
					return;
				}
				bt.removeClass('btn-grey').addClass('btn-dark');
			}else{
				//check if there are at least two items to compare
				if(!_private.checkCompareMinSize(instance)){
					//prevent the action and show a message
					PubSub.publish(T1.constants.TOAST_CUSTOM, {
						customContainer : $('body'),//instance.engineNodesMainContainer || instance.modelNodesMainContainer,
						customText      : instance.minWarningText,
						timeout         : 2000,
						centerScreen    : true
					});
					cb.prop('checked', true).trigger('change');
					e.preventDefault();
					return;
				}
				bt.removeClass('btn-dark').addClass('btn-grey');
			}
		},
		/* *
		 * makes sure the table columns have th same order as the thumbnails
		 * @return {array} sorted array
		 * */
		sortSelectedEngines: function(){
			_private.selectedEngines.sort(function(a, b){
				var aIndex = _private.engines.indexOf(a);
				var bIndex = _private.engines.indexOf(b);
				return (aIndex>bIndex) ? 1 : -1;
			});
		},
		/* *
		 * makes sure there are not more than three selected items
		 * @param instance {object} the instance of the main constructor
		 * @return {boolean} whether there are more than three selected items or not
		 * */
		checkCompareSize: function(instance){
			var selection = instance.compareCheckboxes.filter(":checked").length;
			return (selection <= 3);
		},
		/* *
		 * makes sure there are at least two items to compare
		 * @param instance {object} the instance of the main constructor
		 * @return {boolean} whether there are more than one selected items to compare
		 * */
		checkCompareMinSize: function(instance){
			var selection = instance.compareCheckboxes.filter(":checked").length;
			return (selection > 1);
		},
		/* *
		 * request data from backend
		 * @return {void} void
		 * */
		getData: function(){
			var model = $(".car-model").data("car-model");
			$.getJSON("/api/cardb/enginecompare/"+model, _private.onGetData);
		},
		/* *
		 * callback for the ajax request
		 * @param data {json} the data that is returned from the server
		 * @return {void} void
		 * */
		onGetData: function(data){
			if(data.length === 0) return;
			_private.data = data;
			_private.generateHTML();
		},
		/*
		 * parse the data and generate needed dynamic html
		 * @return {void} void
		 * */
		generateHTML: function(){
			_private.generateIndexes();
			_private.addCollapsePanels();
		},
		/*
		 * Format the data so it is usable for parsing and generating the dynamic HTML
		 * @return {void} void
		 * */
		generateIndexes: function(){
			_private.bodyTypes = _private.data.bodyTypes;
			_private.fuelTypes = _private.data.fuelTypes;
			_private.fuelTypes.unshift({code: false, name: T1.labels.viewAll});
			_private.currentBodyType = _private.bodyTypes[0].code;
			for (var i in _private.data.engines[0].bodyTypes[_private.currentBodyType]) {
				var rootData = _private.data.engines[0].bodyTypes[_private.currentBodyType][i];
				_private.titles[i] = [];
				for (var k = 0; k < rootData.items.length; k++) {
					_private.titles[i].push({"name": rootData.items[k].name, "id": rootData.items[k].id});
				}
			}
			for (var j = 0; j < _private.data.engines.length; j++) {
				_private.engines.push(_private.data.engines[j].code);
				var eImg = null;
				if (_private.data.engines[j].images) {
					eImg = _private.data.engines[j].images["IMG_TECH-GUIDE_91x91"];
				}
				_private.engineImages[_private.data.engines[j].code] = {"img": eImg, "title": _private.data.engines[j].title, "hybrid": (_private.data.engines[j].isHybrid) ? _private.data.engines[j].isHybrid : false, "fuelType": _private.data.engines[j].fuel};
				_private.enginePayments[_private.data.engines[j].code] = _private.data.engines[j].payments;
			}
			_private.addFilters();
		},
		/*
		 * Add the needed filters and radio buttons
		 * @return {void} void
		 * */
		addFilters: function(){
			var holder			= $('<div/>').addClass('filter-holder').appendTo(_private.filterContainer),
				bodyHolder		= $('<div/>').addClass('body-type-filter').appendTo(holder).addClass('darker'),
				fuelHolder		= $('<div/>').addClass('fuel-filter').appendTo(holder).addClass('darker'),
				legendHolder	= $('<div/>').addClass('legend-holder').appendTo(holder),
				exs				= _private.getExpansionContainer(_private.exceptionsLegendId).appendTo(legendHolder);

			if(_private.isTrackingEnabled){
				bodyHolder.attr({
					'data-bt-action': 'click_function',
					'data-bt-value': 'change_bodytype'
				});
				fuelHolder.attr({'data-bt-action': 'filter_engine'});
			}

			$("<h5/>").text(T1.labels.comparator.chooseBodytype+":").appendTo(bodyHolder);
			$("<h5/>").text(T1.labels.comparator.chooseFuel+":").appendTo(fuelHolder);

			var dropdown = $("<div/>", {
				"class": "dropdown",
				"data-select": "bodytype"
			});
			var dropdowntoggle = $("<a/>", {
				"class": "dropdown-toggle",
				"href": "#",
				"data-validation": "select",
				"data-toggle": "dropdown",
				"role": "button"
			}).append("<span>Please select</span><i class='icon-chevron-down'></i>");
			var dropdownmenu = $("<ul/>", {
				"class": "dropdown-menu",
				"role": "menu"
			});

			if(_private.bodyTypes.length > 2) {
				dropdown.append(dropdowntoggle).append(dropdownmenu).appendTo(bodyHolder);
				for (var i in _private.bodyTypes) {
					_private.addDropDownItem(_private.bodyTypes[i].name, _private.bodyTypes[i].code, dropdownmenu, bodyHolder, _private.onBodyFilterChange, _private.currentBodyType);
				}
			} else {
				for(var k in _private.bodyTypes){
					_private.addRadioButton(_private.bodyTypes[k].name, _private.bodyTypes[k].code, bodyHolder, "body-type-label", "ec-body-type-radio", "ec-filter-body-type", _private.onBodyFilterChange, _private.currentBodyType, _private.isTrackingEnabled?{'data-bt-track': ''}: null);
				}
			}

			for (var j = 0; j < _private.fuelTypes.length; j++) {
				var tagEngineType;
				switch (_private.fuelTypes[j].code) {
					case false:
						tagEngineType = 'all';
						break;
					case '1':
						tagEngineType = 'fuel';
						break;
					case '2':
						tagEngineType = 'diesel';
						break;
					case 'h_1':
						tagEngineType = 'hybrid';
						break;
					default:
						tagEngineType = _private.fuelTypes[j].name;
				}
				_private.addRadioButton(_private.fuelTypes[j].name, _private.fuelTypes[j].code, fuelHolder, "fuel-type-label", "ec-fuel-type-radio", "filter-fuel-type", _private.onFuelFilterTypeChange, false, _private.isTrackingEnabled?{'data-bt-value': tagEngineType, 'data-bt-track': ''}: null);
			}

			// exceptions legend
			$("<span/>").attr('data-tooltip-selector', '#' + _private.exceptionsLegendId).
				addClass('cs-legend-exceptions  mc-legend-label readMore').text(T1.labels.exceptions).appendTo(legendHolder);
			exs.find('.expansion-inner').html(T1.labels.exceptionsDetails);
		},
		addDropDownItem: function(itemTxt, value, dropdownmenu, container, handler, defVal) {
			if(typeof value === "undefined") return;
			if(!container.hasClass("form")) container.addClass("form");
			var listItem = $("<li/>");
			var item = $("<a/>", {
				"data-value": value,
				"href": "#",
				"text": itemTxt
			}).appendTo(listItem);
			item.off("click").on("click", {container: container, itemTxt: itemTxt}, handler);
			listItem.appendTo(dropdownmenu);
			if(value === defVal) {
				container.find(".dropdown-toggle span").html(itemTxt);
			}
		},
		/*
		 * add a single radio button according to given parameters
		 * @param labelTxt {string} the visible text for the label
		 * @param value {string} the value of the radio button
		 * @param container {DOM} html container to inject the radio button
		 * @param labelClass {string} the class that needs to be given to the radio label
		 * @param radioClass {string} the class that needs to be given to the radio button
		 * @param groupName {string} the name of the radio button group
		 * @param handler {function} the callback function for the change event of radio button
		 * @param defVal {string} the default value of the radio button
		 * @param attrList {object} the list of the needed attributes for the radio button
		 * @return {void} void
		 * */
		addRadioButton: function(labelTxt, value, container, labelClass, radioClass, groupName, handler, defVal, attrList){
			if(typeof value === "undefined") return;
			if(!container.hasClass("form")) container.addClass("form");
			var radio = $("<input/>").addClass(radioClass).attr({
				"name" : groupName,
				"type" : "radio",
				"data-icon-type":"icon-radio-checked"
			}).addClass("dark-input").val(value);
			if(attrList){
				for(var k in attrList) radio.attr(k, attrList[k]);
			}
			var label = $("<label/>").addClass(labelClass).addClass("radio").text(labelTxt);
			if(typeof handler === "function"){
				radio.on("click", handler);
			}
			var	identifier = _private.generateUniqueId(radioClass);
			radio.attr("id", radioClass+identifier);
			label.attr("for", radioClass+identifier);
			radio.appendTo(container);
			label.appendTo(container);
			if(value === defVal){
				radio.attr("checked", "checked");
			}
		},
		/*
		 * generates a unique id
		 * @param prefix {String} the classname that is being used for calculation
		 * @return {String} the generated unique id
		 */
		generateUniqueId: function(prefix){
			var identifier = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
			while($("#"+prefix+identifier).length>0){
				identifier = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
			}
			return identifier;
		},
		/*
		 * callback for the body filter changes
		 * @param e {object} the change event object
		 * @return {void} void
		 * */
		onBodyFilterChange: function(e){
			var $this = $(this);
			if($this.is("a")) {
				e.preventDefault();
				_private.currentBodyType = $this.data("value");
				var container = e.data.container;
				container.find(".dropdown-toggle span").html(e.data.itemTxt);
			} else if($this.is(":checked")) {
				_private.currentBodyType = $this.val();
			} else {
				return;
			}

			$("data-cell").each(function(i, e){
				var newVal = $(this).data(_private.currentBodyType) || "-";
				$(this).html(newVal);
			});
			_private.resetView();

			/*if($(this).is(":checked")) {
			 _private.currentBodyType = $(this).val();
			 $("data-cell").each(function(i, e){
			 var newVal = $(this).data(_private.currentBodyType) || "-";
			 $(this).html(newVal);
			 });
			 _private.resetView();
			 }*/
		},
		/*
		 * callback for the fuel filter changes
		 * @param e {object} the change event object
		 * @return {void} void
		 * */
		onFuelFilterTypeChange: function(e){
			_private.currentFuelType = $(this).val();
			_private.fadeEngines(_private.currentFuelType);
		},
		/*
		 * fade the engines out for the selected fuel filter
		 * @param fuelType {string} selected fuel type
		 * @return {void} void
		 * */
		fadeEngines: function(fuelType){
			$(".mini-edit-selection-item, .img-select-thumb, .data-cell").css("opacity", "1.0");
			if (fuelType && fuelType !== "false") {
				$(".mini-edit-selection-item[ec-fuel-type!='" + fuelType + "']").css("opacity", "0.3");
				$(".img-select-thumb[ec-fuel-type!='" + fuelType + "']").css("opacity", "0.3");
				$(".data-cell[ec-fuel-type!='" + fuelType + "']").css("opacity", "0.3");
			}
		},
		/*
		 * add the collapsing panels according to the parsed data
		 * @return {void} void
		 * */
		addCollapsePanels: function(){
			var panelGroup = $('<div/>').addClass('panel-group').attr('id', 'panelGroup-engines').appendTo(_private.gridContainer),
				index = (_private.hidePrices) ? 0 : 1,
				panelBodyInner;

			if (!_private.hidePrices) {

				var priceTable = _private.addPricesTable();
				if(priceTable.find('tr').size()) {
					panelBodyInner = _private.addCollapsePanel(panelGroup, 0, T1.labels.comparator.prices);
					panelBodyInner.html(priceTable);
				}
			}

			for (var i in _private.data.engines[0].bodyTypes[_private.currentBodyType]) {
				panelBodyInner = _private.addCollapsePanel(panelGroup, index, i);
				panelBodyInner.html(_private.addSpecTable(i));
				_private.addSpecCells(i);
				index++;
			}
		},
		/*
		 * ugly body fix
		 *
		 * */
		resetView: function() {
			_private.gridContainer.empty();
			_private.addCollapsePanels();
		},
		/*
		 * add the collapsing panel for a section
		 * @param panelGroup {string} the group name of the panel
		 * @param index {integer} the index of the panel
		 * @param label {string} the title of the panel
		 * */
		addCollapsePanel: function(panelGroup, index, label){
			var panel       = $('<div/>').addClass('panel panel-default').appendTo(panelGroup);
			var panelHeader = $('<div/>').addClass('panel-heading').appendTo(panel);
			var header      = $('<h4/>').addClass('panel-title').appendTo(panelHeader);

			var pLink = $('<a/>').attr({
				'data-toggle':'collapse',
				'data-parent':'#panelGroup-engines',
				'href':'#ec_pane'+index
			}).text(label).addClass('ec-toggle-head').appendTo(header);
			if(_private.isTrackingEnabled) pLink.attr({
				'data-bt-action': 'click_tab',
				'data-bt-value': label,
				'data-bt-track': ''
			});

			pLink.on('click', _private.togglePanelHeaders);

			$('<i/>').addClass('icon-chevron-down').prependTo(pLink);

			var panelBody = $('<div/>').attr('id', 'ec_pane'+index).addClass('panel-collapse collapse').appendTo(panel);
			if(index === 0){
				panelBody.addClass('in');
				$('i', pLink).removeClass('icon-chevron-down').addClass('icon-chevron-up');
			}
			return $('<div/>').addClass('panel-body').appendTo(panelBody);
		},
		/*
		 * callback function for the click event on the collapsing panel
		 * @param e {object} The event object
		 * */
		togglePanelHeaders: function(e){
			var cc = ($(this).is('.mc-toggle-head')) ? $('i', '.mc-toggle-head') : $('i', '.ec-toggle-head');
			cc.removeClass('icon-chevron-up').addClass('icon-chevron-down');
			$('i', this).toggleClass('icon-chevron-up icon-chevron-down');
		},
		/*
		 * add the generated specs table in the belonging panel
		 * @param category {string} the category of the belonging collapsing panel
		 * */
		addSpecTable: function(category){
			var table       = $('<table/>').addClass('table col-lg-12 col-md-12 col-sm-12').attr('data-category', category);
			var tbody       = $('<tbody/>').appendTo(table);
			var data        = _private.titles[category];
			for(var i=0; i<data.length; i++){
				var tr = $('<tr/>').appendTo(tbody).attr('data-row-name', data[i].id);
				var td = $('<td/>').addClass('title-cell').html(data[i].name).appendTo(tr);
			}
			return table;
		},
		/*
		 * Add the key and value cells for a certain table
		 * @param category {string} the section name of the table
		 * @return {void} void
		 * */
		addSpecCells: function(category){
			var data = _private.data.engines;
			for (var i = 0; i < data.length; i++) {
				if (!data[i].bodyTypes[_private.currentBodyType][category]) {
					continue;
				}
				var node = data[i].bodyTypes[_private.currentBodyType][category].items;
				var engineType = data[i].code;
				var table = $('table[data-category="' + category + '"]');

				for (var k in node) {
					var spec = node[k],
						row = $('tr[data-row-name="' + spec.id + '"]', table);
					var td = $("<td/>").html(spec.value).addClass("data-cell").attr({
						"data-engine-type": engineType,
						"ec-fuel-type": data[i].fuel
					});
					for (var l = 0; l < _private.bodyTypes.length; l++) {
						if(data[i].bodyTypes[_private.bodyTypes[l].code] &&
							data[i].bodyTypes[_private.bodyTypes[l].code][category] &&
							data[i].bodyTypes[_private.bodyTypes[l].code][category].items[k]) {
							var otherBodyTypeData = data[i].bodyTypes[_private.bodyTypes[l].code][category].items[k].value;
							var otherBodyTypeKey = _private.bodyTypes[l].code;
							td.attr("data-" + otherBodyTypeKey, otherBodyTypeData);
						}
					}
					// add exceptions
					if (spec.grades) {
						_private.addExceptions(td, spec.grades, spec.id + '-' + i + '-' + k);
					}

					row.append(td);
				}
			}
			_private.renderTable();
		},
		/*
		 * Add exceptions
		 */
		addExceptions: function(td, exceptions, code) {
			var exs = _private.getExpansionContainer('item-' + code),
				exc = exs.find('.expansion-inner'),
				i = $('<i/>').html(td.html()).addClass('readMore exceptions');

			i.attr('data-tooltip-selector', '#item-' + code);
			td.empty().append(i);

			for(var c = 0; c < exceptions.length; c++) {
				var row = $('<div class="row"/>');
				row.append(
					$('<div class="col-lg-6 col-md-6 col-sm-6"/>').html(exceptions[c].name));
				row.append(
					$('<div class="col-lg-6 col-md-6 col-sm-6"/>').html(exceptions[c].value));
				exc.append(row);
			}

			td.append(exs);
		},
		getExpansionContainer: function(code) {
			return _private.engineNodesMainContainer.find('.expansion-content.template').clone().attr('id', code).removeClass('template');
		},
		/*
		 * Add the key and value cells for the prices table
		 * @return {void} void
		 * */
		hasCurrentBodyType: function(grade) {
			for(var i = 0; i < grade.bodyTypes.length; i++) {
				if(grade.bodyTypes[i].code === _private.currentBodyType) {
					return true;
				}
			}
			return false;
		}	,
		addPricesTable: function(){
			var table = $("<table/>").addClass("table table-prices col-lg-12 col-md-12 col-sm-12").attr("data-category", "PRC"),
				grades = _private.getGrades();

			// loop grades
			for (var g = 0; g < grades.length; g++) {

				if(!_private.hasCurrentBodyType(grades[g])) { continue; }

				var grade = grades[g],
					carId = (grade.minPrice && grade.minPrice.car) ? grade.minPrice.car : grade.car,
					ccisUrl = T1.settings.CCISHost + 'vehicle/' + _private.data.code +
						'/' + carId + '/width/91/height/91/' + T1.constants.DEFAULT_EXTERIOR_VIEW,
					url = grade.images && grade.images[0] && grade.images[0].fileName ? (T1.settings.cardbImageHost + grade.images[0].fileName) : ('/images/' + T1.constants.MISSING_IMAGE),
					tr = $("<tr/>").attr("data-grade-code", grade.code).appendTo(table),
					td = $("<td/>").addClass("table-row title-cell col-lg-6 col-md-6 col-sm-6").appendTo(tr),
					img = $("<img/>").attr("src", _private.data.ccVersion === 'None' ? url : ccisUrl).appendTo(td);

				td.append(grade.name);

				for (var b in grade.bodyTypes) {
					var bodyType = grade.bodyTypes[b];

					if (_private.currentBodyType === bodyType.code) {
						// loop engines
						for (var e in _private.data.engines) {
							var engine = _private.data.engines[e];

							td = $("<td/>").html("<i class='icon-minus' />").addClass("data-cell").attr({
								"data-engine-type" : engine.code,
								"ec-fuel-type"     : engine.fuel
							}).appendTo(tr);

							var gradeBodyType = _private.getGradeCurrentBodyType(grade),
								gradeEngine = null;

							if(gradeBodyType) {
								// loop gradeEngines
								for (var d = 0; d < gradeBodyType.engines.length; d++) {
									if(gradeBodyType.engines[d].code === engine.code) {
										gradeEngine = gradeBodyType.engines[d];
										break;
									}
								}

								if (gradeEngine) {
									if (/^h_/.test(engine.fuel)) {
										tr.addClass('hybrid');
									}

									if (gradeEngine.price.list) {
										var newPrice = $('<span/>').addClass('new-price').html(
											globalize.format(gradeEngine.price.listWithDiscount, "c")).append($('<i class="icon-tag"></i>'));
										var oldPrice = $('<span/>').addClass('old-price').html(globalize.format(gradeEngine.price.list, "c"));
										td.empty().append($('<p/>').addClass('promo').append([newPrice, oldPrice]));
									} else {
										td.html(globalize.format(gradeEngine.price.listWithDiscount, "c"));
									}
								}
							}
						}
					}
				}
			}
			return table;
		},
		getGradeCurrentBodyType: function(grade) {
			for(var i in grade.bodyTypes) {
				if(grade.bodyTypes[i].code === _private.currentBodyType) {
					return grade.bodyTypes[i];
				}
			}
			return null;
		},
		/*
		 * get the grade data from the parsed data
		 * @return {array} object list of the grade data
		 * */
		getGrades: function() {
			var grades = [];
			for(var s = 0; s < _private.data.subModels.length; s++) {
				grades = $.merge(grades, _private.data.subModels[s].grades);
			}
			return grades;
		},
		/*
		 * Change the visible values of the cells according to the filter value
		 * @return {void} void
		 * */
		updateCells: function(){
			var columnCount = _private.selectedEngines.length,
				tr = _private.gridContainer.find('tr');

			$.each(tr, function() {
				var td = $(this).find('td'),
					tdNotFirst = td.not('td:first');

				td.eq(0).addClass('col-lg-6 col-md-6 col-sm-6');
				tdNotFirst.attr('class', '');
				tdNotFirst.addClass('data-cell');
				tdNotFirst.addClass(
					_private.getColSize('lg', columnCount, 6) + ' ' +
						_private.getColSize('md', columnCount, 6) + ' ' +
						_private.getColSize('sm', columnCount, 6)
				);
			});
		},
		/*
		 * Filter the showing columns in case the selected engines are changed
		 * @return {void} void
		 * */
		filterColumns: function() {
			var dataCells = _private.gridContainer.find('.data-cell');

			dataCells.attr('data-filtered', false).css('display', 'table-cell');

			var dataCellsHidden = dataCells.filter(function () {
				var engineType = $(this).attr('data-engine-type'),
					isFiltered = _private.selectedEngines.indexOf(engineType) === -1;

				return isFiltered;
			});
			dataCellsHidden.attr('data-filtered', true);

			_private.updateCells();

			dataCellsHidden.css('display', 'none');
		},
		/*
		 * Build the change selection menu at the top
		 * @return {void} void
		 * */
		generateSelectionControls: function(){
			_private.editSelect.empty();
			var optioncontainer = $('<div/>').addClass('optioncontainer').appendTo(_private.editSelect);
			$('<div/>').addClass('itemrow').appendTo(optioncontainer);
			$('<div/>').addClass('buttonrow').appendTo(optioncontainer);
			_private.sortSelectedEngines();

			for(var i=0; i<_private.selectedEngines.length; i++){
				_private.generateThumbs(_private.selectedEngines[i]);
			}
			$("<div/>").addClass("clearfix").appendTo(_private.editSelect);
			_private.generateSelectEdit(_private.editSelect);
			_private.fadeEngines(_private.currentFuelType);
		},
		/*
		 * Build the thumbnails for the selected engine type
		 * @param engineType {string} the selected engine
		 * @return {void} void
		 * */
		generateThumbs: function(engineType){
			var optioncontainer = _private.editSelect.find('.optioncontainer'),
				itemRow = optioncontainer.find('.itemrow'),
				buttonRow = optioncontainer.find('.buttonrow'),
				imgFile,
				imgSource,
				labelContainer;

			if(!_private.engineImages[engineType]) {
				return;
			}

			imgFile = _private.engineImages[engineType].img;

			if (imgFile) {
				imgSource = T1.settings.cardbImageHost + imgFile;
			}

			var thumbContainer = $('<div/>').addClass('img-select-thumb ').attr({
				'ec-engine-type' : engineType,
				'ec-fuel-type'   : _private.engineImages[engineType].fuelType
			}).appendTo(itemRow);

			labelContainer = $('<div/>').addClass('img-select-label-container').appendTo(thumbContainer);

			if (imgFile) {
				$('<img/>').addClass('img-responsive').attr('src', imgSource).appendTo(labelContainer);
			}

			var labelWrapper = $('<div/>').addClass('label-wrapper engine clearfix').appendTo(labelContainer);
			if(_private.engineImages[engineType].hybrid){
				$('<span/>').addClass('label label-default hybrid').text('hybrid').appendTo(labelWrapper);
			}

			var infoContainer = $('<div/>').addClass('infocontainer engine').appendTo(thumbContainer);
			var thumbTitle = $('<h4/>').text(_private.engineImages[engineType].title).attr('ec-engine-type', engineType).appendTo(infoContainer);
			var repaymentsTxt = _private.enginePayments[engineType] !== {} && _private.enginePayments[engineType] !== undefined  ? T1.labels.pricePerMonth.replace('%a', _private.enginePayments[engineType][0].amount ).replace('%m', _private.enginePayments[engineType][0].months ) : ' ';

			$('<span class="finance-rate">' + repaymentsTxt + '</span>').appendTo(infoContainer);

			if(_private.engineImages[engineType].hybrid){
				thumbTitle.addClass('selected-hybrid');
			}
			var removeIconContainer = $('<div/>').addClass('icon-remove-container').prependTo(thumbContainer);
			var removeIcon  = $('<i/>').addClass('icon-remove ec-thumb-remove').appendTo(removeIconContainer);

			var buttonContainer = $('<div/>').addClass('buttoncontainer');
			buttonContainer.appendTo(buttonRow);

			/*var configButton = $("<a/>").addClass("btn btn-grey config-btn").html(T1.labels.configureButton).append($("<i/>").addClass("icon-chevron-right")).appendTo(buttonContainer);
			 if(_private.isTrackingEnabled) configButton.attr({
			 'data-bt-eventclass': 'ctaevent',
			 'data-bt-action': 'click_cta',
			 'data-bt-value': 'carconfigurator',
			 'data-bt-workflowname': 'carconfigurator',
			 'data-bt-workflowstep': '0'
			 });*/
			removeIcon.on('click', _private.onMiniRemoveClick);
		},
		/*
		 * place the hidden drop down menu for changing the selection
		 * @param container {DOM} the html container to inject the generated html
		 * @return {void} void
		 * */
		generateSelectEdit: function(container){
			var selectionMenu = $("<div/>").addClass("mini-edit-selection-menu").appendTo(container);
			$("<h4/>").addClass("mini-edit-selection-header").text(T1.labels.comparator.selectEngine).appendTo(selectionMenu);

			var itemRow   = null;
			var buttonRow = null;

			for(var i=0; i<_private.engines.length; i++){
				if( i%4 === 0 ){
					itemRow = $("<div/>").addClass("itemrow").appendTo(selectionMenu);
					buttonRow = $("<div/>").addClass("buttonrow form").appendTo(selectionMenu);
				}

				var src = T1.settings.cardbImageHost+_private.engineImages[_private.engines[i]].img;
				var hybrid = _private.engineImages[_private.engines[i]].hybrid;
				var holder = $("<div/>").addClass("mini-edit-selection-item form").attr("ec-fuel-type", _private.engineImages[_private.engines[i]].fuelType).appendTo(itemRow);
				var labelContainer = $("<div/>").addClass("img-select-label-container").appendTo(holder);
				$("<img/>").addClass("img-responsive").attr("src", src).appendTo(labelContainer);
				var labelWrapper = $("<div/>").addClass("label-wrapper engine clearfix").appendTo(labelContainer);
				if(hybrid){
					$("<span/>").addClass("label label-default hybrid").text("hybrid").appendTo(labelWrapper);
				}
				var infoContainer = $("<div/>").addClass("infocontainer").appendTo(holder);
				var h4 = $("<h4/>").text(_private.engineImages[_private.engines[i]].title).appendTo(infoContainer);
				if(hybrid){
					h4.addClass("hybrid");
				}

				var configBt = $("<a/>").html("<label>"+T1.labels.compare+"</label>").addClass("btn btn-grey mini-compare-btn").appendTo(holder);
				var configCb = $("<input/>").attr({
					"type": "checkbox",
					"data-engine-select-type": _private.engines[i]
				}).addClass("mini-compare-cb").prependTo(configBt);
				if($.inArray(_private.engines[i], _private.selectedEngines) !== -1){
					configBt.addClass("btn-dark");
					configCb.prop("checked", true).trigger("change");
				}
				var configbtContainer = $('<div/>').addClass('mini-edit-selection-button');
				configBt.appendTo( configbtContainer );
				configbtContainer.appendTo(buttonRow);
			}
			var selectionTriggerHolder = $("<div/>").addClass("selection-trigger-holder").prependTo(container);
			//var printTrigger = $("<button/>").addClass("btn-dark btn mc-print-btn").text(T1.labels.comparator.printSelect).append($("<i/>").addClass("icon-print")).prependTo(selectionTriggerHolder);
			var selectionTrigger = $("<button/>").addClass("btn-dark btn ec-change-compare-btn").text(T1.labels.comparator.changeEngineSelect).append($("<i/>").addClass("icon-chevron-down")).prependTo(selectionTriggerHolder);
			if(_private.isTrackingEnabled) {
				selectionTrigger.attr({
					'data-bt-action': 'click_function',
					'data-bt-value': 'change_engines',
					'data-bt-track': ''
				});

				/*printTrigger.attr({
				 'data-bt-action': 'click_function',
				 'data-bt-value': 'print_engines',
				 'data-bt-track': ''
				 });*/
			}

			$("<div/>").addClass("clearfix").appendTo(selectionMenu);
			var saveAndClose = $("<button/>").text(T1.labels.update).addClass("btn btn-dark save-and-close-button").appendTo(selectionMenu);
			var justClose = $("<button/>").text(T1.labels.cancel).addClass("btn btn-link just-close-button").appendTo(selectionMenu);

			selectionTrigger.on("click", _private.onMiniEditClick);
			/*printTrigger.on("click", function() {
			 PubSub.publish(T1.constants.HASH_ADD, '/publish/engine_compare_print');
			 });*/
			saveAndClose.on("click", _private.onSaveAndCloseClick);
			justClose.on("click", _private.onJustCloseClick);
			$(".mini-compare-btn", _private.overlayContent).on("click", _private.onMiniEditButtonClicked);
			$(".mini-compare-cb", _private.overlayContent).on("change", _private.onMiniEditCheckboxChecked);
			_private.changeCompareMenu = selectionMenu;
			selectionMenu.hide();
		},
		/*
		 * Callback for the cancel button in drop down menu for changing the selection
		 * @param e {object} the event object
		 * @return {void} void
		 * */
		onJustCloseClick: function(e){
			$(".mini-compare-cb",  _private.overlayContent).each(function(i, e){
				var selectedEngine = $(this).data("engine-select-type");
				var selectionIndex = $.inArray(selectedEngine, _private.selectedEngines);
				$(this).prop("checked", (selectionIndex !== -1));
				if(selectionIndex === -1){
					$(this).parent().removeClass("btn-dark");
				}else{
					$(this).parent().addClass("btn-dark");
				}
			});
			$(".ec-change-compare-btn", ".selection-trigger-holder").trigger("click");
		},
		/*
		 * Callback for the update button in drop down menu for changing the selection
		 * @return {void} void
		 * */
		onSaveAndCloseClick: function(){
			_private.selectedModels = [];
			$(".mini-compare-cb",  _private.overlayContent).each(function(i, e){
				var selectedEngine = $(this).data("engine-select-type");
				if($(this).is(":checked")){
					if($.inArray(selectedEngine, _private.selectedEngines) === -1){
						_private.selectedEngines.push(selectedEngine);
					}
				}else{
					var index = _private.selectedEngines.indexOf(selectedEngine);
					if(index !== -1) _private.selectedEngines.splice(index, 1);
				}
			});
			_private.filterColumns();
			_private.generateSelectionControls();
			_private.modal.hide();
			_private.toggleScrollContainer();
			PubSub.publish(T1.constants.ENGINE_COMPARE_CHANGE, {});
		},
		/*
		 * Callback for the checkboxes in the change selection menu
		 * @param e {object} the event object
		 * @return {void} void
		 * */
		onMiniEditCheckboxChecked: function(e){
			//var selectedEngine = $(this).data("engine-select-type");
			if($(this).is(":checked")){
				if($(".mini-compare-cb:checked",  _private.overlayContent).length > 3){
					//if(_private.selectedEngines.length === 3){
					PubSub.publish(T1.constants.TOAST_CUSTOM, {
						customContainer : $(".overlayerContent"),
						customText      : _private.maxWarningText,
						timeout         : 2000
					});
					$(this).prop("checked", false);
					e.preventDefault();
					return false;
				}
				$(this).parent().addClass("btn-dark");
			}else{
				if($(".mini-compare-cb:checked",  _private.overlayContent).length < 2){
					//if(_private.selectedEngines.length === 2){
					PubSub.publish(T1.constants.TOAST_CUSTOM, {
						customContainer : $(".overlayerContent"),
						customText      : _private.minWarningText,
						timeout         : 2000
					});
					$(this).prop("checked", true);
					e.preventDefault();
					return false;
				}
				$(this).parent().removeClass("btn-dark");
			}
		},
		/*
		 * Callback for the checkboxes underneath the thumbnails
		 * @param e {object} the event object
		 * @return {void} void
		 * */
		onMiniEditButtonClicked: function(e){
			var configCb = $("input", this);
			configCb.trigger("click");
		},
		/*
		 * Callback for the remove icons at the top of the thumbnails
		 * @param e {object} the event object
		 * @return {void} void
		 * */
		onMiniRemoveClick: function(e){
			var engineType = $(this).parents('.img-select-thumb').attr("ec-engine-type");
			if(_private.selectedEngines.length === 2){
				PubSub.publish(T1.constants.TOAST_CUSTOM, {
					customContainer : _private.editSelect,
					customText      : _private.minWarningText,
					timeout         : 2000
				});
				return;
			}
			PubSub.publish(T1.constants.ENGINE_COMPARE_CHANGE, {
				"engineType":engineType
			});
			var index = _private.selectedEngines.indexOf(engineType);
			_private.selectedEngines.splice(index, 1);
			$(this).parent().remove();
			$(".img-select-thumb").attr("class", "").addClass(".img-select-thumb "+_private.getColSize());
			_private.onEditSelection();
		},
		/*
		 * Callback for the checkboxes in the dromdown menu
		 * @param e {object} the event object
		 * @return {void} void
		 * */
		onMiniEditClick: function(e){
			e.preventDefault();
			$(this).toggleClass("btn-dark").toggleClass("half-btn");
			var icon = $("i", this);
			if(icon.hasClass("icon-chevron-down")){
				icon.removeClass("icon-chevron-down");
				icon.addClass("icon-chevron-up");
				if(T1.utilities.isIpad()){
					$(".ec-grid-container").css("pointer-events", "none");
				}
			}else if(icon.hasClass("icon-chevron-up")){
				icon.removeClass("icon-chevron-up");
				icon.addClass("icon-chevron-down");
				if(T1.utilities.isIpad()){
					$(".ec-grid-container").css("pointer-events", "auto");
				}
			}
			_private.toggleScrollContainer();
			$(".mini-edit-selection-menu").toggle();
			$(this).trigger("blur");
			_private.modal.toggle();
			if(T1.utilities.isIpad()){
				$(".mini-edit-selection-menu").css("-webkit-transform", "translate3d(0,0,1px)");
				$(this).css("-webkit-transform", "translate3d(0,0,1px)");
			}
		},
		toggleScrollContainer: function(e){
			if(T1.utilities.isIpad()){
				$(".ec-select-modal").css("pointer-events", "none");
				return;
			}
			if(_private.overlayContent.find('.scrollcontainer').length > 0){
				_private.overlayContent.find('.scrollcontainer').remove();
			}
			else{
				$('<div class="scrollcontainer"></div>').appendTo(_private.overlayContent);
				_private.setScrollContainerSize();
			}
		},
		/**
		 * Sets the height of the scrollcontainer when the browser is resized.
		 * The scrollcontainer makes sure that you can scroll the page when the dropdown menu is expanded.
		 */
		setScrollContainerSize: function(e){
			var scrollcontainer = _private.overlayContent.find('.scrollcontainer');
			if(scrollcontainer.length > 0){
				scrollcontainer.css('height',_private.overlayContent.height() +'px');
			}
		},
		/*
		 * Get the needed classes according to the count of the columns
		 * @param media {string} the target breakpoint
		 * @param colCount {integer} the count of the visible columns
		 * @param colBase {integer} the count of the total columns
		 * @return {string} needed class for the column
		 * */
		getColSize: function(media, colCount, colBase){
			if(typeof media === "undefined") media = "lg";
			if(typeof colBase === "undefined") colBase = 12;
			if(typeof colCount === "undefined" || isNaN(colCount)) colCount = (_private.selectedEngines) ? _private.selectedEngines.length : _private.selectedModels.length;

			var colSize  = Math.floor(colBase/colCount);
			return "col-"+media+"-"+colSize;
		}
	};

	/*returns the public methods of the component*/
	var _public = {
		"initDesktop"       : _private.initDesktop,
		"selectedEngines"   : _private.selectedEngines,
		"switchDesktop"     : _private.switchDesktop,
		"switchMobile"      : _private.switchMobile,

		"extendCheckboxChange"  	: _private.extendCheckboxChange,
		"onMiniEditButtonClicked" 	: _private.onMiniEditButtonClicked,
		"getColSize"        		: _private.getColSize,
		"addRadioButton"    		: _private.addRadioButton,
		"togglePanelHeaders"		: _private.togglePanelHeaders
	};
	return _public;
})();