var T1 = T1 || {};
/**
 * statistics tracking
 * version 0.3
 * KGH: update object traversal
 */
T1.statistics = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		// holds section scrollTracked section keys
		statsTracked : [],
		// holds current data to track
		currentObject : {},
		// holds a copy of the base object
		base : {},
		ignoreBtTags: '%track%scroll%collapse%state%',
		settings: {},
		scrollingElements : null,
		brightTagPrefix: 'bt',

		init: function() {
			var m = _private,
				c = T1.constants;

			if (window.t1DataLayer) {
				m.settings = window.t1DataLayer.settings || {};

				//manipulate the base info
				m.updateBaseObject();

				// fetch the base tracking object
				m.base = m.extendObject({}, window.t1DataLayer);

				//update cta elements
				m.updateCTAElements();

				//enable link tracking after the page is initialized (after T1 init, initDesktop, initMobile) => this way all events will be covered
				$('body').on('click', '[data-bt-track]', m.trackLinkData);

				//enable menu tracking (stop propagation issue)
				//$('.dropdown-menu').find('[data-bt-track]').on('click', m.trackLinkData);

				//enable scroll tracking
				if(m.settings.trackScroll){
					PubSub.subscribe(c.STATS_TRACK_SECTIONSCROLL, m.trackScroll);
					PubSub.publish(c.SCROLL_TRACK_ADD, {elements: $('[data-bt-scroll]'), options:{once:true, event:c.STATS_TRACK_SECTIONSCROLL, threshold:'-25%'}});
				}

				//subscribe a brighttag event to send data directly to brighttagging
				PubSub.subscribe(c.STATS_TRACK, m.track);

				//enable carousel tracking
				PubSub.subscribe(c.STATS_TRACK_CAROUSEL, m.trackCarousel);

				//track my toyota event
				PubSub.subscribe(c.MY_TOYOTA_STORED_CAR, m.trackMyToyotaEvents); //store car

				//track galleryscroll
				PubSub.subscribe(c.GALLERY_SCROLL, m.trackGalleryScroll);

				//track share
				PubSub.subscribe(c.SOCIAL_SHARED, m.trackShare);

				//track form loading
				PubSub.subscribe(c.FORM_LOAD, m.trackFormLoad);

				PubSub.subscribe(c.MY_TOYOTA_TAB_SWITCH, m.trackMyToyotaTabSwitch);
				PubSub.subscribe(c.MY_TOYOTA_SAVED_CAR, m.trackMyToyotaSavedCar);
				PubSub.subscribe(c.FORM_VALIDATION_FAILED, m.trackFormValidationFailed);
				PubSub.subscribe(c.SUBMIT_FORM_RETURN, m.trackSubmitFormReturn);
				PubSub.subscribe(c.MY_TOYOTA_CAR_ALREADY_SAVED, m.trackMyToyotaCarAlreadySaved);
				PubSub.subscribe(c.SEARCH, m.trackSearch);
				PubSub.subscribe(c.TABS_SWITCH, m.trackTabsSwitch);



			}
		},

		/**
		 * updates the userinfo/initial hash/platform
		 */
		updateBaseObject: function(){
			var dataLayer = window.t1DataLayer;
			if (dataLayer) {
				var c = T1.constants,
					href = location.href;
				if (!dataLayer.userinfo) {
					dataLayer.userinfo = {};
				}
				//check if the user is logged in
				if (T1.mypage && T1.mypage.user) {
					dataLayer.userinfo.status = 'loggedin';
				}
				//check the device
				if (!dataLayer.userinfo.platform) {
					dataLayer.userinfo.platform = _private.getPlatform();
				}
				//check the entry component
				if (((typeof href) === 'string') && (href.indexOf('#') !== -1)) {
					if (!dataLayer.page) {
						dataLayer.page = {};
					}
					dataLayer.page.entrycomponent = href.substr(href.indexOf('#') + 1);
				}
			}
		},

		getPlatform: function (){
			var userAgentName = navigator.userAgent?navigator.userAgent:'',
				userAgentNameLowerCase = userAgentName.toLowerCase();
			if (/phone/.test(userAgentNameLowerCase)) {
				return 'mobile';
			}
			if (/tablet|(pad(\d|\b))/.test(userAgentNameLowerCase)) {
				return 'tablet';
			}
			if (/tv\b/.test(userAgentNameLowerCase)) {
				return 'smart-tv';
			}
			var appVersion = navigator.appVersion?navigator.appVersion:'',
				deviceSpecsLowerCase = userAgentNameLowerCase + ' ' + appVersion.toLowerCase();
			if (/mobile/.test(deviceSpecsLowerCase)) {
				return 'mobile';
			}
			if (/android|blackberry/.test(deviceSpecsLowerCase)) {
				var innerWidth = window.innerWidth || $(window).innerWidth(),
					innerHeight = window.innerHeight || $(window).innerHeight(),
					maximumDimension = (innerWidth > innerHeight)?innerWidth:innerHeight;
				if (maximumDimension < 770) {
					return 'mobile';
				} else {
					return 'tablet';
				}
			}
			return 'pc';
		},

		/**
		 * copies the data-bt-category + componentname from the previous sibling
		 */
		updateCTAElements: function(){
			var ctas = $('.inpage-cta'),
				cta = null,
				prevSection = null,
				componentName = '', category = '';
			for(var iCta=0; iCta < ctas.length; iCta++){
				cta = ctas.eq(iCta);
				prevSection = cta.prev();
				cta.attr('data-bt-componentname', prevSection.attr('data-bt-componentname') || '');
				cta.attr('data-bt-category', prevSection.attr('data-bt-category') || '');
			}
		},

		/**
		 * track scrolling of the gallery
		 * @param evName
		 * @param galleryNode
		 */
		trackGalleryScroll: function(evName, galleryNode){
			PubSub.publish(T1.constants.STATS_TRACK, {node: $(galleryNode),
				extraData: {
					event:{
						'eventclass': 'componentevent',
						'action': 'click_function',
						'value': ($(galleryNode).closest('section').data('bt-componentname')==='own_toyota') ? 'browse' : 'scroll_gallery'
					}
				}
			});
		},

		/**
		 * tracks the share component,
		 * @param evName (String) name of the event which triggered this function (default provided by pubsub)
		 * @param data (plain object) {node: the clicked element, url: the shared url, href: the share url}
		 */
		trackShare: function(evName, data){
			PubSub.publish(T1.constants.STATS_TRACK, {node: data.node,
				extraData:{
					event:{
						href: data.href,
						value: data.url
					}
				}
			});
		},

		/**
		 * function called when a search event is triggered
		 * @param evName (String) name of the event which triggered this function (default provided by pubsub)
		 * @param data (plain object) information about the search
		 */
		trackSearch : function(evName, data) {
			var c = T1.constants;
			if (data && data.origin) {
				if (data.origin === 'menu') {
					PubSub.publish(c.STATS_TRACK, {
						node: $('#menu-search'),
						extraData:{
							event:{
								value: data.q
							}
						}
					});
				}
			}
		},

		/**
		 * function called when a form in the My Toyota section is displayed
		 * @param evName (String) name of the event which triggered this function (default provided by pubsub)
		 * @param id (String) id of the pane element that is displayed
		 */
		trackMyToyotaTabSwitch : function(evName, id) {
			var c = T1.constants,
				pane = $('#'+id);
			switch (id) {
				case 'pane-save-car':
					if (pane.closest('.authenticated').length) {
						// track event form to (name and) save car displayed
						PubSub.publish(c.STATS_TRACK, {
							node: pane.find('#form-save-car')
						});
					} else {
						// track event login form to save car displayed
						PubSub.publish(c.STATS_TRACK, {
							node: pane
						});
					}
					break;
				case 'pane-login':					// track event login form displayed
				case 'pane-register':				// track event register form displayed
				case 'pane-forgotten-password':		// track event forgotten password form displayed
				case 'pane-my-cars':				// track event my cars pane displayed
				case 'pane-my-dealer':				// track event my dealer pane displayed
				case 'pane-owners-area':			// track event owner area displayed
					PubSub.publish(c.STATS_TRACK, {
						node: pane
					});
					break;
			}
		},

		trackTabsSwitch : function(evName, id) {
			var c = T1.constants,
				pane = $('#'+id);
			switch (id) {
				case 'pane-search':
					PubSub.publish(c.STATS_TRACK, {
						node: pane,
					});
					break;
			}
		},

		/**
		 * function called when form has not passed validation
		 * @param evName (String) name of the event which triggered this function (default provided by pubsub)
		 * @param data (plain object) contains form element and fields which have not passed validation
		 */
		trackFormValidationFailed : function(evName, data) {
			var c = T1.constants,
				form = $(data.form),
				id = form.attr('id');
			switch (id) {
				case 'form-my-cars':				// track event form to add a car (via a Toyota code) not passed validation
				case 'form-login':					// track event login form not passed validation
				case 'form-register':				// track event register form not passed validation
				case 'form-forgotten-password':		// track event forgotten password form not passed validation
				case 'form-save-car':				// track event form to (name and) save car not passed validation
				case 'form-login-save-car':			// track event login form to save car not passed validation
					form.attr('data-bt-state', 'fail');
					PubSub.publish(c.STATS_TRACK, {
						node: form.find('.btn-submit')
					});
					break;
			}
		},

		/**
		 * function called on return of submitting forms
		 * @param evName (String) name of the event which triggered this function (default provided by pubsub)
		 * @param data (plain object) {data: (plain object) sent data/success info, form: (JQuery object) the form element, status: (String) success/fail - indicates if the submit was successfull / failed, validated: (boolean) indicates if validation is done}
		 */
		trackSubmitFormReturn : function(evName, data) {
			var c = T1.constants,
				form = $(data.form),
				id = form.attr('id'),
				state;
			switch (id) {
				case 'form-my-cars':				// track event result submit form to add a car (via a Toyota code)
					state = (data.status === 'success') ? 'success' : 'fail';
					form.attr('data-bt-state', state);
					PubSub.publish(c.STATS_TRACK, {
						node: form.find('.btn-submit')
					});
					break;
				case 'form-login':					// track event result submit login form
				case 'form-register':				// track event result submit register form
				case 'form-forgotten-password':		// track event result submit forgotten password
				case 'form-login-save-car':			// track event result submit login form to save car
				case 'form-save-car':				// track event result submit form to (name and) save car
					state = ((data.status === 'success') && (data.data && data.data.success)) ? 'success' : 'fail';
					if ((state === 'success') && (id === 'form-save-car')) {
						// successfully saved car handled during event named T1.constants.MY_TOYOTA_SAVED_CAR
					} else {
						form.attr('data-bt-state', state);
						PubSub.publish(c.STATS_TRACK, {
							node: form.find('.btn-submit')
						});
					}
					break;
				case 'form-contact':				// contact form submitted (if successful track display results screen)
					if ((data.status === 'success') && (data.data && data.data.success)) {
						PubSub.publish(c.STATS_TRACK, {
							node: form.find('.btn-submit')
						});
					}
					break;
				case 'form-brochure':				// brochure request form submitted (if successful track display results screen)
				case 'form-testdrive':				// testdrive form submitted (if successful track display results screen)
					if ((data.status === 'success') && (data.data && data.data.success)) {
						var modelId = '', modelName = '', code;
						form.find('input[name="model"]:checked').each(function(index,element) {
							modelName += (';' + element.value);
							code = $(element).data('code');
							if (code) {
								modelId += (';' + code);
							}
						});
						PubSub.publish(c.STATS_TRACK, {
							node: form.find('.btn-submit'),
							extraData: {
								event: {
									modelid: modelId.substr(1),
									modelname: modelName.substr(1)
								}
							}
						});
					}
					break;
			}
		},

		trackMyToyotaCarAlreadySaved : function(evName, data) {
			var c = T1.constants,
				form = $('#form-save-car'),
				buttonSubmit = form.find('.btn-submit');
			form.attr('data-bt-state', 'fail');
			PubSub.publish(c.STATS_TRACK, {
				node: buttonSubmit
			});
		},

		/**
		 * tracking applied when car in My Toyota is saved successfully
		 * @param evName (String) name of the event which triggered this function (default provided by pubsub)
		 * @param data (plain object) contains some info regarding saved car including Toyota (car) code
		 */
		trackMyToyotaSavedCar : function(evName, data) {
			var c = T1.constants,
				form = $('#form-save-car'),
				buttonSubmit = form.find('.btn-submit'),
				carId = (data && data.car && data.car.code)?data.car.code:'',
				configuration = {
					type: "saveconfig",
					configcode: carId
				},
				request = $.ajax({
					type: 'GET',
					dataType: 'JSON',
					url: T1.settings.loadSaveServer + '/config/' + carId + '/json',
					crossDomain: true
				});
			form.attr('data-bt-state', 'success');
			request.done(function(data) {
				var suffix,
					modelId,
					tmpArray,
					tmpString,
					index,
					requestExtraData;
				if (data) {
					suffix = '_' + T1.settings.country + T1.settings.language;
					modelId = (data.ModelID)?data.ModelID:'';
					configuration.modelid = modelId;
					configuration.carid = ((data.CarID)?data.CarID:'') + suffix;
					configuration.extcolorid = modelId + '_' + ((data.ExteriorColourID)?data.ExteriorColourID:'') + suffix;
					configuration.intcolorid = modelId + '_' + ((data.UpholsteryID)?data.UpholsteryID:'') + suffix;
					tmpArray = (data.Options && $.isArray(data.Options))?data.Options:[];
					if (tmpArray.length > 0) {
						tmpString = '';
						for (index = 0; index < tmpArray.length; index++) {
							tmpString += (';' + modelId + '_' + tmpArray[0] + suffix);
						}
						tmpString = tmpString.substr(1);
					} else {
						tmpString = 'no_option';
					}
					configuration.optionlist = tmpString;
					tmpArray = (data.Accessories && $.isArray(data.Accessories))?data.Accessories:[];
					if (tmpArray.length > 0) {
						tmpString = '';
						for (index = 0; index < tmpArray.length; index++) {
							tmpString += (';' + modelId + '_' + tmpArray[0] + suffix);
						}
						tmpString = tmpString.substr(1);
					} else {
						tmpString = 'no_accessory';
					}
					configuration.accessorylist = tmpString;
					tmpArray = (data.Packs && $.isArray(data.Packs))?data.Packs:[];
					if (tmpArray.length > 0) {
						configuration.packs = {};
						for (index = 0; index < tmpArray.length; index++) {
							configuration.packs[tmpArray[0] + suffix] = {};
						}
					} else {
						configuration.packs = 'no_pack';
					}
				}
				requestExtraData = $.ajax({
					type: 'GET',
					dataType: 'JSON',
					url: T1.settings.loadSaveServer + '/config/' + carId + '/json/full',
					crossDomain: true
				});
				requestExtraData.done(function(data) {
					if (data && data.price) {
						var spotlights = ($.isArray(data.price.spotlights))?data.price.spotlights:[],
							discounts = ($.isArray(data.price.discounts))?data.price.discounts:[],
							promotions = $.merge(spotlights, discounts),
							tmpString = '',
							index;
						for (index = 0; index < promotions.length ; index++) {
							if (promotions[index].promoId) {
								tmpString += (';' + promotions[index].promoId);
							}
						}
						if (tmpString.length > 0) {
							tmpString = tmpString.substr(1);
						} else {
							tmpString = 'no_promotion';
						}
						configuration.promotionlist = tmpString;
					}
					PubSub.publish(c.STATS_TRACK, {
						node: buttonSubmit,
						extraData: {
							configuration: configuration
						}
					});
				});
				requestExtraData.fail(function(jqXHR, status, error) {
					PubSub.publish(c.STATS_TRACK, {
						node: buttonSubmit,
						extraData: {
							configuration: configuration
						}
					});
				});
			});
			request.fail(function(jqXHR, status, error) {
				PubSub.publish(c.STATS_TRACK, {
					node: buttonSubmit,
					extraData: {
						configuration: configuration
					}
				});
			});
		},

		/**
		 * tracks the store procedure of a car
		 * @param evName (string) event name which triggers this function (provided by PubSub)
		 * @param data (plain object) car information
		 */
		trackMyToyotaEvents : function(evName, data){
			var m = _private,
				c = T1.constants;
			if(evName===c.MY_TOYOTA_DELETED_CAR){
				PubSub.publish(c.STATS_TRACK, {extraData:{}});
			}
		},

		/**
		 * tracks display of the custom forms (contact/dealerfinder/...)
		 * @param evName (string) event name which triggers this function (provided by PubSub)
		 * @param data (jQuery object) form being loaded
		 */
		trackFormLoad: function(evName, data){
			if (!data) return;
			var form = $(data),
				id = form.attr('id');
			switch (id) {
				case 'form-contact':
				case 'form-brochure':
				case 'form-testdrive':
					PubSub.publish(T1.constants.STATS_TRACK, {
						node: form
					});
					break;
			}
		},

		/**
		 * generic carousel tracking
		 */
		trackCarousel : function(evName, data) {
			var m = _private,
				carousel = $(data.el).closest('.carousel'),
				activeSlide = carousel.find('.item.active'),
				galleryNode = activeSlide.data('dataNode'),
				sType = activeSlide.data('type'),
				posterNode = null,
				extraData = {event: {}};

			// log if the carousel is in the viewport (and visible)
			if(carousel.is(':visible')){
				if(carousel.inView() > 25){
					switch(sType){
						case 'image':
							extraData.event.assettype = sType;
							extraData.event.value = activeSlide.find('img').data('lazy-load');
							extraData.event.assetname = extraData.event.value;
							extraData.event.eventclass = 'assetevent';
							break;
						case 'video':
							posterNode = activeSlide.find('.posterWrapper');
							extraData.event.assettype = sType;
							extraData.event.value = posterNode.data('video-mp4') || posterNode.data('video-flv') || posterNode.data('video-ogv') || posterNode.data('video-webm');
							extraData.event.assetname = extraData.event.value;
							extraData.event.eventclass = 'assetevent';
							break;
						case 'external-video':
							extraData.event.assettype = 'video';
							extraData.event.value = activeSlide.find('iframe').prop('href');
							extraData.event.assetname = extraData.event.value;
							extraData.event.eventclass = 'assetevent';
							break;
					}
					PubSub.publish(T1.constants.STATS_TRACK, {node: galleryNode || activeSlide, extraData: extraData});
				}
			}
		},

		/**
		 * track section if in view
		 */
		trackScroll : function(evName, data) {
			PubSub.publish(T1.constants.STATS_TRACK, {node: data.element, extraData: {event: {eventclass: 'scrollevent', action: 'view_scroll', value: data.element.data('bt-componentname')}}});
		},

		/**
		 * handler for webtrends track on event
		 */
		trackLinkData : function() {
			PubSub.publish(T1.constants.STATS_TRACK, {node: $(this)});
		},

		/**
		 * callback function which will track eventObject
		 */
		trackCallback : function(e){
			PubSub.publish(T1.constants.STATS_TRACK, {node: $(e.target)});
		},

		/**
		 * track
		 * @param evName
		 * @param data
		 */
		track: function(evName, data){
			var node = data.node || $('body'),
				extraData = data.extraData || null;

			_private.trackNodeData(node, extraData);
		},

		/**
		 * tracks all webtrends data-attributes for the given node
		 * @node: the node to track
		 * @extraDataObject: json object holding data to override default data
		 */
		trackNodeData : function(node, extraData) {
			var m = _private,
				c = T1.constants,
				dataKey,
				tempObj,
				catObj,
				eventClass,
				trackSettingPrefix,
				collapsed,
				elementId;

			//default the node if it does not exist
			if(typeof node==='undefined' || node.length===0) node = $("body");

			//get brighttag state
			var state = m.getState(node);
			if(state==='no-tracking') return;

			//fetch data recursive
			m.currentObject = extraData || {};
			tempObj = m.crawlData(node, state);

			//extend the t1DataLayer
			m.extendDataLayer(tempObj);

			//trigger the brighttag event
			if (tempObj.event) {
				eventClass = tempObj.event.eventclass;
				if ((typeof eventClass === 'string') && eventClass.length > 0) {
					trackSettingPrefix = eventClass.substr(0, eventClass.indexOf('event'));
					if (m.settings['track' + trackSettingPrefix.charAt(0).toUpperCase() + trackSettingPrefix.substr(1)] !== false) {
						try {
							if (tempObj.event.workflowname && !tempObj.event.workflowconversion) {
								window.t1DataLayer.event.workflowconversion = '0';
							}
							console.log('TRIGGER ' + eventClass + ' STATE ' + (state || 'default') + ' DATA ' + JSON.stringify(window.t1DataLayer));
							$(window).trigger(eventClass);
						} catch (e) {
							console.log(e.message);
						}
					}
				} else {
					console.log('TRIGGER cancelled because eventclass not defined!');
				}
			}

		},

		/**
		 * traverses html up till tracking root found (root node = body / bt-category node)
		 * @param {$object} node
		 */
		crawlData: function(node, state){
			var m = _private,
				parent = node.parent();
			m.extendObject(m.currentObject, m.nodeDataToJSON(node, state));
			if(m.isTrackChildNode(parent) && node.prop('tagName').toUpperCase()!=='BODY'){
				return m.crawlData(parent);
			}else{
				return m.extendObject(m.currentObject, m.nodeDataToJSON(parent, state));
			}
		},

		/**
		 * true if node needs additional parent data
		 * false if node contains sufficient data
		 * @param node
		 * @returns {boolean}
		 */
		isTrackChildNode: function(node) {
			if (node.prop('tagName') === 'BODY' || node.length===0) {
				return false;
			}
			var result = (node.data('bt-category') === undefined);

			return result;
		},

		/**
		 * returns node data and optional extra data in one object
		 * @param node
		 * @param extraData
		 * @param collapsed (optional boolean) will overrule collapse data over the other bt-attributes
		 * @returns {object}
		 */
		nodeDataToJSON: function(node, state) {
			var m = _private,
				obj;

			obj = m.filterData(node, state);

			return obj;
		},

		/**
		 * filters data relevant for tracking
		 * @param {object} data
		 * @param state (optional string) fitlers only the attributes for a certain state
		 * @returns {object}
		 */
		filterData: function(node, state) {
			//loop attributes
			var m = _private,
				obj = {},
				key = '',
				keyElements = [],
				domNode = (node.get) ? node.get(0) : node,
				attrs = node.length===0 ? [] : domNode.attributes,
				attribute = null;

			for(var iAttr=0; iAttr < attrs.length; iAttr++){
				attribute = m.getAttrValues(attrs[iAttr]);
				if(attribute){
					if(!obj[attribute.category]) obj[attribute.category] = {};
					if(state && state!=='' && attribute.state.toLowerCase() === state.toLowerCase()){ // a state is provided and the attribute matches the state! => overrule already existing keys
						obj[attribute.category][attribute.key] = attribute.value;
					}else{
						if(!obj[attribute.category][attribute.key] && attribute.state === '') obj[attribute.category][attribute.key] = attribute.value;
					}
				}
			}

			return obj;
		},

		/**
		 * Attribute-names will be interpreted as the following patterns (DATA-PREFIX-KEY | DATA-PREFIX-STATE-KEY | DATA-PREFIX-STATE-CATEGORY-KEY)
		 * DATA: fixed string
		 * PREFEX: BT
		 * STATE: (default='') if a state is provided the attribute value will overrule any other value when the node reaches this state
		 *		example <data-bt-hybrid-value=hybridvalue data-bt-value=defaultvalue> => when the node reaches state 'hybrid', it hybridvalue will overrule the defaultvalue
		 * CATEGORY: (default='event') the subobject @ t1DataLayer where this key needs to be added (example: data-bt--userinfo-username="Hendrik")
		 * KEY: the actual key in the category-object (example => {'event':{'KEY': 'value'}})
		 * @param attribute (attribute object)
		 * @return (plain object) {key: bt key name, category: bt category object, state: bt state on which this value needs to be applied}
		 */
		getAttrValues: function(attribute){
			var m = _private,
				c = T1.constants,
				attrName = attribute.nodeName.toLowerCase(),
				attrPrefix = 'data-' + m.brightTagPrefix + '-',
				attrElements = [],
				key = '',
				retObj = {'category': c.STATS_CATEGORY_EVENT, 'key': '', 'state':'', 'value': ''};
			if(attrName.indexOf(attrPrefix)>-1){
				//collect the key (= attribute name without the data-prefix included)
				key = attrName.substring(attrPrefix.length);
				//ignore the attributenames which should be excluded
				if(m.ignoreBtTags.indexOf('%'+key+'%')!==-1) return null;
				//split up and interpret the attribute elements
				attrElements = key.split('-');
				if(attrElements.length===1){
					retObj.key = attrElements[0];
				}else if(attrElements.length===2){
					retObj.state = attrElements[0];
					retObj.key = attrElements[1];
				}else if(attrElements.length > 2){
					retObj.state = attrElements[0];
					retObj.category = attrElements[1];
					retObj.key = attrElements[2];
				}
				retObj.value = m.translateValuePlaceholders(attribute.nodeValue);
				return retObj;
			}
		},

		/**
		 * Translates the placesholders in the attribute values (example [URL] by the current URL) + casts to string (if needed)
		 * @param attrVal (string) the attribute value
		 * @returns {*}
		 */
		translateValuePlaceholders: function(attrVal){
			//translate [URL] + [TITLE]
			if(attrVal.indexOf('[URL]')!==-1) attrVal = attrVal.replace('[URL]', location.href + location.hash);
			if(attrVal.indexOf('[TITLE]')!==-1) attrVal = attrVal.replace('[TITLE]', window.title);
			//return the translated attribute value
			return (typeof attrVal === 'string') ? attrVal : attrVal.toString();
		},

		/**
		 * returns the current brighttag state for a certain node... Example: if only hybrid features are shown, all action-tagging within the feature component will include isHybrid='1'
		 * to determine if the element is clicked in a hybrid/nonhybrid context, a state is added to the node/parent/section.
		 * @param node (jquery object) the node for which you need to determine it's state
		 * @returns {*}
		 */
		getState: function(node){
			var m = _private,
				state = node.attr('data-bt-state');
			if(state){
				return state;
			} else {
				return (m.isTrackChildNode(node) && node.prop('tagName').toUpperCase()!=='BODY') ? m.getState(node.parent()) : '';
			}
		},

		/**
		 * extend dataLayer object (with categorizedObject)
		 * @param {object} categorizedObject
		 */
		extendDataLayer: function(categorizedObject) {
			var m = _private;

			// clone the base object
			var base = _private.extendObject({}, this.base);

			// set the datalayer
			window.t1DataLayer = base;
			m.extendObject(window.t1DataLayer, categorizedObject, true);
		},

		/**
		 * merges 2 objects into 1 new object (+ exclude the settings object from the t1DataLayer)
		 * @param objTarget
		 * @param objSource
		 * @returns {*}
		 */
		extendObject: function(objTarget, objSource, override){
			for(var sKey in objSource){
				if(objTarget[sKey]){
					for(var sSubKey in objSource[sKey]){
						if(! objTarget[sKey][sSubKey] || override) objTarget[sKey][sSubKey] = objSource[sKey][sSubKey];
					}
				}else{
					if(sKey!=='settings') objTarget[sKey] = objSource[sKey];
				}
			}
			return objTarget;
		}
	};

	return {
		init: _private.init,
		trackCallback: _private.trackCallback,
		updateBaseObject : _private.updateBaseObject,
		getPlatform : _private.getPlatform
	};

}());