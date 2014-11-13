var T1 = T1 || {};

/**
 * dealer script
 * version 1.0
 * KGH: mobile version
 * TODO:
 * - check why no markers shown (set marker in inline function?)
 * - integrate with page dealer finder
 * - STEP2: show amount of dealers
 * - caching when applicable
 * - desktop version
 */
T1.dealerFinder = ( function () {
	'use strict';

	// private vars for facade pattern (return public vars/functions)
	var _dealerFinder = {
		currentLocation: {},
		currentDealer: {},
		currentDealerData: {},
		eventTokens: {},
		currentMap: null,
		currentStep: -1,
		currentSearchAddress: null,
		currentSearchOptions: [],
		searchOptions: '',
		googleMapsLoaded: false,
		isSearch: false,
		amountOfDealers: 0,
		init: function() {
			PubSub.subscribe(T1.constants.DEALERS_FOUND, _dealerFinder.trackDisplayDealerResultsScreen);
		},
		/**
		 * initialize for desktop
		 */
		initDesktop: function () {
			var m = _dealerFinder,
				c = T1.constants;

			m.isTrackingEnabled = typeof(window.t1DataLayer) === 'object';
			// load dealerscript when form ready
			PubSub.subscribe(c.DEALER_LOAD, m.initOnDemand);
			PubSub.subscribe(c.TABS_SWITCH, m.initOnDemand);
			PubSub.subscribe(c.PAGEOVERLAYER_CLOSE, m.destroyOverlayer);

			_dealerFinder.initInPage();
		},
		/**
		 * initialize for mobile
		 */
		initMobile: function() {
			var m = _dealerFinder;
			m.isTrackingEnabled = typeof(window.t1DataLayer) === 'object';
			m.initOnDemand();
		},
		/**
		 * init on demand
		 */
		initOnDemand: function(eventName, eventData) {
			var m = _dealerFinder,
				view = _dealerView;

			// set dealer container
			m.resetView();
			view.container = $('#pane-dealer');

			if (m.currentStep < 1) {
				m.currentStep = 1;
			}

			m.setStep(m.currentStep);
			if ((eventName === T1.constants.DEALER_LOAD) || m.isMobile()) {
				if (m.currentStep < 2) m.trackDisplayDealerForm();
			}

			// load maps API 01/09 MOVED TO ASYNC LOADING
			//m.initMaps();

			// show the "use my location" link (if geolocation is available)
			view.showGeoLink();

			// prepare events
			m.setEvents();
		},
		initOverlayerGUI: function(initSearchAddress, initSearchOptions) {
			$('#pane-dealer .input-search input[type="text"]').val(initSearchAddress);
			$('#pane-dealer input[name="options"]').each(function() {
				if (initSearchOptions[$(this)[0].value]) {
					$(this)[0].checked = true;
				}
			});
		},
		trackDisplayDealerForm: function() {
			if ($('#pane-dealer').length) {				// do not track when in only track outside of My Toyota
				if (_dealerFinder.isTrackingEnabled)  {
					PubSub.publish(T1.constants.STATS_TRACK, {
						node: _dealerView.container,
						extraData: {
							event: {
								value: 'search-form',
								workflowname: 'dealerfinder',
								workflowstep: '1'
							}
						}
					});
				}
			}
		},
		trackDisplayDealerResultsScreen: function() {
			var m = _dealerFinder;
			if (m.isTrackingEnabled) {
				PubSub.publish(T1.constants.STATS_TRACK, {
					node: _dealerView.container,
					extraData: {
						event: {
							eventclass: 'searchevent',
							value: 'search-results',
							workflowname: 'dealerfinder',
							workflowstep: '2',
							workflowconversion: '1'
						},
						search: {
							type: m.tagSearchType,
							query: m.tagSearchQuery,
							results: (m.amountOfDealers > 0)?'1':'0',
							category: m.tagSearchCategory
						}
					}
				});
			}
		},
		trackClickDealerDetail: function (dealer) {
			if (_dealerFinder.isTrackingEnabled) {
				PubSub.publish(T1.constants.STATS_TRACK, {
					node: _dealerView.container,
					extraData: {
						event: {
							eventclass: 'dealerevent',
							value: 'view-dealer',
							workflowname: 'dealerfinder',
							workflowstep: '3'
						},
						dealer: {
							dealerid: dealer.guid
						}
					}
				});
			}
		},
		trackClickDealerSite: function () {
			var m = _dealerFinder;
			if (m.isTrackingEnabled) {
				PubSub.publish(T1.constants.STATS_TRACK, {
					node: _dealerView.container,
					extraData: {
						event: {
							eventclass: 'dealerevent',
							value: 'open-dealer-site',
							workflowname: 'open-dealer-site',
							workflowstep: '4',
							workflowconversion: '1'
						},
						dealer: {
							dealerid: m.currentDealerData.guid
						}
					}
				});
			}
		},
		trackClickDealerSave: function () {
			var m = _dealerFinder;
			if (m.isTrackingEnabled) {
				PubSub.publish(T1.constants.STATS_TRACK, {
					node: _dealerView.container,
					extraData: {
						event: {
							eventclass: 'dealerevent',
							value: 'save-dealer',
							workflowname: 'save-dealer',
							workflowstep: '4',
							workflowconversion: '1'
						},
						dealer: {
							dealerid: m.currentDealerData.guid
						}
					}
				});
			}
		},
		trackRequestDealerDirections: function () {
			var m = _dealerFinder;
			if (m.isTrackingEnabled) {
				PubSub.publish(T1.constants.STATS_TRACK, {
					node: _dealerView.container,
					extraData: {
						event: {
							value: 'direction-start',
							workflowname: 'dealerfinder',
							workflowstep: '5'
						},
						dealer: {
							dealerid: m.currentDealerData.guid
						}
					}
				});
			}
		},
		trackCallDealer: function () {
			var m = _dealerFinder;
			if (m.isTrackingEnabled) {
				PubSub.publish(T1.constants.STATS_TRACK, {
					node: _dealerView.container,
					extraData: {
						event: {
							eventclass: 'dealerevent',
							value: 'call-dealer',
							workflowname: 'call-dealer',
							workflowstep: '4',
							workflowconversion: '1'
						},
						dealer: {
							dealerid: m.currentDealerData.guid
						}
					}
				});
			}
		},
		trackDisplayResultsRequestDealerDirections: function () {
			var m = _dealerFinder;
			if (m.isTrackingEnabled) {
				PubSub.publish(T1.constants.STATS_TRACK, {
					node: _dealerView.container,
					extraData: {
						event: {
							eventclass: 'dealerevent',
							value: 'direction-results',
							workflowname: 'dealerfinder',
							workflowstep: '6'
						},
						dealer: {
							dealerid: m.currentDealerData.guid
						}
					}
				});
			}
		},
		/**
		 * init in page dealer component
		 */
		initInPage: function() {
			var m = _dealerFinder,
				view = _dealerView;

			view.container = $('.dealer-finder.in-page');

			// load maps API 01/09 MOVED TO ASYNC LOADING
			//m.initMaps();

			// show the "use my location" link (if geolocation is available)
			view.showGeoLink();

			// prepare events
			m.setEvents();
		},
		/**
		 * load gmaps script
		 * @param clientId
		 */
		initMaps: function() {
			var m = _dealerFinder,
				c = T1.constants,
				view = _dealerView;

			if (!m.googleMapsLoaded) {
				var settings = T1.settings.dealer,
					country = T1.settings.country,
					url;

				if (settings.googleClientId && settings.googleClientId.length > 0) {
					url = c.URL_GOOGLE_MAPS_API.replace('{CLIENT_ID}', settings.googleClientId);
				} else {
					url = c.URL_GOOGLE_MAPS_API_DEV.replace('{API_KEY}', settings.googleAPIKey);
				}

				if (country) {
					url += '&region=' + country;
				}

				//	business accounts:
				url += '&callback=T1.dealerFinder.handleAPILoad';
				//$.getScript(url);
				$.ajax({
					type: "GET",
					url: url,
					dataType: "script",
					cache: true
				});
				m.googleMapsLoaded = true;

			} else {
				if (m.isSearch) {
					//run the search
					m.handleSearch(e);
				} else {
					m.handlePosition(e);
				}
			}
		},
		/**
		 * Clears all event subscriptions when the overlayer closes
		 */
		destroyOverlayer: function(evName, data){
			//reset step
			_dealerFinder.currentSearchAddress = '';
			_dealerFinder.currentSearchOptions = [];
			_dealerFinder.currentLocation = {};
			_dealerFinder.currentStep = -1;
			//unsubscribe events
			var evtTokens = _dealerFinder.eventTokens;
			for(var sKey in evtTokens){
				if(evtTokens[sKey]) PubSub.unsubscribe(evtTokens[sKey]);
				evtTokens[sKey] = null;
			}
			_dealerFinder.resetView();
		},
		/**
		 * resets the cached elements in the view
		 */
		resetView: function(){
			//reset view cache
			var view = _dealerView;
			view.container= null;
			view.buttonBack= null;
			view.buttonSearch= null;
		},
		/**
		 * convert address to coordinates
		 * @param address
		 */
		getGeoForAddress: function(address, options) {
			var m = _dealerFinder,
				geoCoder = new google.maps.Geocoder();

			geoCoder.geocode(
				{'address': address, componentRestrictions: {country: T1.settings.country}},
				function(results, status) {
					m.handleGeoCoding(results, status, options);
				}
			);
		},
		getDealersOrGeo: function(selectedOpts) {
			var m = _dealerFinder,
				service = _dealerService,
				view = _dealerView,
				options,
				category,
				country = T1.settings.country;

			view.setContainer('#pane-dealer');

			options = view.getOptions();

			if (m.currentStep < 3) {
				m.tagSearchCategory = '';
				if (options.size() > 0) {
					options.each(function() {
						category = $(this)[0].value.toLowerCase();
						if (category !== 'selectall') {
							if (category === 'prius') category += 'dealer';
							if (m.tagSearchCategory.length > 0) m.tagSearchCategory += ';';
							m.tagSearchCategory += category;
						}
					});
				}
			}
			if (view.buttonSearch && view.buttonSearch.hasClass('btn-search-dealers')) {
				if (!m.currentLocation || m.currentLocation.address !== m.currentSearchAddress) {
					/*if (m.currentSearchAddress.match(new RegExp('\b' + country + '\b', 'i')) === null) {
						m.currentSearchAddress += (', ' + country);
					}*/
					if (m.currentStep < 3) {
						m.tagSearchType = 'dealer-search-address';
						m.tagSearchQuery = m.currentSearchAddress;
					}
					m.getGeoForAddress(m.currentSearchAddress, view.serializeOptions(options));
				} else {
					if (m.currentStep < 3) {
						m.tagSearchType = 'dealer-search-gps';
						var p = m.currentLocation.position;
						m.tagSearchQuery = (p && p.d && p.e)?(p.d + ',' + p.e):'';
					}
					service.getDealersByLocation(m.currentLocation, view.serializeOptions(options));
				}
			} else {
				/*if (m.currentSearchAddress.match(new RegExp('\b' + country + '\b', 'i')) === null) {
					m.currentSearchAddress += (', ' + country);
				}*/
				if (m.currentStep < 3) {
					m.tagSearchType = 'dealer-search-address';
					m.tagSearchQuery = m.currentSearchAddress;
				}
				m.getGeoForAddress(m.currentSearchAddress, view.serializeOptions(options));
			}
		},
		/**
		 * get map for dealerarray
		 */
		getMapForDealers: function(element, dealers) {
			var m = _dealerFinder,
				mapOptions = {
					center : m.currentLocation.position,
					zoom : 10,
					mapTypeId : google.maps.MapTypeId.ROADMAP
				};

			m.currentMap = new google.maps.Map(element[0], mapOptions);

			$.each(dealers, m.setMarker);
		},
		/**
		 * get map for one dealer
		 * @param element
		 * @param dealer
		 */
		getMapForDealer: function(element, dealer) {
			var m = _dealerFinder,
				mapOptions = {
					center : dealer.position,
					zoom : 13,
					mapTypeId : google.maps.MapTypeId.ROADMAP
				};

			m.currentMap = new google.maps.Map(element[0], mapOptions);

			m.setMarker(-1, dealer);
		},
		/**
		 * get details for selected dealer
		 * @param dealer
		 */
		getDealerDetail: function(index, dealer) {
			var m = _dealerFinder,
				view = _dealerView,
				t = T1.labels,
				titleContainer = view.getElement('.form-label').filter(':first'),
				detailContainer = view.getElement('.detail-dark'),
				ctaContainer = view.getElement('.dealer-CTA'),
				listAddress = $('<ul>'),
				listContact = $('<ul>'),
				listServices = $('<ul>'),
				containerHours = $('<div>'),
				htmlAddress = '',
				htmlContact = '',
				htmlHours,
				htmlServices = '',
				htmlServicesDesktop = '',
				services = dealer.services,
				CHAR_SPACE = ' ',
				CHAR_COLON = ':',
				HTML_ITEMOPEN = '<li>',
				HTML_ITEMCLOSE = '</li>',
				region,
				btnDir,
				btnTel,
				btnWeb,
				btnPrint,
				btnSave,
				phone;

			// cache selected dealer
			m.currentDealerData = dealer;
		//	m.currentDealer.position = new google.maps.LatLng(dealer.address.origin.lon, dealer.address.origin.lat);
			m.currentDealer.position = new google.maps.LatLng(dealer.address.geo.lat, dealer.address.geo.lon);
			m.currentDealer.address = dealer.address;

			if (m.currentMap) {
				m.currentMap.setCenter(m.currentDealer.position);
			}

			if (m.isMobile()) {
				m.setStepForward();

				// load map
				m.getMapForDealer(view.getMapDealers(m.currentStep), m.currentDealer);
			} else {
				view.setDealerActive(index);
			}

			// change header
			titleContainer.html(t.dealer.dealerDirections);
			view.setDealerName(m.htmlDecode(dealer.name));

			// compose dealer detail html
			var images = dealer.images;
			if ($.isEmptyObject(images)) {
				view.getElement('.dealer-image').hide();
			}

			htmlAddress += HTML_ITEMOPEN + dealer.address.address1 + HTML_ITEMCLOSE;
			region = dealer.address.region;
			if (region && region.length > 0) {
				region = ' (' + region + ')';
			}
			htmlAddress += HTML_ITEMOPEN + dealer.address.zip + CHAR_SPACE + dealer.address.city + (region || '') + HTML_ITEMCLOSE;
			listAddress.html(htmlAddress);

			if (dealer.phone) {
				phone = m.convertPhoneToInternationalFormat(dealer.phone);
				$(HTML_ITEMOPEN + HTML_ITEMCLOSE).text(CHAR_COLON + CHAR_SPACE + phone.text).prepend($('<b/>').text(t.tel)).appendTo(listContact);
			}
			if (dealer.fax1) {
				$(HTML_ITEMOPEN + HTML_ITEMCLOSE).text(CHAR_COLON + CHAR_SPACE + m.convertPhoneToInternationalFormat(dealer.fax1).text).prepend($('<b/>').text(t.fax)).appendTo(listContact);
			}

			var urlDealer = dealer.url,
				httpPrefix = '';

			if (urlDealer && urlDealer.length > 0) {
				if (urlDealer.indexOf("http://") === -1 ) {
					httpPrefix = 'http://';
				}

				var linkDealerSite = $('<a/>').attr('href', httpPrefix + urlDealer).attr('target', '_blank').addClass('inline').text(urlDealer);

				linkDealerSite.on('click', m.trackClickDealerSite);
				$(HTML_ITEMOPEN + HTML_ITEMCLOSE).text(CHAR_COLON + CHAR_SPACE).prepend($('<b/>').text(t.website)).append(linkDealerSite).appendTo(listContact);
			}

			htmlHours = m.htmlDecode(dealer.openingHours);
			containerHours.addClass('dealer-hours');
			containerHours.html(htmlHours);

			// mobile
			detailContainer.empty();
			detailContainer.append(listAddress);
			detailContainer.append(listContact);
			detailContainer.append(containerHours);

			// desktop
			view.setDealerAddress(listAddress[0].outerHTML);
			view.setDealerContact(listContact);
			view.setDealerHours(htmlHours);

			if (services.length > 0) {
				for (var i = 0; i < services.length; i++) {
					var service = services[i].label,
						item = '<div class="col-xs-6 col-md-4"><i class="hidden-xs icon-car2"></i>' + service + '</div>';

					htmlServices += HTML_ITEMOPEN + service + HTML_ITEMCLOSE;
					htmlServicesDesktop += item;
				}
				listServices.html(htmlServices);
				detailContainer.append(listServices);

				view.setDealerServices(htmlServicesDesktop);
			}

			// compose dealer CTA links
			btnTel = ctaContainer.find('.btn-phone');
			if (dealer.phone) {
				btnTel.attr('href', 'tel:' + phone.tel);
				btnTel.unbind('click', m.trackCallDealer).bind('click', m.trackCallDealer);
				btnTel.css('display', 'block');
			} else {
				btnTel.css('display', 'none');
			}

			btnDir = ctaContainer.find('.btn-directions');
			btnDir.unbind('click', m.handleCTADirections).bind('click', m.handleCTADirections);

			btnWeb = ctaContainer.find('.btn-website');
			btnWeb.attr('href', httpPrefix + urlDealer);
			btnWeb.unbind('click', m.trackClickDealerSite).bind('click', m.trackClickDealerSite);
			btnWeb.attr('target', '_blank');

			btnPrint = ctaContainer.find('.btn-print');
			btnPrint.unbind('click', m.handleCTAPrint).bind('click', m.handleCTAPrint);

			btnSave = view.getElement('.cta-save .btn');
			btnSave.unbind('click', m.handleCTASave).bind('click', m.handleCTASave);

			PubSub.publish(T1.constants.DEALER_SELECTED, dealer);

			//	btnGroupGps = ctaContainer.find('.bubble-gps a.btn[data-format]');
			//	btnGroupGps.unbind().bind('click', m.handleGPSExport);
		},
		convertPhoneToInternationalFormat: function(phoneParameterToProcess) {
			var phoneToReturn = {text:'',tel:''}, phoneStringToProcess, currentIndex, currentCharacter, phoneCountryCode = T1.settings.phoneCountryCode;
			if ((typeof phoneParameterToProcess) === 'string') {
				phoneStringToProcess = phoneParameterToProcess;
			} else if (phoneParameterToProcess instanceof String) {
				phoneStringToProcess.toString();
			} else {
				phoneStringToProcess = '';
			}
			if (((typeof phoneCountryCode) === 'string') && (phoneCountryCode.length > 0)) {
				for (currentIndex = 0 ; currentIndex < phoneStringToProcess.length ; currentIndex++) {
					currentCharacter = phoneStringToProcess.charAt(currentIndex);
					if ('1234567890+'.indexOf(currentCharacter) > -1) {
						if (currentCharacter === '0') {
							if (phoneToReturn.text.length === 0) {
								phoneToReturn.text += '(0)';
							} else {
								phoneToReturn.text += currentCharacter;
								phoneToReturn.tel += currentCharacter;
							}
						} else {
							phoneToReturn.text += currentCharacter;
							phoneToReturn.tel += currentCharacter;
						}
					}
				}
				if ((phoneToReturn.text.length > 0) && (phoneToReturn.text.charAt(0) !== '+')) {
					phoneToReturn.text = phoneCountryCode + phoneToReturn.text;
					phoneToReturn.tel = phoneCountryCode + phoneToReturn.tel;
				}
			} else {
				for (currentIndex = 0 ; currentIndex < phoneStringToProcess.length ; currentIndex++) {
					currentCharacter = phoneStringToProcess.charAt(currentIndex);
					if ('1234567890+'.indexOf(currentCharacter) > -1) {
						phoneToReturn.tel += currentCharacter;
					}
				}
				phoneToReturn.text = phoneStringToProcess;
			}
			return phoneToReturn;
		},
		/**
		 * get directions to dealer
		 * @param elementMap
		 * @param elementDirections
		 */
		getDealerDirections: function(elementMap, elementDirections) {
			var m = _dealerFinder,
				mapOptions = {
					center : m.currentLocation.position,
					zoom : 7,
					mapTypeId : google.maps.MapTypeId.ROADMAP
				},
				panelDirections = elementDirections[0];

			m.currentMap = new google.maps.Map(elementMap[0], mapOptions);

			var renderOptions = {
					map : m.currentMap,
					suppressMarkers : true
				},
				directionsDisplay = new google.maps.DirectionsRenderer(renderOptions),
				directionsService = new google.maps.DirectionsService();

			var request = {
				origin: m.currentLocation.position,
				destination: m.currentDealer.position,
				travelMode: google.maps.DirectionsTravelMode.DRIVING,
				unitSystem: google.maps.DirectionsUnitSystem.METRIC
			};

			panelDirections.innerHTML = '';
			directionsDisplay.setPanel(panelDirections);
			directionsService.route(request, function(response, status) {
				if (status === google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
				}
			});

			m.setMarker(98, m.currentLocation);
			m.setMarker(-1, m.currentDealer);

			m.trackDisplayResultsRequestDealerDirections();
		},

		/**
		 * handles search in dealer UI
		 * @param e
		 */
		handleSearch: function(e) {
			e.preventDefault();

			var m = _dealerFinder,
				tokenMapsLoad = PubSub.subscribe(T1.constants.GOOGLE_MAP_LOAD, function(){
					m.search(e);
					PubSub.unsubscribe(tokenMapsLoad);
				});

			if (!m.googleMapsLoaded) {
				m.initMaps();
			} else {
				PubSub.publishSync(T1.constants.GOOGLE_MAP_LOAD);
			}
		},
		/**
		 * handles use my location link
		 * @param e
		 */
		handleCurrentLocation: function(e) {
			var m = _dealerFinder,
				geoLocation = navigator.geolocation;

			e.preventDefault();

			if (geoLocation) {
				//	geoLocation.getCurrentPosition(m.handlePosition, m.handlePositionFail);
				geoLocation.getCurrentPosition(m.handlePosition, m.handlePositionFail);
			} else {
				m.setError(T1.labels.dealer.errorGeoNotFound);
			}
		},

		/**
		 * geoLocator callback
		 * @param position
		 */
		handlePosition: function(position) {
			var m = _dealerFinder,
			tokenMapsLoad = PubSub.subscribe(T1.constants.GOOGLE_MAP_LOAD, function(){
				m.convertPositionToAddress(position);
				PubSub.unsubscribe(tokenMapsLoad);
			});

			if (!m.googleMapsLoaded) {
				m.initMaps();
			} else {
				PubSub.publishSync(T1.constants.GOOGLE_MAP_LOAD);
			}
		},
		handlePositionFail: function() {
			var m = _dealerFinder,
				geoLocation = navigator.geolocation,
				options = {
					maximumAge: 30000,
					timeout: 5000,
					enableHighAccuracy: false
				};

			geoLocation.getCurrentPosition(m.handlePosition, options);
		},
		/**
		 * handles maps API loaded
		 */
		handleAPILoad: function() {
			PubSub.publishSync(T1.constants.GOOGLE_MAP_LOAD);
			if (Modernizr.geolocation) {
				_dealerView.showGeoLink();
			}
		},
		/**
		 * handles nearest dealers request if success
		 * @param data
		 * @param textStatus
		 * @param jqXHR
		 */
		handleDealersByLocation: function(data, textStatus, jqXHR) {
			var m = _dealerFinder,
				view = _dealerView,
				s = T1.settings,
				t = T1.labels.dealer,
				list = $('<ul></ul>'),
				dataObject,
				dealers;

			try {
				dataObject = $.parseJSON(data);
			} catch (e) {
				dataObject = data;
			}

			dealers = dataObject.dealers;
			m.amountOfDealers = dealers.length;

			if (m.amountOfDealers === 0) {
				m.setError(t.errorDealersNotFound);
				if(m.currentStep !== 1) {
					m.setStepBack();
				}

				/*
				PubSub.publish(T1.constants.TOAST_CUSTOM, {
				customText: t.errorDealersNotFound,
				customContainer: $("#pane-dealer"),
				timeout: 2000
				});
				*/
			} else {
				if (m.currentStep === 1) {
					m.setStepForward();
				}

				$.each(dealers, function(index, element) {
					var item = $('<li></li>'),
						link = $('<a href="#"></a>'),
						html = '<span>' + (index + 1) + '</span>',
						dealerName = m.htmlDecode(element.name),
						dealerGeo = element.address.geo;

					html += '<span>' + dealerName + '</span>';
					if (element.drive && element.drive.length > 0){
						html += '<b>' + element.drive[0].distance.text + '</b>';
					} else {
						html += '<b>' + Math.round((element.distance) * 10) / 10 + ' ' + s.dealer.distanceUnit + '</b>';
					}
					html += '<i class="icon-chevron-right"></i>';

					link.html('<div>' + html + '</div>');
					link.click(function(e) {
						e.preventDefault();
						m.getDealerDetail(index, element);
						m.trackClickDealerDetail(element);
					});

					if (index === 0 && !m.isMobile()) {
						item.addClass('active');
						m.getDealerDetail(index, element);
					}

					item.append(link);
					list.append(item);
				});

				view.setListDealers(list);

				m.getMapForDealers(view.getMapDealers(m.currentStep), dealers);

				view.setSubHeader(m.currentStep, t.dealersFound.replace('{%0}', m.amountOfDealers));

				PubSub.publish(T1.constants.DEALERS_FOUND, dealers);
			}
		},
		/**
		 * handles nearest dealers request if error
		 * @param jqXHR
		 * @param textStatus
		 * @param error
		 */
		handleDealersByLocationError: function(jqXHR, textStatus, error) {
			var m = _dealerFinder;

			m.setError(jqXHR.responseText);
			m.setStepBack();
		},
		handleKeyPress: function(e) {
			if (e.keyCode === 13) {
				e.preventDefault();
				PubSub.publish(T1.constants.STATS_TRACK, {node: $(this).parent().find('.btn-search-dealers')});
				_dealerFinder.handleSearch(e);
				_dealerFinder.hideVirtualKeyboard();
			}
		},
		hideVirtualKeyboard: function() {
			// fix ipad virtual keyboard bug
			if(document.activeElement) {
				document.activeElement.blur();
			}
		},
		/**
		 * handle CTA get directions click
		 * @param e
		 */
		handleCTADirections: function(e) {
			var m = _dealerFinder,
				view = _dealerView;

			e.preventDefault();

			if (m.isMobile()) {
				view.mobileCTADirections = $(e.target).parent();
				view.mobileDefaultHeaderStep3 = view.getHeader(3);
				view.setMobileStep3(true);
			}

			m.trackRequestDealerDirections();
		},
		handleCTAPrint: function(e) {
			var url = '/dealer-print.html',
				print = window.open(url, 'Print dealer', 'width=600,height=800');

			e.preventDefault();

			print.dealer = _dealerFinder.currentDealerData;
			print.labels = T1.labels;
		},
		handleCTASave: function(e) {
			var m = _dealerFinder,
				c = T1.constants;
			e.preventDefault();

			PubSub.publish(
				c.DEALER_SAVE,
				{
					search: {
						query: m.currentSearchAddress,
						options: m.currentSearchOptions
					},
					dealer: m.currentDealerData
				}
			);

			m.eventTokens.savedDealerDone = PubSub.subscribe(c.MY_TOYOTA_SAVED_DEALER, function(event, data) {
				PubSub.publish(T1.constants.TOAST_CUSTOM, {
					customText: T1.labels.mytoyota.dealerSaved,
					customContainer: $('#pane-dealer'),
					timeout: 2000
				});
				m.clearSaveDealerEvents();
			});

			m.eventTokens.dealerAlreadySaved = PubSub.subscribe(c.MY_TOYOTA_DEALER_ALREADY_SAVED, function(event, data) {
				PubSub.publish(T1.constants.TOAST_CUSTOM, {
					customText: T1.labels.mytoyota.dealerAlreadySaved,
					customContainer: $('#pane-dealer'),
					timeout: 2000
				});
				m.clearSaveDealerEvents();
			});

			m.eventTokens.savedDealerFail = PubSub.subscribe(c.MY_TOYOTA_SAVE_DEALER_FAILED, function(event, data) {
				PubSub.publish(T1.constants.TOAST_CUSTOM, {
					customText: data.error,
					customContainer: $('#pane-dealer'),
					timeout: 2000
				});
				m.clearSaveDealerEvents();
			});

			m.trackClickDealerSave();
		},
		clearSaveDealerEvents: function() {
			PubSub.unsubscribe(_dealerFinder.eventTokens.savedDealerDone);
			PubSub.unsubscribe(_dealerFinder.eventTokens.savedDealerFail);
			PubSub.unsubscribe(_dealerFinder.eventTokens.dealerAlreadySaved);
		},
		/**
		 * search location/directions
		 * @param e
		 */
		search: function(e) {
			var m = _dealerFinder,
				view = _dealerView,
				c = T1.constants;

			//e.preventDefault();
			m.setValid();
			m.isSearch = true;

			// triggered by button or enter?
			if (e.type === 'click') {
				view.buttonSearch = $(e.target).parent();
			} else {
				view.buttonSearch = $(e.target).siblings('.btn-search');
			}

			m.currentSearchAddress = view.getSearchField(false).val();
			m.currentSearchOptions = [];

			// check if inpage dealerfinder
			if (view.buttonSearch.hasClass('btn-search-in-page')) {
				var initSearchAddress = m.currentSearchAddress;
				var initSearchOptions = {};

				var url = '/ajax/',
					urlContent = T1.settings.dealer.formUrl + '?tab=pane-dealer';

				var optsHolder = $(".search-options", view.buttonSearch.closest('section'));
				var opts = $("input[name='options']", optsHolder);
				opts.each(function(i, e) {
					var $this = $(this);
					if($this.is(":checked")) {
						initSearchOptions[$this.val()] = $this.val();
						if ($this.val().length>0) {
							m.currentSearchOptions.push(this);
						}
					}
				});

				if (m.currentSearchAddress.length > 0) {
					m.currentStep = 2;

					if (!m.eventTokens.getDealersOrGeo) {
						m.eventTokens.getDealersOrGeo = PubSub.subscribe(c.PAGEOVERLAYER_LOAD, function() {
							m.initOverlayerGUI(initSearchAddress, initSearchOptions);
							m.getDealersOrGeo(m.currentSearchOptions);
						});
					}
				} else {
					m.currentStep = 1;

					if (!m.eventTokens.getDealersOrGeo) {
						m.eventTokens.getDealersOrGeo = PubSub.subscribe(c.PAGEOVERLAYER_LOAD, function() {
							m.initOverlayerGUI(initSearchAddress, initSearchOptions);
							m.setError(T1.labels.dealer.errorNoValue);
						});
					}

				}
				view.setButtonBackDisplay(true);

				PubSub.publish(c.HASH_ADD, url + encodeURIComponent(urlContent));
			} else {
				if (m.currentSearchAddress.length < 1) {
					m.setError(T1.labels.dealer.errorNoValue);
					return;
				}
				if (m.currentStep !== 1) {
					m.setStepForward();
				}
				m.getDealersOrGeo();
			}
		},
		/**
		 * convert coordinates to address
		 * @param position
		 */
		convertPositionToAddress: function(position) {
			var m = _dealerFinder,
				geoCoder = new google.maps.Geocoder(),
				latitude = position.coords.latitude,
				longitude = position.coords.longitude,
				gPosition = new google.maps.LatLng(latitude, longitude);

			m.currentLocation.position = gPosition;

			geoCoder.geocode(
				{'latLng': gPosition},
				m.handleGeoCodingReverse
			);
		},

		/**
		 * geocoder (address to coordinates)
		 * @param results
		 * @param status
		 */
		handleGeoCoding: function(results, status, options) {
			var m = _dealerFinder,
				service = _dealerService,
				view = _dealerView,
				t = T1.labels.dealer,
				location;

			if (status === google.maps.GeocoderStatus.OK || status === google.maps.GeocoderStatus.ZERO_RESULTS) {
				if(status === google.maps.GeocoderStatus.ZERO_RESULTS){
					if(m.currentStep === 3 || (m.currentStep === 4 && m.isMobile())){
						m.setStep(2);
					}
					m.setError(t.errorGeoNotFound);
					return;
				}else{
					location = results[0].geometry.location;
					m.currentLocation.position = new google.maps.LatLng(location.lat(), location.lng());
					m.currentLocation.address = results[0].formatted_address;
				}
			} else {
				m.setStep(1);
				m.setError(t.errorGeoFailed);
				return;
			}

			if (m.currentStep < 3) {
				service.getDealersByLocation(m.currentLocation, options);
			} else {
				if (m.currentStep === 3 && !m.isMobile()) {
					m.setStepForward();
				}
				m.getDealerDirections(view.getMapDealers(m.currentStep), view.getElement('.directions'));
			}
		},
		/**
		 * reverse geocoder (coordinates to address)
		 * @param results
		 * @param status
		 */
		handleGeoCodingReverse: function(results, status) {
			var m = _dealerFinder,
				view = _dealerView,
				t = T1.labels.dealer,
				address;

			if (status === google.maps.GeocoderStatus.OK) {
				if (results[1]) {
					m.currentLocation.address = address = results[1].formatted_address;
				} else {
					m.setError(t.errorGeoNotFound);
				}
			} else {
				m.setStepBack();
				m.setError(t.errorGeoFailed);
				return;
			}
			view.setSearchField(address);
		},

		/**
		 * set dealer events
		 */
		setEvents: function() {
			var m = _dealerFinder,
				view = _dealerView,
				inputSearch = view.getSearchField();
			//currentForm = $('form, .form');

			//currentForm.off('keypress');
			inputSearch.off('keydown', m.handleKeyPress).on('keydown', m.handleKeyPress);

			view.getElement('.btn-search').off('click', m.handleSearch).on('click', m.handleSearch);
			view.getElement('.btn-back').off('click', m.setStepBack).on('click', m.setStepBack);
			view.getLinkLocation().off('click', m.handleCurrentLocation).on('click', m.handleCurrentLocation);
		},
		/**
		 * add marker to current map
		 * @param {int} index
		 * @param {LatLng} element
		 */
		setMarker: function(index, element) {
			var m = _dealerFinder,
				marker,
				markerNumber = (index < 9)? '0' + (index + 1) : (index + 1),
				markerPath = T1.settings.dealer.markerPath + 'marker' + markerNumber + '.png',
			//	markerPosition = element.position || element.address.origin;
				markerPosition = element.position || element.address.geo;

			// convert to google latlng object if needed
			if (markerPosition.lat && typeof markerPosition.lat==='number') {
				markerPosition = new google.maps.LatLng(markerPosition.lat, markerPosition.lon);
			}

			marker = new google.maps.Marker({
				position : markerPosition,
				icon : markerPath,
				map : m.currentMap
			});

			if (m.currentStep < 3) {
				google.maps.event.addListener(marker, 'click', function() {
					m.getDealerDetail(index, element);
					m.trackClickDealerDetail(element);
				});
			}
		},
		setStepForward: function(e) {
			var m = _dealerFinder;

			if (e) {
				e.preventDefault();
			}
			m.setStep(m.currentStep * 1 + 1);
		},
		setStepBack: function(e) {
			var m = _dealerFinder,
				view = _dealerView,
				t = T1.labels.dealer;

			if (e) {
				e.preventDefault();
			}
			if (!m.isMobile() && m.currentStep === 4) {
				m.currentStep--;
			}
			if (view.mobileCTADirections) {
				view.setMobileStep3(false);
				delete view.mobileCTADirections;
				if (m.currentStep === 3) {
					m.currentStep++;		// temporarily increment to 4 to counteract next statement which decrements currentStep by 1
				}
			}

			m.setStep(m.currentStep * 1 - 1);

			if (m.currentStep === 1) {
				view.setSubHeader(m.currentStep, t.dealerSearchBy, 0);
				view.setSubHeader(m.currentStep, t.dealerSearchOptions, 1);
			}

			if (m.currentStep === 1) {
				m.trackDisplayDealerForm();
			} else if (m.currentStep === 2) {
				m.trackDisplayDealerResultsScreen();
			} else if (m.currentStep === 3) {
				m.trackClickDealerDetail(m.currentDealerData);
			}
		},
		/**
		 * set dealerfinder step
		 * @param step
		 */
		setStep: function(step) {
			var m = _dealerFinder,
				view = _dealerView,
				c = T1.constants,
				stepClass = '.dealer-step',
				stepContainers = view.container.find(stepClass);

			m.currentStep = step;

			view.setButtonBackDisplay(step > 1);

			stepContainers.removeClass(c.CLASS_ACTIVE);
			stepContainers.filter(stepClass + '-' + step).addClass(c.CLASS_ACTIVE);
		},
		setError: function(message) {
			// TODO: remove
			console.log('dealerfinder error: ' + message);

			PubSub.publish(T1.constants.FORM_ERROR, message);
		},
		setValid: function() {
			_dealerView.getElement('.error-message').html('');
		},

		/**
		 * dirty html decoder, look for backend solution?
		 * @param value
		 * @returns {*|jQuery}
		 */
		htmlDecode: function(value) {
			return $('<div/>').html(value).text();
		},
		isMobile: function() {
			return window.innerWidth < T1.constants.SCREEN_SMALL;
		}
	};

	var _dealerView = {
		container: null,
		buttonBack: null,
		buttonSearch: null,
		linkLocation: null,
		mapDealers: null,
		listDealers: null,
		searchField: null,
		/**
		 * get element
		 * @param selector
		 * @returns {*|Mixed}
		 */
		getElement: function(selector) {
			var m = _dealerView;

			return m.getContainer().find(selector);
		},
		/**
		 * set element
		 * @param selector
		 * @param value
		 */
		setElement: function(selector, value) {
			_dealerView.getElement(selector).val(value);
		},
		getContainer: function() {
			var m = _dealerView;
			if (!m.container || m.container.length < 1) {
				m.container = $('#pane-dealer,.dealer-finder.in-page');
			}
			return m.container;
		},
		setContainer: function(selector) {
			_dealerView.container = $(selector);
		},
		/**
		 * get back button element
		 * @returns {null|*|Mixed}
		 */
		getButtonBack: function() {
			var m = _dealerView;
			if (!m.buttonBack || m.buttonBack.length < 1) {
				m.buttonBack = m.getElement('.btn-back');
			}
			return m.buttonBack;
		},
		/**
		 * get link element
		 * @returns {null|*}
		 */
		getLinkLocation: function(cached) {
			var m = _dealerView;
			if (!cached) {
				m.linkLocation = m.getElement('.geo-location');
			}
			return m.linkLocation;
		},
		/**
		 * get map element
		 * @returns {null|*}
		 */
		getMapDealers: function(step) {
			var m = _dealerView,
				stepContainer;

			if (step) {
				stepContainer = m.getElement('.dealer-step-' + step);

				m.mapDealers = stepContainer.find('.map-dealers');
			} else {
				m.getElement('.map-dealers');
			}
			return m.mapDealers;
		},
		/**
		 * get search input element
		 * @returns {null|*|Mixed}
		 */
		getSearchField: function(cached) {
			var m = _dealerView;

			if (!cached) {
				if (m.buttonSearch && m.buttonSearch.length > 0) {
					m.searchField = m.buttonSearch.siblings('input[type="text"]');
				} else {
					m.searchField = m.getElement('.input-search input[type="text"]');
				}
			}

			return m.searchField;
		},
		/**
		 * set search input value
		 * @param value
		 */
		setSearchField: function(value) {
			var m = _dealerView;

			m.getSearchField().val(value);
			m.getElement('.input-search input[type="text"]').val(value);
		},

		/**
		 * display back button
		 */
		setButtonBackDisplay: function(visible) {
			var display = (visible) ? 'block' : 'none';

			_dealerView.getButtonBack().css('display', display);
		},
		/**
		 * display my location link
		 */
		showGeoLink: function() {
			if (Modernizr.geolocation) {
				_dealerView.getLinkLocation().css('display', 'block');
			}
		},
		/**
		 * get dealer search options (services)
		 * @returns {string}
		 */
		getOptions: function() {
			var m = _dealerView,
				options;

			if (m.searchField.length > 0) {
				options = m.searchField.parents('form, .form').find('.search-options input[name="options"][value!="selectall"]:checked');
			} else {
				options = m.getElement('input[name="options"][value!="selectall"]:checked');
			}

			return options;
		},
		serializeOptions: function(options) {
			var serviceQueryString = '&services=',
				separator = '|';

			options = $(options);

			if (options.size() < 1) {
				return '';
			}

			options.each(function() {
				var option = $(this),
					service = option[0].value.toLowerCase();

				//prius dealer service match
				if (service === 'prius') {
					service += 'dealer';
				}
				serviceQueryString += service + separator;
			});
			return serviceQueryString.slice(0, -1);
		},
		setMobileStep3: function(isRequestToSpecifyDealerDirections) {
			var m = _dealerView,
				c = m.mobileCTADirections,
				h = m.mobileDefaultHeaderStep3;

			if (c && h) {
				m.setHeader(3, isRequestToSpecifyDealerDirections ? T1.labels.dealer.dealerDirections || 'Dealer Directions' : h);
				m.getElement('.dealer-step-3 .search-form').css('display', isRequestToSpecifyDealerDirections ? 'block' : 'none');
				m.getElement('.dealer-step-3 .detail-dealer').css('display', isRequestToSpecifyDealerDirections ? 'none' : 'block');
				c.css('display', isRequestToSpecifyDealerDirections ? 'none' : 'block');
			}
		},
		/**
		 * get primary header text
		 * @param step
		 */
		getHeader: function(step) {
			var m = _dealerView,
				stepContainer = m.getElement('.dealer-step-' + step),
				header = stepContainer.find('header h2');

			return header.text();
		},
		/**
		 * set primary header
		 * @param step
		 * @param text
		 */
		setHeader: function(step, text) {
			var m = _dealerView,
				stepContainer = m.getElement('.dealer-step-' + step),
				header = stepContainer.find('header h2');

			header.html(text);
		},
		/**
		 * set secondary header
		 * @param text
		 */
		setSubHeader: function(step, text, index) {
			var m = _dealerView,
				stepContainer = m.getElement('.dealer-step-' + step),
				subHeader = stepContainer.find('h5.form-label'),
				i = index || 0;

			subHeader[i].innerHTML = text;
		},
		/**
		 * set dealer name label
		 * @param text
		 */
		setDealerName: function(text) {
			var m = _dealerView,
				subHeader = m.container.find('.dealer-name');

			subHeader.html(text);
		},
		/**
		 * set dealer address
		 * @param html
		 */
		setDealerAddress: function(html) {
			var m = _dealerView,
				dealerAddress = m.container.find('.dealer-address');

			dealerAddress.html(html);
		},
		/**
		 * set dealer services
		 * @param html
		 */
		setDealerServices: function(html) {
			var m = _dealerView,
				dealerServices = m.container.find('.dealer-services');

			dealerServices.html(html);
		},
		/**
		 * set dealer contact data
		 * @param html
		 */
		setDealerContact: function(content) {
			var m = _dealerView,
				dealerContact = m.container.find('.dealer-contact');

			dealerContact.empty();
			dealerContact.append(content);
		},
		/**
		 * set dealer hours
		 * @param html
		 */
		setDealerHours: function(html) {
			var m = _dealerView,
				dealerHours = m.container.find('.dealer-hours');

			dealerHours.html(html);
		},
		/**
		 * get dealer list container element
		 * @returns {null|*|Mixed}
		 */
		getListDealers: function(cached) {
			var m = _dealerView;

			if (!m.listDealers || m.listDealers.length < 1 || !cached) {
				m.listDealers = m.getElement('.list-dealers');
			}
			return m.listDealers;
		},
		/**
		 * fill dealer list
		 * @param object
		 */
		setListDealers: function(object) {
			var m = _dealerView;

			m.getListDealers(false).empty();

			m.listDealers.append(object);
		},
		/**
		 * set a dealer active in dealer list
		 * @param index {int} index of the dealer to activate
		 */
		setDealerActive: function(index) {
			var items = _dealerView.getListDealers().find('li');

			items.removeClass('active');
			$(items[index]).addClass('active');
		}
	};

	var _dealerService = {
		/**
		 * find nearest dealers with request
		 * @param {object} location object with lat & lng coords (optional)
		 */
		getDealersByLocation : function(location, options) {
			var control = _dealerFinder,
				c = T1.constants,
			//	urlNearest = (T1.settings.mock) ? 'http://t1-dev-' + T1.settings.country + '.herokuapp.com' + c.URL_DEALERS_NEAR : c.URL_DEALERS_NEAR,
				urlDrive = (T1.settings.mock) ? 'http://t1-dev-' + T1.settings.country + '.herokuapp.com' + c.URL_DEALERS_DRIVE : c.URL_DEALERS_DRIVE,
				slash = '/',
				lat = location.position.lat(),
				lon = location.position.lng(),
				amount = T1.settings.dealer.searchResultCount || 10;

		//	urlNearest += lon + slash + lat + '?count=' + amount;
			urlDrive += lon + slash + lat + '?count=' + amount;
			if (options.length > 0) {
			//	urlNearest += options;
				urlDrive += options;
			}

		//	var request = $.ajax({url: urlNearest});
			var request = $.ajax({url: urlDrive});
			request.done(control.handleDealersByLocation);
			request.fail(control.handleDealersByLocationError);
		}
	};

	return {
		init					: _dealerFinder.init,
		initDesktop				: _dealerFinder.initDesktop,
		initMobile				: _dealerFinder.initMobile,
		initMaps				: _dealerFinder.initMaps,
		handleAPILoad			: _dealerFinder.handleAPILoad,
		handleGeoCoding			: _dealerFinder.handleGeoCoding,
		handleGeoCodingReverse	: _dealerFinder.handleGeoCodingReverse
	};
}());