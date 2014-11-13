/**
 * carconfig 2.0
 *
 * KGH: change loading logic
 */
var T1 = T1 || {},
	carconfig = (
		function () {
			'use strict';

			// _carconfig var for facade pattern (return public vars/functions)
			var _carconfig = {
				carConfig: null,
				isIframe: false,
				inOverlay: true,
				eventWindow: false,
				parameters : {},
				configCode: '',
				isSummary: false,
				ctaType: '',
				initStep: 0,
				init: function() {
					var m = _carconfig;
					// Check the Brighttag datalayer
					if (window.t1DataLayer) {
						T1.statistics.init();
					}

					try {
						m.inOverlay = T1.settings.carconfig.inOverlay === 'true';
					} catch (err) {
						console.log(err.message);
					}
					
					T1.settings.carconfig.hideChangeModelButton = (!m.inOverlay && _utilities.inIframe());
					
					if (m.inOverlay && _utilities.inIframe()) {
						PubSub.subscribe(T1.constants.OVERLAY_READY, m.initCarConfig);
					} else {
						m.initCarConfig('standalone', _utilities.getQueryStringParameters());

						// Publish the required JS file on the page to
						//	console.log("stand alone: injecting JS: ", $("body"));
						var script = document.createElement('script');
						script.type = 'text/javascript';
						script.src = '/scripts/vendor-iframe-resizer.js';

						$('body').append(script);
					}
				},
				/**
				 * initializes the car-configurator on demand
				 */
				initCarConfig: function(msg, data) {
					var m = _carconfig,
						preconfig,
						settings = T1.settings.carconfig,
						labels = T1.labels.carconfig,
						context;

					preconfig = m.getPreConfig(data);

					if (T1.context.carconfig) {
						context = T1.context.carconfig;
					} else {
						console.log('no context');
						return;
					}

					// Set the eco images
					T1.settings.carconfig.ecoImages = T1.settings.ecoLabel.images;
					T1.settings.carconfig.ctaTypes = T1.constants.CTA_TYPES;

					// set eventwindow to parent if iframe or standalone window
					m.eventWindow = m.eventWindow || (m.isIframe)? window.parent : window;

					// Initialize the salesman code
					m.initSalesman();

					// init cc object
					m.carConfig = new be.marlon.ui.CarConfig($('#tmxcc-v6'), settings, labels, context, preconfig);
					
					// bind events
					m.setEvents();
					m.setCTAEvents();
				},
				/**
				 * compose preconfig
				 * @param data
				 * @returns {{}}
				 */
				getPreConfig: function(data) {
					// preconfig as empty object so we can immediately add properties
					var preconfig = {},
						urlCCLoad = T1.settings.loadSaveHost,
						modelMap = T1.settings.modelMap,
						validIds;

					// return null if no qsparams
					if ($.isEmptyObject(data)) {
						return null;
					} else {
						validIds = ["modelid","submodelid","carid","bodytypeid","engineid","fueltypeid","transmissionid","wheeldriveid","gradeid","exteriorcolourid","upholsteryid","wheelid","inlayid"];
						$.each(data, function (key, value) {
							// tyCode should immediately output url string
							if (key === 'tyCode') {
								preconfig = urlCCLoad + '/' + value + '/legacy';
								// quit 'each' loop
								return false;
							} else {
								// model name should be mapped to modelID
								if (key === 'model') {
									var reqModelName = value.toLowerCase();
									$.each(modelMap, function (modelCode, model) {
										var modelName = model.name.toLowerCase();

										modelCode = modelCode.toLowerCase();

										if (modelName === reqModelName) {
											value = model.id;
											// quit only this loop
											return false;
										} else if (modelCode === reqModelName) {
											value = model.id;
											// quit only this loop
											return false;
										}
									});
									//	preconfig.modelid = value;
									T1.settings.carconfig.modelID = value;
									preconfig = null;
								} else if (typeof key === 'string' && _.indexOf(validIds, key.toLowerCase()) > -1) {
									preconfig[key] = value;
								}
							}
						});
					}

					// Carconfig won't load if the preconfig is an object, without any properties...
					if($.isEmptyObject(preconfig)) {
						preconfig = null;
					}

					return preconfig;
				},
				/**
				 * initializes the car-configurator salesman integration on demand
				 */
				initSalesman: function()
				{
					/* SALESMAN - SETUP */
					var isSalesmanSlave = (getQueryValue('salesmanslave') === "true");
					var isSalesmanMaster = (getQueryValue('salesmanmaster') === "true");

					if(isSalesmanMaster)
					{
						$(document).click(function(e) {
							handleGlobalClick(e.target);
						});
						PubSub.subscribe(be.marlon.utils.TOUCH_CLICK, handleItemTouchClick);
					}

					if(isSalesmanSlave)
					{
						var hidePrices = (getQueryValue('hideprices') === "true"),
							settings = T1.settings.carconfig;
						if(hidePrices)
						{
							settings.showPrice = false;
							settings.showFinanceButtonCarConfig = false;
							settings.showInsuranceButtonCarConfig = false;
							settings.showMonthlyRateCarConfig = false;
							settings.usePromo = false;
						}
					}

					// Set the setting on the carconfig settings, to hide specific UI elements
					T1.settings.carconfig.isSalesmanSlave = isSalesmanSlave;
					T1.settings.carconfig.isSalesmanMaster = isSalesmanMaster;

					if(isSalesmanMaster || isSalesmanSlave)
					{
						PubSub.subscribe("cc_salesman_proaceslider", handleProAceSlider);
						PubSub.subscribe("cc_salesman_hlistswipe", handleGlobalHListSwipe);
						PubSub.subscribe("cc_salesman_extspinswipe", handleGlobalExtSpinSwipe);
						PubSub.subscribe("cc_salesman_intspinswipe", handleGlobalIntSpinSwipe);

						PubSub.subscribe("cc_start_load", startLoadHandler);
						PubSub.subscribe("cc_stop_load", stopLoadHandler);
					}

					/* ////////////////////////////////////////////////////////////////// */
					// SALESMAN UTIL METHODS
					/* ////////////////////////////////////////////////////////////////// */

					/* SALESMAN - GET URL QUERY-STRING VALUES */
					function getQueryValue (name) {
						name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
						var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
							results = regex.exec(location.search);
						return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
					}

					/* SALESMAN - REQUEST FOR ACTION CALLING THE IOS BROWSER */
					var rfaTimer = false;
					var rfaQueue = [];

					var rfaForceTimer = false;
					var rfaForceLast = null;

					function passToAppByForce(string)
					{
						if (isSalesmanMaster || isSalesmanSlave) {
							if (rfaQueue.length === 0)
							{
								// Save last Bf request
								rfaForceLast = string;
								if (!rfaForceTimer) {
									//rfaForceTick();
									rfaForceTimer = setInterval(rfaForceTick, 33); // 33 ms = 30fps
								}
							}
						}
					}

					function rfaForceTick()
					{
						if (rfaForceLast !== "") {
							// Execute last known rfa, clear placeholder
							window.location = "request_for_action://" + rfaForceLast;
							rfaForceLast = "";
						} else {
							// Last rfaForce executed, stop timer
							clearInterval(rfaForceTimer);
							rfaForceTimer = null;
						}
					}

					function passToApp(string, bruteForce)
					{
						// Stop rfaForce calls
						rfaForceLast = "";
						//
						if (isSalesmanMaster || isSalesmanSlave) {
							rfaQueue.push(string);
							if (!rfaTimer) {
								//rfaQueueTick();
								rfaTimer = setInterval(rfaQueueTick, 100);
							}
						}
					}

					function rfaQueueTick()
					{
						if (rfaQueue.length > 0) {
							var string = rfaQueue.shift();
							window.location = "request_for_action://" + string;
							//console.log(" > [ RFA ] > > > > > " + string);
						} else {
							clearInterval(rfaTimer);
							rfaTimer = false;
						}
					}

					/* ////////////////////////////////////////////////////////////////// */
					// MASTER INTERACTION HANDLERS
					/* ////////////////////////////////////////////////////////////////// */

					function handleGlobalClick(target) {
						if(!isSalesmanSlave && target && target.dataset) {
							// GET FULL REACTID
							var reactID = target.dataset.reactid;
							if (!reactID) return false;
							// BUILD DOM PATH TO ROOT NODE/CONAINER
							//var rootElement = $('*[data-reactid="' + rootReactID + '"]')[0];
							var rootElement = $('*[data-reactid="' + reactID + '"]')[0];
							//var rootDomPath = rootElement.localName + "." + rootElement.classList[0];
							// PASS TO iOS
							passToApp("targetID=" + reactID);
						}
					}
					
					function handleItemTouchClick(msg, data)
					{
						passToApp("targetID=" + data + "&reactTouch=true");
					}
					
					function handleGlobalHListSwipe(msg, data) {
						handleGlobalClick(data);
					}

					function handleGlobalExtSpinSwipe(msg, data) {
						passToAppByForce("extspin=" + data);
					}

					function handleGlobalIntSpinSwipe(msg, data) {
						passToAppByForce("intspinh=" + data.horizontal + "&intspinv=" + data.vertical);
					}

					function handleProAceSlider(msg, data) {
						passToAppByForce("proaceslider=" + data.code + "." + data.key + "." + data.hash + "." + data.carindex);
					}

					function startLoadHandler()
					{
						passToApp("isLoading=" + true);
					}

					function stopLoadHandler()
					{
						passToApp("isLoading=" + false);
					}

					/* ////////////////////////////////////////////////////////////////// */
					// SLAVE SIMULATION HANDLERS
					/* ////////////////////////////////////////////////////////////////// */

					/* SALESMAN - IF I AM SLAVE, SIMULATE DOM CLICK */
					// Make this globally accessible, this is required to mirror functionality //
					T1.salesman = {
						simulateInteraction:function(rfaString) {
							if (isSalesmanSlave) {
								// DECODE URI
								rfaString = decodeURI(rfaString);
								// SPLIT REQUEST INTO ARRAY
								var requests = rfaString.split('&');
								// GET QUERY VALUES
								var targetID = findQueryVal(requests, 'targetID'),
									extspinFrame = findQueryVal(requests, 'extspin'),
									intspinHorizontal = findQueryVal(requests, 'intspinh'),
									intspinVertical = findQueryVal(requests, 'intspinv'),
									proaceslider = findQueryVal(requests, 'proaceslider'),
									reactTouch = findQueryVal(requests, 'reactTouch');

								// CLICK > SIMULATE IT
								if (targetID !== null) {
									// FIND MATCHING ELEMENTS
									var elements = $('*[data-reactid="' + targetID + '"]');
									// TRY TO SIMULATE CLICK
									if (elements.length) {
										if(reactTouch)
										{
											React.addons.TestUtils.Simulate.touchEnd(elements[0]);
										}
										else
										{
											elements[0].click();
										}
									} else {
										alert("NOTHING FOUND FOR: " + targetID);
									}
								}
								// EXT SPIN > SIMULATE IT
								if (extspinFrame !== null) {
									//$.publish('simulateExtSpinSwipe', [extspinFrame]);
									PubSub.publish("cc_simulate_extspinswipe", extspinFrame);
								}
								// INT SPIN > SIMULATE IT
								if (intspinHorizontal !== null && intspinVertical !== null) {
									//$.publish('simulateIntSpinSwipe', [intspinHorizontal, intspinVertical]);
									PubSub.publish("cc_simulate_intspinswipe", {horizontal:intspinHorizontal, vertical:intspinVertical});
								}
								// PRO ACE SLIDER > SIMULATE IT
								if (proaceslider !== null) {
									PubSub.publish("cc_simulate_proaceslider", proaceslider);
								}
							}
						}
					};

					// proaceslider=TYPE_SLIDER_1.0.059c819f-6685-48a9-94be-d10d83e78ba8.92,93,94,95,96

					function findQueryVal(list, name) {
						var value = null;
						$.each(list, function(i, r) {
							if (r.indexOf(name) !== -1)
								value = r.substr(name.length + 1); // +1 is for "=" sign
						});
						return value;
					}
				},

				setEvents: function() {
					var m = _carconfig;

					PubSub.subscribe(m.carConfig.AUTO_SAVE, m.handleCCAutoSave);
					PubSub.subscribe(m.carConfig.CONFIG_SAVED, m.handleCCAutoSaved);
					PubSub.unsubscribe(m.initCarConfig);
				},
				/**
				 * bind CC CTA buttons
				 */
				setCTAEvents: function() {
					var m = _carconfig,
						ctaSelector = '.cc-btn[data-link]';

					//$('body').off('click', ctaSelector, m.handleCTAEvents).on('click', ctaSelector, m.handleCTAEvents);
					PubSub.unsubscribe(m.handleCTAEvents);
					PubSub.subscribe(m.carConfig.CTA_CLICKED, m.handleCTAEvents);
				},
				/**
				 * handle CC CTA buttons
				 * @param e
				 */
				//handleCTAEvents: function(e) {
				handleCTAEvents: function(msg, target) {
					var m = _carconfig,
						settings = T1.settings.carconfig,
						//target = $(e.target),
						cta = target.attr('data-link') ? target : target.parent(),
						ctaType = m.ctaType = cta.attr('data-link'),
						ctaTypes = T1.constants.CTA_TYPES,
						ctaTarget = cta.attr('target'),
						ctaUrl = cta.attr('href'),
						urlAjax = '/ajax/',
						urlFrame = '/iframe/',
						urlSend = settings.urlSendToDealer || '/forms/send-to-dealer.json?tab=pane-contact-dealer',
						urlForm = T1.settings.dealer.formUrl,
						urlLoad = '/publish/my_toyota_my_cars',
						bt = be.marlon.Brighttag;

					//e.preventDefault();
					m.eventWindow = m.eventWindow || (m.isIframe)? window.parent : window;

					// SEND to dealer
					if (ctaType === ctaTypes.SEND) {
						bt.trackCTAClicked({
							value: 'send_to_dealer',
							workflowname: 'send_to_dealer',
							workflowstep: '0'
						});
						if (urlSend.indexOf('?') > -1) {
							urlSend += '&car=' + m.configCode;
						} else {
							urlSend += '?car=' + m.configCode;
						}
						m.eventWindow.PubSub.publish(T1.constants.HASH_ADD, urlAjax + encodeURIComponent(urlSend));
						// DOWNLOAD pdf
					} else if (ctaType === ctaTypes.DOWNLOAD) {
						bt.trackCTAClicked({
							value: 'download-config'
						});
						m.getPrintPage(true);

						// FINANCE link
					} else if (ctaType === ctaTypes.FINANCE) {
						bt.trackCTAClicked({
							value: 'finance_calculator',
							workflowname: 'finance_calculator',
							workflowstep: '0'
						});
						m.carConfig.saveConfiguration();

						// PRINT page
					} else if (ctaType === ctaTypes.PRINT) {
						bt.trackCTAClicked({
							value: 'print-config'
						});
						m.getPrintPage(false);

						// SAVE explicitly to user data
					} else if (ctaType === ctaTypes.SAVE) {
						bt.trackCTAClicked({
							value: 'save-config',
							workflowname: 'save-config',
							workflowstep: '0'
						});
						if (m.configCode) {
							m.isSummary = true;

							// request save to myToyota
							m.eventWindow.PubSub.publish(T1.constants.CARCONFIG_SAVE_CONFIG, {"configCode": m.configCode});
						} else {
							m.carConfig.saveConfiguration();
						}

						// LOAD config
					} else if (ctaType === ctaTypes.LOAD) {
						bt.trackCTAClicked({
							value: 'load-config',
							workflowname: 'load-config',
							workflowstep: '0'
						});
						m.eventWindow.PubSub.publish(T1.constants.HASH_CHANGE, urlLoad);

						// Testdrive form
					} else if (ctaType === ctaTypes.TESTDRIVE) {
						bt.trackCTAClicked({
							value: 'test_drive',
							workflowname: 'test_drive',
							workflowstep: '0'
						});
						urlForm += '?tab=pane-testdrive';

						m.eventWindow.PubSub.publish(T1.constants.HASH_ADD, urlAjax + encodeURIComponent(urlForm));
						// DealerFinder
					} else if (ctaType === ctaTypes.DEALERFINDER) {
						bt.trackCTAClicked({
							value: 'dealerfinder',
							workflowname: 'dealerfinder',
							workflowstep: '0'
						});
						urlForm += '?tab=pane-dealer';

						m.eventWindow.PubSub.publish(T1.constants.HASH_ADD, urlAjax + encodeURIComponent(urlForm));
					} else {
						bt.trackCTAClicked({
							value: cta.text(),
							workflowname: cta.text(),
							workflowstep: '0'
						});
						if (ctaUrl && ctaTarget) {
							if (ctaTarget === 'overlayer') {
								m.eventWindow.PubSub.publish(T1.constants.HASH_ADD, urlFrame + encodeURIComponent(ctaUrl));
							} else if (ctaTarget === '_self') {
								window.location = ctaUrl;
							} else if (ctaTarget === '_blank') {
								window.open(ctaUrl);
							}
						} else {
							try {
								_utilities.executeFunctionByName(ctaType, m.eventWindow, [m.configCode]);
							} catch (err) {
								console.log(err.message);
							}
						}
					}
				},
				/**
				 * autosave callback
				 * @param msg
				 * @param data
				 */
				handleCCAutoSave: function(msg, data) {
					var m = _carconfig,
						ccData = null;

					m.isSummary = true;

					if (!$.isEmptyObject(data)) {
						//ccData = data.getController().getConfiguration();

						data.prepareQRC();
						
						// Save is handled inside the carconfig now, when navigating to the summary screen
						//m.carConfig.saveConfiguration();
					}
				},
				/**
				 * saveConfiguration callback
				 * @param msg
				 * @param data
				 */
				handleCCAutoSaved: function(msg, data) {
					var m = _carconfig,
						ctaTypes = T1.constants.CTA_TYPES;

					m.configCode = data.ConfigurationCode;
					
					// request QR code
					var url = T1.settings.loadSaveServer + "/qrcode/" + data.ConfigurationCode + "/68";
					m.carConfig.updateQRC(url, data.ConfigurationCode);

					if (m.isSummary) {
						try { //error trap is added to fix (UK car-config implementation) http://www.toyota.co.uk/new-cars/aygo-build
							// trigger store to localStorage
							m.eventWindow.PubSub.publish(T1.constants.CARCONFIG_END, data);
						} catch (e) {
							console.log(e);
						}

						// Communicate the code to the above window
						if ('parentIFrame' in window) {
							var config = m.carConfig.getController().getExternalConfigurationObject(true, true);
							config = config.substr(0, config.length - 1) + ', "ConfigurationCode":"' + data.ConfigurationCode + '"}';
							window.parentIFrame.sendMessage(config, '*');
						}

						if (m.ctaType === ctaTypes.FINANCE) {
							m.eventWindow.PubSub.publish(T1.constants.FINANCE_EXTERNAL_POST_REQUEST, data);
						}

					} else {
						if (m.ctaType === ctaTypes.SAVE) {
							// request save by configCode to myToyota
							m.eventWindow.PubSub.publish(T1.constants.CARCONFIG_SAVE_CONFIG, {"configCode": m.configCode});
						}
						m.isSummary = false;
					}
				},
				getPrintPage: function(toPdf) {
					var m = _carconfig,
						isMock = T1.settings.mock,
						url = (isMock) ? '/carconfig-print.html' : T1.settings.carconfig.urlContent;

					if (m.configCode || isMock) {
						url += (toPdf) ? 'pdf/' : 'print/';

						window.open(url + m.configCode, 'Print');
					} else {
						console.log('no configCode: ' + url);
					}
				}
			};
			var _utilities = {
				/**
				 * check if CC started in iframe or standalone
				 * @returns {boolean} true = iframe
				 */
				inIframe: function() {
					var cc = _carconfig;

					try {
						cc.isIframe = (window.self !== window.top);
					} catch (e) {
						cc.isIframe = true;
					}
					return cc.isIframe;
				},
				/**
				 * get all qs params
				 * @returns {object} holds qs param key-value pairs
				 */
				getQueryStringParameters: function() {
					var cc = _carconfig,
						url = decodeURIComponent(document.URL);

					//	TODO: decode uri params for settings like this:
					//	t1:5000/mockups/carconfig/index.html?settings={"hasfinance":true,"hastopflap":false}&modelid=mlkjlkj

					if (url.indexOf('?') > -1) {
						var uri = url.split('?')[1],
							pairs = uri.split('&');

						for (var i = 0; i < pairs.length; i++) {
							var params = pairs[i].split('='),
								key = params[0].toString(),
								value = params[1].split('#')[0];

							cc.parameters[key] = value;
						}
					}
					return cc.parameters;
				},
				executeFunctionByName: function(functionName, context, args) {
					if (functionName.indexOf('.') > -1) {
						var namespaces = functionName.split('.'),
							func = namespaces.pop();

						for (var i = 0; i < namespaces.length; i++) {
							context = context[namespaces[i]];
						}
						context[func].apply(context, args);
					} else {
						window[functionName](args);
					}
				}
			};
			return {
				init: _carconfig.init,
				carConfig: _carconfig.carConfig
			};
		}());

$(document).ready(function() {
	'use strict';

	try {
		carconfig.init();
	} catch (e) {
		console.log(e.message);
	}
});

/* ie console fix */
if(! window.console){
	window.console = {
		log: function(){return;},
		dir: function(){return;}
	};
}