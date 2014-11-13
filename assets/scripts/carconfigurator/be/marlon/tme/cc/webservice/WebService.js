be.marlon.WebService = function(
	_hasPrice, 
	_context, 
	_gateway, 
	_loadTFS, 
	_enableCarconfigWebserviceTimeout, 
	_carconfigWebserviceTimeout,
	_webserviceSegmentMaxLength)
{
	var _urlLoader = false;
	var _instance = this; // Since the responder of the _http_request references this as the httpRequest
	
	var _POST = "POST";
	var _GET = "GET";
	
	// Instantiate the validator
	var _validator = be.marlon.Validator?new be.marlon.Validator(_hasPrice, this):false,
		_cacheParams,
		_timer;
	
	// Overwrite eventTypes, else they get shared
	this.eventTypes = [];
	this.eventHandlers = [];
	
	//----------------------------------
	//  Private methods
	//----------------------------------
	
	/**
	* Method which gets the json based on the provided url and parameters
	* @param url:String the url where to fetch the data from
	* @param params:JSON String of the parameters
	* @param event:String the event type which should be dispatched, used to identify the event
	* @param parseFunction:Function the function which is used as an intermediate callback; some data will be prepared before sending the data to possible listeners
	* @param type:String POST or GET
	* @param async:Boolean if the http request has to be fired asynchronous or not
	* @param extraParams:Object additional parameters which should be added or not
	*/
	function getData(url, params, event, parseFunction, type, async, extraParams)
	{	
		if(typeof async == "undefined")async = true;
		// Start the timer
		if(_enableCarconfigWebserviceTimeout)
		{
			_timer = setTimeout(timeOutHandler, _carconfigWebserviceTimeout);
			_cacheParams = {
				url:url,
				params:params,
				event:event,
				parseFunction:parseFunction,
				type:type,
				async:async
			};
		}
		
		// Check the params, if it is a _GET call, create the full url config
		if(type === _GET && params)
		{
			// Check the maximum segment length
			var p = transformParams(params, extraParams),
				aSegments = p.split("/"),
				maxLength = 0;
			aSegments.map(
				function(s)
				{
					if(s.length > maxLength)maxLength = s.length;
				}
			);
			
			// If the maxlength is under the tollerance level, do a get request with the GET string
			if(maxLength < _webserviceSegmentMaxLength)params = p;
			// If not, use a post request
			else type = _POST;
		}
		
		// Create a new urlloader
		_urlLoader = new be.marlon.URLLoader(_POST, _GET);
		_urlLoader.load(url, params, event, parseFunction, responder, type, async);
	}
	
	//----------------------------------
	//  Private functions
	//----------------------------------
	
	/**
	 * Method which handles the transforming of the configuration object to the GET style 
	 */
	function transformParams(config, extraParams)
	{
		var s = "";
		// Add the base parameters
		s += "/" + config.Brand;
		s += "/" + config.Country;
		s += "/" + config.Language;
		if(config.ModelID)s += "/" + config.ModelID;
		if(config.Type)s += "/-/type/" + config.Type;
		// Add the extra custom parameters
		var aParamOrder = [
			{"key":"SubModelID", "value":"submodel"},
			{"key":"BodyTypeID", "value":"bodytype"},
			{"key":"EngineID", "value":"engine"},
			{"key":"FuelTypeID", "value":"fueltype"},
			{"key":"TransmissionID", "value":"transmission"},
			{"key":"WheelDriveID", "value":"wheeldrive"},
			{"key":"GradeID", "value":"grade"},
			{"key":"CarID", "value":"car"},
			{"key":"ExteriorColourID", "value":"colour"},
			{"key":"UpholsteryID", "value":"upholstery"},
			{"key":"WheelID", "value":"wheel"},
			{"key":"InlayID", "value":"inlay"},
			{"key":"Packs", "value":"packs"},
			{"key":"Options", "value":"options"},
			{"key":"Accessories", "value":"accessories"},
			{"key":"ModelSubsetIds", "value":"modelsubsetids"}];
		
		var i = 0,
			iL = aParamOrder.length,
			t,
			tL,
			o,
			v;
		for(; i < iL; i++)
		{
			o = aParamOrder[i];
			v = config[o.key];
			if(v)
			{
				if(typeof v === "string" && v !== "00000000-0000-0000-0000-000000000000")s += "/" + o.value + "/" + v;
				else if((typeof v === "object" && v.length && v.length > 0))
				{
					s += "/" + o.value + "/";
					tL = v.length;
					for(t = 0; t < tL; t++)
					{
						s += v[t];
						if(t < tL -1)s += ",";
					}
				}
			} 
				
		}
		
		// Add the extra keys
		if(extraParams)
		{
			for(var sProp in extraParams)
			{
				s += "/" + sProp + "/" + extraParams[sProp];
			}
		}
		
		return s;
	}
	
	/**
	 * Method which handles the time out event 
	 */
	function timeOutHandler()
	{
		// Abort the webservice call
		_urlLoader.abort(true);
		// Relaunch the call
		getData(_cacheParams.url, _cacheParams.params, _cacheParams.event, _cacheParams.parseFunction, _cacheParams.type, _cacheParams.async);
	}	
	
	/**
	* Handles response from the webservice
	* @param loader:URLLoader instance where the callback originates from
	*/
	function responder(loader)
	{
		var request = loader.getRequest();
		// Calculate the time from the start of the webservice until the response
		var nResponseTime;
        var evaluator = eval;
		if(request.readyState == 4 && (request.status == 200 || request.status === 0))
		{
			// Clear the timeout
			_cacheParams = null;
			clearTimeout(_timer);
			// Set the reference to false
			_urlLoader = null;
			var respons = request.responseText;
			var data;
			nResponseTime = (new Date()).getTime() - loader.startDate;
			if(respons)
			{
				try{
					data = evaluator("(" + respons + ")");
				}
				catch(ex){console.error("Error parsing JSON response!");}
			}
			
			if(loader.parseFunction)
			{
				loader.parseFunction(loader.event, data);
			}
			else
			{
				var evt = new be.marlon.DataEvent(loader.event,data);
				_instance.dispatchEvent(evt);
			}
		}
		// If the service cannot be accesed for some odd reaons
		else if(request.readyState == 4 && (request.status == 500 || request.status == 404))
		{
			// Clear the timeout
			_cacheParams = null;
			clearTimeout(_timer);
			// Set the reference to false
			_urlLoader = null;
			if(loader.event == be.marlon.Internal.MONTHLY_PAYMENT_LOADED || loader.event == be.marlon.Internal.LEGAL_TEXT_LOADED)
			{
				_instance.dispatchEvent(new be.marlon.ErrorEvent(be.marlon.Internal.FIN_SERVICE_ERROR));
			}
			else
			{
				nResponseTime = (new Date()).getTime() - loader.startDate;
				
				// Old fallback
				var sError;
				if(request.status == 500)
				{
					var regExp = /(<title>)(.*)(<\/title>)/gm,
						aError = regExp.exec(request.responseText);
					sError = aError?aError[2]:"Error";
				}
				else
				{
					sError = evaluator("(" + request.responseText + ")").error;
				}
				_instance.dispatchEvent(new be.marlon.ErrorEvent(be.marlon.Internal.SERVICE_ERROR, sError, true, loader.url));
			}
		}
	}
	
	/**
	* Utility method which checks if the item exists in an array
	* @param item:*
	* @param array:Array
	* @param prop:String the property of the array to compare the item to
	* @return bExists:Boolean
	*/
	this.itemExists = function(item, array, prop)
	{
		var bExists = false;
		var iLength = array.length;
		var i = 0;
		if(prop)
		{
			for(i; i < iLength; i++)
			{
				if(array[i][prop] == item)
				{
					bExists = true;
					break;
				}
			}
		}
		else
		{
			for(i; i < iLength; i++)
			{
				if(array[i] == item)
				{
					bExists = true;
					break;
				}
			}
		}
		return bExists;
	};
	
	/**
	* Method used to parse the colours
	* @param type:String event type
	* @param date:* data object returned from the server
	*/
	function colourParser(type,data)
	{
		// If the validator exists, parse the colours
		if(_validator)
		{
			_validator.validateColourInfo(data);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the upholstries
	* @param type:String event type
	* @param date:* data object returned from the server
	*/
	function upholstryParser(type, data)
	{	
		// If the validator exists, parse the upholsteries
		if(_validator)
		{
			_validator.validateUpholsteries(data);
		}

		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the inlays
	* @param type:String event type
	* @param data:* data object returned from the server
	*/
	function inlayParser(type, data)
	{
		// If the validator exists, parse the Inlays
		if(_validator)
		{
			_validator.validateInlays(data);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the equipments
	* @param type:String event type
	* @param date:* data object returned from the server
	*/
	function optionalEquipmentParser(type,data)
	{
		// If the validator exists, parse the optionalEquipment
		if(_validator)
		{
			_validator.validateEquipment(data, "GetOptionalEquipment", true);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the equipments
	* @param type:String event type
	* @param date:* data object returned from the server
	*/
	function standardEquipmentParser(type,data)
	{
		// If the validator exists, parse the optionalEquipment
		if(_validator)
		{
			_validator.validateEquipment(data, "GetStandardEquipment", false);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the accessories
	* @param type:String event type
	* @param date:* data object returned from the server
	*/
	function optionalAccessoriesParser(type, data)
	{
		// If the validator exists, parse the optionalEquipment
		if(_validator)
		{
			_validator.validateEquipment(data, "GetOptionalAccessories", true);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the accessories
	* @param type:String event type
	* @param date:* data object returned from the server
	*/
	function standardAccessoriesParser(type,data)
	{
		// If the validator exists, parse the optionalEquipment
		if(_validator)
		{
			_validator.validateEquipment(data, "GetStandardAccessories", false);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the motorization
	* @param type:String event type
	* @param data:* data object returned from the server
	* @param aParams:Array the array containing the parameters returned from the service
	*/
	function motorizationParser(type, data)
	{
		// If the validator exists, parse the motorizations
		if(_validator)
		{
			_validator.validateMotorizations(data);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the grades
	* @param type:String event type
	* @param data:* data object returned from the server containing all the grades
	* @param aParams:Array containing an additional parameter which is the configuration used to get specific grades
	*/
	function gradeParser(type, data)
	{
		// If the validator exists, parse the motorizations
		if(_validator)
		{
			_validator.validateGrades(data);
		}
		
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the packs
	* @param type:String event type
	* @param data:* data object returned from the server containing all the packs
	*/
	function packParser(type, data)
	{
		// If the validator exists, parse the motorizations
		if(_validator)
		{
			_validator.validatePacks(data);
		}
		
		// Dispatch an event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the default loaded configuration
	* @param type:String event type
	* @param data:* data object returned from the server
	*/
	function defaultConfigParser(type, data)
	{
		// If the validator exists, parse the default configuration
		if(_validator)
		{
			_validator.validateDefaultConfiguration(data);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the prices
	* @param type:String event type
	* @param data:* data object returned from the server
	*/
	function priceParser(type, data)
	{
		// If the validator exists, parse the default configuration
		if(_validator)
		{
			_validator.validateCar(data);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method which is used to parse the comparegrade items
	* @param type:String event type
	* @param data:* data object returned from the server
	*/
	function compareGradesParser(type, data)
	{
		// If the validator exists, parse the compare grades
		if(_validator)
		{
			_validator.validateCompareGrades(data);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method which is used to parse the compareResult returned data
	* @param type:String event type
	* @param data:* data object returned from the server
	*/
	function compareResultParser(type, data)
	{
		// If the validator exists, parse the compare grades
		if(_validator)
		{
			_validator.validateCompatibilityCheck(data);
		}
		
		// Dispatch the event
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the body types, this is used to make sure a standard body type is set!
	* @param type:String event type
	* @param data:* data object returned from the server
	*/
	function bodyTypeParser(type, data)
	{
		// If the validator exists, parse the bodytypes
		if(_validator)
		{
			_validator.validateBodyTypes(data);
		}
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method which parses the loaded getmodel function return value
	* @param type:String event type
	* @param data:* data object returned from the server
	*/
	function modelParser(type, data)
	{
		// If the validator exists, parse the carModel
		if(_validator)
		{
			_validator.validateCarModel(data, _context);
		}
		
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method which parses the loade submodels
	* @param type:String event type
	* @param data:* data object returned from the server
	*/
	function submodelParser(type, data)
	{
		if(_validator)
		{
			_validator.validateSubModels(data, _context);
		}
				
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	/**
	* Method used to parse the wheels, this is used to make sure a standard wheel is set!
	* @param type:String event type
	* @param data:* data object returned from the server
	*/
	function wheelsParser(type, data)
	{
		// If the validator exists, parse the carModel
		if(_validator)
		{
			_validator.validateCarWheels(data);
		}
		
		var evt = new be.marlon.DataEvent(type,data);
		_instance.dispatchEvent(evt);
	}
	
	//----------------------------------
	//  Public methods
	//----------------------------------
	
	/**
	* Method used to stop the active server call
	*/
	this.abort = function()
	{
		if(_urlLoader)
		{
			_urlLoader.abort();
		}
	};
	
	/**
	* Get the model which actually contains the camera and colours configuration required for addressing the spinplayer
	* @param configuration:Configuration object
	*/
	this.getModel = function(configuration, async)
	{
		getData(_gateway + "getcarmodel", configuration, be.marlon.Internal.MODEL_LOADED, modelParser, _GET, async);
	};
	
	/**
	* Get the models
	* @param configuration:Configuration object
	*/
	this.getModels = function(configuration, async)
	{
		// Since this call is only used for the testing in the html wrapper, we use the Service in stead of internal
		getData(_gateway + "getcarmodels", configuration, be.marlon.Service.MODELS_LOADED, false, _GET, async);
	};
	
	/**
	* Get the submodels
	* @param configuration:Configuration object
	*/
	this.getSubModels = function(configuration, async)
	{
		// Since this call is only used for the testing in the html wrapper, we use the Service in stead of internal
		getData(_gateway + "getsubmodels", configuration, be.marlon.Internal.SUBMODELS_LOADED, submodelParser, _GET, async);
	};
	
	/**
	* Get the bodytypes
	* @param configuration:Configuration object
	* @param targetConfiguration:Configuration the configuration object where the received configuration json string will be copied into
	*/
	this.getBodyTypes = function(configuration, async)
	{
		getData(_gateway + "getbodytypes", configuration, be.marlon.Internal.BODY_TYPES_LOADED, bodyTypeParser, _GET, async);
	};
	
	/**
	* Get the motorisations
	* @param configuration:Configuration object
	*/
	this.getMotorizations = function(configuration, async)
	{
		getData(_gateway + "getmotorizations", configuration, be.marlon.Internal.MOTORIZATIONS_LOADED, motorizationParser, _GET, async);
	};
	
	/**
	* Get the grades
	* @param configuration:Configuration object
	*/
	this.getGrades = function(configuration, async)
	{
		getData(_gateway + "getgrades", configuration, be.marlon.Internal.GRADES_LOADED, gradeParser, _GET, async);
	};
	
	/**
	* Get the packs 
	* @param configuration:Configuration object
	*/
	this.getPacks = function(configuration, async)
	{
		getData(_gateway + "getpacks", configuration, be.marlon.Internal.PACKS_LOADED, packParser, _GET, async);
	};
	
	/**
	* Get the colours
	* @param configuration:Configuration object
	*/
	this.getColourInfo = function(configuration, async)
	{
		getData(_gateway + "GetColourInfo", configuration, be.marlon.Internal.COLOURS_LOADED, colourParser, _GET, async);
	};
	
	/**
	* Get the wheels
	* @param configuration:Configuration object
	*/
	this.getWheels = function(configuration, async)
	{
		getData(_gateway + "getcarwheels", configuration, be.marlon.Internal.WHEELS_LOADED, wheelsParser, _GET, async);
	};
	
	/**
	* Get the options based on the categorie
	* @param configuration:Configuration
	*/
	this.getOptionalEquipment = function(configuration, async)
	{
		getData(_gateway + "GetOptionalEquipment", configuration, be.marlon.Internal.OPTIONAL_EQUIPMENT_LOADED, optionalEquipmentParser, _GET, async);
	};
	
	/**
	* Get the options based on the categorie
	* @param configuration:Configuration
	*/
	this.getStandardEquipment = function(configuration, async)
	{
		getData(_gateway + "GetStandardEquipment", configuration, be.marlon.Internal.STANDARD_EQUIPMENT_LOADED, standardEquipmentParser, _GET, async);
	};
	
	/**
	 * Get the specifications based on the configuration
	 * @param configuration:Configuration 
	 */
	this.getTechnicalSpecifications = function(configuration, async)
	{
		getData(_gateway + "GetTechnicalSpecifications", configuration, be.marlon.Internal.SPECS_LOADED, false, _GET, async);
	};
	
	/**
	* Get the accessories based on the categorie
	* @param configuration:Configuration
	*/
	this.getOptionalAccessories = function(configuration, async)
	{
		getData(_gateway + "GetOptionalAccessories", configuration, be.marlon.Internal.OPTIONAL_ACCESSORIES_LOADED, optionalAccessoriesParser, _GET, async);
	};
	
	/**
	* Get the accessories based on the categorie
	* @param configuration:Configuration
	*/
	this.getStandardAccessories = function(configuration, async)
	{
		getData(_gateway + "GetStandardAccessories", configuration, be.marlon.Internal.STANDARD_ACCESSORIES_LOADED, standardAccessoriesParser, _GET, async);
	};
	
	/**
	* Get the upholstry or the interior clothing
	* @param configuration:Configuration
	*/
	this.getUpholsteries = function(configuration, async)
	{
		getData(_gateway + "GetUpholsteries", configuration, be.marlon.Internal.UPHOLSTERIES_LOADED, upholstryParser, _GET, async);
	};
	
	/**
	* Get the full configuration to initialize the application
	* @param configuration:Configuration the configuration object which will be parameterised to get the appropriate configuration
	*/
	this.getFullConfiguration = function(configuration, async)
	{
		var extra = {"tfsenabled":_loadTFS?"true":"false"};
		getData(_gateway + "GetFullConfiguration", configuration, be.marlon.Internal.FULL_CONFIGURATION_LOADED, false, _GET, async, extra);
	};
	
	/**
	* Get the price for the current configuration
	* @param configuration:Configuration
	*/
	this.getCarInfo = function(configuration, async)
	{
		getData(_gateway + "getcar", configuration, be.marlon.Internal.CAR_INFO_LOADED, priceParser, _GET, async);
	};
	
	/**
	* Get the equipment defaults for all the grades
	* @param configuration:Configuration
	*/
	this.getCompareGrade = function(configuration, async)
	{
		getData(_gateway + "CompareGrades", configuration, be.marlon.Internal.COMPARE_GRADES_LOADED, compareGradesParser, _GET, async);
	};
	
	/**
	* Method used to compare 2 configuration objects
	* @param configuration1:Configuration old configuration
	* @param configuration2:Configuration new configuration
	*/
	this.compatibilityCheck = function(configuration1, configuration2)
	{
		getData(_gateway + "CompatibilityCheck", [configuration1, configuration2], be.marlon.Internal.COMPATIBILITY_CHECK_LOADED, compareResultParser, _POST);
	};
	
	/**
	* Method used to get the inlays
	* @param configuration:Configuration
	*/
	this.getInlays = function(configuration, async)
	{
		getData(_gateway + "GetInlays", configuration, be.marlon.Internal.INLAYS_LOADED, inlayParser, _GET, async);
	};
	
	/**
	* Method used to get the version of the backend service
	*/
	this.getBackEndVersion = function(async)
	{
		getData(_gateway + "version", null, be.marlon.Internal.SERVICE_VERSION_LOADED, false, _GET, async);
	};
	
	/**
	* Method used to load the configuration xml located on a distand url
	* @param url:String the url pointing to the xml file
	*/
	this.getUrlConfig = function(url)
	{
		getData(url, null, be.marlon.Internal.CONFIG_URL_LOADED, false, _GET);
	};
	
	/**
	 * Method which retrieves the model-filters from the webservice 
	 */
	this.getFilters = function(configuration)
	{
		getData(_gateway + "GetFilters", configuration, be.marlon.Internal.FILTERS_LOADED, false, _GET);
	};
	
	/**
	 * Method which loads the models 
	 */
	this.getModelSubsets = function(configuration)
	{
		getData(_gateway + "GetModelSubsets", configuration, be.marlon.Internal.MODELSUBSETS_LOADED, false, _GET);
	};
	
	/**
	 * Method which returns the grades for specific modelsubsets 
	 */
	this.getModelSubsetGrades = function(configuration)
	{
		getData(_gateway + "GetModelSubsetGrades", configuration, be.marlon.Internal.MODELSUBSETGRADES_LOADED, false, _GET);
	};
	
	/**
	* Method used to load the configuration xml located on a distand url
	* @param url:String the url pointing to the xml file
	*/
	this.getMonthlyPayment = function(url, configuration)
	{
		getData(url, configuration, be.marlon.Internal.MONTHLY_PAYMENT_LOADED, false, _POST);
	};
	
	/**
	* Method used to load the configuration xml located on a distand url
	* @param url:String the url pointing to the xml file
	*/
	this.getLegalText = function(url, data)
	{
		getData(url, data, be.marlon.Internal.LEGAL_TEXT_LOADED, false, _POST);
	};
	
	/**
	 * Method used to shorten an url
	 * @param url:String escaped string to be shortened
	 */
	this.shortenURL = function(url)
	{
		getData(_gateway + "shorten?url=" + url, null, be.marlon.Internal.SHORTENED_URL_LOADED, false, _POST);
	};
};
be.marlon.WebService.prototype = new be.marlon.EventDispatcher();
be.marlon.WebService.prototype.constructor = be.marlon.WebService;
