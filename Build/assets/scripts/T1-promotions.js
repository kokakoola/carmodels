var T1 = T1 || {};

/**
 * Promotions overview component (filter cars by model, offer and type (standard or hybrid)
 */
T1.promotions = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		FILTER_MODEL: 'model',
		FILTER_OFFER: 'offer',
		FILTER_TYPE: 'type',
		LABEL_HYBRID: 'hybrid',
		LABEL_NON_HYBRID: 'standard',
		CLASS_HYBRID: 'active',
		CLASS_ACTIVE_SELECT: 'select',
		CLASS_EXPANDED: 'open',
		CLASS_CLEAR: 'clear',
		isRefreshable: true,
		mustCheck: false,
		/**
		 * Holds jQuery/DOM references
		 * Binds events to all buttons
		 */
		init: function () {
			//test to be removed later
			PubSub.subscribe(T1.constants.ON_BREAKPOINT_CHANGE, function(evName, bp){
				var constantName = "";
				switch(bp){
					case 'xs': constantName = "SCREEN_XTRASMALL"; break;
					case 'sm': constantName = "SCREEN_SMALL"; break;
					case 'md': constantName = "SCREEN_MEDIUM"; break;
					case 'lg': constantName = "SCREEN_LARGE";
				}
				$('.offer-header > img').attr('width', T1.constants[constantName]);
			});
			// end test

			m.container = $('.promotions');
			if (m.container.length > 0){
				// jQuery/DOM references
				// filterable
				m.filterableWrapper = m.container.find('.filterable-wrapper');
				m.filterable = m.filterableWrapper.find('.filterable');
				// Checkboxes
				m.checkBoxes = m.container.find('input[type="checkbox"]');
				m.checkBoxModels = m.checkBoxes.not('.select-all');
				m.checkBoxAll = m.checkBoxes.filter('.select-all');
				// Radio buttons
				m.radios = m.container.find('input[type="radio"]');
				// Type (all - hybrid) button
				m.typeButton = m.container.find('.btn-type-toggle');
				// Type all button (mobile only)
				m.typeAllButton = m.container.find('.btn-type-all');
				// Type hybrid button (mobile only)
				m.typeHybridButton = m.container.find('.btn-type-hybrid');
				// Select/Deselect all button
				m.toggleAllModelsButton = m.container.find('.btn-select-all');
				// Reset button
				m.resetButton = m.container.find('.btn-reset');
				// Collapse button
				m.collapseButton = m.container.find('.btn-circle');
				// Type filter wrapper
				m.typeFilter = m.container.find('.filter-wrapper-type');

				// Events binding
				m.setModelBinding();
				m.setOfferBinding();
				m.setTypeBinding();
				m.setAllModelsFiltering();
				m.setResetFiltering();

				//Initial refresh for clearing filterable
				m.clearFloatDisplay();
			}
		},
		/**
		 * Called when tablet or desktop breakpoints are reached
		 */
		switchDesktop: function() {
			// Necessary check in case the init function was not entirely run => we are on another page than the promotions one
			if (m.container.length > 0){
				// Be sure no height is defined (bug that could happen when coming from Mobile breakpoint when this element is collapsed)
				if (m.typeFilter.height() != 'auto') {
					m.typeFilter.css('height','auto');
				}
			}
		},
		/**
		 * Checkboxes change event binding
		 */
		setModelBinding: function() {
			m.checkBoxModels.on('change', m.refreshDisplay);
			m.checkBoxAll.on('change', m.showAll);
		},
		/**
		 * show all offers
		 */
		showAll: function(){
			m.refreshDisplay({models:[]});
		},
		/**
		 * Radio buttons change event binding
		 */
		setOfferBinding: function() {
			m.radios.on('change', m.radioChange);
			m.collapseButton.on('click', m.offerCollapse);
		},
		/**
		 * refresh display on radio buttons change
		 */
		radioChange:function(){
			//IE8 fix
			this.checked = true;
			//refresh the display
			m.refreshDisplay();
		},
		/**
		 * Type button click event binding
		 */
		setTypeBinding: function() {
			m.typeButton.on('click', function() {
				m.toggleTypeButton();
				m.refreshDisplay();
			});
			// Mobile
			var buttons = m.typeAllButton.add(m.typeHybridButton);
			buttons.on('click', function() {
				m.toggleTypeAllHybridButton($(this));
				m.refreshDisplay();
			});
		},
		/**
		 * Select/Deselect all click event binding
		 */
		setAllModelsFiltering: function() {
			m.toggleAllModelsButton.on('click', m.toggleAllModels);
		},
		/**
		 * Reset button click event binding
		 */
		setResetFiltering: function() {
			m.resetButton.on('click', m.resetFiltering);
		},
		/**
		 * Filter cars based on all filters: model, offer and type
		 */
		refreshDisplay: function(data) {
			if(! data) data = {};
			if (m.isRefreshable) {
				// Get filter values
				var modelList = data.models || m.getModel(),
					offer = m.getOffer(),
					type = m.getType() || m.LABEL_NON_HYBRID,
					hasMinOneModelVisible = false, // filter display
					filterableItem = null,
					isModelIncluded = null,
					showAll = modelList.length===0;
				m.filterable.each(function() {
					filterableItem = $(this);
					// Remove clearing
					filterableItem.removeClass(m.CLASS_CLEAR);
					// Check for model inclusion
					isModelIncluded = showAll || m.isModelIncluded(filterableItem.data(m.FILTER_MODEL), modelList);
					// Match all conditions for display
					if (isModelIncluded && (filterableItem.data(m.FILTER_OFFER) === offer || offer === 'all') && (type == m.LABEL_NON_HYBRID || filterableItem.data(m.FILTER_TYPE) === type)) {
						filterableItem.show();
						hasMinOneModelVisible = true;
					} else {
						filterableItem.hide();
					}
				});
				// Models container display
				if (hasMinOneModelVisible === true) {
					m.filterableWrapper.show();
					m.clearFloatDisplay();
				} else {
					m.filterableWrapper.hide();
				}
			}
		},
		/**
		 * checks if a promotion should be filtered or not
		 * @param filters
		 * @param modelList
		 * @returns {boolean}
		 */
		isModelIncluded: function(filters, modelList){
			if(! filters) return true;
			var filterArr = filters.replace(/\s/g,'').split(',');
			for(var iModel=0; iModel < modelList.length; iModel++){
				for(var iFilter=0; iFilter < filterArr.length; iFilter++){
					if(modelList[iModel] && filterArr[iFilter] && modelList[iModel].toLowerCase()===filterArr[iFilter].toLowerCase()) return true;
				}
			}
			return false;
		},
		/**
		 * Clear every 2 filterable items for proper 2 columns display
		 */
		clearFloatDisplay: function() {
			var visibleFilterables = m.filterable.filter(':visible');
			visibleFilterables.each(function(i,item) {
				if (i%2 === 0) {
					$(this).addClass(m.CLASS_CLEAR);
				}
			});
		},
		offerCollapse: function() {
			$(this).toggleClass(m.CLASS_EXPANDED);
		},
		/**
		 * Return the list of models based on checked checkboxes
		 * @returns {Array} List of models (strings)
		 */
		getModel: function() {
			var modelList = [];
			m.checkBoxes.each(function() {
				if ($(this).is(':checked')) {
					modelList.push($(this).data(m.FILTER_MODEL));
				}
			});
			return modelList;
		},
		/**
		 * Return the offer type based on the checked radio button
		 * @returns {string} The offer type
		 */
		getOffer: function() {
			var checkedValue = '';
			m.radios.each(function () {
				if ($(this).is(':checked')) {
					checkedValue = $(this).val();
					return false;
				}
			});
			return checkedValue;
		},
		/**
		 * Return the car type (standard or hybrid)
		 * @returns {string} The car type
		 */
		getType: function() {
			var targetButton,
				type = null;
			if (m.typeButton.is(':visible')) {
				targetButton = m.typeButton;
			} else {
				m.typeHybridButton.each(function(i,item) {
					if ($(this).is(':visible')) {
						targetButton = $(this);
						return false;
					}
				});
			}
			if(targetButton) type = (targetButton.hasClass(m.CLASS_HYBRID)) ? m.LABEL_HYBRID : m.LABEL_NON_HYBRID;
			return type;
		},
		/**
		 * Switch Type button state
		 */
		toggleTypeButton: function() {
			var button = m.typeButton,
				buttonText = '';
			button.toggleClass(m.CLASS_HYBRID);
			if (button.hasClass(m.CLASS_HYBRID)) {
				buttonText = T1.labels.viewAllModels;
				button.addClass("btn-grey").removeClass("btn-blue");
			} else {
				buttonText = T1.labels.viewOnlyHybridModels;
				button.addClass("btn-blue").removeClass("btn-grey");
			}
			button.text(buttonText);
		},
		/**
		 * Switch Type all and Type Hybrid buttons state (mobile)
		 * @param button Clicked button (Type all or Type Hybrid)
		 */
		toggleTypeAllHybridButton: function(button) {
			if (!button.hasClass(m.CLASS_HYBRID)) {
				var otherButton = (button.is(m.typeAllButton)) ? m.typeHybridButton : m.typeAllButton;
				button.toggleClass(m.CLASS_HYBRID);
				otherButton.toggleClass(m.CLASS_HYBRID);
			}
		},
		/**
		 * Either select or deselect all checkboxes
		 * Switch Select/Deselect all button state
		 * @param e Click event from Select/Deselect all button, can be missing when called from Reset button
		 */
		toggleAllModels: function(e) {
			if (e) {
				e.preventDefault();
			}
			// Temporary disable display refresh for performance
			m.isRefreshable = false;
			// Checkboxes selection
			var button = m.toggleAllModelsButton,
				doCheck = (m.mustCheck === true || button.hasClass(m.CLASS_ACTIVE_SELECT)) ? true : false;
			m.checkBoxes.each(function() {
				// Only unchecking if already checked OR checking if not already checked
				if ((!doCheck && $(this).is(':checked')) || (doCheck && !$(this).is(':checked'))) {
					$(this).prop('checked', doCheck).trigger('change');
				}
			});
			// Update button text and state (except when called from Reset button AND, at the same time, the toggleAllModelsButton button is already in "Deselect all" state)
			if (!(m.mustCheck === true && !button.hasClass(m.CLASS_ACTIVE_SELECT))) {
				var buttonText = '';
				if (button.hasClass(m.CLASS_ACTIVE_SELECT)) {
					buttonText = T1.labels.deselectAll;
				} else {
					buttonText = T1.labels.selectAll;
				}
				button.text(buttonText);
				button.toggleClass(m.CLASS_ACTIVE_SELECT);
				// Ok for display
				m.isRefreshable = true;
				m.refreshDisplay();
			}
		},
		/**
		 * Reset all filters to default state and update cars display
		 * @param e Click event from Reset button
		 */
		resetFiltering: function(e) {
			e.preventDefault();
			// Temporary disable display refresh for performance
			m.isRefreshable = false;
			// Force checkboxes to be checked
			m.mustCheck  = true;
			m.toggleAllModels();
			// Disable force checking flag
			m.mustCheck  = false;
			m.resetOfferFilter();
			m.resetTypeFilter();
			// Ok for display
			m.isRefreshable = true;
			m.refreshDisplay();
		},
		/**
		 * Reset offer filter to default state
		 */
		resetOfferFilter: function() {
			// Uncheck all but first radio button.
			m.radios.not(':first').prop('checked', false).trigger('change');
			m.radios.eq(0).prop('checked', true).trigger('change');
		},
		/**
		 * Reset Type filter to default state
		 */
		resetTypeFilter: function() {
			if (m.typeButton.hasClass(m.CLASS_HYBRID)) {
				m.toggleTypeButton();
			}
		}
	};
	var m = _private;
	return {
		init: _private.init,
		switchDesktop: _private.switchDesktop
	};
}());