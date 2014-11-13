var T1 = T1 || {};

T1.mobile = (function(){
	'use strict';

	var _private = {
		currentBreakpoint: '',
		isPageInit: true,
		initializedMobile: false,
		initializedDesktop: false,
		initializeMobileFnName: 'initMobile',
		initializeDesktopFnName: 'initDesktop',
		switchMobileFnName: 'switchMobile',
		switchDesktopFnName: 'switchDesktop',
		lastOpenedMobileSection: null,

		init: function(){
			var m = _private;
			PubSub.subscribe(T1.constants.MOBILE_OPEN, m.openMobile);
			PubSub.subscribe(T1.constants.ON_BREAKPOINT_CHANGE, m.breakpointChange);
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_REOPEN_MAINCONTENT, m.hideMobilePane);
		},

		/**
		 * run on breakpoint changes or initializes
		 * @param evName (String) name of the event which fires of the function
		 * @param breakpoint (String) name of the current breakpoint
		 */
		breakpointChange: function(evName, breakpoint){
			var m = _private;
			//only initialize or switch when the breakpoint switches between xs <-> all other breakpoints || on init
			if(breakpoint==='xs' || m.currentBreakpoint==='xs' || m.currentBreakpoint===''){
				m.currentBreakpoint = breakpoint;
				//check the current breakpoint (MOBILE or TABLET/DESKTOP)
				if(breakpoint==='xs'){
					//initialize mobile
					if(!m.initializedMobile){
						m.runFn(m.initializeMobileFnName);
						m.initializedMobile = true;
						PubSub.publish(T1.constants.MODE_INIT_MOBILE, {});
					}
					m.runFn(m.switchMobileFnName);
					PubSub.publish(T1.constants.MODE_SWITCH_MOBILE, {});
				}else{
					//initialize tablet & desktop
					if(!m.initializedDesktop){
						m.runFn(m.initializeDesktopFnName);
						m.initializedDesktop = true;
						PubSub.publish(T1.constants.MODE_INIT_DESKTOP, {});
					}
					m.runFn(m.switchDesktopFnName);
					PubSub.publish(T1.constants.MODE_SWITCH_DESKTOP, {});
				}
				//init mobile/init desktop are the last initialisation runs on a page; fire the page initialized event when done (after the first run)
				if(m.isPageInit){
					m.isPageInit = false;
					PubSub.publish(T1.constants.PAGE_INITIALIZED, {mode: m.initializedDesktop ? 'desktop' : 'mobile'});
				}
			}
		},

		/**
		 * calls a certain function in all modules
		 * @param fnName (String) name of the function that needs to run in all modules
		 */
		runFn: function(fnName){
			for (var sKey in T1) {
				if (T1[sKey][fnName]) {
					try {
						//console.log(fnName + ' ' + sKey);
						T1[sKey][fnName]();
					}
					catch (e) {
						console.log('Error running ' + fnName + ' ' + sKey + ': ' + e);
					}
				}
			}
		},

		/**
		 * Opens the mobile links
		 * @param evt (String) event name (provided by pubsub)
		 * @param data (Object) {
		 *     id: (String) sectionid of the element that should be shown in the overlayer,
		 *     section: (Object) the object containing a section (this can be used in stead of the section id
		 * }
		 */
		openMobile: function(evt, data){
			if(!data) return;
			var m = _private,
				section = data.id ? $('#' + data.id) : data.section;
			//apply extra parameter to the section if provided
			section.removeAttr("data-extended-param");
			if (data.param) {
				section.attr("data-extended-param", data.param);
			}
			//replace hidden-xs class with visible-xs
			if (section.length === 0) {
				return;
			}
			//open the overlayer
			PubSub.publishSync(T1.constants.PAGEOVERLAYER_OPEN, {'html':section, 'inPage': true, 'preserveContent': true, 'styleClass':'white', 'noResize':true, 'fitImages':false, 'noTransitions':true});
			//show sections
			section.prop('className', section.prop('className').replace(/hidden-xs/g,'visible-xs'));
			//update the navigation breadcrumb
			PubSub.publish(T1.constants.NAVIGATION_ADD_BREADCRUMB_LINK, {name: section.data('section-title'), url: location.href});
			//keep the last opened mobile section in memory
			m.lastOpenedMobileSection = section;
			//trigger all resize function
			PubSub.publish(T1.constants.ON_WIN_RESIZE, {});
		},

		/**
		 * hide the opened mobile pane
		 */
		hideMobilePane: function(evName){
			var m = _private;
			if(m.lastOpenedMobileSection){
				//update the navigation breadcrumb
				PubSub.publish(T1.constants.NAVIGATION_REMOVE_BREADCRUMB_LINK, {});
				//restore the maincontent
				m.lastOpenedMobileSection.prop('className', m.lastOpenedMobileSection.prop('className').replace(/visible-xs/g,'hidden-xs'));
				m.lastOpenedMobileSection = null;
			}
		}

	};

	return {
		init: _private.init
	};

}());
