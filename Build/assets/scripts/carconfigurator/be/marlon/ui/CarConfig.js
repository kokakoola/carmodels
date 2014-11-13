/**
 * Toyota CCv6 car configurator
 */
(function() {
	/**
	 * Initialize the namespace 
	 */
	if(typeof(window.be) == "undefined")
    {
        window.be = {};
    }
    if(typeof be.marlon == "undefined")
    {
        be.marlon = {};
    }
    if(typeof be.marlon.ui == "undefined")
    {
        be.marlon.ui = {};
    }
    
    /**
	 * The carconfigurator! 
	 */
	var ui = be.marlon.ui;
    ui.CarConfig = function(_$ele, _settings, _labels, _context, _preconfig)
    {
    	// Declare all variables
    	var _controller,
    		_dic,
    		_utils = be.marlon.utils,
    		_instance = this,
    		
    		_reload = true,
    		_configs = null, // Contains specific car-configurator settings, at the moment only used for containing CCIS rendering modes
    		
    		_filterDataLoaded = false,
    		_topContainer,
    		_middleContainer,
    		_bottomContainer,
    		_overlay,
    		_disableOverlay = null,
    		_wsVersionLoaded = false,
    		_debug,
    		_initMonthlyRate = false,
    		_showMonthlyRate = true, // On the finance step the monthly rate should not be shown
    		_monthlyRateToggleValue = true, // The value relevant to the show monthly rate toggle checkbox in the specification screen
    		_monthlyRateData = null, // Cached data of the monthly rate response
    		_savedConfig = false,
    		_delayedSummaryTrack = false, // Due to the need to track the configuration code on the summary which is dependent on the save & load service, we have to use this variable to check
    		_reloadMonthlyRate = false, // Boolean set when the monthly rate should be reloaded
    		_brightTag,
    		_savingConfig = false, // Boolean used to track the saving process of the configuration
    		_totalHeight = 0;
    		
    	this.AUTO_SAVE = "cc_auto_save";
    	this.HEIGHT_UPDATED = "cc_height_updated";
    	this.SAVING_CONFIG = "cc_saving_config";
    	this.CONFIG_SAVED = "cc_config_saved";
    	this.GOTO_MY_TOYOTA = _utils.GOTO_MY_TOYOTA;
    	this.CTA_CLICKED = _utils.CTA_CLICKED;
    	this.START_LOAD = "cc_start_load";
    	this.STOP_LOAD = "cc_stop_load";
    	
    	this.SIMULATE_PROACE_SLIDER = "cc_simulate_proace_slider";
    	
    	
    	// #####################
    	// Public methods
    	// #####################
    	
    	/**
    	 * Return the controller 
    	 */
    	this.getController = function()
    	{
    		return _controller;
    	};
    	
    	/**
		 * Method which prepares the qr code 
		 */
		this.prepareQRC = function()
		{
			_bottomContainer.prepareQRC();
		};
		
		/**
		 * Method which updates the qr code 
		 */
		this.updateQRC = function(url, code)
		{
			_bottomContainer.updateQRC(url, code);
		};
		
		/**
		 * Method which returns the total height of the car-configurator 
		 */
		this.getHeight = function()
		{
			return _totalHeight;
		};
		
		/**
		 * Method which saves the configuration and dispatches an event when the configuration is available 
		 */
		this.saveConfiguration = function(async)
		{
			if(_savedConfig)
			{
				saveComplete(_savedConfig);
			}
			else
			{
				PubSub.publish(_instance.SAVING_CONFIG);
				_savingConfig = $.ajax({
					type:"POST",
					url:_settings.saveLocation,
					data:_controller.getExternalConfigurationObject(true),
					success:saveComplete,
					async:((typeof async === "undefined")?true:async),
					contentType:"text/plain;charset=UTF-8",
					error:saveFailHandler
				});
			}
		};
		
		/**
		 * Method which returns the version 
		 */
		this.getVersion = function()
		{
			return _debug.getVersionContent();
		};
    	
    	// #####################
    	// Private methods
    	// #####################
    	
    	/**
    	 * Method which actions the saving of the configuration, but forces a synchronous call 
    	 * @param $t:Target the target clicked upon
    	 */
    	function summaryButtonClicked(msg, $t)
    	{
    		if(!_savedConfig)
    		{
    			// Only save if the process isn't ongoing yet
    			if(!_savingConfig)_instance.saveConfiguration();
    		}
    		else 
    		{
    			_bottomContainer.hideCTALoaders();
    			PubSub.publishSync(_utils.CTA_CLICKED, $t);
    		}
    	}
    	
    	/**
		* Method which handles the successfull save
		*/
		function saveComplete(data, textStatus)
		{
			if(_disableOverlay)_disableOverlay.hide();
			_savingConfig = false;
			if(typeof data === "string")
			{
				var e = eval;
				data = e("(" + data + ")");
			}
			_savedConfig = data;
			_bottomContainer.hideCTALoaders();
			if(_delayedSummaryTrack)trackSummary();
			PubSub.publishSync(_instance.CONFIG_SAVED, data);
		}
		
		/**
		* Method which handles the fail of the autosave function
		*/
		function saveFailHandler(data)
		{
			_savingConfig = false;
			if(data.statusText !== "abort")
			{
				_bottomContainer.resetCTALoaders();
				//if(_disableOverlay)_disableOverlay.hide();
				console.error("AUTOSAVE FAILED: ", data);
			}
		}
    	
    	// Initialization function
        function init()
        {
        	// Init the dictionary
        	_dic = _utils.Dictionary; 
        	_dic.init(_labels);
        	
        	_brightTag = be.marlon.Brighttag;
        	
        	// Parse the settings
        	parseSettings();
        	
        	_utils.cardbAssetPath = _settings.cardbAssetPath;
        	_utils.enableListSearch = _settings.enableListSearch;
        	_utils.ctaTypes = _settings.ctaTypes;
        	// Instantiate controller
        	_controller = new be.marlon.Controller(_settings, _context, _preconfig);
        	_controller.addEventListener(be.marlon.Service.SHOW_CONFLICT, showConflictHandler);
        	_controller.addEventListener(be.marlon.Service.SHOW_INCLUDE_OPTIONS, showIncludeOptions);
        	_controller.addEventListener(be.marlon.Service.SERVICE_ERROR, serverErrorEventHandler);
        	_controller.addEventListener(be.marlon.Service.LOAD_DATA, loadDataHandler);
        	_controller.addEventListener(be.marlon.Service.LOAD_DATA_COMPLETE, loadCompleteHandler);
        	_controller.addEventListener(be.marlon.Service.RELOAD_DATA, reloadDataHandler);
        	// Instant callbacks
        	_controller.addEventListener(be.marlon.Config.CHANGED, configurationChanged);
        	_controller.addEventListener(be.marlon.Service.RENDER_UPHOLSTERIES, renderUpholsteries);
			_controller.addEventListener(be.marlon.Service.RENDER_OPTIONS, renderOptions);
			_controller.addEventListener(be.marlon.Service.RENDER_INLAYS, renderInlays);
			_controller.addEventListener(be.marlon.Service.RENDER_ACCESSORIES, renderAccessories);
			
			// Save the hasPrice!
			_utils.hasPrice = _controller.hasPrice();
			
			// Add the version panel
			var version = "6.0.26",
        		lastUpdate = "2014-10-08",
        		sv = "";
        	
        	sv =  "Last update: " + lastUpdate + ' <br/>';
        	sv += "Carconfigurator version: " + version + ' <br/>';
        	sv += "Javascript controller version: " + _controller.version() + ' <br/>';
        	
        	// Version control
        	_debug = new be.marlon.Debug(_$ele, _controller, _settings);
        	_debug.addVersionContent(sv);
        	// Add the overlays
        	var ele = $('<div/>');
        	_$ele.append(ele);
        	_overlay = React.renderComponent(ui.Overlay(), ele[0]);
        	if(_settings.disabledOverlayCarConfig)
        	{
        		ele = $('<div/>');
        		_$ele.append(ele);
        		_disableOverlay = React.renderComponent(ui.DisabledOverlay(), ele[0]);
        	}
        	
			// Check if touch is enabled, if so enable it in React
			if(_utils.hasTouch)
			{
				React.initializeTouchEvents(true);
			}
			
			// Reference the price formatting method
        	_utils.formatPrice = _controller.formatPrice;
        	
        	// Initialize the containers
        	initContainers();
        	
        	// Subscribe internal pubsub events
        	PubSub.subscribe(_utils.SUMMARY_BTN_CLICKED, summaryButtonClicked);
        	
        	// Save the initial height
        	_totalHeight = $(_bottomContainer.getDOMNode()).outerHeight() + $(_middleContainer.getDOMNode()).outerHeight();
			// Check if a modelID is specified or a preconfiguration!
			if((_settings.modelID && _settings.modelID !== "" && _settings.modelID !== "00000000-0000-0000-0000-000000000000") || (typeof _preconfig !== "undefined" && _preconfig !== null && _preconfig !== ""))
			//if(_settings.modelID && _settings.modelID !== "" && _settings.modelID !== "00000000-0000-0000-0000-000000000000")
			{
				// Load the modeldata
				_controller.loadData([_controller.LOAD.MODEL], modelDataLoaded);
			}
			else
			{
				// Start loading the required initial data
				_controller.loadData([_controller.LOAD.FILTERDATA], filterDataLoaded);
			}
        }
        
        /**
         * Method which parses the settings 
         */
        function parseSettings()
        {
        	var aSettings = [
        		{prop:"showPromo", defaultTrue:true, parent:_settings},
        		{prop:"hidePromoButtons", defaultTrue:false, parent:_settings},
        		{prop:"showQRCode", defaultTrue:true, parent:_settings},
        		{prop:"showFinanceButtonCarConfig", defaultTrue:true, parent:_settings},
        		{prop:"showInsuranceButtonCarConfig", defaultTrue:true, parent:_settings},
        		{prop:"showMonthlyRateCarConfig", defaultTrue:true, parent:_settings},
        		{prop:"forceShowFinanceButtonCarConfig", defaultTrue:false, parent:_settings},
        		{prop:"showMonthlyRateToggleCarConfig", defaultTrue:false, parent:_settings},
        		{prop:"disabledOverlayCarConfig", defaultTrue:true, parent:_settings},
        		{prop:"hideChangeModelButton", defaultTrue:false, parent:_settings},
        		{prop:"useExtendedWheelColourFiltering", defaultTrue:false, parent:_settings},
        		{prop:"enableListSearch", defaultTrue:false, parent:_settings},
        		{prop:"salesmanShowCTAS", defaultTrue:false, parent:_settings}
        	];
        	var i = 0,
        		iL = aSettings.length,
        		o,
        		prop,
        		defaultTrue;
        	for(; i < iL; i++)
        	{
        		o = aSettings[i];
        		prop = o.parent[o.prop];
        		defaultTrue = aSettings[i].defaultTrue;
        		if(defaultTrue)
        		{
        			o.parent[o.prop] = !Boolean(prop === "" || prop === "false" || prop === false);
        		}
        		else
        		{
        			o.parent[o.prop] = Boolean(typeof prop !== "undefined" && (prop === "true" || prop === true));
        		}
        	}
			
			if(_settings.showMonthlyRateToggleCarConfig)_monthlyRateToggleValue = !Boolean(_settings.monthlyRateToggleDefaultValueCarConfig === "" || _settings.monthlyRateToggleDefaultValueCarConfig === "false" || _settings.monthlyRateToggleDefaultValueCarConfig === false);
			else _monthlyRateToggleValue = true;
        	_utils.smSlave = !Boolean(typeof _settings.isSalesmanSlave === "undefined" || _settings.isSalesmanSlave === "" || _settings.isSalesmanSlave === "false" || _settings.isSalesmanSlave === false);
        	_utils.smMaster = !Boolean(typeof _settings.isSalesmanMaster === "undefined" || _settings.isSalesmanMaster === "" || _settings.isSalesmanMaster === "false" || _settings.isSalesmanMaster === false);
        	if(_utils.smSlave || _utils.smMaster)_settings.disabledOverlayCarConfig = false;
        	if(_utils.smSlave || _utils.smMaster)_settings.enableListSearch = false;
        }
        
        /**
         * Method which initializes and fades in the navigation if required 
         */
        function initNavigation(showMainButtons)
        {
        	//console.log("init navigation: ", _middleContainer.resetNavigation());
        	// Render the navigation based on the available steps, the navigatioin is reset when a model or submodel is selected
        	if(_middleContainer.resetNavigation())
        	{
    			var fc = _controller.getFullConfiguration(),
    				dep = (fc.Submodel?fc.Submodel:fc.Model),
    				car = fc.Car,
    				config = {
						hasBodytype:dep.MultiBodyType,
						hasAccessories:dep.HasAccessories,
						hasFinance:_settings.forceShowFinanceButtonCarConfig?true:_settings.showFinanceButtonCarConfig?(car.Availability?car.Availability.ShowFinancialButton:false):false,
						// TODO
						hasInsurance:_settings.showInsuranceButtonCarConfig?(car.Availability?car.Availability.ShowInsuranceButton:false):false
					};
    			_middleContainer.setProps({naviconfig:config});
    			
    			// Set reset of the navigation to false
    			_middleContainer.resetNavigation(false);
    			
    			// Also set the properties on the bottom container
    			_bottomContainer.setProps({hasBodytype:dep.MultiBodyType, summaryContent:_controller.getSummaryContent(), specProps:{
	        		availablePacks:fc.AvailablePacks,
	        		availableInternalOptions:fc.AvailableInternalOptions,
	        		availableExternalOptions:fc.AvailableExternalOptions,
	        		availableAccessories:fc.AvailableAccessories
	        	}});
	        	
	        	// Also set the specific properties on the top container
	        	_topContainer.setProps({
	        		modes:{
	        			visibleInExteriorSpin:true, // There should always be an exterior spin! //car.VisibleInExteriorSpin,
						visibleInInteriorSpin:car.VisibleInInteriorSpin, // There should always be an interior spin! //car.VisibleInInteriorSpin, (in case of the Hilux there is no interior spin but there is a static image present)
						visibleInXRay4X4Spin:car.VisibleInXRay4X4Spin,
						visibleInXRayHybridSpin:car.VisibleInXRayHybridSpin,
						visibleInXRaySafetySpin:car.VisibleInXRaySafetySpin,
						visibleInNightMode:getConfig('night_mode_available') === "true",
						// TODO make dynamic
						//visibleInBoot:getConfig('boot_animation_available') === "true",
						visibleInBoot:false,
						//visibleInHero:getConfig('hero_shot_available') === "true"
						visibleInHero:false
	        		}
	        	});
    		}
    		// Navigate in the main buttons
    		if(showMainButtons) _middleContainer.showMainButtons();
        }
        
        /**
         * Method which fetches a specific configuration from the _configs array 
         */
        function getConfig(key)
        {
        	var i = 0,
        		iL = _configs.length;
        	for(; i < iL; i++)
        	{
        		if(_configs[i].Key === key)return _configs[i].Value;
        	}
        	return false;
        }
        
        /**
         * Method which initializes the containers 
         */
        function initContainers(data, callback)
        {
        	var ele,
        		hasPromo = _settings.hidePromoButtons?false:Boolean(data && data.model && data.model.availablePromotions && data.model.availablePromotions.length > 0),
        		cb = callback?_.after(2, callback):null;
        	
        	if(data && !_wsVersionLoaded)
        	{
        		// Add new version information
	        	var o = _controller.getServiceVersionObject().data,
	        		sv = "Back end communication: <br/>";
	        	sv += o.communication.name + "<br/>";
	        	sv += o.communication.version + "<br/>";
	        	sv += "Back end service: <br/>";
	        	sv += o.service.name + "<br/>";
	        	sv += o.service.version + "<br/>";
	        	_debug.addVersionContent(sv);
	        	// Set the version loaded
        		_wsVersionLoaded = true;
        	}
        	
        	if(!_topContainer && !_middleContainer)
    		{
    			// Instantiate the top & middle container elements
    			var $topEle = $('<div/>');
    			_$ele.append($topEle);
    			var $midEle = $('<div/>');
    			_$ele.append($midEle);
    			
    			_middleContainer = React.renderComponent(
        			ui.MiddleContainer(
        					{
        						naviHandler:naviEventHandler, 
        						controller:_controller,
        						showNextStep:showNextStepHandler,
        						hideNextStep:hideNextStepHandler
        					}
        				),
				  	$midEle[0]
        		);
    			
	    		_topContainer = React.renderComponent(
	        		ui.TopContainer(
	        			{
	        				spinSettings:{imagepath:_settings.ccisPath},
	        				settings:_settings,
	        				hasPromo:hasPromo, 
	        				navigate:naviEventHandler, 
	        				nextHandler:_middleContainer.nextStep, 
	        				controller:_controller, 
	        				heightUpdated:_.debounce(topContainerHeightUpdated, 500)
	        			}),
				  	$topEle[0]
	        	);
    		}
    		else
    		{
    			var tcProps = {
    				hasPromo:hasPromo,
    				configuration:null
    			};
    			if(data.model && data.model.carConfiguratorVersion)
    			{
    				tcProps.carConfiguratorVersion = data.model.carConfiguratorVersion;
    			}
    			_topContainer.setProps(tcProps, cb);
    		}
    		
    		// Render the bottom container for the filterdata
    		var bcData = {
    			configuration:null,
    			hasPromo:hasPromo,
	        	errorHandler:showError
    		};
    		if(data)
    		{
	    		if(data.model)
	    		{
	    			bcData.title = data.model.name;
	    			bcData.hasSubmodels = data.model.multiSubModel;
	    			bcData.promotions = data.model.availablePromotions;
	    			bcData.proAceFilterInfo = data.model.filterInfo;
	    			bcData.proAceSelectHandler = proAceSelectHandler;
	    			bcData.hasBodytype = data.model.multiBodyType;
	    		}
	    		if(data.filters && data.modelsubsets)
	    		{
	    			bcData.modelSelected = modelSelectHandler;
	    			bcData.gradeSelected = filterGradeSelectHandler;
	    			bcData.submodelSelected = submodelSelectedHandler;
	    			bcData.filterData = data.filters.data;
	    			bcData.modelData = data.modelsubsets.data;
	    		}
	    		if(hasPromo)
	    		{
	    		    bcData.promoData = data.model.availablePromotions;
	    		}
	    	}
        	if(!_bottomContainer)
        	{
        		// Standard properties
        		bcData.controller = _controller;
        		bcData.settings = _settings;
        		bcData.navigate = naviEventHandler;
        		bcData.promoSelectHandler = promoSelectHandler;
        		bcData.heightUpdated = _.debounce(bottomContainerHeightUpdated, 500);
        		
    			bcData.nextHandler = _middleContainer.nextStep;
    			bcData.monthlyRateToggleDefaultValue = _monthlyRateToggleValue;
    			bcData.monthlyRateToggleHandler = monthlyRateToggleHandler;
        		
        		ele = $('<div/>');
        		_$ele.append(ele);
        		_bottomContainer = React.renderComponent(
        			ui.BottomContainer(bcData),
				  	ele[0]
        		);
        	}
        	else
        	{
        		_bottomContainer.setProps(bcData, cb);
        	}
        }
        
        /**
         * Handles the height update of the topContainer 
         */
        function topContainerHeightUpdated(h)
        {
        	var totalHeight = h + $(_bottomContainer.getDOMNode()).outerHeight() + $(_middleContainer.getDOMNode()).outerHeight();
        	if(totalHeight != _totalHeight)
        	{
        		_totalHeight = totalHeight;
        		PubSub.publish(_instance.HEIGHT_UPDATED, _instance);
        	}
        }
        
        /**
         * Handles the height update of the bottomContainer 
         */
        function bottomContainerHeightUpdated(h)
        {
        	var totalHeight = h + $(_topContainer.getDOMNode()).outerHeight() + $(_middleContainer.getDOMNode()).outerHeight();
        	if(totalHeight != _totalHeight)
        	{
        		_totalHeight = totalHeight;
        		PubSub.publish(_instance.HEIGHT_UPDATED, _instance);
        	}
        }
        
        /**
         * Method which resets all containers 
         */
        /*function resetContainers()
        {
        	console.log("------> resetting containers <------");
        	_topContainer.setProps(
        		{
        			colours:[],
					packs:[],
					wheels:[],
					upholsteries:[],
					inlays:[],
					accessories:[],
					modes:[],
					options:[]
        		}
        	);
        	_bottomContainer.setProps(
        		{
        			submodels:[],
        			bodytypes:[],
					motorizations:[],
					grades:[],
					enginePromos:[],
					gradePromos:[],
					modelData:null,
					filterData:null,
					specProps:null,
					proAceFilterInfo:{
						Filters:[],
						Cars:[]
					}
        		}
        	);
        }*/
		
		/**
		 * Method which checks the financing availability 
		 */
		function checkMonthlyRate()
		{
			var hasMonthlyRate = _controller.hasMonthlyRate();
			if(hasMonthlyRate)
			{
				if(!_initMonthlyRate)
				{
					// Add controller event handler
        			_controller.addEventListener(be.marlon.Service.MONTHLY_RATE_LOADED, monthlyRateLoaded);
        			_initMonthlyRate = true;
				}
				
				// Now load the financing
				loadMonthlyRate();
			}
			else
			{
				// Remove controller event handler
        		_controller.removeEventListener(be.marlon.Service.MONTHLY_RATE_LOADED, monthlyRateLoaded);
        		_initMonthlyRate = false;
			}
			_reloadMonthlyRate = false;
		}
		
		/**
		 * Method which takes the loading of the financing for it's account 
		 */
		function loadMonthlyRate()
		{
			// Check if the financing is available
			if(_initMonthlyRate)
			{
				// Load the financial data
     			_controller.getMonthlyRate();
			}
		}
		
		/**
		 * Method which handles the loading of the monthly rate 
		 */
		function monthlyRateLoaded(e)
		{
			_monthlyRateData = e.data;
			// The object is filled in if the call was successfull and null when an error occured
			_topContainer.setProps({monthlyRate:_showMonthlyRate?_monthlyRateData?_monthlyRateData:false:false});
			_bottomContainer.setProps({showMonthlyRate:_settings.showMonthlyRateToggleCarConfig?_monthlyRateData?true:false:false});
		}
		
		/**
		 * Method which handles the toggling of the visibility of the monthly rate 
		 */
		function monthlyRateToggleHandler(visible)
		{
			_monthlyRateToggleValue = visible;
			_showMonthlyRate = (_middleContainer.getNaviCurrentStep() !== _utils.FINANCING && _monthlyRateToggleValue);
			_topContainer.setProps({monthlyRate:_showMonthlyRate?_monthlyRateData?_monthlyRateData:false:false});
		}
        
        // #####################
    	// Load complete handlers
    	// #####################
    	
    	/**
    	 * Method which handles the loading of the model data
    	 * @param data:Object 
    	 */
    	function filterDataLoaded(data)
    	{
    		_filterDataLoaded = true;
    		// Create the filter step
			initContainers(data,
				function()
				{
					naviEventHandler(_utils.FILTERSTEP);	
				}
			);
    	}
    	
    	/**
    	 * Method which handles the loading of the submodel data
    	 * @param data:Object 
    	 */
    	function modelDataLoaded(data)
    	{
    		var availablePromotions = data.model.availablePromotions,
    			filterInfo = data.model.filterInfo,
    			hasBodytype = data.model.multiBodyType,
    			hasAccessories = data.model.hasAccessories,
    			hasSubmodels = data.model.multiSubModel,
    			hasDefaultCar = data.model.hasDefaultCar;
    		
    		// Set the model ID on the webtrends
    		_brightTag.setModelID(_controller.getConfiguration().ModelID);
    		
    		// Save the loaded configs
    		_configs = data.model.configs; // Contains the car-configurator settings xml values
    		
    		_reload = false;
    		// Create the containers
    		initContainers(data,
    			function()
    			{
    				// Check the init_view setting
		        	if(_settings.initView && _settings.initView !== "")
		        	{
		        		_settings.initView = Number(_settings.initView);
		        		if(!isNaN(_settings.initView))
		        		{
		        			// Navigate to the corresponding step
		        			naviEventHandler(_settings.initView);
		        			// Remove property
		        			delete _settings.initView;
		        			return;
		        		}
		        	}
		        	// If there is a predefined configuration navigate to the exterior step
		        	else if(hasDefaultCar)
		        	{
		        		// Navigate to the corresponding step
		        		naviEventHandler(_utils.EXTERIOR);
		        		return;
		        	}
		        	
		        	// If there are availablePromotions
		        	if(availablePromotions && availablePromotions.length > 0 && _settings.showPromo)
		        	{
		        		// Show the next step navigation
						_middleContainer.animateIn();
						_bottomContainer.navigate(_utils.PROMOTIONS, false);
		        	}
		    		// If there are submodels, load them
		    		else if(hasSubmodels)
		    		{
		    			// Hide the next button
		    			_middleContainer.animateOut();
		    			_controller.loadData([_controller.LOAD.SUBMODELS], submodelsLoaded);
		    		}
		    		// If there are no submodels but bodytypes, load them
		    		else if(hasBodytype)
		    		{
		    			naviEventHandler(_utils.BODYTYPES);
		    		}
		    		// If there are no submodels and no bodytypes, load the engine and grades
		    		else
		    		{
		    			naviEventHandler(_utils.ENGINE_GRADES);
		    		}
    			}
    		);
    	}
    	
    	/**
    	 * Method which handles the loading of the submodels
    	 * @param submodels:Object 
    	 */
    	function submodelsLoaded(data)
    	{
    		// Navigate to the submodels
    		//setTimeout(function(){_bottomContainer.navigate(_utils.SUBMODELS);},500);
    		_bottomContainer.navigate(_utils.SUBMODELS);
    		
    		// Only update when required
    		if(data.submodels.update)
    		{
    			// Instantiate the submodels
    			_bottomContainer.setProps({
					submodels:data.submodels.data,
					submodelSelectedHandler:submodelSelectedHandler
				});
			}
			
			// Select the corresponding step
    		_middleContainer.selectStep(_utils.SUBMODELS);
    	}
    	
    	/**
    	 * Method which handles the loading of the bodytypes
    	 * @param data:Object 
    	 */
    	function bodytypesLoaded(data)
    	{
    		// Fade in the _navigation!
    		initNavigation(true);
    		
    		var props = {
    			configuration:data.configuration.data
    		};
    		// Only  update when required
    		if(data.bodytypes.update)
    		{
    			// Instantiate the bodytypes
    			props.bodytypes = data.bodytypes.data;
    			props.bodytypeSelectHandler = bodytypeSelectHandler;
    		}
    		
    		// Only check the financing when relevant data is available
    		if(data.configuration.update || _reloadMonthlyRate)checkMonthlyRate();
    		else if(_monthlyRateData && _showMonthlyRate)_topContainer.setProps({monthlyRate:_monthlyRateData});
    		
    		// Instantiate the engine grades
    		_bottomContainer.setProps(props);
    		
    		// Set the configuration on the middle container
    		_middleContainer.setProps({configuration:data.configuration.data, eco:data.configuration.eco});
    	}
    	
    	/**
    	 * Method which handles the loading of the engines and grades data
    	 * @param data:Object 
    	 */
    	function engineGradesLoaded(data)
    	{	
    		// Fade in the _navigation!
    		initNavigation(true);
    		
    		var props = {
    			gradeSelectHandler:gradeSelectHandler,
    			motorizationSelectHandler:motorizationSelectHandler,
    			enabledGrades:data.grades.enabledGrades,
    			configuration:data.configuration.data,
    			enginePromos:data.motorizations.enginePromos,
    			gradePromos:data.grades.gradePromos,
    			eco:data.configuration.eco
    		};
    		
    		// Only update when required
    		if(data.grades.update)props.grades = data.grades.data;
    		if(data.motorizations.update)props.motorizations = data.motorizations.data;
    		
    		// Only check the financing when relevant data is available
    		if(data.configuration.update || _reloadMonthlyRate)checkMonthlyRate();
    		else if(_monthlyRateData && _showMonthlyRate)_topContainer.setProps({monthlyRate:_monthlyRateData});
    		
    		// Instantiate the engine grades
    		_bottomContainer.setProps(props);
    		
    		// Set the configuration on the middle container
    		_middleContainer.setProps({configuration:data.configuration.data});
    	}
    	
    	/**
    	 * Method which handles the loading of the exterior data
    	 * @param data:Object 
    	 */
    	function exteriorLoaded(data)
    	{
    		// Fade in the _navigation!
    		initNavigation(true);
    		
    		var props = null;
    		// Upholsteries are also loaded with the exterior call due to the color dependency
    		if(data.colours.update || data.wheels.update || data.options.update || data.packs.update || data.upholsteries.update)
    		{
    			props = {configuration:data.configuration.data};
    			if(data.colours.update)props.colours = data.colours.data;
    			if(data.upholsteries.update)props.upholsteries = data.upholsteries.data;
    			if(data.wheels.update)
    			{
    				props.wheels = data.wheels.data;
    				props.wheelEquipment = data.wheels.equipment;
    			}
    			if(data.options.update)props.options = data.options.data;
    			if(data.packs.update)props.packs = data.packs.data;
    			props.visible = true;
    		}
    		
    		// Only check the financing when relevant data is available
    		if(data.configuration.update || _reloadMonthlyRate)checkMonthlyRate();
    		else if(_monthlyRateData && _showMonthlyRate)
    		{
    			if(!props)props = {monthlyRate:_monthlyRateData};
    			else props.monthlyRate = _monthlyRateData;
    		}
    		if(props)_topContainer.setProps(props);
    		
    		// Update the configuration on the bottomcontainer (used for specification sheet)
    		_bottomContainer.setProps({configuration:data.configuration.data, eco:data.configuration.eco});
    	}
    	
    	/**
    	 * Method which handles the loading of the interior data
    	 * @param data:Object 
    	 */
    	function interiorLoaded(data)
    	{
    		//console.log("interior data loaded: ", data);
    		// Fade in the _navigation!
    		initNavigation(true);
    		
    		var props = null;
    		// Upholsteries are also loaded with the exterior call due to the color dependency
    		if(data.inlays.update || data.upholsteries.update || data.options.update || data.packs.update)
    		{
    			props = {configuration:data.configuration.data};
    			if(data.upholsteries.update)props.upholsteries = data.upholsteries.data;
    			if(data.inlays.update)props.inlays = data.inlays.data;
    			if(data.options.update)props.options = data.options.data;
    			if(data.packs.update)props.packs = data.packs.data;
    			props.visible = true;
    		}
    		
    		// Only check the financing when relevant data is available
    		if(data.configuration.update || _reloadMonthlyRate)checkMonthlyRate();
    		else if(_monthlyRateData && _showMonthlyRate)
    		{
    			if(!props)props = {monthlyRate:_monthlyRateData};
    			else props.monthlyRate = _monthlyRateData;
    		}
    		
    		if(props)_topContainer.setProps(props);
    		
    		// Update the configuration on the bottomcontainer (used for specification sheet)
    		_bottomContainer.setProps({configuration:data.configuration.data, eco:data.configuration.eco});
    	}
    	
    	/**
    	 * Method which handles the loading of the accessories
    	 * @param data:Object 
    	 */
    	function accessoriesLoaded(data)
    	{
    		// Fade in the _navigation!
    		initNavigation(true);
    		
    		var props = null;
    		// Upholsteries are also loaded with the exterior call due to the color dependency
    		if(data.accessories.update)
    		{
    			props = {
    				configuration:data.configuration.data,
    				accessories:data.accessories.data
    			};
    			props.visible = true;
    			
    			_topContainer.setProps(props);
    		}
    		
    		// Only check the financing when relevant data is available
    		if(data.configuration.update || _reloadMonthlyRate)checkMonthlyRate();
    		else if(_monthlyRateData && _showMonthlyRate)
    		{
    			if(!props)props = {monthlyRate:_monthlyRateData};
    			else props.monthlyRate = _monthlyRateData;
    		}
    		
    		if(props)_topContainer.setProps(props);
    		
    		// Update the configuration on the bottomcontainer (used for specification sheet)
    		_bottomContainer.setProps({configuration:data.configuration.data, eco:data.configuration.eco});
    	}
    	
    	/**
    	 * Method which handles the loading of the summary
    	 * @param data:Object 
    	 */
    	function summaryLoaded(data)
    	{
    		// Fade in the _navigation!
    		initNavigation(true);
    		
    		var config = data.configuration.data,
    			props = {
    				configuration:data.configuration.data, 
    				visible:true
    			};
    		
    		
    		// Update the configuration on the bottomcontainer (used for specification sheet)
    		_bottomContainer.setProps({configuration:data.configuration.data, eco:data.configuration.eco});
    		
    		// Only check the financing when relevant data is available
    		if(data.configuration.update || _reloadMonthlyRate)checkMonthlyRate();
    		else if(_monthlyRateData && _showMonthlyRate)
    		{
    			props.monthlyRate = _monthlyRateData;
    		}
    		
    		// Set the configuration object on the topcontainer to, so it can render the spin
    		_topContainer.setProps(props);
    		
    		// Set the boolean for the delayed summary track
    		_delayedSummaryTrack = !_savedConfig;
    		// Dispatch the auto save event
    		if(!_savedConfig)
    		{
    			// publish the auto save event
				PubSub.publish(_instance.AUTO_SAVE, _instance);
				// Save the configuration, show the overlay
				if(_disableOverlay)_disableOverlay.show();
				_instance.saveConfiguration();
    		}
    		else
    		{
    			trackSummary();
    		}
    	}
    	
    	/**
    	 * Method used to track the summary 
    	 */
    	function trackSummary()
    	{
    		_delayedSummaryTrack = false;
    		// Check the wheel
    		var wheel = _controller.getFullConfiguration().Wheel,
    			config = _controller.getConfiguration(),
    			options = config.Options.concat();
    		if(wheel.Type.toLowerCase() === "option") options.push(wheel.ID);
    		// Track the summary events!
            _brightTag.setStep(_utils.SUMMARY);
            
            var btC = {
            	type: 'carconfig',
                modelid:config.ModelID,
                carid:config.CarID + "_" + config.Country + config.Language,
                extcolorid:config.ModelID + "_" + config.ExteriorColourID + "_" + config.Country + config.Language,
                intcolorid:config.ModelID + "_" + config.UpholsteryID + "_" + config.Country + config.Language,
                optionlist:createWTList(options, config.ModelID, config.Country, config.Language, "no_option", true),
                accessorylist:createWTList(config.Accessories, config.ModelID, config.Country, config.Language, "no_accessory", true),
                promotionlist:createWTList(_controller.getActivePromotions(), config.ModelID, config.Country, config.Language, "no_promotion", true),
                packlist:createWTList(config.Packs, config.ModelID, config.Country, config.Language, "no_pack", false),
                toyotacode:_savedConfig.ConfigurationCode
            };
            if(!config.isEmpty(config.SubModelID))btC.Submodel=config.SubModelID;
    		_brightTag.track({
	                    eventclass: 'configdetailsevent',
	                    componentname: 'carconfig',
	                    action: 'cc_workflow',
	                    workflowname: 'carconfigurator',
	                    workflowstep: 9,
	                    workflowconversion: 1
	                },
	                btC);
    	}
    	
    	/**
    	 * Helper method which creates the list for the options, accessories, promotions or packs 
    	 */
    	function createWTList(arr, modelid, country, language, empty, includeModelID)
    	{
    		var i = 0,
    			iL = arr?arr.length:0;
    		if(iL === 0)return empty;
    		var sRet = "";
    		for(; i < iL; i++)
    		{
    			if(includeModelID)sRet += modelid + "_";
    			sRet += arr[i] + "_" + country + language + ";";
    		} 
    		sRet = sRet.substr(0, sRet.length-1);
    		return sRet;
    	}
    	
    	/**
    	 * Method which handles the loading of the financing
    	 * @param data:Object 
    	 */
    	function externalFrameLoaded(data)
    	{
    		// Fade in the _navigation!
    		initNavigation(true);
    		
    		var props = {
    			configuration:data.configuration.data, 
    			visible:true
    		};
    		
    		// Only check the financing when relevant data is available
    		if(data.configuration.update || _reloadMonthlyRate)checkMonthlyRate();
    		else if(_monthlyRateData)
    		{
    			props.monthlyRate = _showMonthlyRate?_monthlyRateData:false;
    		}
    		
    		// Set the configuration object on the topcontainer to, so it can render the spin
    		_topContainer.setProps(props);
    		
    		// Update the configuration on the bottomcontainer (used for specification sheet)
    		_bottomContainer.setProps({configuration:data.configuration.data, eco:data.configuration.eco});
    	}
    	
    	// #####################
    	// Component callbacks, event handlers
    	// #####################
    	
    	/**
    	 * Method which handles the navigation event 
    	 */
    	function naviEventHandler(step)
    	{
    		var trackWT = true;
    		//console.log("naviEventHandler: ", _middleContainer.getNaviCurrentStep(), " || ", step);
    		// Make sure the navigation is shown
    		if(step > _utils.SUBMODELS)_middleContainer.animateIn();
    		// Filterstep specific logic
    		if(step === _utils.FILTERSTEP)
    		{
    			_brightTag.removeModelID();
    			_middleContainer.showTitle();
    		}
    		else
    		{
    			_middleContainer.hideTitle();
    		}
    		
    		// Finance specific logic
    		_showMonthlyRate = (step !== _utils.FINANCING && _monthlyRateToggleValue);
    		
    		// Do control specific logic
    		switch(step)
    		{
    			case _utils.FILTERSTEP:
    				// Reset all the containers
    				//resetContainers();
    				// Hide the main buttons
    				_middleContainer.hideMainButtons();
    				//if(!_bottomContainer.getSelectedFilterStepModel())_middleContainer.animateOut();
    				if(_bottomContainer.getSelectedFilterStepModel())_bottomContainer.resetSelectedModel();
    				_middleContainer.animateOut();
    				_topContainer.collapse();
    				_bottomContainer.navigate(step, true);
    				if(!_filterDataLoaded)_controller.loadData([_controller.LOAD.FILTERDATA], filterDataLoaded);
    			break;
    			case _utils.PROMOTIONS:
    				// If another model has been selected and data should be (re)loaded:
    				if(_reload)
    				{
    					trackWT = false;
    					// Navigate to the engine and grades step because the navigation does not know yet if there are bodytypes/submodels/promotions
    					_bottomContainer.prepareForLoad(_utils.ENGINE_GRADES);
    					_bottomContainer.navigate(_utils.ENGINE_GRADES, true);
    					if(typeof window.again == "undefined")_controller.loadData([_controller.LOAD.MODEL], modelDataLoaded);
    				}
    				// Else if the user navigates to the promotions screen
    				else
    				{
    					_topContainer.collapse();
    					_bottomContainer.navigate(step, true);
    				}
    			break;
    			// When explicetly navigating to the submodels, it means the next button on the filterstep was pressed
    			case _utils.SUBMODELS:
    				// Show the loader
    				//_bottomContainer.navigate(_utils.ENGINE_GRADES, true);
    				_bottomContainer.navigate(step, true);
    				// If there are submodels, load them
    				if(_bottomContainer.props.hasSubmodels)
    				{
    					// Reset the selected submodels
    					_bottomContainer.resetSubModels();
    					// Hide the main buttons
    					_middleContainer.hideMainButtons();
    					// Collapse/animate out containers
    					_middleContainer.animateOut();
    					_topContainer.collapse();
    					_controller.loadData([_controller.LOAD.SUBMODELS], submodelsLoaded);
    				}
    				// Else navigate to the next available step
    				else
    				{
    					// Check bodytype availability
    					if(_bottomContainer.props.hasBodytype)
    					{
    						naviEventHandler(_utils.BODYTYPES);
			    		}
			    		// If there are no bodytypes, load the engine and grades
			    		else
			    		{
			    			naviEventHandler(_utils.ENGINE_GRADES);
			    		}
    					return;
    				}
    			break;
    			case _utils.BODYTYPES:
    				_topContainer.collapse();
    				_bottomContainer.navigate(step, true);
    				if(!_bottomContainer.hasProAce())_controller.loadData([_controller.LOAD.CONFIGURATION, _controller.LOAD.BODYTYPES], bodytypesLoaded);
    			break;
    			case _utils.ENGINE_GRADES:
    				_topContainer.collapse();
    				_bottomContainer.navigate(step, true);
    				_controller.loadData([_controller.LOAD.CONFIGURATION, _controller.LOAD.MOTORIZATIONS, _controller.LOAD.GRADES], engineGradesLoaded);
    			break;
    			case _utils.EXTERIOR:
    				_topContainer.expand();
    				_topContainer.navigate(step, true);
    				_bottomContainer.navigate(step, true);
    				_controller.loadData([_controller.LOAD.CONFIGURATION, _controller.LOAD.COLOURS, _controller.LOAD.WHEELS, _controller.LOAD.OPTIONS, _controller.LOAD.PACKS], exteriorLoaded);
    			break;
    			case _utils.INTERIOR:
    				_topContainer.expand();
    				_topContainer.navigate(step, true);
    				_bottomContainer.navigate(step, true);
    				_controller.loadData([_controller.LOAD.CONFIGURATION, _controller.LOAD.UPHOLSTERIES, _controller.LOAD.INLAYS, _controller.LOAD.OPTIONS, _controller.LOAD.PACKS], interiorLoaded);
    			break;
    			case _utils.ACCESSORIES:
    				_topContainer.expand();
    				_topContainer.navigate(step, true);
    				_bottomContainer.navigate(step, true);
    				_controller.loadData([_controller.LOAD.CONFIGURATION, _controller.LOAD.ACCESSORIES], accessoriesLoaded);
    			break;
    			case _utils.SUMMARY:
    				_topContainer.expand();
    				_topContainer.navigate(step, true);
    				_bottomContainer.navigate(step, true);
    				_controller.loadData([_controller.LOAD.CONFIGURATION], summaryLoaded);
    			break;
    			case _utils.FINANCING:
    			case _utils.INSURANCE:
    				_topContainer.expand();
    				_topContainer.navigate(step, true);
    				_bottomContainer.navigate(step, true);
    				_controller.loadData([_controller.LOAD.CONFIGURATION], externalFrameLoaded);
    			break;
    		}
    		
			// Set the step in the Brighttag
            _brightTag.setStep(step);
            
            // Summary step needs different params in Brighttag tracking
            if(_middleContainer.getNaviCurrentStep() != step && trackWT)
            {
	            if(step != _utils.SUMMARY)
	            {
	            	_brightTag.track({
	                    componentname: 'carconfig',
	                    action: 'cc_workflow',
	                    workflowname: 'carconfigurator',
	                    workflowstep: step + 1
	                });   
	            }
            }
            // Select the corresponding step
    		_middleContainer.selectStep(step);
    	}
    	
    	/**
    	 * Handles the callback from within the navigation to hide the next step 
    	 */
    	function hideNextStepHandler()
    	{
    		if(_middleContainer.getNaviCurrentStep() > _utils.SUBMODELS)
    		{
    			_middleContainer.hideNextButton();
        		_topContainer.hideNextButton();
        	}
    	}
		
		/**
		 * Handles the callback from within the navigation to show the next step 
		 */
		function showNextStepHandler()
		{
			if(_middleContainer.getNaviCurrentStep() > _utils.SUBMODELS)
    		{
				_middleContainer.showNextButton();
        		_topContainer.showNextButton();
        	}
		}
    	
    	/**
    	 * Method which handles selecting a promotion
    	 * @param data:Object the selected promotion object 
    	 */
    	function promoSelectHandler(data)
    	{
    		// TODO
    		//console.log("Promo selected: ", data);
    		// Set the configuration on the controller, no callback and a synchronous call
    		_controller.setConfiguration(data.DefaultCarForPromotion, null, false);
    		
    		// Determine which step to navigate to
    		/*var step = _utils.EXTERIOR,
    			fc = _controller.getFullConfiguration();
    		switch(data.Target)
   			{
   				case "BODY":
   					step = _utils.BODYTYPES;
    			break;
   				case "ENGINE":
   				case "TRANSMISSION": 
   				case "WHEELDRIVE":
   				case "GRADE": step = _utils.ENGINE_GRADES;
   				break;
   				case "PACK": step = _utils.EXTERIOR;
   				break;
   				case "EXTERIORCOLOUR": 
   				case "EXTERIORCOLOURTYPE": step = _utils.EXTERIOR;
   				break;
   				case "UPHOLSTERY":
   				case "UPHOLSTERYTYPE": step = _utils.INTERIOR;
   				break;
   				case "EQUIPMENT":
   					if(fc.Options.length > 0)
   					{
   						//if(fc.Options[i].)
   					}
   				break;
   				default:return false;
   				break;
   			}*/
    		
    		
    		// Navigate to the corresponding step
    		naviEventHandler(_utils.EXTERIOR);
    	}
    	
    	/**
         * Method which handles selecting a model in the filtertool 
         * @param guid:String the identifier of the clicked upon model
         */
    	function modelSelectHandler(o)
    	{
    	    //console.log("model selected handler: ", o.ModelId);
    	    _reload = true;
    	    _middleContainer.resetNavigation(true);
			// Show the navigation
			_middleContainer.animateIn();
			
			// Set the model on the controller
			_controller.setModel(o.ModelId);
    	}
    	
    	/**
    	 * Method which handles selecting a grade in the filtertool
    	 * @param guid:String the GUID of the grade clicked upon 
    	 */
    	function filterGradeSelectHandler(modelID, gradeID)
    	{
    		//console.log("Filter grade selected: ", modelID, gradeID);
    		var config = {
    			ModelID:modelID,
    			GradeID:gradeID
    		};
    		// Set the configuration on the controller, but don't load it yet.
    		_controller.setConfiguration(config, false);
    		// Load the model data, in the callback it handles loading subsequent data
    		_controller.loadData([_controller.LOAD.MODEL], modelDataLoaded, false);
    	}
    	
    	/**
    	 * Method which handles selecting a submodel 
    	 * @param o:Object an object representation of the selected submodel
    	 */
    	function submodelSelectedHandler(o)
    	{
    		//console.log("submodel clicked: ", o.ID);
    		_middleContainer.resetNavigation(true);
    		
    		// Update navigation logic
    		_middleContainer.setProps({naviconfig:{hasBodytype:o.MultiBodyType}});
    		
    		// Show the navigation
    		_middleContainer.animateIn();
    		
    		// Set the submodel on the controller
    		_controller.setSubModel(o.ID);
    	}
    	
    	/**
    	 * Method which handles selecing another car in the proace 
    	 */
    	function proAceSelectHandler(o)
    	{
    		//console.log("ProAce car selected: ", o);
    		// Set the configuration on the controller, but don't load it yet.
    		_controller.setConfiguration(o, false);
    	}
    	
    	/**
    	 * Method which handles selecting the bodytype
    	 * @param guid:String the identifier of the clicked upon bodytype 
    	 */
    	function bodytypeSelectHandler(guid)
    	{
    		//console.log("bodytype clicked: ", guid);
    		
    		_controller.setBodyType(guid);
    	}
    	
    	/**
    	 * Method which handles selecting a grades
    	 * @param guid:String the identifier for the grades which has to be selected 
    	 */
    	function gradeSelectHandler(guid)
    	{
    		//console.log("grade clicked: ", guid);
    		
    		_controller.setGrade(guid);
    	}
    	
    	/**
    	 * Method which handles selecing a motorization
    	 * @param guid:String the identifier for the motorization which has been selected 
    	 */
    	function motorizationSelectHandler(guid)
    	{
    		//console.log("motorization clicked: ", guid);
    		// Split the given id into the four id's required!
			var id = guid,
				engine = id.substring(0,36),
				engineType = id.substring(36,36*2),
				transmission = id.substring(36*2,36*3),
				wheeldrive = id.substring(36*3,36*4),
				config = _controller.getConfiguration();
			// Only set the engine on the controller if it has not been selected yet
			if(engine != config.EngineID || engineType != config.FuelTypeID || transmission != config.TransmissionID || wheeldrive != config.WheelDriveID)
			{
				_controller.setMotorization(engine, engineType, transmission, wheeldrive);
			}
    	}
        
        // #####################
    	// Controller event handler methods
    	// #####################
        
        /**
         * Method dispatched when data should be reloaded, dispatched when the compatibilitycheck method is called and processed
         * @param e:DataEvent 
         */
        function reloadDataHandler(e)
        {
        	var cStep = _middleContainer.getNaviCurrentStep(); 
        	if(cStep > _utils.SUBMODELS)
        	{
        		// Check the monthly rate
        		_reloadMonthlyRate = true; // We use this because if an update to the configuration is imminent, the configuration in CC can flicker if we would call the monthly rate here
        		// Navigate to the step to trigger data load
        		naviEventHandler(cStep);
        	}
        	_savedConfig = null;
        	_bottomContainer.resetCTALoaders();
        }
        
        /**
         * Method dispatched when data is about to be loaded also called when doing a compatibility check!
         * @param e:DataEvent
         */
        function loadDataHandler(e)
        {
        	// Boolean indicating if data should be (re)loaded
        	var loadData = e.data;
        	//console.log("--START LOADING DATA--", loadData);
        	_middleContainer.showPreLoader();
        	_topContainer.showNextButtonPreLoader();
        	if(_disableOverlay)_disableOverlay.show();
        	// Dispatch load start event
        	PubSub.publish(_instance.START_LOAD);
        }
        
        /**
         * Method called when the data has been loaded, accords for all data!
         * @param e:DataEvent 
         */
        function loadCompleteHandler(e)
        {
        	//console.log("--DATA LOAD COMPLETE--");
        	_middleContainer.hidePreLoader();
        	_topContainer.hideNextButtonPreLoader();
        	if(_disableOverlay)_disableOverlay.hide();
        	// Dispatch load stop event
        	PubSub.publish(_instance.STOP_LOAD);
        }
        
        /**
         * Method which handles showing the conflicts window
         * @param e:DataEvent 
         */
        function showConflictHandler(e)
        {
        	// Scroll the window to the top
        	window.scrollTo(0, 0);
        	// Set the overlay properties
        	_overlay.setProps({
        		title:_dic.getLabel('compatibilityCheckTitle'),
        		description:_dic.getLabel('compatibilityCheckDescription'),
        		cancelHandler:cancelConflictHandler,
        		acceptHandler:acceptConflictHandler
        	});
        }
        
        /**
       	 * Method which accepts the conflict 
       	 */
       	function acceptConflictHandler(e)
       	{
       		e.preventDefault();
       		_controller.acceptConflict();
       		_overlay.setState({visible:false});
       	}
       	
       	/**
       	 * Method which denies the conflict 
       	 */
       	function cancelConflictHandler(e)
       	{
       		e.preventDefault();
       		_controller.declineConflict();
       		
       		var config = _controller.getConfiguration();
       		// Revert the selection on the engine, grades and packs controls
       		_bottomContainer.setProps({configuration:config});
       		_overlay.setState({visible:false});
       	}
        
        /**
         * Method which shows the include options
         * @param e:EventObject 
         */
        function showIncludeOptions(e)
        {
        	// Show include option message
        	_overlay.setProps({
        		title:_dic.getLabel('itemConflictTitle').replace("{ITEM_NAME}",e.data[0].Name),
        		data:e.data,
        		cancelHandler:cancelIncludeHandler,
        		acceptHandler:acceptIncludeHandler
        	});
        }
        
        /**
       	 * Method which accepts the include click
       	 * @param e:DataEvent 
       	 */
       	function acceptIncludeHandler(e)
       	{
       		if(!_overlay._selected)return;
       		var data = _overlay.props.data,
       			selected = _overlay._selected.ID,
       			includes = data[3],
				// Get the object out of the multiple selection Array which should be selected
				optional = data[2][0],
				i = 0,
				iL = optional.length;
				
			for(i; i < iL; i++)
			{
				if(optional[i].ID == selected)
				{
					includes.push(optional[i]);
					break;
				}
			}
			// If there is a second level selection...
			if(data[2].length > 1)
			{
				var aSecondLvl = data[2][(i+1)];
				if(aSecondLvl.length > 1)
				{
					// Hide the msg panel
					_overlay.setState({visible:false});
					// Remove the selectable group from the conflicts! (only support for 2 levels is included atm)
					data[2] = [];
					data[2].push(aSecondLvl);
					// Show the message panel again
					showIncludeOptions({data:data});
					return;
				}
			}
			
			// Set the options
			_controller[data[1]](data[0].ID, includes);
			_overlay.setState({visible:false});
       	}
       	
       	/**
       	 * Method which cancels the include click
       	 * @param e:DataEvent 
       	 */
       	function cancelIncludeHandler(e)
       	{
       		// Hide the msg include, don't do anything
       		_overlay.setState({visible:false});
       	}
       	
       	/**
       	 * Method which handles the server error 
       	 */
       	function serverErrorEventHandler(e)
       	{
       		if(e.critical)
			{
	       		showError(e.text);
	       }
       	}
       	
       	/**
       	 * Method which handles the error response 
       	 */
       	function showError(des)
       	{
       		_overlay.setProps({
	        		title:_dic.getLabel('serviceErrorTitle'),
	        		description:des
	        	});
       	}
        
        /**
         * Method which handles the event when a configuration has changed
         * @param e:DataEvent 
         */
        function configurationChanged(e)
        {
        	//console.log("configuration changed: ", e.data);
        	//console.log("wheel selected: ", e.data.WheelID, " // Accessory: ", e.data.Accessories);
        	//console.log("configuration changed // Options: ", e.data.Options);
        	_topContainer.setProps({configuration:e.data});
        	_bottomContainer.setProps({configuration:e.data}, _bottomContainer.resetCTALoaders);
        	_savedConfig = null;
        	loadMonthlyRate();
        }
        
        /**
       	 * Method which is called when the upholsteries list should be updated
       	 * @param event:DataEvent 
       	 */
       	function renderUpholsteries(e)
       	{
       		//console.log("render upholsteries: ", e.data);
       		_topContainer.setProps({upholsteries:e.data[0]});
       	}
       	
       	/**
       	 * Method which is called when the inlays should be updated
       	 * @param event:DataEvent 
       	 */
       	function renderInlays(e)
       	{
       		//console.log("render inlays: ", e.data);
       		_topContainer.setProps({inlays:e.data[0]});
       	}
       	
       	/**
       	 * Method which is called when the options should be updated
       	 * @param event:DataEvent 
       	 */
       	function renderOptions(e)
       	{
       		//console.log("render options: ", e.data);
       		_topContainer.setProps({options:e.data[0]});
       	}
       	
       	/**
       	 * Method which is called when the accessories should be updated
       	 * @param event:DataEvent 
       	 */
       	function renderAccessories(e)
       	{
       		//console.log("render accessories: ", e.data);
       		_topContainer.setProps({accessories:e.data[0]});
       	}
    	
    	// Call the init method
        init();
    };
    ui.CarConfig.prototype = new be.marlon.EventDispatcher();
	ui.CarConfig.prototype.constructor = ui.CarConfig;
})();
