var T1 = T1 || {};

/**
 * tabs script
 * version 0.1
 * KGH: init
 */
T1.tabs = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		currentTabs: null,
		currentTabContent: null,
		/**
		 * initialize
		 * @returns null
		 */
		init: function(){
			PubSub.subscribe(T1.constants.TABS_SWITCH, _private.setTabActive);
		},
		initDesktop: function() {
			var m = _private,
				c = T1.constants;

			// overlayer tabs
			PubSub.subscribe(c.PAGEOVERLAYER_LOAD, m.initOnDemand);

			// in-page tabs
			m.initOnDemand();
		},
		initMobile: function() {
			_private.initOnDemand();
		},
		initOnDemand: function(evName, data) {
			if(!data) data = {};
			var m = _private,
				c = T1.constants,
				tabContainers = data.el ? $(data.el).find('.toyota-tabs') : $('.toyota-tabs');

			tabContainers.each(m.initTabGroup);

			PubSub.publish(c.TABS_LOAD);
		},
		/**
		 * init one tab group (in case of multiple groups on page)
		 */
		initTabGroup: function() {
			var m = _private,
				request = T1.request,
				container = $(this);

			m.currentTabs = container.find('.toyota-tabs-select a[data-tab]');
			m.currentTabContent = container.find('.toyota-tabs-content');

			m.setTabEvents();

			if (!request) {
				return;
			}

			var activeTabId = request.getQueryStringParameter('tab');

			if (activeTabId && activeTabId.length > 0) {
				PubSub.publish(T1.constants.TABS_SWITCH, activeTabId);
			}
		},
		/**
		 * checks if the current tabs are still the active one; if not, reset the module variables
		 * @param element (domnode / jquery object) any clicked tab-button in container / any element within container toyota-tabs-select
		 */
		setTabComponentActive: function(element){
			if(!element) return;
			var m = _private,
				$el = $(element),
				tabsComponent = $el.closest('.toyota-tabs-content'),
				tabsParent = null;
			if(! tabsComponent.hasClass('active')){
				tabsParent = tabsComponent.parent();
				// set not tabs active
				$('.toyota-tabs-content').removeClass('active');
				tabsComponent.addClass('active');
				// query all module variables
				m.currentTabs = tabsParent.find('.toyota-tabs-select a[data-tab]');
				m.currentTabContent = tabsParent.find('.toyota-tabs-content');
			}
		},
		/**
		 * set events for tab group in container
		 * @param container: the tab group container
		 */
		setTabEvents: function() {
			var m = _private;

			m.currentTabs.on('click', m.switchTab);
		},

		/**
		 * tab selection handler
		 * @param e
		 */
		switchTab: function(e) {
			var activeTabId;

			if (typeof(e) === 'object') {
				e.preventDefault();

				activeTabId = $(e.target).data('tab');
			} else {
				activeTabId = e;
			}

			PubSub.publish(T1.constants.TABS_SWITCH, activeTabId);
		},
		/**
		 * set tab active by id
		 * @param tabId
		 */
		setTabActive: function(evName, tabId) {
			var m = _private,
				c = T1.constants,
				tabPane = $('#' + tabId);

			//set the active tab component
			m.setTabComponentActive(tabPane);

			//set the active tab
			var tab = m.currentTabs.filter('a[data-tab="' + tabId + '"]');
			m.resetAll();
			tab.addClass(c.CLASS_ACTIVE);
			tabPane.addClass(c.CLASS_ACTIVE);
		},
		/**
		 * set tabpane active and show content
		 * @param msg
		 * @param tabContent
		 */
		setTabContent: function(msg, tabContent) {
			var m = _private,
				c = T1.constants,
				activeTabPane = m.currentTabContent.find('.tab-pane.active');

			if (!tabContent.hasClass(c.CLASS_ACTIVE)) {
				tabContent.addClass(c.CLASS_ACTIVE);
			}
			activeTabPane.replaceWith(tabContent);

			PubSub.unsubscribe(m.setTabContent);
		},
		/**
		 * deactivate
		 */
		resetItem: function() {
			var item = $(this);

			item.removeClass('active');
		},
		/**
		 * deactivate all
		 */
		resetAll: function() {
			var m = _private;

			m.currentTabs.each(m.resetItem);
			m.currentTabContent.find('.tab-pane').each(m.resetItem);
		}
	};
	return {
		init: _private.init,
		initDesktop: _private.initDesktop,
		initMobile: _private.initMobile,
		setTabActive: _private.setTabActive,
		setTabContent: _private.setTabContent
	};
}());