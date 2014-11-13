/**
 * This class chains a series of webservice calls it also caches the loaded dat to determine if a new call has to be made or cached data can be returned.
 * Basically, it contains all logic for loading the data.
 */
be.marlon.QueueLoader = function(_LOAD, _ws, _configuration, _settings)
{	
	// Data loaded event
	this.DATA_LOADED = "data_loaded";
	
	// Method dispatched when data is required to reload
	this.REQUIRES_LOAD = "requires_load";
	
	// Webservice instance
	var _data = {	// This is the data object which contains all the loaded data
			filters:null,
			modelsubsets:null,
			msgrades:[],
			configuration:null,
			carinfo:null,
			model:null,
			submodels:null,
			bodytypes:null,
			motorizations:null,
			grades:null,
			colours:null,
			wheels:null,
			options:null,
			packs:null,
			upholsteries:null,
			inlays:null,
			accessories:null,
			version:null
		}, 
		_configURL,
		_eventQueue = [],
		_aCalls = [],
		_oCalls = {},
		_events,
		_msGrades, // Variable used to save which grades where requested for the list of modelsubsets
		_loading = false,
		_internal = be.marlon.Internal,
		_async = true,
		_loadingSubmodelModelID, // Temp object which will contain the submodel id which is being loaded
		_submodelCache = {}, // Object which contains the submodels for each model
		_instance = this;
	
	/**
	 * Method which sets the xmlconfiguration url, used when initially loading the configuration object
	 * @param url:String 
	 */
	this.setConfigURL = function(url)
	{
		_configURL = url;
	};
	
	/**
	 * Method which loads a series of calls
	 * @param aCalls:Array of functions linked to the webservice 
	 */
	this.load = function(aCalls, async)
	{
		var i = 0,
			iL = aCalls?aCalls.length:0,
			o,
			reload = {reload:false};
		
		_aCalls = aCalls;
		_async = (typeof async === "undefined")?true:async;
		// Clean the loading sequence if one is in progress
		cleanLoading();
		
		// If the service has not been loaded yet, add it to the first call made
		if(!_data.version)
		{
			_eventQueue.push({type:_internal.SERVICE_VERSION_LOADED, actionmethod:getVersion, prop:"version"});
		}
		
		// Add the calls which are required
		for(; i < iL; i++)
		{
			switch(aCalls[i])
			{
				case _LOAD.FILTERDATA:
					_eventQueue.push({type:_internal.FILTERS_LOADED, actionmethod:getFilterData, prop:"filters", call:aCalls[i]});
					_eventQueue.push({type:_internal.MODELSUBSETS_LOADED, actionmethod:getModelSubSets, prop:"modelsubsets", call:aCalls[i]});
				break;
				case _LOAD.CONFIGURATION:
					_eventQueue.push({type:_internal.FULL_CONFIGURATION_LOADED, actionmethod:getFullConfiguration, prop:"configuration", call:aCalls[i]});
				break;
				case _LOAD.MODEL:
					if(_configuration.ModelID === "")_eventQueue.push({type:_internal.FULL_CONFIGURATION_LOADED, actionmethod:getFullConfiguration, prop:"configuration", call:_LOAD.CONFIGURATION});
					_eventQueue.push({type:_internal.MODEL_LOADED, actionmethod:getModel, prop:"model", call:aCalls[i]});
					// Due to pack equipment prices not being propagated through correctly, we need to fetch the packs to
					if(_configuration.ModelID === "")_eventQueue.push({type:_internal.PACKS_LOADED, actionmethod:getPacks, prop:"packs", call:_LOAD.PACKS});
				break;
				case _LOAD.SUBMODELS:
					// Check if the submodels are not cached in the submodel cache
					if(_submodelCache[_configuration.ModelID])
					{
						_data.submodels = _submodelCache[_configuration.ModelID];
					}
					_eventQueue.push({type:_internal.SUBMODELS_LOADED, actionmethod:getSubModel, prop:"submodels", call:aCalls[i]});
				break;
				case _LOAD.BODYTYPES:
					_eventQueue.push({type:_internal.BODY_TYPES_LOADED, actionmethod:getBodyTypes, prop:"bodytypes", call:aCalls[i]});
				break;
				case _LOAD.MOTORIZATIONS:
					_eventQueue.push({type:_internal.MOTORIZATIONS_LOADED, actionmethod:getMotorizations, prop:"motorizations", call:aCalls[i]});
				break;
				case _LOAD.GRADES:
					_eventQueue.push({type:_internal.GRADES_LOADED, actionmethod:getGrades, prop:"grades", call:aCalls[i]});
				break;
				case _LOAD.COLOURS:
					_eventQueue.push({type:_internal.COLOURS_LOADED, actionmethod:getColours, prop:"colours", call:aCalls[i]});
					// There is a dependency with colour selection toward the upholsteries, therefor it is required that we also load the upholsteries
					_eventQueue.push({type:_internal.UPHOLSTERIES_LOADED, actionmethod:getUpholsteries, prop:"upholsteries", call:_LOAD.UPHOLSTERIES});
				break;
				case _LOAD.WHEELS:
					_eventQueue.push({type:_internal.WHEELS_LOADED, actionmethod:getWheels, prop:"wheels", call:aCalls[i]});
				break;
				case _LOAD.OPTIONS:
					_eventQueue.push({type:_internal.OPTIONAL_EQUIPMENT_LOADED, actionmethod:getOptions, prop:"options", call:aCalls[i]});
				break;
				case _LOAD.PACKS:
					_eventQueue.push({type:_internal.PACKS_LOADED, actionmethod:getPacks, prop:"packs", call:aCalls[i]});
				break;
				case _LOAD.UPHOLSTERIES:
					_eventQueue.push({type:_internal.UPHOLSTERIES_LOADED, actionmethod:getUpholsteries, prop:"upholsteries", call:aCalls[i]});
					// When loading the interior, there is a dependency on the user selecte wheels which might not update after selecting a pack
					_eventQueue.push({type:_internal.WHEELS_LOADED, actionmethod:getWheels, prop:"wheels", call:_LOAD.WHEELS});
				break;
				case _LOAD.INLAYS:
					_eventQueue.push({type:_internal.INLAYS_LOADED, actionmethod:getInlays, prop:"inlays", call:aCalls[i]});
				break;
				case _LOAD.ACCESSORIES:
					_eventQueue.push({type:_internal.OPTIONAL_ACCESSORIES_LOADED, actionmethod:getAccessories, prop:"accessories", call:aCalls[i]});
					// There is a dependency on exterior wheels, what if you deselect an accessory wheel? -> The default wheel has to be reselected
					_eventQueue.push({type:_internal.WHEELS_LOADED, actionmethod:getWheels, prop:"wheels", call:_LOAD.WHEELS});
				break;
			}
		}
		
		// Remove duplicates from the calls
		i = 0;
		iL = _eventQueue.length;
		var dedupl = {};
		for(; i < iL; i++)
		{
			o = _eventQueue[i];
			if(dedupl[o.type])
			{
				_eventQueue.splice(i, 1);
				i--;
				iL--;
			}
			dedupl[o.type] = true;
		}
		dedupl = null;
		
		// Now add eventlisteners to the relevant calls
        i = 0;
        _events = [];
        for(; i < iL; i++)
        {
        	o = _eventQueue[i];
        	o.callback = responseHandler;
        	_events.push(o);
        	_ws.addEventListener(o.type, o.callback);
        	if(!_data[o.prop])
        	{
        		reload.reload = true;
        		if(o.call)reload[o.call] = true;
        	}
        }
        
        // Dispatch an event notifieying the implementing file that data should be reloaded
        _instance.dispatchEvent({type:_instance.REQUIRES_LOAD, data:reload});
        
        // Load the data
        _loading = true;
        loadData();
	};
	
	/**
     * Method used to retrieve the grades for the given modelsubsets 
     */
    this.getModelSubsetGrades = function(aModelSubsets)
    {
    	// Abort previous webservice calls
    	_ws.abort();
    	
    	// Copy the requested modelsubsetgrades
    	_msGrades = aModelSubsets.concat();
    	// Check the to be loaded modelsubsets, if there are subsets which do not need to be loaded anymore
    	var i = 0,
    		iL = _data.msgrades.length,
    		t;
    	for(; i < iL; i++)
    	{
    		for(t=0; t < aModelSubsets.length; t++)
    		{
    			if(_data.msgrades[i].ModelSubSetID == aModelSubsets[t])
    			{
    				aModelSubsets.splice(t, 1);
    				i--;
    				break;
    			}	
    		}
    	}
    	
    	// Only load if there are grades which have not been loaded yet
    	if(aModelSubsets.length > 0)
    	{
	    	// Create the configuration object required for the webservice call
	    	var o = {
				Country:_configuration.Country,
				Brand:_configuration.Brand,
				Language:_configuration.Language,
				Type:1,
				ModelSubsetIds:aModelSubsets
			};
	    	_ws.getModelSubsetGrades(o);
	    }
	    else
	    {
	    	dispatchModelSubSetGradesEvent();
	    }
    };
    
    /**
     * Method which loads the submodels for a specific model 
     */
    // TODO
    this.getSubModels = function(modelID)
    {
    	// Abort previous webservice calls
    	cleanLoading();
    	_loading = true;
    	_loadingSubmodelModelID = modelID;
    	
    	if(_submodelCache[modelID])
    	{
    		dispatchSubModelEvent(_submodelCache[modelID]);
    	}
    	else
    	{
    		_ws.getSubModels(
	    		{
	        		Country:_settings.country,
	                Brand:_settings.brand,
	                Language:_settings.language,
	                ModelID:modelID
				}
	    	);
    	}
    };

	/**
	 * Method which resets the data object 
	 */
	this.resetData = function(resetPacks, resetEngineGrade, resetBodyTypes, resetModel)
	{
		// Don't reset the model and submodels
		if(resetModel)
		{
			_data.model = null;
			_data.submodels = null;
			delete _oCalls.model;
			delete _oCalls.submodels;
		}
		
		// Reset the other properties
		_data.carinfo = null;
		
		_data.colours = null;
		_data.wheels = null;
		_data.options = null;
		
		_data.upholsteries = null;
		_data.inlays = null;
		_data.accessories = null;
		
		delete _oCalls.colours;
		delete _oCalls.wheels;
		delete _oCalls.options;
		delete _oCalls.upholsteries;
		delete _oCalls.inlays;
		delete _oCalls.accessories;
		
		if(resetBodyTypes)
		{
			_data.configuration = null;
			_data.bodytypes = null;
			_data.motorizations = null;
			_data.grades = null;
			_data.packs = null;
			
			delete _oCalls.configuration;
			delete _oCalls.bodytypes;
			delete _oCalls.motorizations;
			delete _oCalls.grades;
			delete _oCalls.packs;
		}
		if(resetEngineGrade)
		{
			_data.motorizations = null;
			_data.grades = null;
			_data.packs = null;
			
			delete _oCalls.motorizations;
			delete _oCalls.grades;
			delete _oCalls.packs;
		}
		if(resetPacks)
		{
			_data.packs = null;
			
			delete _oCalls.packs;
		}
	};
	
	/**
	 * Method which sets the full configuration object 
	 */
	this.setFullConfiguration = function(config)
	{
		_data.configuration = config;
	};
	
	/**
	 * Method which ressets the queueloader, used when a service error occured 
	 */
	this.reset = function()
	{
		// If it's a critical error, make sure the loading-flow events get removed
        removeEventListeners();
        // Remove all remaining event handlers in the que
        while(_eventQueue.length > 0)
        {
        	_eventQueue.pop();
        }
	};
	
	/**
	 *########################################################################################################################  
	 *
	 * Loading flow action methods
	 * 
	 *######################################################################################################################## 
	 */
	
	/**
	 * Method which loads the webservice version 
	 */
	function getVersion()
	{
		_ws.getBackEndVersion();
	}
	
	/**
	 * Method which returns the filters 
	 */
	function getFilterData()
	{
		var o = {
			Country:_configuration.Country,
			Brand:_configuration.Brand,
			Language:_configuration.Language,
			Type:1
		};
		_ws.getFilters(o);
	}
	
	/**
	 * Method which returns the modelsubsets 
	 */
	function getModelSubSets()
	{
		var o = {
			Country:_configuration.Country,
			Brand:_configuration.Brand,
			Language:_configuration.Language,
			Type:1
		};
		_ws.getModelSubsets(o);
	}
	
	/**
	 * Method which loads the model data 
	 */
	function getModel()
	{
		_ws.getModel(getParamConfiguration(), _async);
	}
	
	/**
	 * Method which loads the submodels 
	 */
	function getSubModel()
	{
		_ws.getSubModels(getParamConfiguration(), _async);
	}
	
	/**
	 * Method which loads the bodytypes 
	 */
	function getBodyTypes()
	{
		_ws.getBodyTypes(getParamConfiguration([_configuration.SubModelID]), _async);
	}
	
	/**
	 * Method which loads the motorizations 
	 */
	function getMotorizations()
	{
		_ws.getMotorizations(getParamConfiguration([_configuration.SubModelID, _configuration.BodyTypeID]), _async);
	}
	
	/**
	 * Method which loads the grades 
	 */
	function getGrades()
	{
		_ws.getGrades(getParamConfiguration([_configuration.SubModelID, _configuration.BodyTypeID]), _async);
	}
	
	/**
	 * Method which loads the colors 
	 */
	function getColours()
	{
		var aPost;
        if(_settings.load_all)
        {
            aPost = [_configuration.SubModelID, _configuration.BodyTypeID];
            if(_settings.gradeid !== false)
            {
                aPost.push(_configuration.GradeID);
            }
        }
        else
        {
            aPost = [_configuration.CarID];
        }
        // Add the packs
        aPost.push(_configuration.Packs);

        // Get the carcolours
        _ws.getColourInfo(getParamConfiguration(aPost), _async);
	}
	
	/**
	 * Method which loads the wheels 
	 */
	function getWheels()
	{
		var aPost;
	    if(_settings.load_all)
	    {
	        aPost = [_configuration.SubModelID, _configuration.BodyTypeID];
	        if(_settings.gradeid !== false)
	        {
	            aPost.push(_configuration.GradeID);
	        }
	    }
	    else
	    {
	        aPost = [_configuration.CarID, _configuration.Packs];
	    }
		_ws.getWheels(getParamConfiguration(aPost), _async);
	}
	
	/**
	 * Method which loads the options 
	 */
	function getOptions()
	{
		// Get the optional equipment
        _ws.getOptionalEquipment(getParamConfiguration([_configuration.CarID, _configuration.Packs]), _async);
	}
	
	/**
	 * Method which loads the packs 
	 */
	function getPacks()
	{
		_ws.getPacks(getParamConfiguration([_configuration.CarID]), _async);
	}
	
	/**
	 * Method which loads the upholsteries 
	 */
	function getUpholsteries()
	{
		_ws.getUpholsteries(getParamConfiguration([_configuration.CarID, _configuration.Packs]), _async);
	}
	
	/**
	 * Method which loads the inlays 
	 */
	function getInlays()
	{
		// Load the inlays!
        _ws.getInlays(getParamConfiguration([_configuration.CarID, _configuration.Packs]), _async);
	}
	
	/**
	 * Method which loads the accessories 
	 */
	function getAccessories()
	{
		_ws.getOptionalAccessories(getParamConfiguration([_configuration.CarID, _configuration.Packs]), _async);
	}
	
	/**
	 * Method which loads the full configuration 
	 */
	function getFullConfiguration()
	{
		var aPara;
		// If the initconfiguration exists on this point,
		// Check if the _initConfiguration is a String which means it points to a JSON configuration
		if(_configURL)
		{
		    // Add event listener
			_ws.addEventListener(_internal.CONFIG_URL_LOADED, getInitConfigUrlEventHandler);
			// Load the xml file
		    _ws.getUrlConfig(_configURL);
		    _configURL = null;
		    return;
		}
       
		aPara = [];
		var prop;
		for(prop in _configuration)
		{
		    // Exclude model id
			if(prop !== "ModelID")
		    {
		        if(_configuration.isValid(_configuration[prop]) && !_configuration.isEmpty(_configuration[prop]))
		        {
		            aPara.push(_configuration[prop]);
		        }
		    }
		}
		// If aPara is emtpy, it means no specific configuration properties have been set
		if(aPara.length === 0)
		{
			aPara = [_configuration.SubModelID];
		    if(_settings.load_all && _settings.gradeid !== false)
		    {
		        aPara.push(_configuration.GradeID);
		    }
		}
		// Standard only Brand, Country, Language adnd ModelID are passed through
		_ws.getFullConfiguration(getParamConfiguration(aPara), _async);
	}
	
	/**
	 *########################################################################################################################  
	 *
	 * Loading flow event handlers
	 * 
	 *######################################################################################################################## 
	 */
	
    /**
     * Callback method when the modelsubsetsgrades have been loaded 
     */
    function modelSubSetLoadedHandler(e)
    {
    	// In chrome when cancelling webcalls, sometimes the handler is still called
    	if(typeof e.data === "undefined")return;
    	// Cache the loaded data on the client
    	var i = 0,
    		iL = e.data.length;
    	for(; i < iL; i++)
    	{
    		_data.msgrades.push(e.data[i]);
    	}
    	dispatchModelSubSetGradesEvent(e.data);
    }
    
    /**
     * Method which handles the loading of the submodels 
     */
    // TODO
    function subModelsLoadedHandler(e)
    {
    	_submodelCache[_loadingSubmodelModelID] = e.data;
    	dispatchSubModelEvent(_submodelCache[_loadingSubmodelModelID]);
    }
    
    /**
     * Method which dispatches the event if the submodels are loaded for a particular model 
     */
    function dispatchSubModelEvent(data)
    {
    	_loading = false;
    	_instance.dispatchEvent(new be.marlon.DataEvent(_internal.SUBMODELS_LOADED, data));
    }
    
    /**
     * Method which takes care of dispatching the event when the modelsubsetgrades have been loaded 
     */
    function dispatchModelSubSetGradesEvent(data)
    {
    	// Create return object based on the loaded data
    	var aR = [],
    		i = 0,
    		iL = _msGrades.length, 
    		t,
    		tL = _data.msgrades.length;
    	for(; i < iL; i++)
    	{
    		// Get the correct loaded value from the msgrades
    		for(t = 0; t < tL; t++)
    		{
    			if(_msGrades[i] == _data.msgrades[t].ModelSubSetID)
    			{
    				aR.push(_data.msgrades[t]);
    				break;
    			}
    		}
    	}
    	
    	// Clear temp cache
    	_msGrades = null;
    	// Dispatch event
    	_instance.dispatchEvent(new be.marlon.DataEvent(_internal.MODELSUBSETGRADES_LOADED, aR));
    }
	
	/**
	 * Method which handles loading the response from the xml to config service
	 * @param e:DataEvent 
	 */
	function getInitConfigUrlEventHandler(e)
	{
		_ws.removeEventListener(_internal.CONFIG_URL_LOADED, getInitConfigUrlEventHandler);
		_ws.getFullConfiguration(e.data);
	}
	
	/**
	 * Method which handles the response from the service
	 * @param e:DataEvent 
	 */
	function responseHandler(e)
	{
		var i = 0,
			iL = _events.length,
			o;
		for(; i < iL; i++)
		{
			o = _events[i];
			if(e.type == o.type)break;
			o = null;
		}
		if(o)
		{
			_data[o.prop] = e.data;
			if(o.type == _internal.FULL_CONFIGURATION_LOADED)
			{
				// Parse the configuration, this is required so the subsequent calls after configuration are populated with the correct properties
				parseFullConfiguration(_data[o.prop]);
			}
		}
		loadData();
	}
	
	/**
	 *########################################################################################################################  
	 *
	 * Private methods
	 * 
	 *######################################################################################################################## 
	 */
	
	/**
	 * Method which initializes the component 
	 */
	function init()
	{
		_ws.addEventListener(_internal.MODELSUBSETGRADES_LOADED, modelSubSetLoadedHandler);
		_ws.addEventListener(_internal.SUBMODELS_LOADED, subModelsLoadedHandler);
	}
	
	/**
     * Method used to compose a configuration object used for parameterising of a service call
     * @param aConfigurationParams:Array
     */
    function getParamConfiguration(aConfigurationParams)
    {
        // Copy the general required parameters for getting the configuration
        var pConfig = {};
        pConfig.Country = _configuration.Country;
        pConfig.Brand = _configuration.Brand;
        pConfig.Language = _configuration.Language;
        if(_configuration.ModelID !== "")pConfig.ModelID = _configuration.ModelID;

        // Now loop through the supplied configuration parameters
        if(aConfigurationParams)
        {
            var i = 0;
            var iLength = aConfigurationParams.length;
            var oParam;
            for(i; i < iLength; i++)
            {
                oParam = aConfigurationParams[i];

                // Loop through all the properties already in the _configuration object
                for(var prop in _configuration)
                {
                    // If the content of the property from the configuration object matches the id, copy the property in the pConfig
                    if(_configuration[prop] === oParam)
                    {
                        pConfig[prop] = oParam;
                        break;
                    }
                }
            }
        }

        return pConfig;
    }
	
	/**
	 * Method which cleans up the loading 
	 */
	function removeEventListeners()
	{
		if(!_events)return;
		var i = 0,
			iL = _events.length,
			o;
		for(; i < iL; i++)
		{
			o = _events[i];
			_ws.removeEventListener(o.type, o.callback);
		}
	}
	
	/**
     * Method which verifies if all required elements are present in the configuration object
     */
    function checkConfiguration(config)
    {
        var reqProps = ["ExteriorColourID", "UpholsteryID","GradeID","CarID","BodyTypeID","EngineID","TransmissionID","WheelDriveID","FuelTypeID","WheelID"],
        	i = 0,
        	iL = reqProps.length;
        for(; i < iL; i++)
        {
        	if(!_configuration.isValid(config[reqProps[i]]) || _configuration.isEmpty(config[reqProps[i]]))
        	{
        		return false;
        	}
        }
        return true;
    }
    
    /**
     * Method which cleans up the loading progress if there is any
     */
    function cleanLoading()
    {
        // Check if there is a server call in progress, if so clean it up!
        if(_loading)
        {
            // Remove all event listeners
            removeEventListeners();

            // Abort the webservice
            _ws.abort();

            // Loading is false
            _loading = false;
        }
    }
    
    /**
     * Method which loads the data
     * @param o:Object 
     */
    function loadData()
    {
    	var i,
    		o,
    		prop,
    		iL = _events.length;
    	if(_eventQueue.length === 0)
    	{
    		removeEventListeners();
    		_loading = false;
    		var data = {};
    		for(i = 0; i < iL; i++)
    		{
    			o = _events[i];
    			prop = o.prop; 
    			data[prop] = {
    				update:o.update,
    				data:_data[prop],
    				internal:(o.internal === true)
    			};
    		}
    		
    		// Save the requested calls in the oCalls hash table object
    		_aCalls.map(
    			function(item)
    			{
    				_oCalls[item] = true;
    			}
    		);
    		// Dispatch the data loaded event
    		_instance.dispatchEvent({type:_instance.DATA_LOADED, data:data});
    		return;
    	}
    	o = _eventQueue.shift();
    	// Check if the data has been loaded
    	if(_data[o.prop])
    	{
    		// Check if the data should be updated or not
    		iL = _aCalls.length;
    		o.update = true;
    		if(_oCalls[o.call])o.update = false;
    		// Check to load the next in line
    		loadData();
    	}
    	// If not, load it
    	else
    	{
    		// Check if the data should be updated or not
    		o.update = true;
    		o.actionmethod();
    	}
    }
    
    /**
     * Parse the full configuration 
     */
    function parseFullConfiguration(config)
    {
    	if(_configuration.ModelID === "")_configuration.ModelID = config.Model.ID;
    	_configuration.CarID = config.Car.ID;
    	_configuration.BodyTypeID = config.Body.ID;
    	_configuration.GradeID = config.Grade.ID;
    	_configuration.EngineID = config.Motorization.Engine.ID;
    	_configuration.FuelTypeID = config.Motorization.Engine.Type.ID;
    	_configuration.TransmissionID = config.Motorization.Transmission.ID;
    	_configuration.WheelDriveID = config.Motorization.Wheeldrive.ID;
    	_configuration.ExteriorColourID = config.ExteriorColour.ID;
    	_configuration.WheelID = config.Wheel.ID;
    	_configuration.UpholsteryID = config.Upholstery.ID;
    	if(config.Inlay)_configuration.InlayID = config.Inlay.ID;
    	if(config.Submodel)_configuration.SubModelID = config.Submodel.ID;
    	// Parse the options, accessories and packs
    	var aP = ["Options", "Accessories", "Packs"],
    		i = 0,
    		iL = aP.length,
    		aO,
    		aR,
    		t,
    		tL;
    	for(; i < iL; i++)
    	{
    		aO = config[aP[i]];
    		if(aO.length > 0)
    		{
    			tL = aO.length;
    			aR = [];
    			for(t = 0; t < tL; t++)
    			{
    				aR.push(aO[t].ID);
    			}
    			_configuration[aP[i]] = aR;
    		}
    	}
    }
	
	// Call the initialisation
	init();
};
be.marlon.QueueLoader.prototype = new be.marlon.EventDispatcher();
be.marlon.QueueLoader.prototype.constructor = be.marlon.QueueLoader;