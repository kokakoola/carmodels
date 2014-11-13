var T1 = T1 || {};

T1.carconfigMini = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		jsonData: null,
		dropdowns: null,
		dropdownIndex: 0,
		step: 0,
		steps: {},
		selectedItems: [],
		selectedSteps: {},
		selectedLists: {},
		iconChevron: $('<i>'),
		wasStartedMobile: false,
		wasStartedDesktop: false,
		isMobile: false,
		hasMobileInit: false,
		isFinalized: false,
		CLASS_HIDE: 'hide',
		CLASS_HIDDEN_XS : 'hidden-xs',
		CLASS_DROPDOWN_MENU : 'dropdown-menu',
		CLASS_DISABLED: 'disabled',
		tokens: {},
		init: function() {
			var m = _private;

			PubSub.subscribe(T1.constants.CARCONFIG_MINI_INIT, m.initModuleVariables);
			PubSub.publish(T1.constants.CARCONFIG_MINI_INIT,{});

			PubSub.subscribe(T1.constants.CARCONFIG_END, m.requestCarCode);
			PubSub.subscribe(T1.constants.CARCONFIG_MINI_END, m.requestCarCode);
			PubSub.subscribe(T1.constants.FINANCE_RATES_ON, _private.loadConfigFinanceData);
			PubSub.subscribe(T1.constants.FINANCE_RATES_OFF, _private.hideFinance);
		},

		/** initialize the module variables (this way they can be initialized on the fly, when the mini carconfig gets injected)
		 *
		 */
		initModuleVariables: function(msg, data){
			if(! data) data={};
			m.miniConfig = data.el || $('.carconfig-mini');

			if (m.miniConfig.length > 0) {
				var ctaContainer = $('.carconfig-mini-cta');

				m.isTrackingEnabled = typeof(window.t1DataLayer) === 'object';

				// list of dropdowns in memory
				m.dropdownWrapper = m.miniConfig.find('.carconfig-mini-select');
				m.dropdowns = m.dropdownWrapper.find('.dropdown');
				m.preSelectedLink = m.dropdowns.find('.' + m.CLASS_DROPDOWN_MENU + ' a[data-selected]');
				m.previewWrapper = m.miniConfig.find('.carconfig-mini-preview');
				m.ecoLabels = $('.carconfig-mini-ecolabels');
				m.ecoLabelsTitle = m.ecoLabels.find('h3');
				m.ecoLabelsSubtitle = m.ecoLabels.find('h4');
				m.ecoLabelsImage = m.ecoLabels.find('.eco-grade');
				m.ecoLabelsTable = m.ecoLabels.find('.eco-table');
				m.ecoLabelsDisclaimer = m.ecoLabels.find('.ecolabels-disclaimer');
				m.ecoLabelsSpecsCondition = m.ecoLabels.find('.ecolabels-specs-condition');
				m.configObj = null;

				//the summary list can be used even if the carconfig mini is not in the page (eg share results on mobile)
				m.summary = m.miniConfig.find('.carconfig-mini-summary');
				m.summaryList = m.summary.find('.summary-selection');
				m.priceTable = m.summary.find('.summary-price');
				m.imageResult = m.miniConfig.find('.image-result');

				// handle selection within dropdown
				m.dropdownWrapper.on('click', 'a[data-id]', m.handleSelection);

				// finance link
				m.financeBtn = ctaContainer.find('.btn-finance');
				m.financeBtn.on('click', m.postFinanceData);

				// insurance link
				m.btnInsurance = ctaContainer.find('.btn-insurance');
				m.btnInsurance.on('click', m.postInsuranceData);

				// config link
				m.configBtn = ctaContainer.find('.btn-car-configurator');


				//reposition the carimage (only when the component gets injected)
				if(data.repositionImage) m.positionCarImage();

				m.modelPreselect();

				m.steps = T1.constants.CARCONFIG_STEPS;
			}
		},


		/**
		 * Init specific Mobile version stuff
		 */
		initMobile: function() {
			m.setMobile(true);
			if (m.miniConfig.length > 0) {
				if (!m.wasStartedDesktop) {
					m.wasStartedMobile = true;
				}
				m.resetButton = m.summary.find('.btn-reset');
				m.resetButton.on('click', m.reset);
			}

			//make it public, it can be called from any page even if mini-carconfig is not there
			m.tokens.load = PubSub.subscribe(T1.constants.CARCONFIG_MINI_LOAD, m.handleCarConfigLoad);
		},
		handleCarConfigLoad: function(msg, data) {
			var m = _private;

			if (data.tyCode) {
				var request = $.ajax({
					type: 'GET',
					dataType: 'JSON',
					url: m.getCarInfoUrl({configCode: data.tyCode})
				});
				request.done(m.handleRequestCarInfoSuccess);
				request.fail(m.handleRequestCarInfoError);
			}
		},
		getCarInfoUrl: function(data) {
			var url = T1.settings.loadSaveServer + '/config/';

			if (data.configCode) {
				url += data.configCode + '/full';
			} else {
				if (data.modelId) {
					url += 'toyota/' + T1.settings.country + '/' + T1.settings.language + '/';
					url += data.modelId + '/' + data.carId + '/' + data.colourId + '/full/';
				} else if (data.ConfigurationID) {
					url += data.ConfigurationID + '/full';
				}
			}

			return url;
		},
		handleRequestCarInfoSuccess: function(data) {
			var l = T1.labels.carconfigMini;

			$('ul.carconfig-mini-select, a.btn-reset').css('display', 'none');

			$('ul.summary-selection li').remove();

			var value, key, keyTranslated;
			m.selectedSteps.grades = {};
			m.jsonData = {};
			for(key in data.guids){
				if(key!=='prototype'){
					if (key.toLowerCase() === 'car') {
						m.selectedSteps.grades.carId = data.guids[key];
					}
				}
			}
			m.jsonData.modelId = data.car.model;

			for(key in data.car){
				if(key!=='prototype'){
					value = data.car[key];
					key = key.toLowerCase();
					keyTranslated = null;
					if (key === 'model') {
						keyTranslated = l.selectedModel;
					} else if (key === 'body') {
						keyTranslated = l.selectedBodyType;
					} else if (key === 'engine') {
						keyTranslated = l.selectedEngine;
					} else if (key === 'transmission') {
						keyTranslated = l.selectedTransmission;
					} else if (key === 'wheeldrive') {
						keyTranslated = l.selectedWheelDrive;
					} else if (key === 'grade') {
						keyTranslated = l.selectedGrade;
					} else if (key === 'colour') {
						var ext = value.exterior;
						keyTranslated = l.selectedColour;
						value = ext.name;
						m.selectedSteps.colours = {};
						m.selectedSteps.colours.code = ext.code;
					}

					if(keyTranslated){
						_private.addToSummary({'key': key, 'value': value});
					}

				}
			}

			m.finalize();

			if (data.price) {
				var priceColor = data.price.colour ? data.price.colour.listWithDiscount : 0;
				m.showPrices(data.price.listWithDiscount, priceColor);
			} else {
				console.log('no price defined');
			}
		},
		handleRequestCarInfoError: function(jqXHR, status, error) {
			console.log(status + ': ' + error);
		},
		/**
		 * Init specific Desktop version stuff
		 */
		initDesktop: function() {
			m.setMobile(false);
			if (m.miniConfig.length > 0) {
				if (!m.wasStartedMobile) {
					m.wasStartedDesktop = true;
				}
				m.niceSummary = m.miniConfig.find('.summary-selection-nice');
				m.actionsWrapper = m.miniConfig.find('.carconfig-mini-actions');
				m.btnMoreAbout = m.actionsWrapper.find('.btn-more-about');
				m.changeCarButton = m.actionsWrapper.find('.btn-reset');
				m.myToyotaButton = m.actionsWrapper.find('.btn-my-toyota');
				m.cta = $('.carconfig-mini-cta');

				// handle selection within dropdown
				m.iconChevron.addClass('icon-chevron-down');
				// disable click on disabled dropdowns
				m.dropdownWrapper.on('click', 'a.'+m.CLASS_DISABLED, function(e){
					e.preventDefault();
				});
				// Change car button
				m.changeCarButton.on('click', m.reset);

				// My Toyota button
				m.myToyotaButton.on('click', m.save);
			}
		},
		/**
		 * Switch to Mobile version
		 */
		switchMobile: function() {
			m.setMobile(true);
			if (m.miniConfig.length > 0) {
				// First time ever that switchMobile is triggered (from the start of Mobile)
				if (m.isMobile) {
					m.hasMobileInit = true;
				} else {
					m.hasMobileInit = false;
				}
				m.setButtonLook();
				m.hideDropdowns();
				m.positionCarImage();
				m.ecoLabelsDisplay(true);
				/*
				if (m.isFinalized) {
					m.showFinance();
				}
				*/
			}
		},
		/**
		 * Switch to Desktop version
		 */
		switchDesktop: function() {
			m.setMobile(false);
			if (m.miniConfig.length > 0) {
				m.setButtonLook();
				m.showDropdowns();
				m.positionCarImage();
				m.ecoLabelsDisplay(false);
				if (m.isFinalized) {
					m.hideDropdownsWrapper();
					//m.showFinance();
					m.showNiceOptions();
					m.showActions();
					m.showCTA();
				}
			}
		},
		setMobile: function(isMobile) {
			m.isMobile = isMobile;
		},
		setButtonLook: function() {
			var buttonClasses = 'btn btn-grey btn-full-width';
			var links = m.dropdowns.find('ul a');
			if (m.isMobile) {
				links.addClass(buttonClasses);
			} else {
				links.removeClass(buttonClasses);
			}
		},
		/**
		 * Mobile only: hide all dropdowns but last active one
		 */
		hideDropdowns: function() {
			// First hide all
			m.dropdowns.addClass(m.CLASS_HIDE);
			// Unhide some
			if (!m.isFinalized) {
				if (m.hasMobileInit && !m.wasStartedDesktop && m.preSelectedLink.length > 0) {
					m.hasMobileInit = false;
					// Preselected model: unhide second dropdown
					var firstDropdown = m.dropdowns.eq(1);
					firstDropdown.removeClass(m.CLASS_HIDE);
				} else {
					// Unhide active dropdown
					var currentActiveDropdown = m.dropdowns.find('.dropdown-toggle').not('.'+m.CLASS_DISABLED).last();
					currentActiveDropdown.parent().removeClass(m.CLASS_HIDE);
				}
			}
		},
		/**
		 * Desktop only: show all dropdowns
		 */
		showDropdowns: function() {
			m.dropdowns.removeClass(m.CLASS_HIDE);
		},
		showDropdownsWrapper: function() {
			m.dropdownWrapper.show();
		},
		hideDropdownsWrapper: function() {
			m.dropdownWrapper.hide();
		},
		/**
		 * Move image to correct container based on breakpoint
		 */
		positionCarImage: function() {
			if (m.isMobile) {
				if (m.imageResult.parent().is(m.previewWrapper)) {
					m.summaryList.before(m.imageResult);
				}
			} else {
				if (m.imageResult.next().is(m.summaryList)) {
					m.previewWrapper.prepend(m.imageResult);
				}
			}
		},
		/**
		 * hide current row and show next one
		 * @param dropdown Parent dropdown for clicked option
		 */
		dropdownSwitch: function(dropdown) {
			if (m.isMobile) {
				dropdown.addClass(m.CLASS_HIDE);
				dropdown.next().removeClass(m.CLASS_HIDE);
			}
		},
		modelPreselect: function() {
			if (m.preSelectedLink.length > 0) {
				m.handleSelection({target: m.preSelectedLink});
				m.preSelectedLink.parents('.dropdown').find('.dropdown-toggle').addClass(m.CLASS_DISABLED);
			}
		},
		/**
		 * Add selected option to the summary list
		 * @param item	The selected option
		 */
		addToSummary: function(item) {
			if (!item) {
				return;
			}

			var newItem = $('<li>'),
				stepName,
				label,
				value;

			if (item.parents) {
				stepName = item.parents('.dropdown').data('step');
				value = item.text();
			} else {
				stepName = item.key;
				value = item.value;
			}

			label = m.getStepLabel(stepName);

			newItem.html('<strong>' + label + ': </strong>' + value);
			m.summaryList.append(newItem);
		},
		/**
		 *
		 * @param {string} step	Current step
		 * @returns {string} Label for current step
		 */
		getStepLabel: function(stepName) {
			var labels = {
				'models' : T1.labels.carconfigMini.selectedModel,
				'bodyType' : T1.labels.carconfigMini.selectedBodyType,
				'engine' : T1.labels.carconfigMini.selectedEngine,
				'transmission' : T1.labels.carconfigMini.selectedTransmission,
				'wheelDrives' : T1.labels.carconfigMini.selectedWheelDrive,
				'grades' : T1.labels.carconfigMini.selectedGrade,
				'colours' : T1.labels.carconfigMini.selectedColour
			};
			var label = labels[stepName];
			return label || stepName;
		},
		/**
		 * Reset and Change car buttons handler
		 */
		reset: function(e) {
			e.preventDefault();

			// reset to first step
			m.step = 0;

			// Reset data EXCEPT when preselected model
			if (m.preSelectedLink.length === 0) {
				m.jsonData = null;
			}

			// Summary
			m.resetSummary();

			// reset the configuration object (used for finance + proxy finance service)
			m.configObj = null;

			// Dropdowns
			// reset all following dropdowns
			m.resetDropdowns(m.step + 1);
			// Mobile only: hide dropdowns except first one
			if (m.isMobile) {
				m.hideDropdowns();
				// Model step (first one never has its content reset)
				var firstDropdown = m.dropdowns.eq(0);
				firstDropdown.removeClass(m.CLASS_HIDE);
			}
			// Reset model item label EXCEPT when preselected model
			if (m.preSelectedLink.length === 0) {
				m.resetDropdownLabel(0);
			}

			// Show dropdowns container
			m.showDropdownsWrapper();

			// Common boxes to hide
			m.priceTable.hide();
			m.hideResultImage();
			m.hideFinance();
			m.hideEcoLabels();

			// Reset desktop specific stuff
			m.hideNiceOptions();
			m.hideActions();
			m.hideCTA();

			m.resetCarCode();

			// Insure we're not done yet
			m.isFinalized = false;

			// Simulate model selection
			if (m.preSelectedLink.length > 0) {
				m.handleSelection({target: m.preSelectedLink});
			}
		},
		save: function(e) {
			e.preventDefault();
			if(m.myToyotaButton.attr('data-car-config-code')) {
				PubSub.publish(T1.constants.CARCONFIG_SAVE_CONFIG, {
					configCode: m.myToyotaButton.attr('data-car-config-code')
				});
			}
		},
		/**
		 * handles item selection from dropdown
		 * @param {event} e
		 */
		handleSelection: function(e) {
			if (e.preventDefault) {
				e.preventDefault();
			}
			var c = T1.constants,
				selectedItem = $(e.target),
				selectedId = selectedItem.data('id'),
				dropdown = selectedItem.parents('.dropdown'),
				selectStep = dropdown.data('step'),
				selectedName = selectedItem.html();

			selectedItem.addClass('selected');

			// keep track of selections
			m.selectedItems.push(selectedItem);

			// replace default label with selection name
			m.setDropdownLabel(dropdown, selectedName);

			// Switch row display
			m.dropdownSwitch(dropdown);

			// Update summary box
			m.addToSummary(selectedItem);

			// calculate dropdown index in collection
			m.dropdownIndex = m.dropdowns.index(dropdown);

			// check if user overrides one of previous selections
			if (m.dropdownIndex < m.step) {
				// reset step to current dropdown
				m.step = m.dropdownIndex + 1;
				if (selectedItem !== m.selectedItems[m.dropdownIndex]) {
					// reset all following dropdowns
					m.resetDropdowns(m.step);
					// reset all following summary options
					m.resetSummary(m.step);
				}
			} else if (m.dropdownIndex === m.step) {
				m.step++;
			}

			if (m.isTrackingEnabled){
				if (e.type === 'click') {
					if (!m.indexFirstUserSelectableDropdown) {
						m.indexFirstUserSelectableDropdown = m.dropdownIndex;
						var nodeToCheck = dropdown, workflowName;
						do {
							workflowName = nodeToCheck.data('bt-workflowname');
							if (workflowName) {
								m.workflowName = workflowName;
							}
							else {
								if (nodeToCheck.prop('tagName') === 'BODY') {
									m.workflowName = '';
								} else {
									nodeToCheck = nodeToCheck.parent();
								}
							}
						}
						while (typeof m.workflowName!=='string');
					}
					if (m.indexFirstUserSelectableDropdown === m.dropdownIndex) {
						PubSub.publish(T1.constants.STATS_TRACK, {
							node:dropdown,
							extraData:{
								event: {
									workflowname: m.workflowName + ';' + m.workflowName,
									workflowstep: '0;' + dropdown.data('bt-workflowstep')
								}
							}
						});
					} else {
						PubSub.publish(T1.constants.STATS_TRACK, {node:dropdown});
					}
				}
			}

			if (m.step === 1) {
				// after model selection
				if (m.jsonData && m.preSelectedLink.length > 0) {
					// use cached cardb data
					m.handleDataResponse(m.jsonData, selectedId);
				} else {
					// ... or get data from server
					$.getJSON(c.URI_MINI_CARCONFIG_DATA + selectedId, m.handleDataResponse);
				}

			} else if (m.step > 1) {
				// further steps
				m.selectedSteps[selectStep] = m.selectedLists[m.step-1][selectedId];
				if (m.step === m.dropdowns.length) {
					// last step
					m.finalize();
				} else {
					// between first and last steps
					m.handleDataResponse(m.jsonData, selectedId);
				}
			}
		},
		/**
		 * handles json response with cardb data
		 * @param {object} data
		 * @param {int} id
		 */
		handleDataResponse: function(data, id) {
			var $stepSelector = $(m.dropdowns[m.step]),
				auxData = ((m.step === 0 || m.step === 1) ? data : m.selectedLists[m.step - 1][id]),
				stepProperty = $stepSelector.data('step');

			// traverse json struct by step, mock data is in /assets/api/cardb/minicarconfig
			//DMA: changed to smaller, configurable version
			m.selectedLists[m.step] = auxData[stepProperty];

			// cache json data
			if (m.jsonData !== data) {
				m.jsonData = data;
				var wheelDriveDropdown = m.dropdownWrapper.find('.dropdown[data-step="wheelDrives"]');
				if(!data.hasWheeldrives || data.hasWheeldrives === false) {
					wheelDriveDropdown.hide();
				} else {
					wheelDriveDropdown.show();
				}
			}

			// fill dropdown with collected data
			m.populateDropdown($stepSelector, m.selectedLists[m.step]);
		},
		/**
		 * fills dropdown with data
		 * @param {element} dropdown
		 * @param {object} data
		 */
		populateDropdown: function(dropdown, data) {
			var list = $('<ul>');

			// remove option list from dropdown
			m.clearDropdown(dropdown);

			// prepare dropdown menu
			list.addClass(m.CLASS_DROPDOWN_MENU);
			list.attr('role', 'menu');
			if(data && data.length > 1){
				$.each(data, addToList);
				dropdown.append(list);
				m.toggleDropdown(dropdown, false);
			} else if (data && data.length === 1) {
				dropdown.find('.dropdown-toggle > span').html(data[0].name || data[0].gradeName);
				m.toggleDropdown(dropdown, true);
				addToList(0, data[0]);
				dropdown.append(list);
				m.handleSelection({target: dropdown.find('ul li:first > a')});
			}
			m.setButtonLook();

			function addToList(key, value){
				var item = $('<li>'),
					link = $('<a>');

				// model needs code, others just key
				if (m.step === 0) {
					link.attr('data-id', value.code);
				} else {
					link.attr('data-id', key);
				}
				// colour step
				if (m.step === m.dropdowns.length - 1) {
					var bgColor = value.rgb;
					// Workaround for bgColor not properly defined (ex: "0")
					if (bgColor.length === 1) {
						var generatedColor = '';
						for (var i=0;i<6;i++){
							generatedColor += bgColor;
						}
						bgColor = generatedColor;
					}
					// White text color for darker backgrounds (ootherwise just use the existing color)
					// Possible values: black, white
					var textColor = T1.utilities.contrastYIQ(bgColor);
					var textColorValue;
					if (textColor === 'white') {
						textColorValue = 'color:' + textColor + ' !important';
					} else {
						textColorValue = false;
					}
					// Background color
					var backgroundValue = m.getInlineBackground(bgColor);
					if (textColorValue) {
						link.attr('style', backgroundValue + textColorValue);
					} else {
						link.attr('style', backgroundValue);
					}
				}
				// all need name, grades need gradeName
				link.html(value.name || value.gradeName);
				item.append(link);
				list.append(item);
			}
		},
		/**
		 * Generate a cross-browser gradient
		 * @param bgColor		The background color to highlight
		 * @returns {string}	A CSS declaration to be injected inline
		 */
		getInlineBackground: function(bgColor) {
			if (!bgColor) return;
			var lightPercent = (T1.utilities.isTooDark(bgColor,30) === true) ? 60 : 15 ;
			var lighterColor = T1.utilities.lightenDarken(bgColor, lightPercent);
			var backgroundValueOldFF = 'background: -moz-linear-gradient(20deg, #'+bgColor+' 0%, #'+bgColor+' 60%, #'+lighterColor+' 64%, #'+lighterColor+' 100%);';
			var backgroundWebkit1 = '-webkit-gradient(left bottom, right top, color-stop(0%, #'+bgColor+'), color-stop(60%, #'+bgColor+'), color-stop(64%, #'+lighterColor+'), color-stop(100%, #'+lighterColor+'));';
			var backgroundWebkit2 = ' -webkit-linear-gradient(20deg, #'+bgColor+' 0%, #'+bgColor+' 60%, #'+lighterColor+' 64%, #'+lighterColor+' 100%);';
			var backgroundOpera = '-o-linear-gradient(20deg, #'+bgColor+' 0%, #'+bgColor+' 60%, #'+lighterColor+' 64%, #'+lighterColor+' 100%);';
			var backgroundMS = '-ms-linear-gradient(20deg, #'+bgColor+' 0%, #'+bgColor+' 60%, #'+lighterColor+' 64%, #'+lighterColor+' 100%);';
			var backgroundValueStandard = 'background: linear-gradient(20deg, #'+bgColor+' 0%, #'+bgColor+' 60%, #'+lighterColor+' 64%, #'+lighterColor+' 100%);';
			var backgroundMSfilter = "filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#"+bgColor+"', endColorstr='#"+lighterColor+"', GradientType=1 );";
			var backgroundValueStockAndroid = 'background: -webkit-linear-gradient(20deg, #'+bgColor+' 0%, #'+bgColor+' 60%, #'+lighterColor+' 64%, #'+lighterColor+' 100%);';
			var backgroundValue = backgroundValueOldFF + backgroundWebkit1 + backgroundWebkit2 + backgroundOpera + backgroundMS + backgroundValueStandard + backgroundMSfilter+backgroundValueStockAndroid;
			return backgroundValue;
		},
		/**
		 * removes data list from dropdown
		 * @param {$object} dropdown
		 */
		clearDropdown: function(dropdown) {
			if (dropdown.children().length > 1) {
				dropdown.children('.'+m.CLASS_DROPDOWN_MENU).remove();
			}
		},
		/**
		 * resets dropdowns as of given index
		 * @param {int} index
		 */
		resetDropdowns: function(index) {
			for (var i = index; i <= m.dropdowns.length; i++) {
				var nextDropdown = $(m.dropdowns[i]);

				if (nextDropdown.children().length > 1) {
					m.clearDropdown(nextDropdown);
					m.toggleDropdown(nextDropdown, true);
					m.resetDropdownLabel(i);
				}
			}
		},
		/**
		 * resets label for dropdown trigger
		 * @param {int} dropdownIndex
		 */
		resetDropdownLabel: function(dropdownIndex) {
			var dropdownToReset = $(m.dropdowns[dropdownIndex]),
				labels = [
					T1.labels.carconfigMini.chooseModel,
					T1.labels.carconfigMini.chooseBodytype,
					T1.labels.carconfigMini.chooseEngine,
					T1.labels.carconfigMini.chooseTransmission,
					T1.labels.carconfigMini.chooseWheeldrive,
					T1.labels.carconfigMini.chooseGrade,
					T1.labels.carconfigMini.chooseColour
				];

			m.setDropdownLabel(dropdownToReset, labels[dropdownIndex]);
		},
		/**
		 * set label for dropdown trigger
		 * @param dropdown
		 * @param label
		 */
		setDropdownLabel: function(dropdown, label) {
			var trigger = dropdown.children('a.dropdown-toggle').find('> span');
			trigger.html(label);
		},
		/**
		 * enable/disable dropdown
		 * @param dropdown
		 * @param {bool} disable - if true disables dropdown functionality
		 */
		toggleDropdown: function(dropdown, disable) {
			var trigger = dropdown.children('a.dropdown-toggle');

			if(disable === true){
				trigger.addClass(m.CLASS_DISABLED);
				//change visibility
			} else {
				trigger.removeClass(m.CLASS_DISABLED);
			}
		},
		/**
		 * Reset summary list either completely or from a specific step
		 * @param step	Optional specific step to reset from
		 */
		resetSummary: function(step) {
			if (step) {
				// Reset from specific step
				var options = m.summaryList.find('li');
				var index = step - 1;
				for (var i = options.length - 2; i >= index ; i--) {
					var nextOption = options.eq(i);
					if (nextOption.length > 0) {
						nextOption.remove();
					}
				}
			} else {
				// Reset all summary
				m.summaryList.empty();
			}
		},
		/**
		 * Handle end steps of the configuration process
		 */
		finalize: function() {
			if (m.isTrackingEnabled) {
				var extraData = {
					configuration:{
						type: m.workflowName,
						modelid: m.jsonData.code,
						carid: m.selectedSteps.grades.carId + '_' + T1.settings.country + T1.settings.language,
						extcolorid: m.jsonData.modelId + '_' + m.selectedSteps.colours.id + '_' + T1.settings.country + T1.settings.language
					}
				};
				PubSub.publish(T1.constants.STATS_TRACK, {node: m.summary, extraData: extraData});
			}
			// Common end steps
			m.isFinalized = true;
			m.showResultImage();
			m.showPrices();
			m.resetCarCode();

			// handle the finance data
			m.loadConfigFinanceData();

			m.showEcoLabels();

			// Desktop specific end steps
			if (!m.isMobile) {
				// Hide dropdowns
				m.hideDropdownsWrapper();
				// Show styled options
				m.showNiceOptions();
				// Show action buttons
				m.showActions();
				// Show Dynamic CTA
				m.showCTA();
			}

			try {
				// end event
				PubSub.publish(m.isMobile ? T1.constants.CARCONFIG_MINI_END : T1.constants.CARCONFIG_END, {
					modelId: m.jsonData.modelId,
					carId: m.selectedSteps.grades.carId,
					colourId: m.selectedSteps.colours.id
				});
			} catch(e) {
				console.log(e.message);
			}
		},
		/*
		* load finance data for current config
		* */
		loadConfigFinanceData: function() {
			if(m.isFinalized) {
				m.hideFinance();
				m.createConfigObj();
				m.handleFinanceData();
			}
		},
		/**
		 * Request the car code for the mobile version.
		 * Desktop version is done via STORED_CAR event
		 * No mytoyota for the mobile version -> no STORED_CAR event
		 */
		requestCarCode: function(event, data) {
			T1.myToyota.requestCarInfo(
				data,
				m.setCarCode,
				function(jqXHR, status, error) {
					console.log(status + ': ' + error);
					m.resetCarCode();
			});
		},
		/**
		 * creates a config object of the created configuration (this object will be passed to the TFS services)
		 */
		createConfigObj: function(){
			try {
				m.configObj = m.selectedSteps.grades.config;
				m.configObj.ExteriorColourID = m.selectedSteps.colours.id;
			} catch(e) {
				console.log(e.message);
			}
		},
		showResultImage: function(modelId, carId, colourCode) {
			if (!m.imageResult.data('orig')) {
				m.imageResult.data('orig', m.imageResult.attr('src'));
			}
			var url = m.getResultImageUrl(modelId, carId, colourCode);
			if(url){
				m.imageResult.attr('src', url);
			}
		},
		getResultImageUrl: function(modelId, carId, colourCode) {
			var url = T1.settings.CCISHost + T1.constants.URL_MINI_CARCONFIG_IMG,
				model = modelId || m.jsonData.modelId,
				carid = carId || m.selectedSteps.grades.carId,
				colour = colourCode || m.selectedSteps.colours.code;

			if(! carid) return;
			console.log('------------' + url);

		//	url = url.replace(/\[LANG\]/g, T1.settings.country);
			url = url.replace(/\[MODEL\]/g, model);
			url = url.replace(/\[GRADE\]/g, carid);
			url = url.replace(/\[COLOUR\]/g, colour);

			return url;
		},
		hideResultImage: function() {
			m.imageResult.attr('src', m.imageResult.data('orig'));
		},
		showPrices: function(priceCar, priceColour) {
			try {
				// Car price
				var carPrice = (typeof priceCar==="number") ? priceCar : parseInt(m.selectedSteps.grades.price.listWithDiscount, 10),
				// Color price
					colorPrice = (typeof priceColour==="number") ? priceColour : parseInt(m.selectedSteps.colours.price.listWithDiscount, 10),
					colorCell = m.priceTable.find('.color td:nth-child(2)');

				if (isNaN(colorPrice)) {
					colorPrice = 0;
				}
				var totalPrice = carPrice + colorPrice;

				console.log('price=' + totalPrice);

				colorCell.text(globalize.format(colorPrice, 'c'));
				// Total price

				m.priceTable.find('.price td:nth-child(2)').text(globalize.format(carPrice, 'c'));
				m.priceTable.find('.price-total td:nth-child(2)').text(globalize.format(totalPrice, 'c'));
				// Display
				m.priceTable.show();
			} catch(e) {
				console.log(e.message);
			}
		},
		/**
		 * Adds the carcode at the bottom of to the prices table
		 */
		setCarCode: function(data){
			if(m.isFinalized) {
				try {
					// Car code
					if( data && data.code !== null && data.code !== undefined ){
						m.priceTable.find('.code td:nth-child(2)').text(globalize.format(data.code, 'c'));
						m.priceTable.find('.code').show();
						m.configBtn.attr('href', '#' + T1.constants.URL_CAR_CONFIG_OVERLAYER + 'tyCode=' + globalize.format(data.code, 'c')).show();
						m.myToyotaButton.attr('data-car-config-code', globalize.format(data.code, 'c')).show().css('display', 'inline-block');
					}
					else {
						m.resetCarCode();
					}
				} catch (err) {
					console.log(err.message);
				}
			}
		},
		/**
		 * reset the car code (will be hidden)
		 */
		resetCarCode: function() {
			m.priceTable.find('.code td:nth-child(2)').empty();
			m.priceTable.find('.code').hide();
			if(m.configBtn){
				m.configBtn.removeAttr('href').hide();
			}
			if(m.myToyotaButton) {
				m.myToyotaButton.removeAttr('data-car-config-code').hide();
			}
		},
		/**
		 * run the finace service (use yql while waiting for the right headers @ t1-dev-proxy
		 */
		handleFinanceData: function() {
			if(T1.settings.carconfigMini.showMonthlyRateMiniConfig === 'true' && T1.financeRates.enabled()) {
				T1.financeService.requestFinanceData({
					configs: m.configObj,
					success: m.showFinance,
					source: 'MiniCarConfig'
				});
			}
		},
		/**
		 * hide all finance information from the minicarconfig
		 */
		hideFinance: function(){
			var financePrice = m.miniConfig.find('.price-monthly'),
				financeRates = m.miniConfig.find('.finance-rates'),
				financeQuote = m.miniConfig.find('.finance-quote');

			financePrice.removeClass('visible').addClass('hidden');
			financeRates.removeClass('visible').addClass('hidden');
			financeQuote.removeClass('visible').addClass('hidden');
			financePrice.find('.price-monthly-value').empty();
			financeRates.find('.finance-rates-value').empty();
			financeQuote.empty();
			if(m.financeBtn){
				m.financeBtn.removeClass('visible').addClass('hidden');
			}
		},
		/**
		 * Display "Finance your Toyota" button
		 */
		showFinance: function(data) {
			if(data.error) {
				console.log(data.message);
				return;
			}

			if(m.isFinalized) {
				var availability = data.show || ((data.query && data.query.results) ? data.query.results.json : null) || data || {},
					financePrice = m.miniConfig.find('.price-monthly'),
					financeQuote = m.miniConfig.find('.finance-quote'),
					financeRates = m.miniConfig.find('.finance-rates'),
					settings = T1.settings.carconfigMini;

				try {
					// show the rates
					if (availability.miniccRate) {
						//show the monthly price
						if (data.rate.monthlyPayment) {
							financePrice.find('.price-monthly-value').html(data.rate.monthlyPayment.formatted);
							financePrice.addClass('visible').removeClass('hidden');
						}

						// show the price rate(s)
						var rates = T1.financeService.formatFinanceString(
							T1.labels.carconfigMini.priceRates,
							data.rate,
							data.show);
						if(rates) {
							financeRates.find('.finance-rates-value').html(rates);
							financeRates.addClass('visible').removeClass('hidden');
						}
					}

					//show the disclaimer
					if(data.show && (data.show.miniccRate || data.show.miniccFinance)) {
						var labelDisclaimer = T1.labels.viewFinanceDisclaimer || T1.labels.viewDisclaimer,
							title = data.rate.productName ? data.rate.productName.formatted : labelDisclaimer,
							disclaimer = T1.financeService.getDisclaimer(
							data.rate,
							true,
							T1.settings.carconfigMini.showFinanceDisclaimerInOverlayMiniConfig === 'true' ? title : null);

						if(disclaimer) {
							// ovl
							if(T1.settings.carconfigMini.showFinanceDisclaimerInOverlayMiniConfig === 'true') {
								financeRates.find('.finance-rates-value').append($('<a href="#" class="readMore"/>').
									html(labelDisclaimer).attr('data-tooltip-selector', '#miniCCDisclaimer'));
								financeRates.find('#miniCCDisclaimer .expansion-inner').empty().append(disclaimer);
								financeRates.addClass('visible').removeClass('hidden');
							}
							// inline
							else {
								financeQuote.html(disclaimer);
								financeQuote.addClass('visible').removeClass('hidden');
							}
						}
					}

					// finance button
					if (settings.showFinanceButtonMiniConfig && availability.miniccFinance) {
						m.financeBtn.addClass('visible').removeClass('hidden');

						// chrome bug fix
						m.financeBtn.parent().hide();
						m.financeBtn.parent().fadeIn();
					}

					// insurance button
					if (settings.showInsuranceButtonMiniConfig && availability.miniccInsurance) {
						m.btnInsurance.addClass('visible').removeClass('hidden');

						// chrome bug fix
						m.btnInsurance.parent().hide();
						m.btnInsurance.parent().fadeIn();
					}
				}catch(e){
					console.log('error showing finance information ' + e);
				}
			}
		},
		/**
		 * posts the configuration to the finance service + redirects to the fincance page.
		 */
		postFinanceData: function(e){
			e.preventDefault();
			try {
				PubSub.publish(T1.constants.FINANCE_EXTERNAL_POST_REQUEST, m.configObj);
			} catch (error) {
				console.log('Error while trying to open the finance link ' + error);
			}
		},
		postInsuranceData: function(e){
			e.preventDefault();
			try {
				PubSub.publish(T1.constants.INSURANCE_EXTERNAL_POST_REQUEST, m.configObj);
			} catch (error) {
				console.log('Insurance link error: ' + error);
			}
		},
		showNiceOptions: function() {
			var options = m.getNiceOptions();
			m.niceSummary.html(options);
			m.niceSummary.append('<div class="bg-gradient"><img src="/assets/images/carconfig-mini-gradient.png"/></div>');
			m.niceSummary.show();
		},
		getNiceOptions: function() {
			var formatedOptions = '';
			m.summaryList.find('li').each(function(i,item) {
				var optionText = $(this).clone().children().remove().end().text();
				// Comma
				if ((i !== 0) && (i !== 2)) {
					formatedOptions += ', ';
				}
				// Title tag begin: first 2 items in bold
				if (i === 0) {

					formatedOptions += '<h3>';
				}
				// Text
				formatedOptions += optionText;
				// Title tag end: first 2 items in bold
				if (i === 1) {
					formatedOptions += '</h3>';
				}
			});
			return formatedOptions;
		},
		hideNiceOptions: function() {
			if (m.niceSummary){
				m.niceSummary.hide();
				m.niceSummary.html();
			}
		},
		showActions: function() {
			// More about button
			if (m.preSelectedLink.length > 0) {
				// Don't show when model preselected (on car chapter page)
				m.btnMoreAbout.hide();
			} else {
				// Using first summary value instead of directly accessing m.selectedSteps.grades.carName because of too long text
				var carName = m.summaryList.find('li').eq(0).clone().children().remove().end().text();
				m.btnMoreAbout.text(T1.labels.moreAbout + ' ' + carName);
				var modelPageURL = m.jsonData.links.CarChapter;
				m.btnMoreAbout.attr('href',modelPageURL);
				m.btnMoreAbout.show();
			}
			m.actionsWrapper.show();
		},
		hideActions: function() {
			if (m.actionsWrapper){
				m.actionsWrapper.hide();
				m.btnMoreAbout.text('');
			}
		},
		showCTA: function() {
			m.cta.show();
		},
		hideCTA: function() {
			if (m.cta){
				m.cta.hide();
			}
		},
		showEcoLabels: function() {
			try {
				var energy = m.selectedSteps.grades.energy;
				var ecoLabel = (energy && T1.settings.useEcoLabels === "true") ? energy.value.toLowerCase() : false;
				if (ecoLabel) {
					// Texts
					m.ecoLabelsTitle.html(T1.settings.ecoLabel.title);
					m.ecoLabelsSubtitle.html(T1.settings.ecoLabel.intro);
					m.ecoLabelsDisclaimer.html(T1.settings.ecoLabel.disclaimer);
					m.ecoLabelsSpecsCondition.html(T1.settings.ecoLabel.specsCondition);
					// Image
					ecoLabel = ecoLabel.replace(/\+/g,'Plus');
					var imagesObj = T1.settings.ecoLabel.images;
					var carConfigEcoImageUrl = '';
					for (var imageProp in imagesObj) {
						if (imagesObj.hasOwnProperty((imageProp))) {
							if (imageProp === ecoLabel) {
								carConfigEcoImageUrl = imagesObj[imageProp];
								break;
							}
						}
					}
					m.ecoLabelsImage.attr('src',carConfigEcoImageUrl);
					// Table
					for (var prop in energy) {
						// important check that this is objects own property
						// not from prototype prop inherited
						if(energy.hasOwnProperty(prop)){
							if (energy[prop] !== ecoLabel) {
								var rowLabel = energy[prop].name;
								var rowValue = energy[prop].value;
								var rowUnit = energy[prop].unit;
								if (rowUnit && rowValue) {
									var row = $('<tr/>');
									var td1 = $('<td/>');
									td1.text(rowLabel);
									var td2 = $('<td/>');
									td2.text(rowValue + ' ' + rowUnit);
									row.append(td1);
									row.append(td2);
									m.ecoLabelsTable.find('tbody').prepend(row);
								}
							}
						}
					}
					// Display
					m.ecoLabels.show();
				}
			} catch(e) {
				console.log(e.message);
			}
		},
		hideEcoLabels: function() {
			// Empty table but last row
			m.ecoLabelsTable.find('tr').not(':last').remove();
			// Hide
			m.ecoLabels.hide();
		},
		ecoLabelsDisplay: function(isAdding) {
			if (isAdding) {
				m.ecoLabels.addClass(m.CLASS_HIDDEN_XS);
			} else {
				m.ecoLabels.removeClass(m.CLASS_HIDDEN_XS);
			}
		}
	};
	var m = _private;
	return {
		init: _private.init,
		initMobile: _private.initMobile,
		initDesktop: _private.initDesktop,
		switchMobile: _private.switchMobile,
		switchDesktop: _private.switchDesktop,
		showFinance: _private.showFinance
	};
}());
