var T1 = T1 || {};

T1.carconfig = (
	function() {
		'use strict';

		var _private = {
			params: {},
			tokens: {},
			urlContent: null,
			viewportMeta: null,
			init: function() {
				var m = _private;

				m.urlContent = T1.settings.carconfig.urlContent || '/mockups/carconfig/index.html';

				// trigger carconfig load from anywhere
				m.tokens.load = PubSub.subscribe(T1.constants.CARCONFIG_LOAD, m.openCarConfig);
			},
			setCarConfigParams: function() {
				var m = _private,
					frame = $('.overlayerContent iframe[src="' + m.urlContent + '"]'),
					ccWindow = frame[0].contentWindow;

			//	console.log('---------------5:publish overlay ready');

			//	ccWindow.postMessage(T1.constants.OVERLAY_READY, '*', m.params);
				ccWindow.PubSub.publish(T1.constants.OVERLAY_READY, m.params);

			//	console.log('---------------6:publish overlay done');

				PubSub.unsubscribe(m.tokens.overlay);
			},
			/**
			 * open overlayer with carconfig in iframe
			 *
			 * @param msg
			 * @param data
			 */
			openCarConfig: function(msg, data) {
				var m = _private;

				m.params = data;

				//handle scaling
				if (Modernizr.touch) {
					m.scale();
					m.tokens.overlayclose = PubSub.subscribe(T1.constants.PAGEOVERLAYER_REOPEN_MAINCONTENT, m.resetScale);
				}

				//open the carconfig
				if (T1.utilities.currentBreakpoint() === 'xs') {
					// if mobile, redirect to mobile cc
					m.tokens.openMobile = PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, m.openCarConfigMobile);

					// open the mobile cc (if it is not present, fetch the code and inject it into the page)
					if ($('#minicarconfig').length === 0) {
						var htmCarconfigMini = m.getCarconfigMiniHtm();
						PubSub.publishSync(T1.constants.MOBILE_OPEN, {section: $(htmCarconfigMini)});
					} else {
						PubSub.publishSync(T1.constants.MOBILE_OPEN, {id: 'minicarconfig'});
					}
				} else {
					if(T1.settings.carconfig.inOverlay === 'true') {
						m.tokens.overlay = PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, m.setCarConfigParams);
						PubSub.publishSync(T1.constants.PAGEOVERLAYER_OPEN, {iframe: true, url: m.urlContent, sync: true, noScroll: !T1.utilities.isIOS()});
					} else {
						//build the query string from the data object
						var qs = '?';
						for(var el in data){
							qs += el + '=' + data[el] + '&';
						}
						//switch location
						window.location = '/carconfig' + qs.replace(/(\&|\?)*$/g, '');
					}
				}
			},

			getCarconfigMiniHtm: function(){
				var m = _private,
					ccMini = null;

				var deferred = $.ajax({
					'async': false,
					'url': '/assets/carconfig-mini-inject.htm'
				});

				return deferred.responseText;
			},

			openCarConfigMobile: function(msg, data) {
				var m = _private;

				PubSub.unsubscribe(m.tokens.openMobile);

				// pass on data to the minicc
				PubSub.publish(T1.constants.CARCONFIG_MINI_INIT, {repositionImage: true});
				PubSub.publish(T1.constants.CARCONFIG_MINI_LOAD, m.params);
			},

			/**
			 * scale the iframe content to be 1100 px wide (even if the screen res is lower) # Carconfig responsive quick fix @ tablets
			 */
			scale: function(){
				if (T1.utilities.currentBreakpoint() !== 'xs') {
					var m = _private,
						meta = $('head').find('meta[name=viewport]');
					if (!m.viewportMeta) {
						m.viewportMeta = meta.attr('content');
					}
					meta.attr('content', 'width=1100px;');
				}
			},

			/**
			 * remove the content stretch and restore it to it's original width # Carconfig responsive quick fix @ tablets
			 */
			resetScale: function(){
				if (T1.utilities.currentBreakpoint() !== 'xs') {
					var m = _private,
						meta = $('head').find('meta[name=viewport]');
					meta.attr('content', m.viewportMeta);
					PubSub.unsubscribe(m.tokens.overlayclose);
				}
			},

			/**
			 * TEMP nl production functions
			 */
			nlOffer: function(ccCode){
				var proxy = (T1.settings.mock)? 'http://t1-preview-proxy.herokuapp.com' : T1.settings.loadSaveServer;
				// get data
				$.ajax({
					url: proxy + '/config/' + ccCode + '/xml/full'
				}).done(function(obj, status, data){
					// open the offer link
					PubSub.publish(T1.constants.FORM_CROSS_DOMAIN_POST, {
						action: 'http://taxatiemodule.toyota.nl/',
						target: '_blank',
						fields: {
							configuration: data.responseText
						}
					});
				});
			},

			nlFinance: function(ccCode){
				var proxy = (T1.settings.mock)? 'http://t1-preview-proxy.herokuapp.com' : T1.settings.loadSaveServer;
				// get data
				$.ajax({
					url: proxy + '/config/' + ccCode + '/xml/legacy'
				}).done(function(obj, status, data){
					// open the offer link
					PubSub.publish(T1.constants.FORM_CROSS_DOMAIN_POST, {
						action: 'http://calculator.toyotafs.nl/asp/carconfig.asp?countrycode=&lnksrc=3948cd6a55c4f1b225cfc1f6c1a50845',
						target: '_blank',
						fields: {
							configuration: data.responseText
						}
					});
				});
			}

		};
		return {
			init: _private.init,
			openCarConfig: _private.openCarConfig,
			/* TMP functions production NL */
			nlOffer: _private.nlOffer,
			nlFinance: _private.nlFinance
		};
	}
());
