var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *
 */
T1.modelCompare = (function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		modelNodesMainContainer: $(".compare-models"),
		modelDataContainer: $(".compare-model-data"),
		compareButtons: null,
		allCompare: $(".compare-model-button"),
		compareCheckboxes: null,
		toggleButtons: null,
		changeCompareMenu: null,
		data: null,
		financeData: null,
		bodyTypes: null,
		currentBodyType: null,
		engines: {},
		availableEngines: [],
		equipment: [],
		hybridCars: [],
		specialOffers: [],
		grades: [],
		bodyTypeValues: {},
		engineTypeValues: {},

		overlayContent: null,
		gridContainer: null,
		controlContainer: null,
		editSelect: null,
		filterContainer: null,
		selectedModels: [],
		modelData: {},
		models: [],
		modal: null,
		overlayerOpen: false,
		pageName: $('.equipmentcompare').attr('data-section-title'),
		hidePrices: null,
		minWarningText: null,
		maxWarningText: null,
		exceptionsLegendId: 'models-exceptions-legend',
		/* *
		 * initializes the main container
		 * @return {void} void
		 * */
		initDesktop: function () {
			_private.hidePrices = (T1.settings.hidePrices === "true");
			if (_private.modelNodesMainContainer.length === 0) return;
			_private.isTrackingEnabled = typeof(window.t1DataLayer) === 'object';
			_private.minWarningText = T1.labels.comparator.compareMinEqu;
			_private.maxWarningText = T1.labels.comparator.compareMaxEqu;

			_private.compareButtons = $(".compare-btn", _private.modelNodesMainContainer);
			_private.compareCheckboxes = $(".model-check", _private.modelNodesMainContainer);
			_private.toggleButtons = $(".mc-show-hide-button", _private.modelNodesMainContainer);

			_private.overlayContent = $(".compare-model-data");
			_private.gridContainer = $(".mc-grid-container", _private.overlayContent);
			_private.controlContainer = $(".compare-top-controls", _private.overlayContent);
			_private.editSelect = $(".engine-model-options", _private.overlayContent);
			_private.filterContainer = $(".other-options", _private.overlayContent);

			_private.compareButtons.on("click", _private.onCompareBtnClick);
			_private.allCompare.on("click", _private.onAllCompare);
			_private.compareCheckboxes.prop("checked", false);
			_private.compareCheckboxes.slice(0, 3).prop("checked", true).trigger("change");
			_private.compareButtons.slice(0, 3).removeClass("btn-grey").addClass("btn-dark");
			_private.compareCheckboxes.on("change", _private.onCheckboxChange);
			_private.toggleButtons.on("click", _private.onTabToggle);

			PubSub.subscribe(T1.constants.MODEL_COMPARE_CHANGE, function (data) {
				_private.compareCheckboxes.prop("checked", false);
				_private.compareButtons.removeClass("btn-dark");
				for (var i = 0; i < _private.selectedModels.length; i++) {
					var model = _private.selectedModels[i];
					$("input[data-model-select-type='" + model + "']").prop("checked", true).parent().addClass("btn-dark");
				}
				_private.compareCheckboxes.trigger("change");
			});
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_OPEN, function (evt, data) {
				if($(".overlayerWrapper").is(".compare-overlay-wrapper") && $(".compare-model-data", ".compare-overlay-wrapper").length > 0 && _private.modal === null && !_private.overlayerOpen){
					_private.modal = $("<div/>").addClass("mc-select-modal").css("width", $(window).width() + "px").hide().prependTo($(".overlayerContent"));
					_private.modal.on("click", _private.onJustCloseClick);
					_private.overlayerOpen = true;
				}
			});
			PubSub.subscribe(T1.constants.ON_WIN_RESIZE, function (event, data) {
				var newWidth = $(window).width() - 15;
				$(".mc-select-modal").css("width", newWidth + "px");
			});
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_CLOSED, function (evt, data) {
				if (_private.overlayerOpen) {
					_private.modal.remove();
					_private.overlayContent.find('.scrollcontainer').remove();
					_private.overlayerOpen = false;
				}
			});
			PubSub.subscribe(T1.constants.READMORE_HIDE, function (evt, data) {
				$(".title2", _private.modelNodesMainContainer).removeClass("read-more-active");
			});
			PubSub.subscribe(T1.constants.READMORE_SHOW, function (evt, data) {
				$(".title2", _private.modelNodesMainContainer).removeClass("read-more-active");
				data.target.addClass("read-more-active");
			});
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_RESIZE, _private.setScrollContainerSize);
			PubSub.subscribe(T1.constants.MODEL_COMPARE_PRINT, _private.print);
			PubSub.subscribe(T1.constants.FINANCE_RATES_ON, _private.requestFinanceData);
			PubSub.subscribe(T1.constants.FINANCE_RATES_OFF, _private.clearFinanceData);
			_private.getData();
		},
		/* *
		 * behaviour for switching to desktop
		 * @return {void} void
		 * */
		switchDesktop: function () {
			$(".equipmentcompare").show();
		},
		/* *
		 * behaviour for switching to mobile
		 * @return {void} void
		 * */
		switchMobile: function () {
			$(".equipmentcompare").hide();
		},
		/* *
		 * behaviour for the tabs
		 * @return {void} void
		 * */
		onTabToggle: function (e) {
			var selector = $(this).data("mc-target");
			$(".mc-toggleable-container").hide();
			$(selector).show();
		},
		/* *
		 * Callback for the compare button on the main screen
		 * @param e {object} Event object
		 * @return {void} void
		 * */
		onAllCompare: function (e) {
			if (!_private.overlayerOpen) {
				_private.selectedModels = [];
				$(".model-check:checked").each(function (i, e) {
					_private.selectedModels.push($(this).data("model-select-type"));
				});
				_private.filterColumns();
				PubSub.publish(T1.constants.HASH_CHANGE, '/publish/pageoverlayer_open/html=.compare-model-data/preserveContent=true/styleClass=compare-overlay-wrapper/pageName=' + _private.pageName);
			}
			$(".mc-body-type-radio[value='" + _private.currentBodyType + "']", _private.modelNodesMainContainer).prop("checked", true).trigger("change");
		},
		/* *
		 * Callback for the checkboxes on the main screen
		 * @param e {object} Event object
		 * @return {void} void
		 * */
		onCheckboxChange: function (e) {
			var bt = $(this).parent();
			T1.engineCompare.extendCheckboxChange(_private, bt, $(this), e);
		},
		/* *
		 * Ajax call to get the dynamic data from the server
		 * @return {void} void
		 * */
		getData: function () {
			var model = $(".car-model").data("car-model");
			$.getJSON("/api/cardb/equipmentcompare/" + model, _private.onGetData);
		},
		/* *
		 * Callback for the ajax call
		 * @param data {json} Data that is returned from the service
		 * @return {void} void
		 * */
		onGetData: function (data) {
			if (data.length === 0) return;
			_private.data = data;
			//_private.data.grades = _private.escapeArrayOfObjects(_private.data.grades);
			_private.bodyTypes = data.bodyTypes;
			_private.currentBodyType = _private.bodyTypes[0].code;
			_private.equipment = data.equipment;
			_private.grades = _private.getGrades();
			_private.generateIndexes();
			_private.addCollapse();
			_private.addFilters();
			_private.selectedModels = [];
			$(".model-check:checked").each(function (i, e) {
				_private.selectedModels.push($(this).data("model-select-type") + '');
			});
			$(".mc-main-image").each(function (i, e) {
				if ($(".hybrid", $(this).parents(".img_with_label")).length > 0) {
					_private.hybridCars.push($(this).attr("data-model-type"));
				}
				if ($(".special-offer", $(this).parents(".img_with_label")).length > 0) {
					_private.specialOffers.push($(this).attr("data-model-type"));
				}
			});
			_private.filterColumns();
			_private.generateSelectionControls();
			_private.requestFinanceData();
		},
		/*
		 * request finance data
		 *
		 * */
		requestFinanceData: function() {
			if(T1.settings.finance.showRatesMonthly === 'true' && T1.financeRates.enabled()) {
				var configs = {};

				for (var i = 0; i < _private.grades.length; i++) {
					configs[_private.grades[i].code] = _private.grades[i].minPrice.config;
				}

				T1.financeService.requestFinanceData({
					configs: configs,
					success: function(data) { _private.financeData = data; _private.loadFinanceData(); },
					multiple: true,
					source: 'ModelsComparer'
				});
			}
			else {
				_private.clearFinanceData();
			}
		},
		/*
		 * display finance informations
		 * */
		loadFinanceData: function(data) {
			data = data || _private.financeData;

			if(data) {
				for (var i = 0; i < _private.grades.length; i++) {
					var code = _private.grades[i].code,
						node = _private.modelNodesMainContainer.find('div.form[data-model-type="' + code + '"]'),

						rate = data[code] && data[code].rate ? data[code].rate : null,
						show = data[code] && data[code].show ? data[code].show : null;

					if(rate) {
						// monthly payment
						if(rate.monthlyPayment) {
							node.find('.monthly-payment').html(
								T1.financeService.formatFinanceString(T1.labels.comparator.monthlyPayment, rate, show));
						}

						// rate details
						if((show.effectiveRate && rate.effectiveInterestRate) || (show.annualRate && rate.annualInterestRate)) {
							var	finc = T1.financeService.formatFinanceString(T1.labels.comparator.priceRate, rate, show),
								ovId = '_' + _private.grades[i].car,
								disc = _private.getExpansionContainer(ovId, true).appendTo(node),
								diss = T1.financeService.getDisclaimer(rate, true, T1.labels.viewDisclaimer);

							node.find('.payment-rate').html(finc + ' ').append($('<a href="#" class="readMore"/>').
								html(T1.labels.viewDisclaimer).attr('data-tooltip-selector', '#' + ovId));
							disc.find('.expansion-inner').empty().append(diss);
						}
					}
				}

				_private.refreshShortFinanceData(data);
			}
		},
		refreshShortFinanceData: function(data) {
			data = data || _private.financeData;

			if(data) {
				for (var i = 0; i < _private.grades.length; i++) {
					var code = _private.grades[i].code,
						shortNode = _private.modelDataContainer.find('div.img-select-thumb[mc-model-type="' + code + '"]'),

						rate = data[code] && data[code].rate ? data[code].rate : null,
						show = data[code] && data[code].show ? data[code].show : null;

					if(rate) {
						// monthly payment
						if(rate.monthlyPayment) {
							var ovId = '_' + _private.grades[i].car,
								disc = _private.getExpansionContainer(ovId, true).appendTo(shortNode),
								diss = T1.financeService.getDisclaimer(rate, true, T1.labels.viewDisclaimer),
								container = shortNode.find('.monthly-payment');

							container.html(
								T1.financeService.formatFinanceString(T1.labels.comparator.shortMonthlyPayment, rate, show));
							container.append(
								$('<a href="#" class="readMore"/>').attr('data-tooltip-selector', '#' + ovId).append($('<i class="icon-info-sign"/>')));
							disc.find('.expansion-inner').empty().append(diss);
						}
					}
				}
			}
		},
		/*
		 * clear finance informations
		 * */
		clearFinanceData: function() {
			_private.modelNodesMainContainer.find('div.form .monthly-payment');
			_private.modelNodesMainContainer.find('div.form .payment-rate');
		},
		/* *
		 * Get the list of the grades
		 * @return {list} object list of the grade data
		 * */
		getGrades: function () {
			var grades = [];
			for (var s = 0; s < _private.data.subModels.length; s++) {
				grades = $.merge(grades, _private.data.subModels[s].grades);
			}
			return _private.escapeArrayOfObjects(grades);
		},
		escapeArrayOfObjects: function(arr){
			for(var i=0; i<arr.length; i++){
				arr[i].code = encodeURIComponent(arr[i].code);
			}
			return arr;
		},
		/*
		 * Filter the showing columns in case the selected engines are changed
		 * @return {void} void
		 * */
		filterColumns: function () {
			_private.resetHighlight();
			$(".data-cell").addClass("filtered").hide();
			for (var i = 0; i < _private.selectedModels.length; i++) {
				var cell = $(".data-cell[mc-model-type='" + _private.selectedModels[i] + "']");
				cell.attr("class", "data-cell").addClass(T1.engineCompare.getColSize("lg", _private.selectedModels.length, 6) + " " + T1.engineCompare.getColSize("md", _private.selectedModels.length, 6) + " " + T1.engineCompare.getColSize("sm", _private.selectedModels.length, 6)).show();
			}
			$(".mc-fuel-type-header").attr("colspan", _private.selectedModels.length + 1);
			$(".data-cell", ".table-prices").addClass("mc-price-cell");
			_private.generateSelectionControls();
		},
		/*
		 * add the collapsing panels according to the parsed data
		 * @return {void} void
		 * */
		addCollapse: function () {
			var panelGroup = $("<div/>").addClass("panel-group").attr("id", "panelGroup-models").appendTo(_private.gridContainer);
			if (!_private.hidePrices) _private.equipment.unshift({name: T1.labels.comparator.prices, code: "PRC", items: false});
			var index = 0;
			for (var i = 0; i < _private.equipment.length; i++) {
				var cat = _private.equipment[i];

				var panel = $("<div/>").addClass("panel panel-default").appendTo(panelGroup);
				var panelHeader = $("<div/>").addClass("panel-heading").appendTo(panel);
				var header = $("<h4/>").addClass("panel-title").appendTo(panelHeader);

				var pLink = $("<a/>").attr({
					"data-toggle": "collapse",
					"data-parent": "#panelGroup-models",
					"href": "#mc_pane" + index
				}).text(cat.name).addClass("mc-toggle-head").appendTo(header);

				if (_private.isTrackingEnabled) pLink.attr({
					'data-bt-action': 'click_tab',
					'data-bt-value': cat.code,
					'data-bt-track': ''
				});

				pLink.on("click", T1.engineCompare.togglePanelHeaders);

				$("<i/>").addClass("icon-chevron-down").prependTo(pLink);

				var panelBody = $("<div/>").attr("id", "mc_pane" + index).addClass("panel-collapse collapse").appendTo(panel);
				if (index === 0) {
					panelBody.addClass("in");
					$("i", pLink).removeClass("icon-chevron-down").addClass("icon-chevron-up");
				}
				var panelBodyInner = $("<div/>").addClass("panel-body").attr("data-equipment-code", cat.code).appendTo(panelBody);
				panelBodyInner.html(_private.addTable(cat.code));
				index++;
			}
		},
		/*
		 * add the generated specs table in the belonging panel
		 * @param category {string} the category of the belonging collapsing panel
		 * */
		addTable: function (category) {
			if (category === "PRC") return _private.addPricesSection();
			var table = $("<table/>").addClass("table table col-lg-12 col-md-12 col-sm-12").attr("data-category", category);
			var data = _private.equipment;
			for (var i = 0; i < data.length; i++) {
				var mainNode = data[i];
				if (mainNode.code !== category) continue;
				for (var k = 0; k < mainNode.items.length; k++) {
					var node = mainNode.items[k];
					var tr = $("<tr/>").attr("data-row-name", node.code).addClass("table-parent").appendTo(table);
					var td = $("<td/>").addClass("title-cell table-row col-lg-6 col-md-6 col-sm-6").html(node.name).appendTo(tr);
					_private.addCells(tr);
				}
			}
			return table;
		},
		/*
		 * Add the key and value cells for a certain table
		 * @param tr {DOM} the target row to inject cells
		 * @return {void} void
		 * */
		addCells: function (tr) {
			var equipmentCode = tr.data("row-name");
			for (var i = 0; i < _private.grades.length; i++) {
				var mainNode = _private.grades[i];
				var td = $("<td/>").addClass("data-cell").attr("mc-model-type", mainNode.code).appendTo(tr);
				var obj = {};
				for (var j in mainNode.bodyType) {
					if (mainNode.bodyType[j] === null) {
						td.html("<i class='icon-minus' />");
						obj[j] = false;
						continue;
					}
					obj[j] = (mainNode.bodyType[j].equipment[equipmentCode]) ? true : false;
					if (j === _private.currentBodyType) {
						if (mainNode.bodyType[j].equipment[equipmentCode]) {
							switch(mainNode.bodyType[j].equipment[equipmentCode].equipped){
								case "s":
									td.html("<i class='icon-radio-checked' />");
									break;
								case "o":
									td.html("<i class='icon-radio-uncheck' />");
									break;
								case "-":
									td.html("<i class='icon-minus' />");
									break;
								default:
									break;
							}
							// equipment exceptions
							if (mainNode.bodyType[j].equipment[equipmentCode].cars) {
								_private.addExceptions(
									td.find('i'),
									mainNode.bodyType[j].equipment[equipmentCode].cars,
									equipmentCode.toString().replace(/[^a-zA-Z0-9]/g, '') + '-' + i + '-' + j
								);
							}
						} else {
							td.html("<i class='icon-minus' />");
						}
					}
				}
				td.data("equipment", obj);
			}
		},
		/*
		 * Add exceptions
		 */
		addExceptions: function (i, exceptions, code) {
			var exs = _private.getExpansionContainer('item-' + code),
				exc = exs.find('.expansion-inner');
			i.text('?').addClass('readMore exceptions');
			i.attr('data-tooltip-selector', '#item-' + code);

			for (var c = 0; c < exceptions.length; c++) {
				var row = $('<div class="row"/>');
				row.append(
					$('<div class="col-lg-10 col-md-10 col-sm-10"/>').html(exceptions[c].name));
				if (exceptions[c].equipped === 's') {
					row.append("<i class='icon-radio-checked' />");
				} else if (exceptions[c].equipped === 'o') {
					row.append("<i class='icon-radio-uncheck' />");
				} else {
					row.append("<i class='icon-minus' />");
				}
				exc.append(row);
			}

			i.parent().append(exs);
		},
		getExpansionContainer: function (code, arrow) {
			var container = _private.modelNodesMainContainer.find('.expansion-content.template').clone().attr('id', code).removeClass('template');
			if(arrow) { container.append($('<div/>').addClass('expansion-arrow')); }
			return container;
		},
		/*
		 * Add the data table for the prices
		 * @return {DOM} generated table
		 * */
		addPricesSection: function () {
			var table = $("<table/>").addClass("table table-prices col-lg-12 col-md-12 col-sm-12").attr("data-category", "PRC"),
				curFuelType = null;
			for (var fuelCode in _private.engines) {
				var engines = _private.engines[fuelCode];
				for (var e = 0; e < engines.length; e++) {
					var engine = engines[e];
					if (curFuelType !== engine.fuelName) {
						var theadRow = $("<tr/>").appendTo(table);
						$("<td/>").html($("<h4/>").text(engine.fuelName)).addClass("col-lg-12 col-md-12 col-sm-12 mc-fuel-type-header").appendTo(theadRow);
						curFuelType = engine.fuelName;
					}
					var tr = $("<tr/>").addClass("table-parent").attr("data-engine-code", engine.code).attr("data-fuel-type", engine.fuelCode).appendTo(table),
						td = $("<td/>").addClass("table-row title-cell col-lg-6 col-md-6 col-sm-6").appendTo(tr),
						img = $("<img/>").attr("src", engine.images ? (T1.settings.cardbImageHost + engine.images["IMG_TECH-GUIDE_91x91"]) : '').appendTo(td);
					//h4 	 = $("<h4/>").text(engine.name).appendTo(td);
					td.append(engine.name);
					if (engine.fuelCode === "H_1") tr.addClass("hybrid");

					_private.addEnginePriceCells(tr, engine.code);
				}
			}
			return table;
		},
		/*
		 * Ugly body type fix
		 * */
		reloadPricesSection: function() {
			var table = $('.compare-model-data table.table-prices').empty();
			table.replaceWith(_private.addPricesSection());
			_private.filterColumns();
		},
		/*
		 * Add the key and value cells for the prices table
		 * @param tr {DOM} the target row to inject the cells
		 * @param engineCode {string} the code of the engine
		 * @return {void} void
		 * */
		addEnginePriceCells: function (tr, engineCode) {
			for (var g = 0; g < _private.grades.length; g++) {
				var grade = _private.grades[g];
				for (var b = 0; b < _private.bodyTypes.length; b++) {
					var td = null;
					if ($("td.mc-price-cell[mc-model-type='" + grade.code + "']", tr).length === 0) {
						td = $("<td/>").attr("mc-model-type", grade.code).addClass("data-cell mc-price-cell").html("<i class='icon-minus'></i>").appendTo(tr);
					} else {
						td = $("td.mc-price-cell[mc-model-type='" + grade.code + "']", tr).eq(0);
					}
					var bodyCode = _private.bodyTypes[b].code,
						bodyType = grade.bodyType[bodyCode];
					if (bodyType && bodyType !== null && _private.currentBodyType === bodyCode) {
						for (var f in bodyType.fuelType) {
							var engines = bodyType.fuelType[f].engine;
							if (engines[engineCode]) {
								if (engines[engineCode].minPrice.list) {
									var newPrice = $('<span/>').addClass('new-price').html(
										globalize.format(engines[engineCode].minPrice.listWithDiscount, "c")).append($('<i class="icon-tag"></i>'));
									var oldPrice = $('<span/>').addClass('old-price').html(globalize.format(engines[engineCode].minPrice.list, "c"));
									td.empty().append($('<p/>').addClass('promo').append([newPrice, oldPrice]));
								}
								else {
									td.html(globalize.format(engines[engineCode].minPrice.listWithDiscount, "c"));
								}
								td.attr("data-price-" + engineCode, engines[engineCode].minPrice.listWithDiscount);
								td.attr("mc-engine-type", engineCode);
							}
						}
					}
				}
			}
		},
		/*
		 * place the hidden drop down menu for changing the selection
		 * @param container {DOM} the html container to inject the generated html
		 * @return {void} void
		 * */
		generateSelectEdit: function (container) {
			if (!container.hasClass("form")) container.addClass("form");
			var selectionMenu = $("<div/>").addClass("mini-edit-selection-menu").appendTo(container);
			$("<h4/>").addClass("mini-edit-selection-header").text(T1.labels.comparator.selectGrade).appendTo(selectionMenu);

			var itemRow = null;
			var buttonRow = null;
			var index = 0;

			for (var i in _private.modelData) {
				var src = $(".mc-main-image[data-model-type='" + i + "']").attr("src");
				if (index % 4 === 0) {
					itemRow = $("<div/>").addClass("itemrow").appendTo(selectionMenu);
					buttonRow = $("<div/>").addClass("buttonrow").appendTo(selectionMenu);
				}

				var holder = $("<div/>").addClass("mini-edit-selection-item").appendTo(itemRow);
				var labelContainer = $("<div/>").addClass("img-select-label-container").appendTo(holder);
				$("<img/>").addClass("img-responsive").attr("src", src).appendTo(labelContainer);
				var labelWrapper = $("<div/>").addClass("label-wrapper clearfix").appendTo(labelContainer);
				var infoContainer = $("<div/>").addClass("infocontainer").appendTo(holder);
				var h4 = $("<h4/>").text(_private.modelData[i].name).appendTo(infoContainer);

				if ($.inArray(i, _private.hybridCars) !== -1) {
					h4.addClass("hybrid");
					labelWrapper.append($("<span/>").addClass("label hybrid").text(T1.labels.hybrid));
				}

				if (!_private.hidePrices && _private.modelData[i].price) {
					var price = null;
					if (_private.modelData[i].price.discount) {
						labelWrapper.append($("<span/>").addClass("label special-offer").text(T1.labels.promotionSpecialOffer).append($("<i/>").addClass("icon-tag")));
						price = _private.modelData[i].price.discount;
					} else {
						price = _private.modelData[i].price.normal;
					}
					$("<span/>").addClass("compare-from-price").text(T1.labels.priceFrom.replace("%s", globalize.format(price, "c"))).appendTo(infoContainer);
				}

				/*
				 if($.inArray(i, _private.specialOffers) !== -1){
				 labelContainer.append($("<span/>").addClass("label special-offer").text(T1.labels.promotionSpecialOffer));
				 }*/

				var configBt = $("<a/>").html("<label>" + T1.labels.compare + "</label>").addClass("btn btn-grey mini-compare-btn");
				var configCb = $("<input/>").attr({
					"type": "checkbox",
					"data-model-select-type": i
				}).addClass("mini-compare-cb").prependTo(configBt);

				if ($.inArray(i, _private.selectedModels) !== -1) {
					configBt.addClass("btn-dark");
					configCb.prop("checked", true).trigger("change");
				}
				var configbtContainer = $('<div/>').addClass('mini-edit-selection-button');
				configBt.appendTo(configbtContainer);

				configbtContainer.appendTo(buttonRow);

				index += 1;
			}
			var selectionTriggerHolder = $("<div/>").addClass("selection-trigger-holder").prependTo(container);
			//var printTrigger = $("<button/>").addClass("btn-dark btn mc-print-btn").text(T1.labels.comparator.printSelect).append($("<i/>").addClass("icon-print")).prependTo(selectionTriggerHolder);
			var selectionTrigger = $("<button/>").addClass("btn-dark btn mc-change-compare-btn").text(T1.labels.comparator.changeModelSelect).append($("<i/>").addClass("icon-chevron-down")).prependTo(selectionTriggerHolder);
			if (_private.isTrackingEnabled) {
				selectionTrigger.attr({
					'data-bt-action': 'click_function',
					'data-bt-value': 'change_models',
					'data-bt-track': ''
				});

				/*printTrigger.attr({
				 'data-bt-action': 'click_function',
				 'data-bt-value': 'print_models',
				 'data-bt-track': ''
				 });*/
			}

			$("<div/>").addClass("clearfix").appendTo(selectionMenu);
			var saveAndClose = $("<button/>").text(T1.labels.update).addClass("btn btn-dark save-and-close-button").appendTo(selectionMenu);
			var justClose = $("<button/>").text(T1.labels.cancel).addClass("btn btn-link just-close-button").appendTo(selectionMenu);

			selectionTrigger.on("click", _private.onMiniEditClick);
			/*printTrigger.on("click", function() {
			 PubSub.publish(T1.constants.HASH_ADD, '/publish/model_compare_print');
			 });*/
			saveAndClose.on("click", _private.onSaveAndCloseClick);
			justClose.on("click", _private.onJustCloseClick);
			$(".mini-compare-btn", _private.overlayContent).on("click", _private.onMiniEditButtonClicked);
			$(".mini-compare-cb", _private.overlayContent).on("change", _private.onMiniEditCheckboxChecked);

			selectionMenu.hide();
			_private.changeCompareMenu = selectionMenu;
		},
		/*
		 * print selection
		 * */
		print: function (event, data) {
			PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {
				url: $('#equipmentcompare').data('print-url'),
				ajax: true,
				styleClass: 'print-overlay-wrapper',
				pageName: _private.pageName
			});
			var token = PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, function (event, data) {
				if ($(data.el).find('#printModelsCompare')) {
					_private.loadPrintContent();
					window.print();
					PubSub.unsubscribe(token);
				}
			});
		},
		/*
		 * create content to print
		 * */
		loadPrintContent: function () {
			var clone = $('.compare-model-data').children().clone(),
				group = clone.find('#panelGroup-models'),
				container = $('#printModelsCompare');


			clone.find('.filter-holder, .selection-trigger-holder, .icon-remove-container, .buttonrow, .mini-edit-selection-menu, td.filtered').remove();
			clone.find('i.exceptions').each(function (key, val) {
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
		/*
		 * Callback for the cancel button in drop down menu for changing the selection
		 * @param e {object} the event object
		 * @return {void} void
		 * */
		onJustCloseClick: function (e) {
			$(".mini-compare-cb", _private.overlayContent).each(function (i, e) {
				var selectedModel = $(this).data("model-select-type");
				var selectionIndex = $.inArray(selectedModel, _private.selectedModels);
				$(this).prop("checked", (selectionIndex !== -1));
				if (selectionIndex === -1) {
					$(this).parent().removeClass("btn-dark");
				} else {
					$(this).parent().addClass("btn-dark");
				}
			});
			$(".mc-change-compare-btn", ".selection-trigger-holder").trigger("click");
		},
		/*
		 * Callback for the update button in drop down menu for changing the selection
		 * @return {void} void
		 * */
		onSaveAndCloseClick: function () {
			_private.selectedModels = [];
			$(".mini-compare-cb", _private.overlayContent).each(function (i, e) {
				var selectedModel = $(this).data("model-select-type");
				if ($(this).is(":checked")) {
					if ($.inArray(selectedModel, _private.selectedModels) === -1) {
						_private.selectedModels.push(selectedModel);
					}
				} else {
					var index = _private.selectedModels.indexOf(selectedModel);
					if (index !== -1) _private.selectedModels.splice(index, 1);
				}
			});
			_private.sortSelectedModels();
			_private.filterColumns();
			_private.generateSelectionControls();
			_private.modal.hide();
			_private.toggleScrollContainer();
			PubSub.publish(T1.constants.MODEL_COMPARE_CHANGE, {});
		},
		/*
		 * Callback for the checkboxes in the dromdown menu
		 * @param e {object} the event object
		 * @return {void} void
		 * */
		onMiniEditClick: function (e) {
			$(this).toggleClass("btn-dark").toggleClass("half-btn");
			var icon = $("i", this);
			if (icon.hasClass("icon-chevron-down")) {
				icon.removeClass("icon-chevron-down");
				icon.addClass("icon-chevron-up");
				if (T1.utilities.isIpad()) {
					$(".mc-grid-container").css("pointer-events", "none");
				}
			} else if (icon.hasClass("icon-chevron-up")) {
				icon.removeClass("icon-chevron-up");
				icon.addClass("icon-chevron-down");
				if (T1.utilities.isIpad()) {
					$(".mc-grid-container").css("pointer-events", "auto");
				}
			}
			_private.toggleScrollContainer();
			$(".mini-edit-selection-menu").toggle();
			$(this).trigger("blur");
			_private.modal.toggle();
			if (T1.utilities.isIpad()) {
				$(".mini-edit-selection-menu").css("-webkit-transform", "translate3d(0,0,1px)");
				$(this).css("-webkit-transform", "translate3d(0,0,1px)");
				$(".mc-grid-container").css("z-index", "0");
			}
		},
		toggleScrollContainer: function (e) {
			if (T1.utilities.isIpad()) {
				$(".mc-select-modal").css("pointer-events", "none");
				return;
			}
			if (_private.overlayContent.find('.scrollcontainer').length > 0) {
				_private.overlayContent.find('.scrollcontainer').remove();
			}
			else {
				var scrCont = $('<div class="scrollcontainer"></div>').appendTo(_private.overlayContent);
				scrCont.on("click", function (e) {
					_private.modal.trigger("click");
				});
				_private.setScrollContainerSize();
			}
		},
		/**
		 * Sets the height of the scrollcontainer when the browser is resized.
		 * The scrollcontainer makes sure that you can scroll the page when the dropdown menu is expanded.
		 */
		setScrollContainerSize: function (e) {
			var scrollcontainer = _private.overlayContent.find('.scrollcontainer');
			if (scrollcontainer.length > 0) {
				scrollcontainer.css('height', _private.overlayContent.height() + 'px');
			}
		},
		/*
		 * Callback for the checkboxes in the change selection menu
		 * @param e {object} the event object
		 * @return {void} void
		 * */
		onMiniEditCheckboxChecked: function (e) {
			var $this = $(this);

			if ($this.is(":checked")) {
				if ($(".mini-compare-cb:checked", _private.overlayContent).length > 3) {
					//if(_private.selectedModels.length === 3){
					PubSub.publish(T1.constants.TOAST_CUSTOM, {
						customContainer: $(".overlayerContent"),
						customText: _private.maxWarningText,
						timeout: 2000
					});
					$this.prop("checked", false);
					e.preventDefault();
					return false;
				}
				/*
				 if($.inArray(selectedModel, _private.selectedModels) === -1){
				 _private.selectedModels.push(selectedModel);
				 _private.sortSelectedModels();
				 }
				 */
				$this.parent().addClass("btn-dark");
			} else {
				if ($(".mini-compare-cb:checked", _private.overlayContent).length < 2) {
					//if(_private.selectedModels.length === 2){
					PubSub.publish(T1.constants.TOAST_CUSTOM, {
						customContainer: $(".overlayerContent"),
						customText: _private.minWarningText,
						timeout: 2000
					});
					$this.prop("checked", true);
					e.preventDefault();
					return false;
				}
				/*
				 var index = _private.selectedModels.indexOf(selectedModel);
				 _private.selectedModels.splice(index, 1);
				 */
				$this.parent().removeClass("btn-dark");
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
		onCompareBtnClick: function(e){
			e.preventDefault();
			var cb = $('input', $(this).parent());
			cb/*.prop("checked", !cb.is(":checked"))*/.trigger("change");
		},
		/*
		 * Format the data so it is usable for parsing and generating the dynamic HTML
		 * @return {void} void
		 * */
		generateIndexes: function () {
			for (var i = 0; i < _private.data.engines.length; i++) {
				var node = _private.data.engines[i];
				if (typeof _private.engines[node.fuelName] === "undefined") _private.engines[node.fuelName] = [];
				_private.engines[node.fuelName].push(node);
				_private.availableEngines.push(node.code);
			}
			_private.data.grades = [];
			for (var k = 0; k < _private.data.subModels.length; k++) {
				var gradeArr = _private.data.subModels[k].grades;
				_private.data.grades = _private.data.grades.concat(gradeArr);
			}
			for (var j = 0; j < _private.grades.length; j++) {
				var grade = _private.grades[j];
				var modObj = {"name": grade.name};
				if (grade.minPrice) {
					modObj.price = {};
					if (grade.minPrice.list) {
						modObj.price.normal = grade.minPrice.list;
						modObj.price.discount = grade.minPrice.listWithDiscount;
					} else {
						modObj.price.normal = grade.minPrice.listWithDiscount;
					}
				}
				//if(grade.minPrice && grade.minPrice.listWithDiscount) modObj.price = grade.minPrice.listWithDiscount;
				_private.modelData[grade.code] = modObj;
				_private.models.push(grade.code);
				var readMore = $("i[data-model-type='" + grade.code + "']").parent();

				var readMoreContent = $("<div/>").addClass("expansion-content").hide().insertAfter(readMore);
				var readMoreInner = $("<div/>").addClass("expansion-inner").html(grade.feature).appendTo(readMoreContent);

				$("<a/>").addClass("closelink").attr("href", "#").css({
					"position": "absolute",
					"top": "10px",
					"right": "10px"
				}).text(T1.labels.close + " ").append($("<i/>").addClass("icon-remove")).appendTo(readMoreContent);

				var model = _private.data.code;//$(".car-model").data("car-model");
				var compareFullDetailsButton = $("<a/>").addClass("compare-full-details btn btn-grey");
				if (_private.isTrackingEnabled) compareFullDetailsButton.attr({
					'data-bt-action': 'click_function',
					'data-bt-value': 'view_grade_details',
					'data-bt-track': ''
				});
				//compareFullDetailsButton.attr({"href": "/api/page/view/cars/" + model + "/grade/" + grade.code}).text(T1.labels.comparator.viewFullGradeDetails).appendTo(readMoreInner);
				compareFullDetailsButton.attr("href", $('.equipmentcompare').data('base-grade-link') + grade.code).text(T1.labels.comparator.viewFullGradeDetails).appendTo(readMoreInner);

				readMoreContent.append($("<div/>").addClass("expansion-arrow"));
				readMore.attr("data-tooltip-selector", ".modelcompare_tooltipcontent_" + j).addClass("readMore");
				readMoreContent.addClass("modelcompare_tooltip modelcompare_tooltipcontent_" + j);
			}
			_private.generateBodyTypeIndexes();
			//PubSub.publish(T1.constants.STATS_INIT_TRACK, {target: _private.modelNodesMainContainer});
		},
		/*
		 * Makes an array of the needed body type data
		 * @return {void} void
		 * */
		generateBodyTypeIndexes: function () {
			var obj = {};
			var prc = {};
			for (var i = 0; i < _private.data.grades.length; i++) {
				var node = _private.data.grades[i];
				obj[node.code] = node.bodyType;
				prc[node.code] = {};
				for (var j in node.bodyType) {
					prc[node.code][j] = {};
					for (var k in node.bodyType[j].fuelType) {
						for (var l in node.bodyType[j].fuelType[k].engine) {
							prc[node.code][j][l] = node.bodyType[j].fuelType[k].engine[l].minPrice;
						}
					}
				}
			}
			_private.bodyTypeValues = obj;

			_private.engineTypeValues = prc;
		},
		/*
		 * Add the needed filters and radio buttons
		 * @return {void} void
		 * */
		addFilters: function () {
			var holder = $("<div/>").addClass("filter-holder").appendTo(_private.filterContainer),
				bodyHolder = $("<div/>").addClass("body-type-filter").appendTo(holder).addClass("darker"),
				gradeHolder = $("<div/>").addClass("grades-filter").appendTo(holder).addClass("darker"),
				legendHolder = $("<div/>").addClass("legend-holder").appendTo(holder),
				exs = _private.getExpansionContainer(_private.exceptionsLegendId).appendTo(legendHolder);

			if (_private.isTrackingEnabled) {
				bodyHolder.attr({
					'data-bt-action': 'click_function',
					'data-bt-value': 'change_bodytype'
				});
				gradeHolder.attr({'data-bt-action': 'highlight_diff'});
			}

			$("<h5/>").text(T1.labels.comparator.chooseBodytype + ":").appendTo(bodyHolder);
			$("<h5/>").text(T1.labels.comparator.highlightDifferences + ":").appendTo(gradeHolder);

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
				for (var j in _private.bodyTypes) {
					T1.engineCompare.addRadioButton(_private.bodyTypes[j].name, _private.bodyTypes[j].code, bodyHolder, "body-type-label", "mc-body-type-radio", "mc-filter-body-type", _private.onBodyFilterChange, _private.currentBodyType, _private.isTrackingEnabled ? {'data-bt-track': ''} : null);
				}
			}

			T1.engineCompare.addRadioButton(T1.labels.selectOn, "on", gradeHolder, "grades-type-label", "mc-grades-type-radio", "highlight-grades", _private.onGradeFilterChange, "off", _private.isTrackingEnabled ? {'data-bt-value': 'on', 'data-bt-track': ''} : null);
			T1.engineCompare.addRadioButton(T1.labels.selectOff, "off", gradeHolder, "grades-type-label", "mc-grades-type-radio", "highlight-grades", _private.onGradeFilterChange, "off", _private.isTrackingEnabled ? {'data-bt-value': 'off', 'data-bt-track': ''} : null);

			var standartHolder = $("<span/>").addClass("mc-legend-standart mc-legend-label").text(T1.labels.comparator.standard).appendTo(legendHolder);
			$("<i/>").addClass("icon-radio-checked").prependTo(standartHolder);

			var optionHolder = $("<span/>").addClass("mc-legend-option mc-legend-label").text(T1.labels.comparator.optional).appendTo(legendHolder);
			$("<i/>").addClass("icon-radio-uncheck").prependTo(optionHolder);

			var notApcHolder = $("<span/>").addClass("mc-legend-not-applicable mc-legend-label").text(T1.labels.comparator.notApplicable).appendTo(legendHolder);
			$("<i/>").addClass("icon-minus").prependTo(notApcHolder);

			var specialOfferHolder = $("<span/>").addClass("mc-legend-special-offer mc-legend-label").text(T1.labels.promotionSpecialOffer).appendTo(legendHolder);
			$("<i/>").addClass("icon-tag").prependTo(specialOfferHolder);

			$("<span/>").attr('data-tooltip-selector', '#' + _private.exceptionsLegendId).
				addClass("cs-legend-exceptions  mc-legend-label readMore").text(T1.labels.exceptions).appendTo(legendHolder);
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
		 * callback for the body filter changes
		 * @param e {object} the change event object
		 * @return {void} void
		 * */
		onBodyFilterChange: function (e) {
			_private.resetHighlight();
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
			//if ($(this).is(":checked")) {
			//_private.currentBodyType = $(this).val();
			//console.log(_private.engineTypeValues);
			/*$("td.mc-price-cell").each(function (i, e) {
			 var modelType = $(this).attr("mc-model-type");
			 var engineCode = $(this).attr("mc-engine-type");
			 if (engineCode && _private.engineTypeValues[modelType] && _private.engineTypeValues[modelType][_private.currentBodyType] && _private.engineTypeValues[modelType][_private.currentBodyType][engineCode]) {
			 var priceObj = _private.engineTypeValues[modelType][_private.currentBodyType][engineCode];
			 if (priceObj.list) {
			 var newPrice = $('<span/>').addClass('new-price').html(globalize.format(priceObj.listWithDiscount, "c")).append($('<i class="icon-tag"></i>'));
			 var oldPrice = $('<span/>').addClass('old-price').html(globalize.format(priceObj.list, "c"));
			 $(this).empty().append($('<p/>').addClass('promo').append([newPrice, oldPrice]));
			 }
			 else {
			 $(this).html(globalize.format(priceObj.listWithDiscount, "c"));
			 }
			 } else {
			 $(this).html("<i class='icon-minus'></i>");
			 }
			 //$(this).css("background", "red");
			 });*/
			_private.reloadPricesSection();

			$("td.data-cell:not(.mc-price-cell)", _private.overlayContent).each(function (i, e) {
				var newValue = "<i class='icon-minus'></i>";
				var modelType = $(this).attr("mc-model-type");
				var equipmentCode = $(this).parent().attr("data-row-name");
				var gradeNode = _private.bodyTypeValues[modelType];
				if (gradeNode[_private.currentBodyType] && gradeNode[_private.currentBodyType].equipment && gradeNode[_private.currentBodyType].equipment[equipmentCode]) {
					var valueCode = gradeNode[_private.currentBodyType].equipment[equipmentCode].equipped;
					switch (valueCode) {
						case "s":
							newValue = "<i class='icon-radio-checked'></i>";
							break;
						case "o":
							newValue = "<i class='icon-radio-uncheck'></i>";
							break;
						case "-":
							break;
						default:
							break;
					}
					$(this).html(newValue);
					// equipment exceptions
					if (gradeNode[_private.currentBodyType].equipment[equipmentCode].cars) {
						_private.addExceptions(
							$(this).find('i'),
							gradeNode[_private.currentBodyType].equipment[equipmentCode].cars,
							equipmentCode.toString().replace(/[^a-zA-Z0-9]/g, '') + '-' + i + '-' + _private.currentBodyType
						);
					}
				}else{
					$(this).html(newValue);
				}
			});
			//}
		},
		/*
		 * callback for the grade filter changes
		 * @param e {object} the change event object
		 * @return {void} void
		 * */
		onGradeFilterChange: function () {
			var headrows = $(".table-parent:not([data-engine-code])");
			switch ($(this).val()) {
				case "on":
					headrows.each(function (i, e) {
						var sameVal = true;
						var firstTd = $(".data-cell", this).eq(0);
						var gradeVal = firstTd.html();
						var otherTds = firstTd.nextAll().not(".filtered");
						otherTds.each(function (i, e) {
							if ($(this).html() !== gradeVal) {
								sameVal = false;
								return false;
							}
						});
						if (!sameVal) $("td", this).eq(0).css("background", "#f07f0a");
					});
					break;
				case "off":
					$("td", headrows).css("background", "inherit");
					break;
				default:
					break;
			}
		},
		/*
		 * reset the highlighting rows for the differences
		 * @return {void} void
		 * */
		resetHighlight: function () {
			$(".mc-grades-type-radio[value='off']").prop("checked", true);
			$("td", $(".table-parent:not([data-engine-code])")).css("background", "inherit");
		},
		/*
		 * change the order of the selected engines according to the order in the data
		 * @return {void} void
		 * */
		sortSelectedModels: function () {
			_private.selectedModels.sort(function (a, b) {
				var aIndex = _private.models.indexOf(a);
				var bIndex = _private.models.indexOf(b);
				return (aIndex > bIndex) ? 1 : -1;
			});
		},
		/*
		 * Build the change selection menu at the top
		 * @return {void} void
		 * */
		generateSelectionControls: function () {
			_private.editSelect.empty();
			var optioncontainer = $('<div/>').addClass('optioncontainer').appendTo(_private.editSelect);
			$('<div/>').addClass('itemrow').appendTo(optioncontainer);
			$('<div/>').addClass('buttonrow').appendTo(optioncontainer);

			for (var i = 0; i < _private.selectedModels.length; i++) {
				_private.generateThumbs(_private.selectedModels[i]);
			}
			$("<div/>").addClass("clearfix").appendTo(_private.editSelect);
			_private.generateSelectEdit(_private.editSelect);

			_private.refreshShortFinanceData();
		},
		/*
		 * Build the thumbnails for the selected engine type
		 * @param engineType {string} the selected engine
		 * @return {void} void
		 * */
		generateThumbs: function (selectedModel) {
			try {
				var optioncontainer = _private.editSelect.find('.optioncontainer');
				var itemRow = optioncontainer.find('.itemrow');
				var buttonRow = optioncontainer.find('.buttonrow');
				var financeBox = $("<div/>").addClass("finance-rate");

				var selectionIndex = $.inArray(selectedModel, _private.selectedModels);

				var imgSource = $(".mc-main-image[data-model-type='" + selectedModel + "']").attr("src");
				var thumbContainer = $("<div/>").addClass("img-select-thumb").attr({"mc-model-type": selectedModel}).appendTo(itemRow);

				var labelContainer = $("<div/>").addClass("img-select-label-container").appendTo(thumbContainer);
				$("<img/>").addClass("img-responsive").attr("src", imgSource).appendTo(labelContainer);
				var labelWrapper = $("<div/>").addClass("label-wrapper clearfix").appendTo(labelContainer);
				var infoContainer = $("<div/>").addClass("infocontainer model").appendTo(thumbContainer);

				var h4 = $("<h4/>").text(_private.modelData[selectedModel].name).attr("mc-model-type", selectedModel).appendTo(infoContainer);
				if ($.inArray(selectedModel, _private.hybridCars) !== -1) {
					h4.addClass("hybrid");
					labelWrapper.append($("<span/>").addClass("label hybrid").text(T1.labels.hybrid));
				}

				financeBox.append($('<span/>').addClass('monthly-payment')).appendTo(infoContainer);

				if ($.inArray(selectedModel, _private.specialOffers) !== -1) {
					labelWrapper.append($("<span/>").addClass("label special-offer").text(T1.labels.promotionSpecialOffer));
				}
				var removeIconContainer = $('<div/>').addClass('icon-remove-container').prependTo(thumbContainer);
				var removeIcon = $("<i/>").addClass("icon-remove ec-thumb-remove").appendTo(removeIconContainer);

				var buttonContainer = $('<div/>').addClass('buttoncontainer ');
				buttonContainer.appendTo(buttonRow);

				var configButton = $("<a/>").addClass("btn btn-grey config-btn ");
				if (_private.isTrackingEnabled) configButton.attr({
					'data-bt-eventclass': 'ctaevent',
					'data-bt-action': 'click_cta',
					'data-bt-value': 'carconfigurator',
					'data-bt-workflowname': 'carconfigurator',
					'data-bt-workflowstep': '0',
					'data-bt-track': ''
				});
				var configLink = '#' + T1.constants.URL_CAR_CONFIG_OVERLAYER + 'modelid=' + _private.data.modelId + "/carid=" + _private.grades[selectionIndex].car;
				configButton.attr("href", configLink);
				configButton.html(T1.labels.configureButton).append($("<i/>").addClass("icon-chevron-right")).appendTo(buttonContainer);
				removeIcon.on("click", _private.onMiniRemoveClick);

			} catch (err) {
				console.log(err.message);
			}
		},
		/*
		 * Callback for the remove icons at the top of the thumbnails
		 * @param e {object} the event object
		 * @return {void} void
		 * */
		onMiniRemoveClick: function (e) {
			var modelType = $(this).parent().parents('.img-select-thumb').attr("mc-model-type");
			if (_private.selectedModels.length === 2) {
				PubSub.publish(T1.constants.TOAST_CUSTOM, {
					customContainer: _private.editSelect,
					customText: _private.minWarningText,
					timeout: 2000
				});
				return;
			}

			PubSub.publish(T1.constants.MODEL_COMPARE_CHANGE, {
				"selectedModel": modelType
			});

			var index = _private.selectedModels.indexOf(modelType);
			_private.selectedModels.splice(index, 1);
			$(this).parent().remove();
			$(".img-select-thumb").attr("class", "").addClass(".img-select-thumb " + T1.engineCompare.getColSize());

			_private.onEditSelection();
		},
		/*
		 * Ingine the operation in case the selected engines are changed
		 * @return {void} void
		 * */
		onEditSelection: function () {
			_private.filterColumns();
			_private.generateSelectionControls();
		}
	};

	/*returns the public methods of the component*/
	var _public = {
		initDesktop: _private.initDesktop,
		switchDesktop: _private.switchDesktop,
		switchMobile: _private.switchMobile
	};
	return _public;
})();