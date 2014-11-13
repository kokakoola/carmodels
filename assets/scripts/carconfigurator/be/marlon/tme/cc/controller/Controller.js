(function(){
    // Create the namespace!
    // Only create new be namespace if none already exists
    if(typeof(window.be) === "undefined")
    {
        window.be = {};
    }
    if(typeof be.marlon === "undefined")
    {
        be.marlon = {};
    }

    // Set up the event flow
    be.marlon.EventDispatcher = function()
    {
        this.eventTypes = [];
        this.eventHandlers = [];
    };

    be.marlon.EventDispatcher.prototype.addEventListener = function(type, handler)
    {
        this.eventTypes.push(type);
        this.eventHandlers.push(handler);
    };

    be.marlon.EventDispatcher.prototype.removeEventListener = function(type, handler)
    {
        var iLength = this.eventTypes.length;
        for(var i = 0; i < iLength; i++)
        {
            if(type === this.eventTypes[i] && handler == this.eventHandlers[i])
            {
                this.eventTypes.splice(i,1);
                this.eventHandlers.splice(i,1);
                i--;
            }
        }
    };

    be.marlon.EventDispatcher.prototype.dispatchEvent = function(dataEvent)
    {
        var iLength = this.eventTypes.length;
        for(var i = 0; i < iLength; i++)
        {
            if(this.eventTypes[i] === dataEvent.type)
            {
                dataEvent.target = this;
                // Execute the method
                this.eventHandlers[i](dataEvent);
                // Check if the amount of eventTypes has been changed (ex: when calling the method in the line above, the convention is to remove the event listener, this means that the eventTypes array gets changed)
                if(iLength > this.eventTypes.length)
                {
                    iLength = this.eventTypes.length;
                    i--;
                }
            }
        }
    };

    // JSON Stringify method
    be.marlon.Utility = function()
    {
        /**
         * Index of array helper function
         **/
        this.getIndex = function(arr, obj)
        {
            var i = 0,
                iL = arr.length;
            for (; i < iL; i++)
            {
                if (arr[i] == obj)
                {
                    return i;
                }
            }
            return -1;
        };

        /**
         * Method which stringify's an Object
         */
        this.stringify = function(o)
        {
            return appendType("", o, "");
        };

        /**
         * Internal appendType method
         */
        function appendType(prop, oContent, sJSON)
        {
            switch(typeof oContent)
            {
                case "object":	// Only append prop if prop is defined!
                    if(prop !== "")sJSON += '"' + prop + '":';
                    // check if it is an Array!
                    if(Object.prototype.toString.apply(oContent) === "[object Array]")
                    {
                        // Start the Array!
                        sJSON += '[';
                        var i = 0;
                        var iLength = oContent.length;
                        for(i; i < iLength; i++)
                        {
                            sJSON = appendType("", oContent[i], sJSON);
                            if(i != iLength -1)
                            {
                                sJSON += ",";
                            }
                        }
                        sJSON += ']';
                    }
                    // Check if it's null!
                    else if(oContent === null)
                    {
                        sJSON += String(oContent);
                    }
                    // check if it is an Object
                    else
                    {
                        sJSON += '{';
                        for(var sChar in oContent)
                        {
                            sJSON = appendType(sChar, oContent[sChar], sJSON);
                            if(typeof oContent[sChar] != "function")
                            {
                                sJSON += ',';
                            }
                        }
                        // Remove last comma
                        sJSON = sJSON.substring(0,sJSON.length - 1);
                        sJSON += '}';
                    }
                    break;
                case 'string':
                    sJSON += createString(prop, oContent);
                    break;
                case 'number':
                    sJSON += createString(prop, (isFinite(oContent) ? String(oContent) : 'null'), true);
                    break;
                case 'boolean':
                case 'null':
                    sJSON += createString(prop, String(oContent));
                    break;
            }

            return sJSON;
        }

        /**
         * Method which creates a json string part
         */
        function createString(prop, value, isNumber)
        {
            var sReturn = "";
            if(prop !== "")
            {
                sReturn += '"' + prop + '":';
            }
            if(!isNumber)
            {
                value = value.replace(/["]|[â€]/gm, '\\"');
                sReturn += '"';
            }

            sReturn += value;

            if(!isNumber)
            {
                sReturn += '"';
            }
            return sReturn;
        }
    };
    be.marlon.Utility = new be.marlon.Utility();

    // Instantiate the constants
    be.marlon.Service = {
        LOAD_PROGRESS:"LOAD_PROGRESS",
        LOAD_DATA:"LOAD_DATA",
        LOAD_DATA_COMPLETE:"LOAD_DATA_COMPLETE",
        RELOAD_DATA:"RELOAD_DATA",
        COMPARE_GRADES_LOADED:"COMPARE_GRADES_LOADED",
        STANDARD_EQUIPMENT_LOADED:"STANDARD_EQUIPMENT_LOADED",
        SPECS_LOADED:"SPECS_LOADED",
        COMPARE_PACKS_LOADED:"COMPARE_PACKS_LOADED",
        COMPATIBILITY_CHECK_LOADED:"COMPATIBILITY_CHECK_LOADED",
        SHOW_CONFLICT:"SHOW_CONFLICT",
        SHOW_INCLUDE_OPTIONS:"SHOW_INCLUDE_OPTIONS",
        RENDER_UPHOLSTERIES:"RENDER_UPHOLSTERIES",
        SERVICE_ERROR:"SERVICE_ERROR",
        VALIDATION_ERROR:"VALIDATION_ERROR",
        UPDATE_WHEEL_PRICES:"UPDATE_WHEEL_PRICES",
        UPDATE_COLOUR_PRICES:"UPDATE_COLOUR_PRICES",
        UPDATE_INLAY_PRICES:"UPDATE_INLAY_PRICES",
        UPDATE_UPHOLSTERY_PRICES:"UPDATE_UPHOLSTERY_PRICES",
        RENDER_OPTIONS:"RENDER_OPTIONS",
        RENDER_INLAYS:"RENDER_INLAYS",
        RENDER_ACCESSORIES:"RENDER_ACCESSORIES",
        MONTHLY_RATE_LOADED:"MONTHLY_RATE_LOADED",
        SHORTENED_URL_LOADED:"SHORTENED_URL_LOADED",
        MODELSUBSETGRADES_LOADED:"MODELSUBSETGRADES_LOADED",
        MODELS_LOADED:"MODELS_LOADED",
        SUBMODELS_LOADED:"SUBMODELS_LOADED"
    };

    be.marlon.Config = {
        CHANGED:"CHANGED"
    };

    be.marlon.Internal = {
        SERVICE_ERROR:"I_SERVICE_ERROR",
        VALIDATION_ERROR:"VALIDATION_ERROR",
        SERVICE_VERSION_LOADED:"I_SERVICE_VERSION_LOADED",
        FILTERS_LOADED:"I_FILTERS_LOADED",
        MODELSUBSETS_LOADED:"I_MODELSUBSETS_LOADED",
        MODEL_LOADED:"I_MODEL_LOADED",
        SUBMODELS_LOADED:"I_SUBMODELS_LOADED",
        MODELS_LOADED:"I_MODELS_LOADED",
        MOTORIZATIONS_LOADED:"I_MOTORIZATIONS_LOADED",
        BODY_TYPES_LOADED:"I_BODY_TYPES_LOADED",
        GRADES_LOADED:"I_GRADES_LOADED",
        PACKS_LOADED:"I_PACKS_LOADED",
        COLOURS_LOADED:"I_COLOURS_LOADED",
        OPTIONAL_EQUIPMENT_LOADED:"I_OPTIONAL_EQUIPMENT_LOADED",
        STANDARD_EQUIPMENT_LOADED:"I_STANDARD_EQUIPMENT_LOADED",
        SPECS_LOADED:"I_SPECS_LOADED",
        OPTIONAL_ACCESSORIES_LOADED:"I_OPTIONAL_ACCESSORIES_LOADED",
        STANDARD_ACCESSORIES_LOADED:"I_STANDARD_ACCESSORIES_LOADED",
        FULL_CONFIGURATION_LOADED:"I_FULL_CONFIGURATION_LOADED",
        UPHOLSTERIES_LOADED:"I_UPHOLSTERIES_LOADED",
        PRICE_LOADED:"I_PRICE_LOADED",
        WHEELS_LOADED:"I_WHEELS_LOADED",
        CAR_INFO_LOADED:"I_CAR_INFO_LOADED",
        COMPARE_GRADES_LOADED:"I_COMPARE_GRADES_LOADED",
        COMPATIBILITY_CHECK_LOADED:"I_COMPATIBILITY_CHECK_LOADED",
        INLAYS_LOADED:"I_INLAYS_LOADED",
        CONFIGURATION_OBJECT_LOADED:"I_CONFIGURATION_OBJECT_LOADED",
        CONFIG_URL_LOADED:"I_CONFIG_URL_LOADED",
        MONTHLY_PAYMENT_LOADED:"I_MONTHLY_PAYMENT_LOADED",
        LEGAL_TEXT_LOADED:"I_LEGAL_TEXT_LOADED",
        FIN_SERVICE_ERROR:"I_FIN_SERVICE_ERROR",
        SHORTENED_URL_LOADED:"I_SHORTENED_URL_LOADED",
        MODELSUBSETGRADES_LOADED:"I_MODELSUBSETGRADES_LOADED"
    };

    // The controller class
    be.marlon.Controller = function(_settings, _context, _preConfig)
    {
        //country, language, brand, flashContainer, _preConfig, modelID
        //----------------------------------
        //  Properties
        //----------------------------------

        var _instance = this;
        var _configuration = false;

        // Reference to the getIndex method in the Utility class
        var _getIndex = be.marlon.Utility.getIndex;

        // The version of the service, is a json object formatted as in: {"communication":{"name":"TME.CarConfigurator.Services.Communication","version":"1.0.0.7"},"service":{"name":"TME.CarConfigurator.Services.dll","version":"1.0.0.6"}}

		var _version = "2.0.1.15",
        	_serviceVersion;

        // Boolean which indicates whether there should be prices calculated or not
        // Does the app has prices?
        var _hasPrices = false;
        if(_settings.showPrice === "true" || _settings.showPrice === true)
        {
            _hasPrices = true;
        }

        // Startup values!
        var _initConfiguration;
        var _fc;
        var _model = false; // Object referencing the data returned from the getcarmodel service
        var _aSubModels;
        var _aBodyTypes;
        var _aMotorizations;
        var _aGrades;
        var _aPacks;
        var _aColours;
        var _aWheels;
        var _aWheelEquipment;
        var _aOptionalEquipment;
        var _aOptionalAccessories;
        var _aUpholsteries;
        var _aInlays;
        var _carData = null; // Array containing the eco data

        var _filterEquipment; // Array containing the equipment specific for the filter step

        var _parser = false; // Class used to parse the data when the class is recognized!

        // Array which holds the user selected equipment, used to automatically select/unselect equipment
        var _aUserSelected;

        // Array which contains equipment items which have there AvailableForExteriorColours or AvailableForCarUpholsteries Array filled in
        var _aAvailables,
            _hasOptionalAvailables;
            
        var _cb; // Callback which will be set when loading data

        // Boolean used to exclude some logic/functionality from the service handlers when a compatibility check is done
        var _bCompatibilityCheck = false;
	
        // Boolean used to indicate when enginegrades should be updated
        var _bLoadEngineGrades = false;

        // Boolean used to indicate when packs should be re-loaded to, used when engine/grades have been altered
        var _bLoadPacks = false;

        // Boolean used to indicate when the modelsubset has been altered, if so reload some more stuff
        var _bLoadSubModel = false;

        // Boolean used to indicate wether the loading flow is in progress or not
        var _loading = false;

        // Array which contains the compare grades returned value!
        var _aCompareGrades;
        // Array which contains the compare packs returned value!
        var _aComparePacks;
        // Array which contains the standard equipment values for the car
        var _aStaEquipment;
        // Array which contains the specification values for the car
        var _aSpecs;
        // Boolean indicating whether or not to dispatch a conflict event when the compatibility check is called
        var _dispatchConflict = true;

        // Boolean used to check for initial change in pack/colour/wheel/option/accessory/upholstry/inserts/accessories which then desides whether to populate the conflicts array
        var _bUserInteracted = false;

        // Object containing the loaded financial data
        var _financial;
        
        // Object which contains data regarding the extended selected wheel
        var _extendedWheel = {
        	ID:"",
        	finish:null,
        	cap:null,
        	surround:null
        };

        // Webservice class
        var _ws = false,
        // Queue loader class
        	_ql = false;

        // Overwrite eventTypes, else they get shared
        this.eventTypes = [];
        this.eventHandlers = [];
        
        // Constant variable containing all the possible data to load
        // TODO
        this.LOAD ={
        	FILTERDATA:"filterdata",
        	MODEL:"model",
			SUBMODELS:"submodels",
			BODYTYPES:"bodytypes",
			MOTORIZATIONS:"motorizations",
			GRADES:"grades",
			COLOURS:"colours",
			WHEELS:"wheels",
			OPTIONS:"options",
			PACKS:"packs",
			UPHOLSTERIES:"upholsteries",
			INLAYS:"inlays",
			ACCESSORIES:"accessories",
			CONFIGURATION:"configuration"
        };

        //----------------------------------
        //  Getters & setters
        //----------------------------------



        //----------------------------------
        //  Public methods
        //----------------------------------
		
		/**
		 * Method which debugs the packs 
		 */
		this.debugPacks = function(packNameToBeLogged)
		{
			var str = [],
				aPacks = _aPacks.map(
				function(item)
				{
					var equipment = [],
						i = 0,
						iL = item.Equipment.length,
						t,
						equip,
						co,
						cos,
						printPack = item.Name.toLowerCase().indexOf(String(packNameToBeLogged).toLowerCase()) > -1,
						tL;
					
					if(printPack)
					{
						str.push("----------------------------------------------------------------------");
						str.push("Name: " + item.Name);
						str.push("ID: " + item.ID);
						str.push("ShortID: " + item.ShortID);
						str.push("Equipment: ");
					}
					for(; i < iL; i++)
					{
						cos = [];
						equip = item.Equipment[i];
						tL = equip.ChildOptions.length;
						
						if(printPack)
						{
							str.push("--> Name: " + equip.Name);
							str.push("--> ID: " + equip.ID);
							str.push("--> ShortID: " + equip.ShortID);
							str.push("--> PriceInVat: " + equip.PriceInVat);
							str.push("--> Standard: " + equip.Standard);
							str.push("--> ChildOptions: ");
						}
						
						for(t = 0; t < tL; t++)
						{
							co = equip.ChildOptions[t];
							
							if(printPack)
							{
								str.push("-----> Name: " + co.Name);
								str.push("-----> ID: " + co.ID);
								str.push("-----> ShortID: " + co.ShortID);
								str.push("-----> PriceInVat: " + co.PriceInVat);
								str.push("-----> Standard: " + co.Standard);
								str.push("-----> ColouringMode: " + co.ColouringMode);
								str.push("-----> Colour: ");
								str.push("--------->" + co.Colour.Name);
								str.push("--------->" + co.Colour.Code);
								str.push("--------->" + co.Colour.ID);
							}
							
							cos.push(
								{
									Name:co.Name,
									ID:co.ID,
									ShortID:co.ShortID,
									Standard:co.Standard,
									ColouringMode:co.ColouringMode,
									Colour:co.Colour,
									PriceInVat:co.PriceInVat
								}
							);
						}
						equipment.push(
							{
								Name:equip.Name,
								ID:equip.ID,
								ShortID:equip.ShortID,
								PriceInVat:equip.PriceInVat,
								Standard:equip.Standard,
								ChildOptions:cos
							}
						);
					}
					
					return {
						Name:item.Name,
						ID:item.ID,
						ShortID:item.ShortID,
						AccentColourCombination:item.AccentColourCombination,
						Equipment:equipment
					};
				});
				
			if(str.length > 0)
			{
				str.map(function(item){console.log(item);});
			}
			return aPacks;
		};
		
        /**
         * Method which returns the version of the JavaScript layer
         */
        this.version = function()
        {
            return _version;
        };
        
        /**
         * Method which returns the backend version 
         */
        this.getServiceVersionObject = function()
        {
        	return _serviceVersion;
        };
        
        /**
         * Method which returns if there is financing available
         */
        this.hasMonthlyRate = function()
        {
            return (
                (_settings.showMonthlyRateCarConfig) &&
                    ((_settings.monthlyRate && _settings.monthlyRate !== "" && _settings.monthlyRateDisclaimer && _settings.monthlyRateDisclaimer !== "") &&
                        (_carData && _carData.Availability && _carData.Availability.ShowMonthlyRate))
                );
        };

        /**
         * Method which is used to shorten an url using the bitly proxy method on the server
         * @param url:String to be shortened
         */
        this.shortenURL = function(url)
        {
            // Conform the rules for encoding a shortened url!
            url = url.replace("?", "/?");
            // Shorten the escaped url
            _ws.shortenURL(escape(url));
        };

        /**
         * Callback method when the url has been shortened
         * @param e:EventObject
         */
        function shortenURLLoadedEventHandler(e)
        {
            // Dispatch event
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.SHORTENED_URL_LOADED, e.data));
        }
        
        /**
         * Method which loads the models 
         */
        this.getModels = function()
        {
        	init();
        	_ws.addEventListener(be.marlon.Internal.MODELS_LOADED, modelsLoadedHandler);
        	_ws.getModels({
        		Country:_settings.country,
                Brand:_settings.brand,
                Language:_settings.language
        	});
        };
        
        /**
         * Callback method actioned when the models are loaded 
         */
        function modelsLoadedHandler(e)
        {
        	_ws.removeEventListener(be.marlon.Internal.MODELS_LOADED, modelsLoadedHandler);
        	_instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.MODELS_LOADED, e.data));
        }
        
        /**
         * Method which loads the submodels for a given model 
         */
        this.getSubModels = function(modelID)
        {
        	_ql.getSubModels(modelID);
        };
        
        /**
         * Method which handles the loading of the submodels 
         */
        function submodelsLoadedHandler(e)
        {
        	_instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.SUBMODELS_LOADED, e.data));
        }
        
        /**
         * Method used to retrieve the grades for the given modelsubsets 
         */
        this.getModelSubsetGrades = function(aModelSubsets)
        {
        	_ql.getModelSubsetGrades(aModelSubsets);
        };
        
        /**
         * Callback method when the modelsubsetsgrades have been loaded 
         */
        function modelSubSetGradesLoadedHandler(e)
        {
        	// Dispatch event
        	_instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.MODELSUBSETGRADES_LOADED, e.data));
        }

        /**
         * Method which retrieves the financial information
         */
        this.getMonthlyRate = function()
        {
            // If the data is being loaded, abort the webservice call and make a new one!
            if(_loading)
            {
                _ws.abort();
                _ws.removeEventListener(be.marlon.Internal.FIN_SERVICE_ERROR, finServiceErrorControllerEventHandler);
                _ws.removeEventListener(be.marlon.Internal.MONTHLY_PAYMENT_LOADED, monthlyPaymentLoadedEventHandler);
                _ws.removeEventListener(be.marlon.Internal.LEGAL_TEXT_LOADED, legalTextLoadedEventHandler);
                _loading = false;
            }
            // Only do a call when the totalprice has been changed
            var pd = _configuration.TotalPrice - _configuration.TotalPriceDiscount;
            if(_financial && (_financial.totalprice == pd))
            {
                parseFinancialData();
                return;
            }
            // Add financial data
            if(!_financial)_financial = {};
            _financial.totalprice = pd;

            // Add and remove event handlers
            _ws.addEventListener(be.marlon.Internal.FIN_SERVICE_ERROR, finServiceErrorControllerEventHandler);
            _ws.addEventListener(be.marlon.Internal.MONTHLY_PAYMENT_LOADED, monthlyPaymentLoadedEventHandler);
            _ws.addEventListener(be.marlon.Internal.LEGAL_TEXT_LOADED, legalTextLoadedEventHandler);

            _loading = true;
            // Get the monthly payment
            _ws.getMonthlyPayment(_settings.monthlyRate, this.getExternalConfigurationObject(false, true));
        };

        /**
         * Monthly payment service handler
         */
        function monthlyPaymentLoadedEventHandler(e)
        {
            // If there exists a previous cached one
            var d = e.data;
            // Check if there was an error!
            if(typeof d === "undefined" || d.ErrorMessage)
            {
                _financial = null;
                parseFinancialData();
                return;
            }
            // Reference the Quotation
            d = d.Quotation;
			// Check if the monthly rate is found, if not return
			if(!d.Calculations || !d.Calculations.Calculation || d.Calculations.Calculation.length === 0)
			{
				_financial = null;
                parseFinancialData();
                return;
			}
            // Save properties
            _financial.data = d.Calculations.Calculation;

            // Else check the other properties
            if(
                (_financial.Legal_Text_ID && (_financial.Legal_Text_ID === d.Legal_Text_ID))
                )
            {
                parseFinancialData();
            }
            // Else fetch the legal text
            else
            {
                _financial.Legal_Text_ID = d.Legal_Text_ID;
                _financial.Execution_ID = d.Execution_ID;
                var oConfig = {
                    "Legal_Text_ID": d.Legal_Text_ID,
                    "Execution_ID": d.Execution_ID
                };
                _ws.getLegalText(_settings.monthlyRateDisclaimer, oConfig);
            }
        }

        /**
         * Legal text service handler
         */
        function legalTextLoadedEventHandler(e)
        {
        	if(e.data.ErrorMessage)
        	{
        		_financial = null;
                parseFinancialData();
                return;
        	}

            _financial.legaltext = e.data.Legal_Text;
            parseFinancialData();
        }

        /**
         * Financial service error handler
         */
        function finServiceErrorControllerEventHandler(e)
        {
            _financial = null;
            parseFinancialData();
        }

        /**
         * Method which parses the financial data
         */
        function parseFinancialData()
        {
            // Load completed
            _loading = false;
            // Add and remove event handlers
            _ws.removeEventListener(be.marlon.Internal.FIN_SERVICE_ERROR, finServiceErrorControllerEventHandler);
            _ws.removeEventListener(be.marlon.Internal.MONTHLY_PAYMENT_LOADED, monthlyPaymentLoadedEventHandler);
            _ws.removeEventListener(be.marlon.Internal.LEGAL_TEXT_LOADED, legalTextLoadedEventHandler);
            // Dispatch event
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.MONTHLY_RATE_LOADED, _financial));
        }
        
        /**
         * Method which returns the selected primary accent color 
         */
        this.getPrimaryAccentColor = function()
        {
        	if(!_fc || !_aPacks)return null;
        	
        	// Since the getFullConfiguration method does not return the objects with correct ColouringModes we have to do all this logic...
        	var i = 0,
        		iL = _configuration.Packs.length,
        		o,
        		t,
        		tL,
        		c,
        		selected = _configuration.Options.concat(_configuration.Accessories),
        		aChildEquip = [];
        	for(; i < iL; i++)
        	{
        		o = getObject(_configuration.Packs[i], _aPacks);
        		tL = o.Equipment.length;
        		for(t = 0; t < tL; t++)
        		{
        			c = o.Equipment[t].ChildOptions;
        			if(c.length > 0)
        			{
        				aChildEquip = aChildEquip.concat(c);
        			}
        		}
        	}
        	// Get the first selected element
        	iL = selected.length;
        	for(i = 0; i < iL; i++)
        	{
        		o = getObject(selected[i], aChildEquip);
        		if(o &&
        			(o.ColouringMode === 2 || o.ColouringMode === 3 || o.ColouringMode === 6 || o.ColouringMode === 7))
        		{
        			return o.Colour;
        		}
        	}
        	return null;
        };

        /**
         * Method which creates a PromoConfiguration object
         */
        this.getPromoConfiguration = function()
        {
            if(_model && _model.AvailablePromotions && _model.AvailablePromotions.length > 0)
            {
                var pc = {},
                    i = 0,
                    iLength,
                    o,
                    config = _configuration;
                // Add global promos
                pc.ModelPromo = getGlobalPromotions("MODELGENERATION");
                // Add submodel promos
                pc.SubModelPromo = getGlobalPromotions("SUBMODEL");
                // Add bodytypes
                pc.BodyTypePromo = getGlobalPromotions("BODY");
                // Add motorization, special logic is required since the presence of the motorization object's promotion is subject to the presence in it's grades list
                o = _fc.Motorization;
                var p = updateEnginePromoValues([o])[0],
                    eP = o.AvailablePromotions.concat();
                i = 0;
                iLength = eP.length;
                for(; i < iLength; i++)
                {
                    o = getObject(eP[i].ID, p.Promotions);
                    if(o && (!o.Show))
                    {
                        eP.splice(i, 1);
                        i--;
                        iLength--;
                    }
                }
                pc.EnginePromo = eP;
                // Add grade
                pc.GradePromo = _fc.Grade.AvailablePromotions;
                // Add packs
                i = 0;
                iLength = _fc.Packs.length;
                pc.PackPromo = [];
                for(i; i < iLength; i++)
                {
                    pc.PackPromo.push(_fc.Packs[i].Promotions);
                }
                // Add wheels
                pc.WheelPromo = _fc.Wheel.Promotions;
                // Add colors
                pc.ColorPromo = _fc.ExteriorColour.Promotions;
                // Add inlays
                o = _fc.Inlay;
                pc.InlayPromo = o?o.Promotions:[];
                // Add upholstery
                pc.UpholsteryPromo = _fc.Upholstery.Promotions;
                // Add equipment items
                i = 0;
                iLength = _fc.Options.length;
                pc.OptionsPromo = [];
                for(i; i < iLength; i++)
                {
                    pc.OptionsPromo.push(_fc.Options[i].Promotions);
                }
                // Add accessories
                i = 0;
                iLength = _fc.Accessories.length;
                pc.AccessoriesPromo = [];
                for(i; i < iLength; i++)
                {
                    pc.AccessoriesPromo.push(_fc.Accessories[i].Promotions);
                }
                return pc;
            }
            return null;
        };

        /**
         * Helper method for the "getPromoConfiguration" to retrieve a specific type of promotions, only available for promotions which are calculated in the _carData.PriceInfo object
         */
        function getGlobalPromotions(type)
        {
            var i = 0,
                iL = _model.AvailablePromotions.length,
                o,
                l,
                aR = [];
            for(i; i < iL; i++)
            {
                o = _model.AvailablePromotions[i];
                l = getObject(o.ID, _carData.PriceInfo.Discounts);
                if(o.Target == type && l)
                {
                    if(o.Value != l.Amount)
                    {
                        // Update the value
                        o.Value = l.Amount;
                    }
                    aR.push(o);
                }
            }
            return aR;
        }

        /**
         * Method which returns a list of active promotions
         */
        this.getActivePromotions = function()
        {
            if(_model && _model.AvailablePromotions && _model.AvailablePromotions.length > 0)
            {
                var i,
                    iL,
                    aR = [];
                // Check the Prices
                populatePromotion(_configuration.BasePrice.Discounts, aR);
                populatePromotion(_configuration.ExteriorColourPrice.Discounts, aR);
                populatePromotion(_configuration.UpholstryPrice.Discounts, aR);
                if(_configuration.InlayPrice)populatePromotion(_configuration.InlayPrice.Discounts, aR);
                populatePromotion(_configuration.WheelPrice.Discounts, aR);
                i = 0;
                iL = _configuration.PackPrices.length;
                for(i; i < iL; i++)
                {
                    populatePromotion(_configuration.PackPrices[i].Discounts, aR);
                }
                i = 0;
                iL = _configuration.OptionsPrices.length;
                for(i; i < iL; i++)
                {
                    populatePromotion(_configuration.OptionsPrices[i].Discounts, aR);
                }
                i = 0;
                iL = _configuration.AccessoriesPrices.length;
                for(i; i < iL; i++)
                {
                    populatePromotion(_configuration.AccessoriesPrices[i].Discounts, aR);
                }
                // Sort the promotions based on index!
                aR.sort(_instance.sortPromos);
                return aR;
            }
            return null;
        };

        /**
         * Helper method for the getActivePromotions public function
         * @param disc:Array the Array of discounts
         * @param aR:Array the Array of unique discounts
         */
        function populatePromotion(disc, aR)
        {
            var i = 0,
                iL = disc.length,
                o;
            for(i; i < iL; i++)
            {
                o = disc[i];
                if(!getObject(o.ID, aR))
                {
                    aR.push(getObject(o.ID, _model.AvailablePromotions));
                }
            }
        }

        /**
         * Helper sort method
         * @param a:Object
         * @param b:Object
         */
        this.sortPromos = function(a,b)
        {
            return (a.Index - b.Index);
        };
        
        /**
         * Method which returns the pack specific selections which are also present in the _configuration.Options (and/or) _configuration.Accessories arrays
         * @param id:String guid of the pack id to get the selected items for 
         */
        this.getSelectedPackOptions = function(id)
        {
        	var equip = _configuration.Options.concat(_configuration.Accessories),
        		i = 0,
        		iL = equip.length,
        		pack = getObject(id, _aPacks?_aPacks:_fc.Packs),
        		// Returns a Hash table of all the pack's equipment
        		packEquipment = createPackEquipment(pack.Equipment, {}),
        		selected = [];
        	// Create an array of the equipment in the selected pack
        	for(; i < iL; i++)
        	{
        		// If the property of the ID exists on the object, it means it has been selected
        		if(packEquipment[equip[i]])
        		{
        			selected.push(packEquipment[equip[i]]);
        		}
        	}
        	equip = null;
        	pack = null;
        	return selected;
        };
        
        /**
         * Method which adds all the equipment inside a pack to the given array
         * @param arr:Array source array
         * @param ret:Object returned hash table
         */
        function createPackEquipment(arr, ret)
        {
        	var i = 0,
        		iL = arr.length,
        		o;
        	for(; i < iL; i++)
        	{
        		o = arr[i];
        		if(o.ChildOptions && o.ChildOptions.length > 0)
        		{
        			createPackEquipment(o.ChildOptions, ret);
        		}
        		else
        		{
        			if(!ret[o.ID])ret[o.ID] = o;
        			if(o.IncludeEquipment && o.IncludeEquipment.length > 0)
        			{
        				createPackEquipment(o.IncludeEquipment, ret);
        			}
        		}
        	}
        	o = null;
        	return ret;
        }

        /**
         * Method which returns the length of the accessories!
         */
        this.getTotalAccessories = function()
        {
            return _aOptionalAccessories.length;
        };

        /**
         * Returns an equiipment item based on it's id
         */
        this.getEquipment = function(id)
        {
            return getEquipmentItem(id);
        };

        /**
         * Returns the current configuration
         */
        this.getConfiguration = function(bString)
        {
            if(bString)
            {
                return be.marlon.Utility.stringify(_configuration);	
            }
            return _configuration;
        };
        
        /**
         * Returns the current full configuration
         */
        this.getFullConfiguration = function(bString)
        {
            if(bString)
            {
                return be.marlon.Utility.stringify(_fc);
            }
            return _fc;
        };
        
        /**
         * Returns the extended wheel configuration 
         */
        this.getWheelConfiguration = function(bString)
        {
        	if(bString)
        	{
        		return be.marlon.Utility.stringify(_extendedWheel);
        	}
        	return _extendedWheel;
        };

        /**
         * Method which returns the length of the interior accessories
         */
        this.getTotalInteriorOptions = function()
        {
            var o;
            var i = 0;
            var t = 0;
            var iLength = _aOptionalEquipment.length;
            for(i; i < iLength; i++)
            {
                o = _aOptionalEquipment[i];
                if(o.Category.Code.substring(0,3) == "INT" && (((typeof o.Standard != "undefined") && (o.Standard === false)) || (typeof o.Standard == "undefined")))
                {
                    t ++;
                }
            }
            return t;
        };

        /**
         * Method which returns the standard promoted options
         */
        this.getStandardPromotedOptions = function()
        {
            return getStandardPromotedItems(_aOptionalEquipment);
        };

        /**
         * Method which returns the standard filter options
         */
        this.getStandardFilterOptions = function()
        {
            var i = 0,
                iL = _aOptionalEquipment.length,
                o,
                r = [];
            for(; i < iL; i++)
            {
                o = _aOptionalEquipment[i];
                if(o.StandardFilterEquipment === true)r.push(o);
            }
            return r;
        };

        /**
         * Method which returns the standard promoted accessories
         */
        this.getStandardPromotedAccessories = function()
        {
            return getStandardPromotedItems(_aOptionalAccessories);
        };

        /**
         * Function which assembles an array of equipment objects which are standard promoted
         * @param a:Array the array of accessories or options
         */
        function getStandardPromotedItems(a)
        {
            var i = 0,
                iLength = a.length,
                o,
                r = [];
            for(i; i < iLength; i++)
            {
                o = a[i];
                if((o.Promotions && o.Promotions.length > 0) && ((typeof o.Standard != "undefined") && (o.Standard === true)))
                {
                    r.push(o);
                }
            }
            return r;
        }

        /**
         * Method which returns the variable which indicates if theres is data being loaded or not
         */
        this.isLoading = function()
        {
            return _loading;
        };

        /**
         * Method which stops the loading process
         */
        this.abortLoadProgress = function()
        {
            // Clean the loading!
            cleanLoading();
        };

        /**
         * Method which returns the length of the exterior options
         */
        this.getTotalExteriorOptions = function()
        {
            var o;
            var i = 0;
            var t = 0;
            var iLength = _aOptionalEquipment.length;
            for(i; i < iLength; i++)
            {
                o = _aOptionalEquipment[i];
                if(o.Category.Code.substring(0,3) == "EXT" && (((typeof o.Standard != "undefined") && (o.Standard === false)) || (typeof o.Standard == "undefined")))
                {
                    t ++;
                }
            }
            return t;
        };

        /**
         * Method which returns the engine logo of the current engine
         */
        this.getEngineLogo = function()
        {
            var i = 0;
            var t;
            var iLength = _aMotorizations.length;
            var tLength;
            var id = _configuration.EngineID;
            var assets;
            for(i; i < iLength; i++)
            {
                // Get appropriate engine
                if(_aMotorizations[i].Engine.ID == id)
                {
                    assets = _aMotorizations[i].Engine.Assets;
                    t = 0;
                    tLength = assets.length;
                    for(t; t < tLength; t++)
                    {
                        if(assets[t].Type == "LOGO")
                        {
                            return assets[t].Url;
                        }
                    }
                    assets = null;
                }
            }
            return false;
        };

        /**
         * Method which returns the packs, used to render the compare packs
         */
        this.getComparePacks = function()
        {
            return _aPacks?_aPacks:null;
        };

        /**
         * Method which returns the parsed summary
         */
        this.getSummaryContent = function()
        {
            var oSummary,
            	oReturn = {
	            	primary:[],
	            	secondary:[]
	            },
	            model,
	            submodel;
            
            // Get the correct model/submodel for the current model/submodel
            if(_fc)
            {
            	model = _fc.Model;
            	submodel = _fc.Submodel;
            }
            else
            {
            	model = _model;
            	submodel = getObject(_configuration.SubmodelID, _aSubModels);
            }
            oSummary = getContextSummary(model, submodel);
            
            // Parse the buttons
            oReturn.primary = (oSummary.primary && oSummary.primary.length > 0)?oSummary.primary:[];
            oReturn.secondary = (oSummary.secondary && oSummary.secondary.length > 0)?oSummary.secondary:[];
            
            return oReturn;
        };

        /**
         * Method which returns the appropriate context submodel based on the configuration . submodelID
         */
        function getContextSummary(model, submodel)
        {
        	var i,
        		iL = _context.models.length,
        		o;
        		
            if(iL > 0)
            {
            	// Fetch the correct model from the list of models
            	i = 0;
            	for(; i < iL; i++)
            	{
            		if(_context.models[i].model == model.InternalCode)
            		{
            			o = _context.models[i];
            			break;
            		}
            	}
            }
            // If there is a model found
            if(o)
            {
            	// Check for the submodel
            	i = 0;
            	iL = o.submodels.length;
            	if(submodel)
            	{
	            	for(; i < iL; i++)
	            	{
	            		if(o.submodels[i].submodel == submodel.InternalCode)
	            		{
	            			return o.submodels[i].summary;
	            		}
	            	}
	            }
            	// If none are found return the summary from the first submodel
            	if(iL > 0)return o.submodels[0].summary;
            }
            
            // Else return the standard summary
            return _context.standard.summary;
        }

        /**
         * Method which returns the global available promotions
         */
        this.getPromotions = function()
        {
            if(_model && _model.AvailablePromotions) return _model.AvailablePromotions;
            return null;
        };

        /**
         * Method which formats the date of the promotions
         */
        function formatDate(sDate)
        {
            sDate = sDate.replace(/(\D+)(\d+)(\D+)/gi, "$2");
            var date = new Date(Number(sDate));
            return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
        }

        /**
         * Method which initializes the app if it has not been initalized yet
         */
        function init()
        {
            if(!_ws)
            {   
                // Initialize the configuration
                _configuration = new be.marlon.Configuration();
                _configuration.Country = _settings.country;
                _configuration.Brand = _settings.brand;
                _configuration.Language = _settings.language;
				
				_settings.enableCarconfigWebserviceTimeout = !Boolean(_settings.enableCarconfigWebserviceTimeout === "" || _settings.enableCarconfigWebserviceTimeout === "false" || _settings.enableCarconfigWebserviceTimeout === false);
				var timeout = _settings.carconfigWebserviceTimeout?Number(_settings.carconfigWebserviceTimeout):10000;
				_settings.carconfigWebserviceTimeout = isNaN(timeout)?10000:timeout;
				
				// Check the carconfigWebserviceSegmentMaxLength setting
                if(_settings.carconfigWebserviceSegmentMaxLength && !isNaN(Number(_settings.carconfigWebserviceSegmentMaxLength)))
                {
                	_settings.carconfigWebserviceSegmentMaxLength = Number(_settings.carconfigWebserviceSegmentMaxLength);
                }
                else
                {
                	_settings.carconfigWebserviceSegmentMaxLength = 570;
                }
				
				var loadFinance = ((_settings.showFinanceButtonCarConfig || _settings.showInsuranceButtonCarConfig || _settings.showMonthlyRateCarConfig) && !_settings.forceShowFinanceButtonCarConfig);
                // Initialize the webservice
                _ws = new be.marlon.WebService(
                	_hasPrices, 
                	_context, 
                	_settings.gateway, 
                	loadFinance, 
                	_settings.enableCarconfigWebserviceTimeout, 
                	_settings.carconfigWebserviceTimeout,
                	_settings.carconfigWebserviceSegmentMaxLength);

                // Reference the model id to the CarConfigurator
                var omega = _settings.modelID;
                if(omega && omega !== "")
                {
                    _configuration.ModelID = omega;
                }

                // Instantiate the parser if it exists!
                if(be.marlon.Parser)
                {
                    _parser = new be.marlon.Parser();
                }

                // Reference the submodel id to the CarConfigurator
                omega = _settings.submodelID;
                if(omega && omega !== "")
                {
                    _configuration.SubModelID = omega;
                }

                // Check gradeid
                if(_settings.gradeid)
                {
                    if(_settings.gradeid === "" || _configuration.isEmpty(_settings.gradeid) || !_configuration.isValid(_settings.gradeid))
                    {
                        _settings.gradeid = false;
                    }
                    else
                    {
                        _configuration.GradeID = _settings.gradeid;
                    }
                }
                else
                {
                    _settings.gradeid = false;
                }
                // Parse the _preConfiguration
                if(_preConfig)
                {
                    _initConfiguration = _preConfig;
                    // Parse the init configuration into the _configuration object, if it is not a String!
                    if(typeof _initConfiguration != "string")
                    {
                        parseConfiguration(_initConfiguration);
                    }
                }
                _preConfig = null;

                // Check load_all settings
                if(_settings.load_all)
                {
                    if(_settings.load_all === "" || _settings.load_all === "false" || _settings.load_all === false)
                    {
                        _settings.load_all = false;
                    }
                    else
                    {
                        _settings.load_all = true;
                    }
                }
                else
                {
                    _settings.load_all = false;
                }

                // Check the financing setting
                if(_settings.showMonthlyRateCarConfig)
                {
                    if(_settings.showMonthlyRateCarConfig === "" || _settings.showMonthlyRateCarConfig === "false" || _settings.showMonthlyRateCarConfig === false)
                    {
                        _settings.showMonthlyRateCarConfig = false;
                    }
                    else
                    {
                        _settings.showMonthlyRateCarConfig = true;
                    }
                }
                else
                {
                    _settings.showMonthlyRateCarConfig = false;
                }

                // Check use_promo settings
                if(_settings.usePromo)
                {
                    if(_settings.usePromo === "" || _settings.usePromo === "false" || _settings.usePromo === false)
                    {
                        _settings.usePromo = false;
                    }
                    else
                    {
                        _settings.usePromo = true;
                    }
                }
                else
                {
                    _settings.usePromo = true;
                }

                // If the financial button url is available, parse it
                if(_settings.fin_btn_url && _settings.fin_btn_url !== "")
                {
                    var url = _settings.fin_btn_url;
                    url = url.replace('[country]', _settings.country);
                    url += "?regioncode=" + _settings.country;
                    url += "&languagecode=" + _settings.language;
                    url += "&mfrid=C74834D8-FA50-4A8F-9009-C00588F47482";
                    url += "&lnksrc=3948cd6a55c4f1b225cfc1f6c1a50845";
                    _settings.fin_btn_url = url;
                }

                // Add error listener!
                _ws.addEventListener(be.marlon.Internal.SERVICE_ERROR, serviceErrorControllerEventHandler);
                // Add listener to the url shortening method!
                _ws.addEventListener(be.marlon.Internal.SHORTENED_URL_LOADED, shortenURLLoadedEventHandler);
                // Initialize the QueueLoader
                _ql = new be.marlon.QueueLoader(_instance.LOAD, _ws, _configuration, _settings);
                if(typeof _initConfiguration == "string")_ql.setConfigURL(_initConfiguration);
                _ql.addEventListener(be.marlon.Internal.MODELSUBSETGRADES_LOADED, modelSubSetGradesLoadedHandler);
                _ql.addEventListener(be.marlon.Internal.SUBMODELS_LOADED, submodelsLoadedHandler);
                _ql.addEventListener(_ql.DATA_LOADED, dataLoadedEventHandler);
                _ql.addEventListener(_ql.REQUIRES_LOAD, requiresLoadEventHandler);
            }
        }
        
        /**
         * Method used to transform the internal configuration object to the object which is understood by the external applications 
         */
        this.getExternalConfigurationObject = function(stringify, addPromotionInfo)
        {
        	var o = {
        		Country:_configuration.Country,
        		Brand:_configuration.Brand,
        		Language:_configuration.Language,
        		ModelID:_configuration.ModelID,
        		CarID:_configuration.CarID,
        		ExteriorColourID:_configuration.ExteriorColourID,
        		UpholsteryID:_configuration.UpholsteryID
        	},
        		i,
        		iL;
        	iL = _configuration.Options.length;
        	if(iL > 0)o.Options = _configuration.Options.concat();
        	iL = _configuration.Accessories.length;
        	if(iL > 0)o.Accessories = _configuration.Accessories.concat();
        	iL = _configuration.Packs.length;
        	if(iL > 0)o.Packs = _configuration.Packs.concat();
        	
        	// Add wheels & inlays to
        	if(_fc.Wheel.Type.toLowerCase() == "option")
        	{
        		if(!o.Options)o.Options = [];
        		o.Options.push(_configuration.WheelID);
        	}
        	if(!_configuration.isEmpty(_configuration.InlayID) && _fc.Inlay)
            {
                if(_fc.Inlay.Type.toLowerCase() =="option")
                {
                	if(!o.Options)o.Options = [];
        			o.Options.push(_configuration.InlayID);
				}
                else
                {
                	if(!o.Accessories)o.Accessories = [];
        			o.Accessories.push(_configuration.InlayID);
				}
            }
            
            // Add promotional information
            if(addPromotionInfo)
            {
            	var promos = this.getActivePromotions();
            	if(promos)
            	{
            		o.Promotions = promos.map(
            			function(item)
            			{
            				return item.ID;
            			}
            		);
            	}
            	o.TotalPrice = _configuration.TotalPrice - _configuration.TotalPriceDiscount;
            }
        	
        	return stringify?be.marlon.Utility.stringify(o):o;
        };
        
        /**
         * Method which loads the configuration given 
         * @param config:Object the configuration object to be loaded
         * @param cb:Function callback function, false if no data should be loaded
         * @param async:Boolean whether the webservice call is handled synchronous or asynchronous
         */
        this.setConfiguration = function(config, cb, async)
        {
        	
        	// Clear the rest of the configuration
            _configuration.reset();
            // Reset the queue loader
            _ql.resetData(false, false, true, true);
            // Reset variables to
            resetVariables();
            _aCompareGrades = null;
            _aSubModels = null;
            _initConfiguration = config;
        	_initConfiguration.Brand = _configuration.Brand;
        	_initConfiguration.Country = _configuration.Country;
        	_initConfiguration.Language = _configuration.Language;
        	
        	// Set the callback
        	if(cb)
        	{
        		_cb = cb;
				_ws.addEventListener(be.marlon.Internal.FULL_CONFIGURATION_LOADED, configSetFCLoadedHandler);
        		_ws.getFullConfiguration(_initConfiguration, async);
        	}
        	else
        	{
        		// Parse the configuration
        		parseConfiguration(_initConfiguration);
        	}
        };
        
        /**
         * Handles complete loading of the fullconfiguration object 
         */
        function configSetFCLoadedHandler(e)
        {
        	_ws.removeEventListener(be.marlon.Internal.FULL_CONFIGURATION_LOADED, configSetFCLoadedHandler);
        	
        	// Parse and save the initial configuration
	         _aUserSelected = [];
        	
        	// Parse the loaded configuration object
        	parseFullConfiguration(e.data);
			
			// Reset the queueloader
            _ql.setFullConfiguration(e.data);
            
            // Re-initialize configuration dependencies
	        initConfiguration(e.data);
	        
	        // Update configuration prices
	        updateConfiguration(false);
	        _initConfiguration = null;
	        
	        // Call the callback method
	        if(_cb)
	        {
	        	var cb = _cb;
	        	_cb = null;
	        	cb();
	        }
        }
        
        /**
         * Method which starts loading the required data 
         */
        this.loadData = function(aCalls, cb, async)
        {
        	// Set the callback
        	_cb = cb;
        	// Initialize the controller
        	init();
        	// Start loading
        	_ql.load(aCalls, async);
        	// Show loader?
        };
        
        /**
         * Method which handles the  load complete of the queue loader
         * @param e:DataEvent
         */
        function dataLoadedEventHandler(e)
        {
        	// TODO
        	// Hide loader?
        	var data = e.data,
        		i,
        		iL,
        		t,
        		tL,
        		o,
        		arr,
        		bDefault,
        		userSelectedUpdate = false,
        		prop;
        	// Instantiate the _aAvailables Array
        	if(!_aAvailables)
        	{
        		// Instantiate the Array of _aAvailables
	            _aAvailables = [];
	            _hasOptionalAvailables = {
	                options:false,
	                accessories:false,
	                inlays:false
	            };
        	}	
        	// Check the packs, this has to be donebefore the initConfiguration is handled because it has a dependency on the _aPacks array
        	if(data.packs && data.packs.update)
        	{
        		// Save the packs
	            _aPacks = data.packs.data;
	            
	            // Update the prices of the equipment items for each pack
				updatePackEquipmentPrices(_aPacks);
				
	            // Enrich the promotions
	            enrichPromotions(_aPacks, "Promotions");
        	}
        	// Check configuration
        	if(data.configuration && data.configuration.update)
        	{
	            // Parse and save the initial configuration
	            _aUserSelected = [];
	            // Save the model to!
	            if(data.model && data.model.update)
        		{
	            	// Save the data
	            	_model = data.model.data;
	           	}
	            // Initialize configuration dependencies once again
	            initConfiguration(data.configuration.data);
	            // Update configuration prices
	            updateConfiguration(false);
	            // Save the model in the configuration object
	            _configuration.ModelLabel = _fc.Model.Name;
        	}
        	// Check the model
        	if(data.model && data.model.update)
        	{
	            // Save the data
	            _model = data.model.data;
	
	            // Save the model in the configuration object
	            _configuration.ModelLabel = _model.Name;
	
	            // Clear the promotions if there should be no promotions shown
	            if(!_settings.usePromo)
	            {
	                clearPromotions(_model, "AvailablePromotions");
	            }
	
	            var so;
	            // Enrich the availablepromotions with an index!
	            if(_model.AvailablePromotions)
	            {
	                i = 0;
	                iL = _model.AvailablePromotions.length;
	                for(i; i < iL; i++)
	                {
	                    o = _model.AvailablePromotions[i];
	                    o.Index = (i + 1);
	                    o.From = formatDate(o.From);
	                    o.Until = formatDate(o.Until);
	                }
	            }
	
	            // Check if there are filter values available
	            if(_model.FilterInfo && _model.FilterInfo.Cars.length > 0)
	            {
	                i = 0;
	                iL = _model.FilterInfo.Cars.length;
	                _filterEquipment = [];
	                for(; i < iL; i++)
	                {
	                    o = _model.FilterInfo.Cars[i];
	                    tL = o.SelectedOptions.length;
	                    for(t = 0; t < tL; t++)
	                    {
	                        so = o.SelectedOptions[t];
	                        if(!getObject(so.ID, _filterEquipment))
	                        {
	                            _filterEquipment.push(so);
	                        }
	                    }
	                }
	            }
	            // Is there a default configuration?
	            bDefault = _initConfiguration?true:false;
        	}
        	// Check the submodels
        	if(data.submodels && data.submodels.update)
        	{
        		// Reference the submodels
	            _aSubModels = data.submodels.data;
	
	            // Append the submodel images
	            createImages(_aSubModels);
	
	            // Check if the returned array contains more then one value!
	            if(_aSubModels.length > 1)
	            {
	                // Enrich the promotions
	                enrichPromotions(_aSubModels, "AvailablePromotions");
	            }
	            // Is there a default configuration?
	            bDefault = _initConfiguration?true:false;
        	}
        	// Check the bodytypes
        	if(data.bodytypes &&  data.bodytypes.update)
        	{
        		 // Save the loaded body types
	            _aBodyTypes = data.bodytypes.data;
	            
	            // Append the submodel images
	            createImages(_aBodyTypes);
	
	            // Enrich the promotions
	            enrichPromotions(_aBodyTypes, "AvailablePromotions");
        	}
        	// Check the motorizations
        	if(data.motorizations && data.motorizations.update)
        	{
        		// Save the motorizations
	            _aMotorizations = data.motorizations.data;
	
	            // Enrich the promotions
	            enrichPromotions(_aMotorizations, "AvailablePromotions");
	
	            // Clear the promotions if there should be no promotions shown
	            if(!_settings.usePromo)
	            {
	                i = 0;
					iL = _aMotorizations.length;
	                for(i; i < iL; i++)
	                {
	                    t = 0;
	                    tL = _aMotorizations[i].Grades.length;
	                    for(t; t < tL; t++)
	                    {
	                        clearPromotions(_aMotorizations[i].Grades[t], false);
	                    }
	                }
	            }
        	}
        	// Check the grades
        	if(data.grades && data.grades.update)
        	{
        		// Save the grades
	            _aGrades = data.grades.data;
	
	            // Enrich the promotions
	            enrichPromotions(_aGrades, "AvailablePromotions");
	            
	            // Add images to the grade objects
				createGradeImages();
        	}
        	// Check the upholsteries
        	if(data.colours && data.colours.update)
        	{
        		// Save the colours
	            _aColours = data.colours.data.ExteriorColours;
	
	            // Enrich the promotions
	            enrichPromotions(_aColours, "Promotions");
	
	            // Parse the user selected logic
	            if(parseUserSelectedItem(_aColours, "ExteriorColourID", "ExteriorColour") === true && !userSelectedUpdate)userSelectedUpdate = true;
        	}
        	// Check the wheels
        	if(data.wheels && data.wheels.update)
        	{
        		// Save the wheels
        		if(data.wheels.data.Wheels)
        		{
        			_aWheels = data.wheels.data.Wheels;
					_aWheelEquipment = data.wheels.data.IncludeEquipment;
        		}
        		else
        		{
        			_aWheels = data.wheels.data;
        			_aWheelEquipment = [];
        		}
	            // Enrich the promotions
	            enrichPromotions(_aWheels, "Promotions");
	            // Parse the user selected logic
	            if(parseUserSelectedItem(_aWheels, "WheelID", "Wheel") === true && !userSelectedUpdate)userSelectedUpdate = true;
        	}
        	// Check the options
        	if(data.options && data.options.update)
        	{
        		// Save the optional equipment
	            _aOptionalEquipment = data.options.data;
	
	            // First check if the standard equipment should be removed!
	            if(!_settings.usePromo)
	            {
	                removeStandardEquipment(_aOptionalEquipment);
	            }
				
	            // Check if there are filter values which should be removed
	            if(_filterEquipment && _filterEquipment.length > 0)
	            {
	                i = 0;
	                iL = _aOptionalEquipment.length;
	                for(; i < iL; i++)
	                {
	                    o = _aOptionalEquipment[i];
	                    prop = "";
	                    // Check if the object is present in the filterEquipment
	                    if(getObject(o.ID, _filterEquipment))
	                    {
	                        if(_getIndex(_configuration.Options, o.ID) > -1)
	                        {
	                            prop = "StandardFilterEquipment";
	                        }
	                        else
	                        {
	                            prop = "Hide";
	                        }
	                        o[prop] = true;
	                        // Loop through the object's included equipment and also disable those, webservice does not take the includes of equipment items
	                        // into account when doing compatibility check so still apply this logic
	                        tL = o.IncludeEquipment.length;
	                        for(t = 0; t < tL; t++)
	                        {
	                            e = getObject(o.IncludeEquipment[t].ID, _aOptionalEquipment);
	                            if(e)
	                            {
	                                e[prop] = true;
	                                // Also add the option to the configuration!
	                                if(prop == "StandardFilterEquipment" && (_getIndex(_configuration.Options, e.ID) == -1))_configuration.Options.push(e.ID);
	                            }
	                        }
	                    }
	                    // Check if the object excludes equipment items which are present in the filterequipment
	                    if(prop === "")
	                    {
	                        tL = o.ExcludeEquipment.length;
	                        for(t = 0; t < tL; t++)
	                        {
	                            if(getObject(o.ExcludeEquipment[t].ID, _filterEquipment))
	                            {
	                                o.Hide = true;
	                                break;
	                            }
	                        }
	                    }
	                }
	            }
	
	            // Enrich the promotions
	            enrichPromotions(_aOptionalEquipment, "Promotions");
	
	            // Loop through the optional equipment to check if there are equipment items with there AvailableForExteriorColours or AvailableForExteriorColours filled in
	            updateAvailability(_aOptionalEquipment, "options");
	            
	            // Remove Aygo options
	            removeChildEquipment(_aOptionalEquipment);
        	}
        	// Check the upholsteries
        	if(data.upholsteries && data.upholsteries.update)
        	{
        		// Save the upholstries
	            _aUpholsteries = data.upholsteries.data;
	
	            // Enrich the promotions
	            enrichPromotions(_aUpholsteries, "Promotions");
	
	            // Parse the user selected logic
	            i = 0;
	            arr = _fc.ExteriorColour.Upholsteries.concat();
	            iL = arr.length;
	            for(; i < iL; i++)
	            {
	            	arr[i] = getObject(arr[i].ID, _aUpholsteries);
	            }
	            if(parseUserSelectedItem(arr, "UpholsteryID", "Upholstery") === true && !userSelectedUpdate)userSelectedUpdate = true;
        	}
        	if(data.inlays && data.inlays.update)
        	{
        		// Save the inlays
	            _aInlays = data.inlays.data;
	
	            // Enrich the promotions
	            enrichPromotions(_aInlays, "Promotions");
        	}
        	if(data.accessories && data.accessories.update)
        	{
        		// Save the loaded optional accessories
	            _aOptionalAccessories = data.accessories.data;
	
	            // First check if the standard equipment should be removed!
	            if(!_settings.usePromo)
	            {
	                removeStandardEquipment(_aOptionalAccessories);
	            }
	
	            // Enrich the promotions
	            enrichPromotions(_aOptionalAccessories, "Promotions");
	
	            // Loop through the optional equipment to check if there are equipment items with there AvailableForExteriorColours or AvailableForExteriorColours filled in
	            updateAvailability(_aOptionalAccessories, "accessories");
	            
	            // Remove Aygo options
	            removeChildEquipment(_aOptionalAccessories);
        	}
        	// Calculate and return the available adjusted
            var aAdjusted = getAvailableAdjustment();
            
            // Save the version in a global object
            if(data.version)_serviceVersion = data.version;
            
            // Parse the data object and create the return object
            o = {};
            if(data.filters && data.modelsubsets)
            {
            	if(!_settings.usePromo)
            	{
            		i = 0;
            		arr = data.modelsubsets.data;
            		iL = arr.length;
            		for(; i < iL; i++)
            		{
            			arr[i].PromotionsCount = 0;
            		}
            	}
            	o.filters = {
            		data:data.filters.data,
            		update:data.filters.update
            	};
            	o.modelsubsets = {
            		data:data.modelsubsets.data,
            		update:data.modelsubsets.update
            	};
            }
            if(data.model)
            {
            	o.model = {	
            		name:_model.Name,
            		availablePromotions:_model.AvailablePromotions,
            		hasDefaultCar:bDefault,
            		multiSubModel:_model.MultiSubModel,
            		multiBodyType:_model.MultiBodyType,
            		hasAccessories:_model.HasAccessories,
            		filterInfo:_model.FilterInfo,
            		configs:_model.Configs,
            		carConfiguratorVersion:_model.CarConfiguratorVersion
            	};
            }
            if(data.submodels)
            {
            	o.submodels = {
            		data:_aSubModels,
            		update:data.submodels.update,
            		hasDefaultCar:bDefault
            	};
            }
			// Reference appropriate elements
			if(data.bodytypes)
			{
				o.bodytypes = {
					data:(_parser?_parser.parseBodyTypes(_aBodyTypes):_aBodyTypes),
					update:data.bodytypes.update
				};
			}
			if(data.motorizations)
			{
				o.motorizations = {
					data:_aMotorizations,
					enginePromos:updateEnginePromoValues(_aMotorizations),
					update:data.motorizations.update
				};
			}
			if(data.grades)
			{
				o.grades = {
					data:_aGrades,
					gradePromos:updateGradePromoValues(_aGrades),
					enabledGrades:getMotorization(_configuration).Grades,
					update:data.motorizations.update
				};
			}
			if(data.packs)
			{
				o.packs = {
					data:(_parser?_parser.parsePacks(_aPacks):_aPacks),
					update:data.packs.update
				};
			}
			if(data.colours && !data.colours.internal)
			{
				o.colours = {
					data:(_parser?_parser.parseColours(_aColours):_aColours),
					colourPriceDifference:calculatePriceDifference(_aColours, _configuration.ExteriorColourID),
					update:data.colours.update
				};
			}
			if(data.wheels)
			{
				o.wheels = {
					data:(_parser?_parser.parseWheels(_aWheels):_aWheels),
					equipment:_aWheelEquipment,
					wheelPriceDifference:calculatePriceDifference(_aWheels, _configuration.WheelID),
					update:data.wheels.update
				};
			}
			if(data.options)
			{
				o.options = aAdjusted[1]?aAdjusted[1]:_aOptionalEquipment;
				o.options = {
					data:(_parser?_parser.parseOptions(o.options):o.options),
					update:data.options.update
				};
			}
			if(data.accessories)
			{
				o.accessories = aAdjusted[2]?aAdjusted[2]:_aOptionalAccessories;
				o.accessories = {
					data:(_parser?_parser.parseAccessories(o.accessories):o.accessories),
					update:data.accessories.update
				};
			}
			// Reference the upholsteries based on the upholsteries present for the selected colour!
			if(data.upholsteries)
			{
				o.upholsteries = getFullUpholsteries(data.configuration.data.ExteriorColour.Upholsteries);
				o.upholsteries = {
					data:(_parser?_parser.parseUpholsteries(o.upholsteries):o.upholsteries),
					upholsteryPriceDifference:((o.upholsteries.length > 1)?calculatePriceDifference(o.upholsteries, _configuration.UpholsteryID):[]),
					update:data.upholsteries.update
				};
			}
			if(data.inlays)
			{	
				if(parseUserSelectedItem(aAdjusted[0]?aAdjusted[0]:_aInlays, "InlayID", "Inlay") === true && !userSelectedUpdate)userSelectedUpdate = true;
				o.inlays = aAdjusted[0]?aAdjusted[0]:_aInlays;
				o.inlays = {
					data:(_parser?_parser.parseInlays(o.inlays):o.inlays),
					inlayPriceDifference:((o.inlays.length > 0)?calculatePriceDifference(o.inlays, _configuration.InlayID):[]),
					update:data.inlays.update
				};
			}
			if(userSelectedUpdate)
			{
				// Initialize configuration dependencies once again
	            initConfiguration(_fc);
	            // Update configuration prices
	            updateConfiguration(false);
			}
			// Reference the eco data
			if(data.configuration)
			{
				// Reference the promo image
				var q;
				if(_aSubModels)q = getPromoData();
				
				// Sort the configuration!
				sortConfig();
				
				// Save the configuration
				o.configuration = {
					eco:_carData.EcoSpecs,
					data:copyConfiguration(true),
					promoLink:(q?q.promoLink:""),
					promoImage:(q?q.promoImage:""),
					update:data.configuration.update
				};
				// Add the images for the HTML spinplayer
				addImages(o.configuration.data);
			}
			// Dispatch load complete event
			_instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.LOAD_DATA_COMPLETE));
        	// Call the callback method
	        if(_cb)
	        {
	        	var cb = _cb;
	        	_cb = null;
	        	cb(o);
	        }
        }
        
        /**
         * Method which removes the Equipment items which have a "ChildOption" defined 
         */
        function removeChildEquipment(arr)
        {
        	var i = 0;
        	for(; i < arr.length; i++)
        	{
        		if(arr[i].ChildOptions.length > 0)
        		{
        			arr.splice(i, 1);
        			i--;
        		}
        	}
        }
        
        /**
         * Method which notifies the implementing control that data is required to be loaded
         * @param e:DataEvent 
         */
        function requiresLoadEventHandler(e)
        {
        	// Dispatch event (based on _bLoadPacks, _bLoadEngineGrades?)
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.LOAD_DATA, e.data));
        }
        
        /**
         * Method which loads the standard equipment 
         */
        this.loadStandardEquipment = function()
        {
        	// Check if the standard equipment exist, if so return them immediately
            if(_aStaEquipment)
            {
                _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.STANDARD_EQUIPMENT_LOADED, [_aStaEquipment, true]));
            }
            // Else; load them from the webservice
            else
            {
            	_ws.abort();
                // Add the event listener
                _ws.addEventListener(be.marlon.Internal.STANDARD_EQUIPMENT_LOADED, standardEquipmentControllerLoadEventHandler);
                // Call the webservice method which handles the actual call
                getContent("getStandardEquipment", [_configuration.CarID]);
            }
        };
        
        /**
         * Handles the loaded standard equipment 
         */
        function standardEquipmentControllerLoadEventHandler(evt)
        {
        	// Reference the loaded compare grades!
            _aStaEquipment = evt.data;
			// Remove event listener
            _ws.removeEventListener(be.marlon.Internal.STANDARD_EQUIPMENT_LOADED, standardEquipmentControllerLoadEventHandler);
            // Do the comparing of the grades
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.STANDARD_EQUIPMENT_LOADED, [_aStaEquipment, false]));
        }
        
        /**
         * Method which loads the specifications 
         */
        this.loadSpecifications = function()
        {
        	// Check if the specifications exist, if so return them immediately
            if(_aSpecs)
            {
                _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.SPECS_LOADED, [_aSpecs, true]));
            }
            // Else; load them from the webservice
            else
            {
            	_ws.abort();
                // Add the event listener
                _ws.addEventListener(be.marlon.Internal.SPECS_LOADED, specificationsControllerLoadEventHandler);
                // Call the webservice method which handles the actual call
                getContent("getTechnicalSpecifications", [_configuration.CarID]);
            }
        };
        
        /**
         * Handles the loaded specifications 
         */
        function specificationsControllerLoadEventHandler(evt)
        {
        	// Reference the loaded compare grades!
            _aSpecs = evt.data;
			// Remove event listener
            _ws.removeEventListener(be.marlon.Internal.STANDARD_EQUIPMENT_LOADED, specificationsControllerLoadEventHandler);
            // Do the comparing of the grades
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.SPECS_LOADED, [_aSpecs, false]));
        }

        /**
         * Method used to get the list of equipment to populate the compare grades list
         */
        this.loadCompareGrades = function()
        {
            // Check if the comparegrades exist, if so return them immediately
            if(_aCompareGrades)
            {
                _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.COMPARE_GRADES_LOADED, [_aCompareGrades, true]));
            }
            // Else; load them from the webservice
            else
            {
                // Add the event listener
                _ws.addEventListener(be.marlon.Internal.COMPARE_GRADES_LOADED, compareGradesControllerLoadEventHandler);
                // Call the webservice method which handles the actual call
                getContent("getCompareGrade", [_configuration.CarID]);
            }
        };

        /**
         * Method which handles the return value from the server regarding the retrevement for all the equipment for all the grades
         * @param evt:DataEvent
         */
        function compareGradesControllerLoadEventHandler(evt)
        {
            // Reference the loaded compare grades!
            _aCompareGrades = evt.data;

            // Enrich the promotional data
            var i = 0,
                iLength = _aCompareGrades.length,
                o,
                t,
                tLength;
            for(i; i < iLength; i++)
            {
                o = _aCompareGrades[i];
                enrichPromotions(o.OptionalOn, "Promotions");
                enrichPromotions(o.StandardOn, "Promotions");
            }

            // Remove event listener
            _ws.removeEventListener(be.marlon.Internal.COMPARE_GRADES_LOADED, compareGradesControllerLoadEventHandler);
            // Do the comparing of the grades
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.COMPARE_GRADES_LOADED, [_aCompareGrades, false]));
        }

        /**
         * Method which returns the panorama image for the interior
         */
        function getIntPanoramaImage(uphol)
        {
            // Get the current active color
            var e = _fc.ExteriorColour,
            // Check for presence of a colour specific Asset
                i = 0,
                iL = e.Assets.length,
                img = false;
            for(; i < iL; i++)
            {
                if(e.Assets[i].Type == "Panorama")
                {
                    img = e.Assets[i].Url;
                    break;
                }
            }
            e = null;

            // If image is not yet found, try and search for it in the upholsteries
            if(!img)
            {
                // Get the current active upholsterie
                // Check for presence of the Panorama asset under this location
                i = 0;
                iL = uphol.Assets.length;
                for(; i < iL; i++)
                {
                    if(uphol.Assets[i].Type == "Panorama")
                    {
                        img = uphol.Assets[i].Url;
                        break;
                    }
                }
            }
            return img;
        }

        /**
         * Method which is used to reset the Configuration object
         */
        this.resetConfiguration = function()
        {
            _configuration.reset();
        };

        /**
         * Method which sets the language of the configuration object
         * @param language:String
         */
        this.setLanguage = function(language)
        {
            _configuration.Language = language;
        };

        /**
         * Method which sets the brand of the configuration object
         * @param brand:String
         */
        this.setBrand = function(brand)
        {
            _configuration.Brand = brand;
        };

        /**
         * Method which sets the country of the configuration object
         * @param country:String
         */
        this.setCountry = function(country)
        {
            _configuration.Country = country;
        };

        /**
         * Method which sets the model based on the given guid
         * @param guid:String
         */
        this.setModel = function(sGuid)
        {
        	// Initialize the application if it has not been initialized yet
        	init();
        	// Set the model id
            _configuration.ModelID = sGuid;
            _configuration.SubModelID = "00000000-0000-0000-0000-000000000000";
            // Clear the rest of the configuration
            _configuration.reset();
            // Reset the queue loader
            _ql.resetData(false, false, true, true);
            
            // Reset variables to
            resetVariables();
            _aCompareGrades = null;
            _aSubModels = null;
            
            // Dispatch event to let the implementing application know that data should be reloaded
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.RELOAD_DATA));
        };

        /**
         * Method which sets the submodelid on the given guid
         * @param guid:String
         */
        this.setSubModel = function(guid)
        {
            // Set the submodel id
            _configuration.SubModelID = guid;
            // Clear the rest of the configuration
            _configuration.reset();
            // Reset the queue loader
            _ql.resetData(false, false, true, false);
            
            // Reset variables to
            resetVariables();
            _aCompareGrades = null;
            
            // Dispatch event to let the implementing application know that data should be reloaded
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.RELOAD_DATA));
        };

        /**
         * Function which is used to set the Motorizations which match that guid
         * @param engine:String
         * @param fueltype:String
         * @param transmission:String
         * @param wheeldrive:String
         */
        this.setMotorization = function(engine, fueltype, transmission, wheeldrive)
        {
            // Reload the packs!
            _bLoadPacks = true;

            // Do the compare result!
            // Save old properties!
            var sOldEngine = _configuration.EngineID;
            var sOldFuelType = _configuration.FuelTypeID;
            var sOldWheelDrive = _configuration.WheelDriveID;
            var sOldTransmission = _configuration.TransmissionID;

            // Set the first configuration with the old parameters
            var config1 = copyConfiguration(false);

            // Set the second configuration with the new parameters
            // Set the id's on the configuration
            _configuration.EngineID = engine;
            _configuration.FuelTypeID = fueltype;
            _configuration.WheelDriveID = wheeldrive;
            _configuration.TransmissionID = transmission;

            var config2 = copyConfiguration(false);

            // Reset the old properties
            _configuration.EngineID = sOldEngine;
            _configuration.FuelTypeID = sOldFuelType;
            _configuration.WheelDriveID = sOldWheelDrive;
            _configuration.TransmissionID = sOldTransmission;

            compatibilityCheck(config1, config2);
        };

        /**
         * Function which is used to set the body type on the _configuration object
         * @param guid:String
         */
        this.setBodyType = function(guid)
        {
            // Do full check!
            _bLoadEngineGrades = true;
            // Do the compare result!
            // Save the old bodytype id
            var sOld = _configuration.BodyTypeID;
            // Set the first configuration with the old bodytype id
            var config1 = copyConfiguration(false);
            // Set the second configuration with the new bodytype id
            _configuration.BodyTypeID = guid;
            var config2 = copyConfiguration(false);
            // Reset the old bodytype id
            _configuration.BodyTypeID = sOld;
            compatibilityCheck(config1, config2);
        };

        /**
         * Function which is used to set the selected grade id
         * @param guid:String
         */
        this.setGrade = function(guid)
        {
            // Reload the packs, only if there are any!
			_bLoadPacks = true;
            // Do the compare result!
            // Save the old grade id
            var sOld = _configuration.GradeID;
            // Set the first configuration with the old grade id
            var config1 = copyConfiguration(false);
            // Set the second configuration with the new grade id
            _configuration.GradeID = guid;
            var config2 = copyConfiguration(false);
            // Reset the old grade id
            _configuration.GradeID = sOld;
            compatibilityCheck(config1, config2);
        };

        /**
         * Function which sets the selected exterior colour id
         * @param guid:String
         */
        this.setExteriorColour = function(guid)
        {
            // Set the user interacted boolean
            _bUserInteracted = true;

            var oPrevious = getObject(_configuration.ExteriorColourID, _aColours);
            var oCurrent = getObject(guid, _aColours);
            // Remove the previous one from the user selected array
            updateUserSelected(_configuration.ExteriorColourID, oCurrent);

            // Set new guid to the configuration object
            _configuration.ExteriorColourID = guid;

            // Update the label
            _configuration.ExteriorColourLabel = oCurrent.Name;
            // Update the disclaimer
            _configuration.ExteriorColourDisclaimer = oCurrent.FootNote;
            // Update the price
            _configuration.ExteriorColourPrice = oCurrent.PriceInfo;
            var bDif = false;
            var i = 0,
            	iL;
            if(oPrevious.Upholsteries.length == oCurrent.Upholsteries.length)
            {
                // Check if all items match
                iL = oPrevious.Upholsteries.length;
                for(i; i < iL; i++)
                {
                    if(oPrevious.Upholsteries[i].ID != oCurrent.Upholsteries[i].ID)
                    {
                        bDif = true;
                        break;
                    }
                }
            }
            else
            {
                bDif = true;
            }

            // Check if there is a difference in available upholstries for the prev/current colour
            if(bDif)
            {
                // Now check if the current selected upholstery is still available in the array of the newly selected upholsteries
                i = 0;
                var aUpholsteries = getFullUpholsteries(oCurrent.Upholsteries);
                iL = aUpholsteries.length;
                var sDefault = "";
                var bExists = false;
                var o;
                for(i; i < iL; i++)
                {
                    o = aUpholsteries[i];
                    // Get the default for the selected colour
                    if(o.Default === true)
                    {
                        sDefault = o.ID;
                    }
                    if(_configuration.UpholsteryID == o.ID)
                    {
                        bExists = true;
                        break;
                    }
                }
                // If the default is an emtpy string, take the first element
                if(sDefault === "" && iL > 0)
                {
                    sDefault = aUpholsteries[0].ID;
                }
                if(!bExists)
                {
                    // Check if the user selected upholstery is available in the upholstery list
                    i = 0;
                    for(i; i < iL; i++)
                    {
                        o = aUpholsteries[i];
                        if(getObject(o.ID, _aUserSelected))
                        {
                            sDefault = o.ID;
                            break;
                        }
                    }
                    // Update the upholstery
                    updateUpholstery(sDefault, false);
                }
                sDefault = _configuration.UpholsteryID;
                // Dispatch an event notifieng which upholstries to set
                var evt = new be.marlon.DataEvent(be.marlon.Service.RENDER_UPHOLSTERIES,[aUpholsteries, sDefault]);
                _instance.dispatchEvent(evt);

                // Keep the updating of the configuration for the last
                if(bExists)
                {
                    // Update the _aAvailables array (AvailableForExteriorColours, AvailableForUpholsteries)
                    updateAvailables();
                }
            }
            else
            {
                // Update the _aAvailables array (AvailableForExteriorColours, AvailableForUpholsteries)
                updateAvailables();
            }
            
            // Save the selected color in the full configuration object
            _fc.ExteriorColour = getObject(_configuration.ExteriorColourID, _aColours);
            
            // Check the body colour dependency of the ChildOptions of the selected packs
            updateStandardPackColourDependentItems();
            
            // Check the body colour dependency of the ChildOptions for the non optional pack equipment items
            updateOptionalPackColourDependentItems();
            
            // Check the body colour dependent items of the current selected extended wheel
			updateExtendedWheel();
            
            // Check for pack availability!
            var incompatiblePack = getIncompatiblePack(_configuration.ExteriorColourID, _configuration.UpholsteryID);
            if(incompatiblePack)
            {
            	// Disable the pack!
				_instance.setPack(incompatiblePack);	
            }
            else
            {
            	// Update the global price
           		updateConfiguration(true);
            
            	// Execute the callback containing the array with the updated price value paires
            	var cpd = calculatePriceDifference(_aColours, guid);
				_instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.UPDATE_COLOUR_PRICES, cpd));
            }
        };
        
        /**
         * Method which updates the standard, body color dependent equipment items from the packs 
         */
        function updateStandardPackColourDependentItems()
        {
        	var i = 0,
        		iL = _configuration.Packs.length,
        		o,
        		so,
        		t,
        		tL,
        		equip = [];
        		
        	// Create an array of all the equipment inside the selected packs
        	for(; i < iL; i++)
        	{
        		o = getObject(_configuration.Packs[i], _aPacks);
        		equip = equip.concat(o.Equipment);
        	}
        	
        	// Loop through the array of equipment
        	iL = equip.length;
            for(i = 0; i < iL; i++)
            {
            	o = equip[i];
            	// Loop through the packs equipment
            	tL = o.ChildOptions.length;
            	for(t = 0; t < tL; t++)
            	{
            		so = o.ChildOptions[t];
            		// If the colouringmode should be matched against the exterior colour
            		// And if the object is standard or the relevant sub Object is selected inside the current options and/or accessories arrays
            		if(so.ColouringMode === 1 && (o.Standard || getObject(so.ID, _configuration.Options.concat(_configuration.Accessories))))
            		{
            			if(so.Colour.ID == _configuration.ExteriorColourID)
            			{
	            			// Add the item to the configuration object
	            			if(so.Type.toLowerCase() === "accessory")
	            			{
	            				if(!getObject(so.ID, _fc.Accessories))_fc.Accessories.push(so);
		                    	_configuration.addAccessory(so.ID, so.Name, so.PriceInfo);
	            			}
	            			else
	            			{
	            				if(!getObject(so.ID, _fc.Options))_fc.Options.push(so);
		                    	_configuration.addOptions(so.ID, so.Name, so.PriceInfo, so.Category.Root.Code);
	            			}
            			}
            			else
            			{
	            			// Remove the item from the configuration object
	            			if(so.Type.toLowerCase() === "accessory")
	            			{
	            				// Remove the item from the configuration object
		            			if(getObject(so.ID, _fc.Accessories))_fc.Accessories.splice(_getIndex(_configuration.Accessories, so.ID), 1);
								_configuration.removeAccessory(so.ID);
	            			}
	            			else
	            			{
		            			// Remove the item from the configuration object
		            			if(getObject(so.ID, _fc.Options))_fc.Options.splice(_getIndex(_configuration.Options, so.ID), 1);
								_configuration.removeOptions(so.ID);
							}
	            		}
	            	}
            	}
            }
        }
        
        /**
         * Method which updates the optional pack equipment (which are secondary accent colour dependent) items which have a body colour dependency.
         * This method is used to fix CARDB-2248 
         */
        function updateOptionalPackColourDependentItems()
        {
        	var i = 0,
        		iL = _configuration.Packs.length,
        		o,
        		so,
        		t,
        		tL,
        		k,
        		kL,
        		acc,
        		selectedEquipment = _configuration.Options.concat(_configuration.Accessories),
        		pac = _instance.getPrimaryAccentColor();
        		
        	if(!pac)pac = {ID:"00000000-0000-0000-0000-000000000000"};
        	// Create an array of all the equipment inside the selected packs
        	for(; i < iL; i++)
        	{
        		o = getObject(_configuration.Packs[i], _aPacks);
        		// Accent Colour Combinations
        		acc = [];
        		// Get the current selected secondary accent colour combinations
        		tL = o.AccentColourCombination.length;
        		for(t = 0; t < tL; t++)
        		{
        			so = o.AccentColourCombination[t];
        			if(	so.BodyColour.ID === _configuration.ExteriorColourID && 
        				so.PrimaryAccentColour.ID === pac.ID) acc.push(so.SecondaryAccentColour.ID);
        		}
        		// Run through the equipment of the packs
        		tL = o.Equipment.length;
        		for(t = 0; t < tL; t++)
        		{
        			// Run through the ChildOptions
        			kL = o.Equipment[t].ChildOptions.length;
        			for(k = 0; k < kL; k++)
        			{
        				so = o.Equipment[t].ChildOptions[k];
        				// Check if the childoption is present in the current configuration object
        				if(_getIndex(selectedEquipment, so.ID) !== -1)
        				{
        					// Check if the ChildOptions colour mode is secondary accent colour
        					if(so.ColouringMode === 4 || so.ColouringMode === 6)
        					{
        						// If the colour does not match the one dictated in the acc array, select a new color item
        						if(acc.length > 0 && _getIndex(acc, so.Colour.ID) === -1)
        						{
			            			// Remove the item from the configuration object
			            			if(so.Type.toLowerCase() === "accessory")
			            			{
			            				// Remove the item from the configuration object
				            			if(getObject(so.ID, _fc.Accessories))_fc.Accessories.splice(_getIndex(_configuration.Accessories, so.ID), 1);
										_configuration.removeAccessory(so.ID);
			            			}
			            			else
			            			{
				            			// Remove the item from the configuration object
				            			if(getObject(so.ID, _fc.Options))_fc.Options.splice(_getIndex(_configuration.Options, so.ID), 1);
										_configuration.removeOptions(so.ID);
									}
        						}
        					}
        				}
        			}
        		}
        	}
        }
        
        /**
         * Method which updates the equipment items selected for the extended wheel, based on the selected color 
         */
        function updateExtendedWheel(force)
        {
        	// Only check this logic if the check is true
        	if(!_settings.useExtendedWheelColourFiltering || !_extendedWheel.finish || !_aWheels)return;
        	// Check the cap/surround
        	var opts = [
	        		_extendedWheel.cap,
	        		_extendedWheel.surround
	        	],
	        	o,
	        	i = 0,
	        	shouldCapUpdate = false,
	        	shouldSurroundUpdate = false,
	        	colouringMode,
	        	exteriorColour = _configuration.ExteriorColourID,
	        	primaryAccentColor = _instance.getPrimaryAccentColor(),
	        	iL = opts.length;
	        for(; i < iL; i++)
	        {
	        	o = opts[i];
	        	if(o && o.ColouringMode)
	        	{
	        		colouringMode = o.ColouringMode;
	        		if(
	        			!(
	        				colouringMode === 0 || 
							(colouringMode === 1 && o.Colour.ID == exteriorColour) ||
							(colouringMode === 2 && primaryAccentColor && o.Colour.ID == primaryAccentColor.ID) ||
							(colouringMode === 3 && ((o.Colour.ID == exteriorColour) || (primaryAccentColor && (o.Colour.ID == primaryAccentColor.ID)))))
					)
					{
						switch(i)
						{
							case 0:
								shouldCapUpdate = true;
							break;
							case 1:
								shouldSurroundUpdate = true;
							break;
						}
					}
	        	}
	        }
        	
        	// Don't select a wheel if nothing should be updated
        	if(!shouldCapUpdate && !shouldSurroundUpdate && !force)return;
        	
        	// Select the wheel
           	selectWheel(getObject(_extendedWheel.ID, _aWheels), _extendedWheel.finish, shouldCapUpdate?null:_extendedWheel.cap, shouldSurroundUpdate?null:_extendedWheel.surround);
        }
        
        /**
         * Method which checks if one or more packs are still valid for the new color/upholstery 
         */
        function getIncompatiblePack(colour, upholstery)
        {
        	if(!_aPacks)return null;
        	
        	var i = 0,
        		iL = _fc.Packs.length,
        		arrColour,
        		o,
        		available,
        		arrUphol;
        	for(; i < iL; i++)
        	{
        		o = getObject(_fc.Packs[i].ID, _aPacks);
        		arrColour = o.AvailableForExteriorColours;
        		arrUphol = o.AvailableForUpholsteries;
        		available = true;
        		if(arrColour && arrColour.length > 0)
				{
					available = getObject(colour, arrColour)?true:false;
				}
				if(!available)return o.ID;
				if(arrUphol && arrUphol.length > 0)
				{
					available = getObject(upholstery, arrUphol)?true:false;
				}
				if(!available)return o.ID;
        	}
        	return null;
        }

        /**
         * Method which returns an Array of complete upholsterie objects
         * @param aUphol:Array (limitted Array containing only ID and name)
         */
        function getFullUpholsteries(aUpholsteries)
        {
            var aReturn = [],
                i = 0,
                iLength = aUpholsteries.length;
            for(i; i < iLength; i++)
            {
                aReturn.push(getObject(aUpholsteries[i].ID, _aUpholsteries));
            }
            return aReturn;
        }

        /**
         * Function which sets the selected exterior colour id
         * @param wheelID:String guid of the Wheel
         * @param finish:Object the finish equipment object
         * @param cap:Object the cap equipment object
         * @param surround:Object the surround equipment object
         */
        this.setWheels = function(wheelID, finish, cap, surround, update)
        {
            // Set the user interacted boolean
            _bUserInteracted = true;
           	
           	var wheelShouldUpdate = (wheelID != _configuration.WheelID),
           		oldWheelID = _configuration.WheelID,
           		o,
           		oldWheel;
           		
            // Only if the setted wheelID is different from the current wheel!
            if(wheelShouldUpdate)
            {
                 o = getObject(wheelID, _aWheels);
                // Remove the old one from the accessorie list!
                var oOldOptionalWheel = getObject(_configuration.WheelID, _fc.Accessories);
                if(oOldOptionalWheel)
                {
                    // Remove the oOldOptionalWheel!
                    setEquipment(_configuration.Accessories, oOldOptionalWheel, "addAccessory", "removeAccessory", false, _aOptionalAccessories, null, [-1]);
                }
                else
                {
                	oldWheel = getObject(_configuration.WheelID, _aWheels);
                	// Remove the possible includes related to the wheel
                	updateEquipmentDependencies(null, oldWheel.IncludeEquipment, null);
                }

                _configuration.WheelID = wheelID;

                // Update the label
                _configuration.WheelLabel = o.Name;

                // Update the price
                _configuration.WheelPrice = o.PriceInfo;
                
                // Save the wheel object
                _fc.Wheel = o;

                // Check if the wheel id is also an accessory, if so also select it!
                if(o.Type.toLowerCase() === "accessory")
                {
                	// Enrichment of the asset is already done in the setEquipment method
                    setEquipment(_configuration.Accessories, o, "addAccessory", "removeAccessory", false, _aOptionalAccessories, null, [-1]);
                }
                // Include itself so it get's selected in relevant locations
                o.IncludeEquipment.push(o);
                // Exclude the old accessorie if found!
                if(oOldOptionalWheel)
                {
                    o.ExcludeEquipment.push(oOldOptionalWheel);
                }
                if(typeof update == "undefined" || update === true)updateEquipmentDependencies(o, false, null);
                // Remove the last item
                o.IncludeEquipment.pop();
                // Remove the last item
                if(oOldOptionalWheel)
                {
                    o.ExcludeEquipment.pop();
                }
            }
            // Get the previous finish and caps
        	var oldFinish = _extendedWheel.finish,
        		oldCap = _extendedWheel.cap,
        		oldSurround = _extendedWheel.surround,
        		index;
        	// Get the previous finish which is present in the ChildOptions of the Wheel
        	if(oldFinish && (oldCap || oldSurround))
        	{
        		// Old finishes get removed by the wheel selection logic
        		if(!wheelShouldUpdate && (!finish || (finish && (oldFinish.ID != finish.ID))))
        		{
        			
        			index = _getIndex(_configuration.Accessories, oldFinish.ID);
        			if(index === -1) 
        			{
        				index = _getIndex(_configuration.Options, oldFinish.ID);
        				if(index > -1)_fc.Options.splice(index, 1);	
        			}
        			else
        			{
        				_fc.Accessories.splice(index, 1);
        			}
            		_configuration.removeOptions(oldFinish.ID);
            		_configuration.removeAccessory(oldFinish.ID);
        		}
        		// Remove the cap if it differs
        		if(
        			(!cap && !surround && oldCap) || 
        			(cap && oldCap && (oldCap.ID != cap.ID)) ||
        			(oldCap && wheelShouldUpdate)
        			)
        		{
        			index = _getIndex(_configuration.Accessories, oldCap.ID);
        			if(index === -1) 
        			{
        				index = _getIndex(_configuration.Options, oldCap.ID);
        				if(index > -1)_fc.Options.splice(index, 1);	
        			}
        			else
        			{
        				_fc.Accessories.splice(index, 1);
        			}
        			_configuration.removeOptions(oldCap.ID);
        			_configuration.removeAccessory(oldCap.ID);
        		}
        		// Remove the surround if it differs
        		if(
        			(!surround && !cap && oldSurround) || 
        			(surround && oldSurround && (oldSurround.ID != surround.ID)) ||
        			(oldSurround && wheelShouldUpdate)
        			)
        		{
        			index = _getIndex(_configuration.Accessories, oldSurround.ID);
        			if(index === -1) 
        			{
        				index = _getIndex(_configuration.Options, oldSurround.ID);
        				if(index > -1)_fc.Options.splice(index, 1);	
        			}
        			else
        			{
        				_fc.Accessories.splice(index, 1);
        			}
        			_configuration.removeOptions(oldSurround.ID);
        			_configuration.removeAccessory(oldSurround.ID);
        		}
        	}
        	
        	// When the old cap and rings have been removed from the configuration object, check if the wheel updated, if so, remove the oldCap and oldSurround
        	if(wheelShouldUpdate)
        	{
        		oldCap = null;
        		oldSurround = null;
        	}
        	
        	// Update references, and update the colouringMode based on the Finish it's includeEquipment
        	cap = cap?cap:surround?oldCap:null;
        	surround = surround?surround:cap?oldSurround:null;
        	if(finish)
        	{
        		if(cap)
        		{
        			o = getObject(cap.ID, finish.IncludeEquipment);
        			cap.ColouringMode = o.ColouringMode;	
        		}
        		if(surround)
        		{
        			o = getObject(surround.ID, finish.IncludeEquipment);
        			surround.ColouringMode = o.ColouringMode;
        		}
        	}
        	
        	// Save the new finish and cap
        	_extendedWheel.ID = wheelID;
           	_extendedWheel.finish = finish?finish:null;
           	_extendedWheel.cap = cap;
           	_extendedWheel.surround = surround;
        	
            // Set the finish and the cap items on the configuration object
            if(finish && (cap || surround))
            {
            	// Now add the new finish
            	if(finish.Type.toLowerCase() == "option")
            	{
            		index = _getIndex(_configuration.Options, finish.ID);
            		if(index === -1)
            		{
            			_fc.Options.push(finish);
            			_configuration.addOptions(finish.ID, finish.Name, finish.PriceInfo, finish.Category.Root.Code);
            		}
            	}
            	else
            	{
            		index = _getIndex(_configuration.Accessories, finish.ID);
            		if(index === -1)
            		{
            			_fc.Accessories.push(finish);
            			_configuration.addAccessory(finish.ID, finish.Name, finish.PriceInfo, finish.Category.Root.Code);
            		}
            	}
	           	
				// Add the new cap
				if(cap)
				{
	            	if(cap.Type.toLowerCase() == "option")
	            	{
	            		index = _getIndex(_configuration.Options, cap.ID);
	            		if(index === -1)
	            		{
	            			_fc.Options.push(cap);
	            			_configuration.addOptions(cap.ID, cap.Name, cap.PriceInfo, cap.Category.Root.Code);
	            		}
	            	}
	            	else
	            	{
	            		index = _getIndex(_configuration.Accessories, cap.ID);
	            		if(index === -1)
	            		{
			        		_fc.Accessories.push(cap);
			        		_configuration.addAccessory(cap.ID, cap.Name, cap.PriceInfo, cap.Category.Root.Code);
			        	}
	            	}
				}
            	
            	if(surround)
            	{
	            	// Add the new surround
	            	if(surround.Type.toLowerCase() == "option")
	            	{
	            		index = _getIndex(_configuration.Options, surround.ID);
	            		if(index === -1)
	            		{
	            			_fc.Options.push(surround);
	            			_configuration.addOptions(surround.ID, surround.Name, surround.PriceInfo, surround.Category.Root.Code);
	            		}
	            	}
	            	else
	            	{
	            		index = _getIndex(_configuration.Accessories, surround.ID);
	            		if(index === -1)
	            		{
			        		_fc.Accessories.push(surround);
			        		_configuration.addAccessory(surround.ID, surround.Name, surround.PriceInfo, surround.Category.Root.Code);
			        	}
	            	}
	            }
	            
	            // Remove the previous one from the user selected array
                updateUserSelected(oldWheelID, _extendedWheel);
            	
            	// If the wheel ID is the same, still dispatch an update event!
            	if(!wheelShouldUpdate)
            	{
            		// Update the global price
	                updateConfiguration(true);
            	}
            }
            
            // Dispatch an event after all the logic has been applied
            if(wheelShouldUpdate)
            {
            	// Only update default
                if(typeof update === "undefined" || update === true)
                {
                    // Update the global price
                    updateConfiguration(true);
                }

                // Do the callback on the wheels with the array with the updated price value paires
                var cpd = calculatePriceDifference(_aWheels, wheelID);
                
                _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.UPDATE_WHEEL_PRICES, cpd));
            }
        };

        /**
         * Function which set's  the upholstry id
         * @param guid:String
         */
        this.setUpholstery = function(guid)
        {
            // Set the user interacted boolean
            _bUserInteracted = true;

            // Remove the previous one from the user selected array
            updateUserSelected(_configuration.UpholsteryID, getObject(guid, _aUpholsteries));

            // Update the upholstery
            updateUpholstery(guid, true);
        };

        /**
         * Method which internally set's the upholstery, for user selection purposes this method is required since in the setColour method the upholsteries can be set to
         * @param guid
         */
        function updateUpholstery(guid, updateConf)
        {
            var o = getObject(guid, _aUpholsteries);
            _configuration.UpholsteryID = guid;
            // Update the available assets
            updateAvailables();
            
            // Save the selected color in the full configuration object
            _fc.Upholstery = o;

            // Update the label
            _configuration.UpholstryLabel = _fc.Upholstery.Name;

            // Update the price
            _configuration.UpholstryPrice = _fc.Upholstery.PriceInfo;
			
            // Execute the callback containing the array with the updated price value paires
            var cpd = calculatePriceDifference(_aUpholsteries, guid);
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.UPDATE_UPHOLSTERY_PRICES, cpd));
			
            // Calculate price!
            if(updateConf)
            {
            	// Check for pack availability!
	            var incompatiblePack = getIncompatiblePack(_configuration.ExteriorColourID, _configuration.UpholsteryID);
	            if(incompatiblePack)
	            {
	            	// Disable the pack!
					_instance.setPack(incompatiblePack);	
	            }
            	else
            	{
            		updateConfiguration(true);
            	}
            }
        }

        /**
         * Function which set's the inlays
         * @param guid:String
         */
        this.setInlay = function(guid)
        {
            // Set the user interacted boolean
            _bUserInteracted = true;
            var oldGuid = _configuration.InlayID;
            updateInlay(guid);

            // Remove the previous one from the user selected array
            updateUserSelected(oldGuid, getObject(guid, _aInlays));
			
            // Calculate price!
            updateConfiguration(true);
        };

        function updateInlay(guid)
        {
            _configuration.InlayID = guid;

            // If it's an empty guid, return!
            if(guid == "00000000-0000-0000-0000-000000000000")
            {
                // Update the label
                _configuration.InlayLabel = "";
                // Update the price
                _configuration.InlayPrice = 0;
                // Update the complete object
                _fc.Inlay = null;
                return;
            }
            
            var o = getObject(guid, _aInlays);
            // Save the selected color in the full configuration object
            _fc.Inlay = o;

            // Update the label
            _configuration.InlayLabel = o.Name;

            // Update the price
            _configuration.InlayPrice = o.PriceInfo;

            // Update the price differences
            var cpd = calculatePriceDifference(_aInlays, guid);
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.UPDATE_INLAY_PRICES, cpd));
        }

        /**
         * Method to add an equipment id to the configuration object
         * @param guid:String
         */
        this.setOption = function(guid, includes)
        {
            // Set the user interacted boolean
            _bUserInteracted = true;
            var o = getObject(guid, _aOptionalEquipment);

            // Check if the includes is present, if not make it so it contains one element. This is necessary to keep the reference to the Array in subfunctions
            if(typeof includes == "undefined")
            {
                includes = [-1];
            }
            // Update the configuration object en spinplayer
            var aRemove = setEquipment(_configuration.Options, o, "addOptions", "removeOptions", true, _aOptionalEquipment, "setOption", includes);
            // Only applicable if Include conflicts are found, the item is selected though
            if(aRemove == -1)
            {
                return;
            }
            updateEquipmentDependencies(o, aRemove, includes[0] == -1?null:includes);
            // Update the global price
            updateConfiguration(true);
        };

        /**
         * Method to add an accessory to the configuration object
         * @param guid:String of the Accessorie to select
         * @param includes:Array Array of include elements which should be selected together with the Accessorie. This should be filled in with user selected includes (if more are available and one of the many should be chosen)

         * returns: Boolean indicating if the item has been added (true) or removed (false)
         */
        this.setAccessory = function(guid, includes)
        {
            // Set the user interacted boolean
            _bUserInteracted = true;
            var o = getObject(guid, _aOptionalAccessories);
            var cpd;
            // Is it a wheel?
            var bWheel = (o.Path.indexOf("exterior/wheels") != -1);
            // Check if the includes is present, if not make it so it contains one element. This is necessary to keep the reference to the Array in subfunctions
            if(typeof includes == "undefined")
            {
                includes = [-1];
            }
            // Update the configuration object and spinplayer		
            var aRemove = setEquipment(_configuration.Accessories, o, "addAccessory", "removeAccessory", false, _aOptionalAccessories, "setAccessory", includes);
            // Only applicable if Include conflicts are found, the item is selected though
            if(aRemove == -1)
            {
                return;
            }
            if(!aRemove)
            {
                // Update the controls with the relevant includes/excludes when applicable
                updateEquipmentDependencies(o, false,  includes[0] == -1?null:includes);

                // If it is a wheel, check if the wheel is also available in the aWheels array
                if(bWheel)
                {
                    // Set the id on the wheelID
                    _configuration.WheelID = o.ID;
                    _configuration.WheelLabel = o.Name;
                    _configuration.WheelPrice = o.PriceInfo;
                    
                    _fc.Wheel = o;

                    // Do the callback on the wheels with the array with the updated price value paires
                    cpd = calculatePriceDifference(_aWheels, _configuration.WheelID);
                    _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.UPDATE_WHEEL_PRICES, cpd));
                }
            }
            else
            {
                // If the user deselected the wheel, set the default wheel which is always the first wheel in the array aWheels
                if(bWheel)
                {
                    var g = _aWheels[0];
                    // Set the wheel id back to default
                    _configuration.WheelID = g.ID;
                    _configuration.WheelLabel = g.Name;
                    _configuration.WheelPrice = g.PriceInfo;
                    
                    _fc.Wheel = g;

                    // Do the callback on the wheels with the array with the updated price value paires
                    cpd = calculatePriceDifference(_aWheels, _configuration.WheelID);
                    _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.UPDATE_WHEEL_PRICES, cpd));
                }
                // Update the controls with the relevant includes/excludes when applicable
                updateEquipmentDependencies(o, aRemove, null);
            }

            // Update the global price
            updateConfiguration(true);
        };

        /**
         * Method which supplies the corrsponding controls with the information to select/deselect dependend options/accessories based on includes/excludes
         * @param o:Object containing all relevant properties
         * @param aRemove:Array of items which should be removed from the configuration
         * @param aIncludes:Array of items which should be included in the rendering process
         */
        function updateEquipmentDependencies(o, aRemove, aIncludes)
        {
            var isWheel = (o && (o.Path.indexOf('exterior/wheels') != -1))?true:false;
            // When not reselecting the includes, just deselect excludes and select includes respectively
            if(!aRemove)
            {
                // Now loop through the excludes!
                enrichEquipmentArrays(o.ExcludeEquipment, isWheel, false);
                // If the includes array is defined, use it, else use the o.IncludeEquipment
                aIncludes = aIncludes?aIncludes:o.IncludeEquipment;
                // Now loop through the includes!
                enrichEquipmentArrays(aIncludes, isWheel, true);
            }
            // Else deselect the includes
            else
            {
                // Now loop through the elements which are eligable for removal!
                enrichEquipmentArrays(aRemove, isWheel, false);
            }
        }

        /**
         * Method which populates the includes excludes relevant arrays
         * @param aDependency:Array
         * @param isWheel:Boolean if this item is a wheel don't default the wheel
         * @param bAdd:Boolean which indicates wheter to add or remove from the configuration object
         *
         * @returns wheel:String if the aDependency excludes a not-default wheel make sure to select the default one
         */
        function enrichEquipmentArrays(aDependency, isWheel, bAdd)
        {
            var i,
            	iLength = aDependency.length,

            	t,
            	tLength,

            	type,
            	id,
            	o,
            	us,
            
            	options = (bAdd?_aOptionalEquipment:_fc.Options),
            	accessories = (bAdd?_aOptionalAccessories:_fc.Accessories),
            	wheels = _aWheels;
            for(i = 0; i < iLength; i++)
            {
                id = aDependency[i].ID;
                o = null;
                // Exclude is present in the optional options?
                if(options)
                {
	                tLength = options.length;
	                for(t = 0; t < tLength; t++)
	                {
	                    o = options[t];
	                    if(id == o.ID)
	                    {
	                        // Get the type; EXT/INT
	                        type = o.Category.Root.Code;
	
	                        // Adjust the configuration object
	                        if(bAdd)
	                        {
	                        	if(!getObject(o.ID, _fc.Options))_fc.Options.push(o);
	                            _configuration.addOptions(id, o.Name, o.PriceInfo, type);
	                        }
	                        else
	                        {
	                        	_fc.Options.splice(_getIndex(_configuration.Options, o.ID), 1);
	                            _configuration.removeOptions(id);
	                            // Also remove the option from the user selected array if it exists!
	                            us = getObject(id, _aUserSelected);
	                            if(us)
	                            {
		                            _aUserSelected.splice(_getIndex(_aUserSelected, us), 1);
	                            }
	                        }
	                        break;
	                    }
	                    o = null;
	                }
	            }
                // Exclude is present in the accessories options?
                if(accessories && !o)
                {
	                tLength = accessories.length;
	                for(t = 0; t < tLength; t++)
	                {
	                    o = accessories[t];
	                    if(id == o.ID)
	                    {
	                        // Adjust the configuration object
	                        if(bAdd)
	                        {
	                        	if(!getObject(o.ID, _fc.Accessories))_fc.Accessories.push(o);
	                            _configuration.addAccessory(id, o.Name, o.PriceInfo);
	                        }
	                        else
	                        {
	                        	_fc.Accessories.splice(_getIndex(_configuration.Accessories, o.ID), 1);
	                            _configuration.removeAccessory(id);
	                            // Also remove the accessory from the user selected array if it exists!
	                            us = getObject(id, _aUserSelected);
	                            if(us)
	                            {
		                            _aUserSelected.splice(_getIndex(_aUserSelected, us), 1);
	                            }
	                        }
	                        break;
	                    }
	                    o = null;
	                }
	            }
                // Exclude is present in the wheels?
                if(!isWheel && wheels && !o)
                {
                    tLength = wheels.length;
                    for(t = 0; t < tLength; t++)
                    {
                        o = wheels[t];
                        if(id == o.ID)
                        {
                            if(bAdd)
                            {
                                // Add the wheel which is included in the equipment item
                                selectWheel(o);
                                break;
                            }
                            else
                            {
                            	us = wheels[0];
                            	if((wheels[0].ID === o.ID) && wheels.length > 0)us = wheels[1];
                            	selectWheel(us);
                                break;
                            }
                        }
                    }
                }
            }
			
            // Garbage collect variables
            us = null;
            aDependency = null;
        }
        
        /**
         * Method which selects a wheel based on the givin wheel object also taking into account extended aygo wheels 
         */
        function selectWheel(wheel, finish, cap, surround)
        {
			finish = finish?finish:null;
			cap = cap?cap:null;
			surround = surround?surround:null;
			var	o,
				i,
				iL,
				equipment = _fc.Options.concat(_fc.Accessories),
				arr;
			// Check if the wheel is an extended Aygo wheel
			if(wheel.ChildOptions.length > 0)
			{
				if(!finish)finish = wheel.ChildOptions[0];
				// Get the first item which is a cap
				arr = finish.IncludeEquipment;
				iL = arr.length;
				for(i = 0; i < iL; i++)
				{
					o = getObject(finish.IncludeEquipment[i].ID, _aWheelEquipment);
					if(o.Path.indexOf("cap surrounds") > -1)
					{
						if(!surround)
						{
							surround = o;
							surround.ColouringMode = finish.IncludeEquipment[i].ColouringMode;
						}
					}
					else
					{
						if(!cap)
						{
							cap = o;
							cap.ColouringMode = finish.IncludeEquipment[i].ColouringMode;
						}
					}
					o = null;
					if(cap && surround)break;
				}
			}
			_instance.setWheels(wheel.ID, finish, cap, surround, false);
        }

        /**
         * Method which updates the equipment dependencies, _aAvailables
         */
        function updateAvailables()
        {
            var aAdjusted = getAvailableAdjustment();
            var aInlays = aAdjusted[0];
            var aOptions = aAdjusted[1];
            var aAccessories = aAdjusted[2];
            aAdjusted = null;

            // Update the options!
            if(aOptions)
            {
                _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.RENDER_OPTIONS, [aOptions, _configuration.Options]));
            }

            // Update the inlays
            if(aInlays)
            {
                _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.RENDER_INLAYS, [aInlays, _configuration.InlayID]));
            }

            // Update the accessories
            if(aAccessories)
            {
                _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.RENDER_ACCESSORIES, [aAccessories, _configuration.Accessories]));
            }
            // Clean up!
            aAccessories = aOptions = aInlays = null;
        }

        /**
         * Method which calculates the items which should be removed and returns them
         */
        function getAvailableAdjustment()
        {
            var i = 0;
            var iLength = _aAvailables.length;
            var o;
            var colour;
            var uphol;
            // Arrays which will get populated if adjustments need to be made
            var aOptions = [],
                aAccessories = [],
                aInlays = [];
            // Loop through all the equipment items which have specific availability for exterior colour and upholstery
            for(i; i < iLength; i++)
            {
                o = _aAvailables[i];

                // Check the colours
                if(o.AvailableForExteriorColours && o.AvailableForExteriorColours.length > 0)
                {
                    colour = getObject(_configuration.ExteriorColourID, o.AvailableForExteriorColours);
                    // If the colour is not found, do stuff
                    colour = colour?0:-1;
                }
                else
                {
                    colour = -1;
                }

                // Check the upholsteries
                if(o.AvailableForCarUpholsteries && o.AvailableForCarUpholsteries.length > 0)
                {
                    uphol = getObject(_configuration.UpholsteryID, o.AvailableForCarUpholsteries);
                    // If the upholstery is not found, do stuff
                    uphol = uphol?0:-1;
                }
                else
                {
                    uphol = -1;
                }

                // Logic which creates an Array of the options/accessories which have availables should be removed
                if(uphol == -1 && colour == -1)
                {
                    // Check the type of the object
                    // If it's an Inlay, first check for inlays since inlays are also accessories!
                    if(o.Path == "interior/inlays")
                    {
                        // Inlays is a special case so we need to treat it differently
                        aInlays.push(o);
                    }
                    // If it's an Option, update the option array!
                    else if(o.Type.toLowerCase() == "option")
                    {
                        // Push the option
                        if(!o.Standard)
                        {
                            // push it to the option array
                            aOptions.push(o);
                            // Also remove the option from the configuration, if it exists!
                            if(_configuration.hasOption(o.ID))
                            {
                                // Update the configuration object en spinplayer
                                removeEquipment(setEquipment(_configuration.Options, o, "addOptions", "removeOptions", true, _aOptionalEquipment, "setOption", null, false), "removeOptions");
                            }
                        }
                    }
                    // If it's an Accessory
                    else if(o.Type.toLowerCase() == "accessory")
                    {
                        // Add the accessory
                        if(!o.Standard)
                        {
                            aAccessories.push(o);
                            // Also remove the accessory from the configuration, if it exists!
                            if(_configuration.hasAccessory(o.ID))
                            {
                                // Update the configuration object en spinplayer
                                removeEquipment(setEquipment(_configuration.Accessories, o, "addAccessory", "removeAccessory", false, _aOptionalAccessories, "setAccessory", null, false), "removeAccessory");
                            }
                        }
                    }
                }

                // Reset
                colour = uphol = null;
            }

            if(_hasOptionalAvailables.options)
            {
                // Enrich array of the aOptions
                aOptions = createAvailableReturn(aOptions, _aOptionalEquipment);
            }
            else
            {
                aOptions = null;
            }
            // Check if the current selected inlay is available for the new range of selectable inlays
            if(_hasOptionalAvailables.inlays)
            {
                var aReturn = createAvailableReturn(aInlays, _aInlays);
                if(getObject(_configuration.InlayID, aInlays))
                {
                    // Pick first available inlay for the item!
                    o = aReturn[0];
                    // Update configuration and spinplayer!
                    if(o)
                    {
                        updateInlay(o.ID);
                    }
                    else
                    {
                        updateInlay("00000000-0000-0000-0000-000000000000");
                    }
                }
                aInlays = aReturn;
            }
            else
            {
                aInlays = null;
            }
            if(_hasOptionalAvailables.accessories)
            {
                // Enrich the aAccessories
                aAccessories = createAvailableReturn(aAccessories, _aOptionalAccessories);
            }
            else
            {
                aAccessories = null;
            }
            return [aInlays, aOptions, aAccessories];
        }

        /**
         * Helper method for the updateAvailables which returns an Array which reflects the items which should be visualized
         * @param aRemove:Array array of items to be removed from the UI
         * @param aBase:Array global array containing the items
         */
        function createAvailableReturn(aRemove, aBase)
        {
            // Check the inlays
            var aReturn = aBase;
            // If options are found which should be excluded, render it!
            if(aRemove.length > 0)
            {
                var iLength = aBase.length,
                    i = 0,
                    o = null;
                aReturn = [];
                for(i; i < iLength; i++)
                {
                    o = aBase[i];
                    // If the element is not found, it means it should stay!
                    if(!getObject(o.ID, aRemove))
                    {
                        aReturn.push(o);
                    }
                    o = null;
                }
            }
            return aReturn;
        }

        /**
         * Method which updates the userselected array used to revert the selection
         * @param oldID:Guid
         * @param newO:Object containing the ID
         */
        function updateUserSelected(oldID, newO)
        {
        	var o = getObject(oldID, _aUserSelected);
        	if(o)
        	{
	            var index = _getIndex(_aUserSelected, o);
	            _aUserSelected.splice(index, 1);
	        }
            // Add the next item to the user selected array
            _aUserSelected.push(newO);
        }

        /**
         * Helper method for the updateAvailabels which removes the objects in the aRemove array from the configuration
         * @param aRemove:Array array of objects which should be removed from the aConfSource
         * @param sRemoveMethod:String string of the remove method being removeOptions or removeAccessory
         */
        function removeEquipment(aRemove, sRemoveMethod)
        {
            var i = 0;
            var iLength = aRemove.length;
            for(i; i < iLength; i++)
            {
                _configuration[sRemoveMethod](aRemove[i].ID);
            }
            aRemove = null;
        }

        /**
         * Method to add a pack id to the configuration object
         * @param guid:String of the selected pack
         * @param config:Object containing twor properties: options (array) and accessories (array)
         */
        this.setPack = function(guid, config)
        {
        	// TODO Implement selected pack equipment
            // Set the user interacted boolean
            _bUserInteracted = true;

            // First check if the pack is present in the Packs array
            var index = _getIndex(_configuration.Packs, guid),
            	bExists = (index > -1);
            
            // Set the first configuration with the old packs
            var config1 = copyConfiguration(false);
			// Copy the configuration into a new object
            var config2 = copyConfiguration(false);
            
            // If it doesn't exist yet, add it in the newly compare method
            if(!bExists)
            {
                // Add the pack to the configuration
                config2.Packs.push(guid);
                // Add the selected equipment items
                if(config)
                {
                	addPackEquipment(config.options, config2.Options, false);
                	addPackEquipment(config.accessories, config2.Accessories, false);
               	}
            }
            // Else remove it in the newly compare method
            else
            {
                // Remove the packs!
                config2.Packs.splice(index, 1);
                // Remove the selected equipment items
                if(config)
                {
                	addPackEquipment(config.options, config2.Options, true);
                	addPackEquipment(config.accessories, config2.Accessories, true);	
                }
            }
			
			_dispatchConflict = false;
            // Do the compatibility check
            compatibilityCheck(config1, config2);
        };
        
        /**
         * Method which adds the pack-equipment items to their corresponding Arrays 
         */
        this.setPackEquipment = function(guid, oldConfig, newConfig)
        {
        	// First check if the pack is present in the Packs array
            var index = _getIndex(_configuration.Packs, guid),
            	bExists = (index > -1);
            // If the pack is not selected yet, return
            if(!bExists)return;
            
        	// Set the first configuration with the old packs
            var config1 = copyConfiguration(false);
			// Copy the configuration into a new object
            var config2 = copyConfiguration(false);
            
        	// Remove the accessories and options from the oldConfig
        	addPackEquipment(oldConfig.options, config2.Options, true);
            addPackEquipment(oldConfig.accessories, config2.Accessories, true);
            	
        	// Add the accessories and options from the newConfig
        	addPackEquipment(newConfig.options, config2.Options, false);
            addPackEquipment(newConfig.accessories, config2.Accessories, false);
            
            _dispatchConflict = false;
            // Do the compatibility check
        	compatibilityCheck(config1, config2);
        };
        
        /**
         * Helper method which adds the selected pack equipment items to the configuration object 
         * @param arr:Array of objects which need to be added/removed to the configSrc
         * @param configSrc:Array source array reference to config.Accessories or config.Options
         * @param bRemove:Boolean indicating whether elements from within arr need to be added or removed to the configSrc
         */
        function addPackEquipment(arr, configSrc, bRemove)
        {
        	var i = 0,
        		iL = arr.length,
        		index,
        		o;
        	for(; i < iL; i++)
        	{
        		o = arr[i];
        		if(bRemove)
        		{
        			index = _getIndex(configSrc, o.ID);
        			if(index > -1)configSrc.splice(index, 1);
        		}
        		else
        		{
        			index = _getIndex(configSrc, o.ID);
        			if(index === -1)configSrc.push(o.ID);
        		}
        		// Only add include equipment if the object has no parent option
        		if(o.IncludeEquipment && o.IncludeEquipment.length > 0 && !o.ParentOption)
    			{
    				// Also check if none of the other items in the array are colour dependent and are referenced inside this object include equipment
    				addPackEquipment(o.IncludeEquipment, configSrc, bRemove);
    			}
        	}
        }

        /**
         * Method used for debugging, returns the webservice instance
         */
        this.getWebservice = function()
        {
            return _ws;
        };

        /**
         * Method used to get the BodyTypeID from the configuration object
         */
        this.getBodyTypeID = function()
        {
            return _configuration.BodyTypeID;
        };

        /**
         * Method used to get the EngineID from the configuration object
         */
        this.getEngineID = function()
        {
            return _configuration.EngineID;
        };

        /**
         * Method used to get the WheelDriveID from the configuration object
         */
        this.getWheelDriveID = function()
        {
            return _configuration.WheelDriveID;
        };

        /**
         * Method used to get the TransmissionID from the configuration object
         */
        this.getTransmissionID = function()
        {
            return _configuration.TransmissionID;
        };

        /**
         * Method used to get the EngineTypeID from the configuration object
         */
        this.getFuelTypeID = function()
        {
            return _configuration.FuelTypeID;
        };

        /**
         * Method used to get the GradeID from the configuration object
         */
        this.getGradeID = function()
        {
            return _configuration.GradeID;
        };
        
        /**
         * Method which returns if there are prices available 
         */
        this.hasPrice = function()
        {
        	return _hasPrices;
        };

        /**
         * Method used to format the price
         * @param price:Number,
         * @param bIncludeCurrencySymbol
         * @param convert:Boolean
         */
        this.formatPrice = function(price, bIncludeCurrencySymbol, convert)
        {
            // Cast to number
            price = Number(price);

            // If convert is true, convert it to the second currency
            if(convert)
            {
                price *= Number(_settings.secondconversionrate);
            }

            // If it's a negative value, make it positive!
            var bNegative = false;
            if(price < 0)
            {
                bNegative = true;
                price = -price;
            }

            var sPrice = "";
            var currencysymbol = convert?_settings.secondCurrencySymbol:_settings.currencySymbol;
            var currencysymbolposition = convert?_settings.secondCurrencySymbolposition:_settings.currencySymbolPosition;
            var digitgroupingsymbol = convert?_settings.secondDigitGroupingSymbol:_settings.digitGroupingSymbol;
            var decimalsymbol = convert?_settings.secondDecimalSymbol:_settings.decimalSymbol;
            var numberofdecimals = Number((convert?_settings.secondNumberOfDecimals:_settings.numberOfDecimals));

            // Define the amount of displayed decimals
            var nOmega = Math.pow(10,numberofdecimals);
            sPrice = "" + Math.round(nOmega * price) / nOmega;
            // Get the numbers behind the comma
            var sAmountComma = "";
            if(sPrice.search(/[.]/) != -1)
            {
                sAmountComma = sPrice.replace(/\d*[.]/g,"");
            }
            // Make sure the numbers behind the comma are equal to the actual requested numbers even if it is 0
            while(sAmountComma.length < numberofdecimals)
            {
                sAmountComma += "0";
            }

            // Normal amount without values behind the comma
            var sNaturalAmount = "" + Math.floor(price);
            var sReverse = sNaturalAmount.split("").reverse().join("");
            // Now format the grouping symbol
            var sReverseOutput = sReverse.replace(/([0-9]{3})/g, "$1" + digitgroupingsymbol);
            // Reverse the string again
            var sOutput = sReverseOutput.split("").reverse().join("");
            // Make sure the string doesn't start with the groupingsymbol
            if(sOutput.substr(0,1) == digitgroupingsymbol)
            {
                sOutput = sOutput.substr(1);
            }
            // Only add a decimalsymbol if there are actually decimals present
            var complete;
            if(numberofdecimals <= 0)
            {
                complete = sOutput;
            }
            else
            {
                complete = sOutput + decimalsymbol + sAmountComma;
            }

            // Check if it was negative!
            if(bNegative)
            {
                complete = "-" + complete;
            }

            // Include the currencysymbol
            if(bIncludeCurrencySymbol)
            {
                if(currencysymbolposition == "RIGHT")
                {
                    complete = complete + currencysymbol;
                }
                else
                {
                    complete = currencysymbol + complete;
                }
            }

            return complete;
        };
        
        /**
         * Method which parses the full configuration 
         */
        function parseFullConfiguration(fc)
        {
        	_configuration.ModelID = fc.Model.ID;
			_configuration.SubModelID = fc.Submodel?fc.Submodel.ID:"00000000-0000-0000-0000-000000000000";
			_configuration.CarID = fc.Car.ID;
			_configuration.BodyTypeID = fc.Body.ID;
			_configuration.EngineID = fc.Motorization.Engine.ID;
			_configuration.FuelTypeID = fc.Motorization.Engine.Type.ID;
			_configuration.TransmissionID = fc.Motorization.Transmission.ID;
			_configuration.WheelDriveID = fc.Motorization.Wheeldrive.ID;
			_configuration.GradeID = fc.Grade.ID;
			_configuration.ExteriorColourID = fc.ExteriorColour.ID;
			_configuration.UpholsteryID = fc.Upholstery.ID;
			_configuration.Options = fc.Options.map(
				function(item)
				{
					return item.ID;
				}
			);
			_configuration.WheelID = fc.Wheel.ID;
			_configuration.Packs = fc.Packs.map(
				function(item)
				{
					return item.ID;
				}
			);
			_configuration.Accessories = fc.Accessories.map(
				function(item)
				{
					return item.ID;
				}
			);
			_configuration.InlayID = fc.Inlay?fc.Inlay.ID:"00000000-0000-0000-0000-000000000000";
        }

        /**
         * Parses the initial configuration
         */
        function parseConfiguration(config)
        {
            var sProp,
            	sCopyProp;
            for(sProp in _configuration)
            {
                for(sCopyProp in config)
                {
                    if(sProp.toLowerCase() == sCopyProp.toLowerCase())
                    {
                        // Check if it is empty!
                        if(config[sCopyProp])
                        {
                            // If it's an Object, copy all entries
                            if(typeof _configuration[sProp] == "object")
                            {
                                // check if it is an Array!
                                if(Object.prototype.toString.apply(_configuration[sProp]) === "[object Array]")
                                {
                                    _configuration[sProp] = config[sCopyProp].concat();
                                }
                                else
                                {
                                    _configuration[sProp] = config[sCopyProp];
                                }
                            }
                            else
                            {
                                _configuration[sProp] = config[sCopyProp];
                            }
                            break;
                        }
                    }
                }
            }
            sProp = null;
            sCopyProp = null;
        }

        //----------------------------------
        //  Private methods
        //----------------------------------

        /**
         * Method which is used to add an accessory or an option
         * @param guid:String
         * @param confSource:Array
         * @param o:Object
         * @param add:String configuration specific add method
         * @param remove:String configuration specific remove method
         * @param hasType:Boolean to indicate whether it's an equipment (ext/int) or an accessory (which has no type)
         * @param aOptional:Array which contains the optional assets (_aOptionalAccessories/_aOptionalEquipment)
         * @param sMethodName:String the original method name being setOption or setAccessory
         * @param aIncludes:Array the Array of the selected includes which should be rendered on the spinplayer together with the actual object
         *
         * Returns: *-1 if conflict items are found (so elements in the o.IncludeEquipment Array which exclude eachother)
         *          *null if the item should be added
         *          *Array containing elements which should also be removed when the item should be removed (= deselected), used in the updateEquipmentDependencies method
         */
        function setEquipment(confSource, o, add, remove, hasType, aOptional, sMethodName, aIncludes)
        {
            // Determine whether to add or remove the guid!
            var aPostElements = null;
            var i;
            var iLength = confSource.length;
            var tLength;
            var t;
            var omega;
            for(i = 0; i < iLength; i++)
            {
                // If it already exists in the array, remove it
                if(o.ID == confSource[i])
                {
                    aPostElements = [];
                    break;
                }
            }

            // If the asset should be added...
            if(!aPostElements)
            {
                /**
                 * First check if there are no includes present which exclude eachother, for the wheels the method name is not given since this is not relevant to it!
                 * Also make sure that the includes is not present, else skip this step!
                 */
                if(sMethodName && (aIncludes && aIncludes.length > 0 && aIncludes[0] == -1))
                {
                    var aConflicts = checkDuplexIncludes(o, aOptional);
                    if(aConflicts[0].length > 0)
                    {
                        // Get the user selected items which are present in the conflicts array, first element is an Array of user selected Include object conflicts, second element is the cleaned out aConflicts Array
                        var aCheck = checkUserIncludes(aConflicts.concat(), confSource);
                        var aUserSelectedIncludes = aCheck[0];
                        var aCleanedConflicts = aCheck[1];
                        aCheck = null;

                        // Loop through the objects include Array and enrich the aUserSelectedIncludes with the non-conflict includes
                        iLength = o.IncludeEquipment.length;
                        tLength = aConflicts.length;
                        for(i = 0; i < iLength; i++)
                        {
                            // Loop through all the Arrays in teh aConflicts
                            for(t = 0; t < tLength; t++)
                            {
                                omega = getObject(o.IncludeEquipment[i].ID, aConflicts[t]);
                                if(omega)
                                {
                                    break;
                                }
                            }
                            if(!omega)
                            {
                                aUserSelectedIncludes.push(o.IncludeEquipment[i]);
                            }
                            omega = null;
                        }
                        // Check if there are still conflict IncludeEquipment left when we remove the userSelected
                        if(aCleanedConflicts[0].length > 0)
                        {
                            // Make the return object, the selected Object, the method name (setAccessory, setEquipment), the conflicts array without the user selected conflicts, the rest of the includes
                            o = [o, sMethodName, aCleanedConflicts, aUserSelectedIncludes];
                            // Do the callback to the flash regarding notifying include options
                            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.SHOW_INCLUDE_OPTIONS, o));
                            return -1;
                        }
                        // Else update the aIncludes array with the items from the aUserSelectedIncludes and the items which do not conflict
                        // Clean out the aIncludes Array (only contains one element being "-1")
                        aIncludes.splice(0,1);
                        // Now fill  the array with elements from the aUserSelectedIncludes Array
                        iLength = aUserSelectedIncludes.length;
                        for(i = 0; i < iLength; i++)
                        {
                            aIncludes.push(aUserSelectedIncludes[i]);
                        }
                    }
                }
                /**
                 * If no popup should be shown, render it on the car!
                 */
                // Add the guid including the label and the price!
                if(hasType)
                {
                    _configuration[add](o.ID, o.Name, o.PriceInfo, o.Category.Code.substring(0,3));
                }
                else
                {
                    _configuration[add](o.ID, o.Name, o.PriceInfo);
                }
                // Add the object to the fullconfiguration object
                if(add == "addAccessory")
                {
                	if(!getObject(o.ID, _fc.Accessories))_fc.Accessories.push(o);
                }
                else
                {
                	if(!getObject(o.ID, _fc.Options))_fc.Options.push(o);
                }
                // Add the user selected element to the array
                if(!getObject(o.ID, _aUserSelected))_aUserSelected.push(o);
            }
            // If the item should be removed
            else
            {
                // Remove the equipment
                aPostElements = removeConfigurationEquipment(o, remove, confSource);
            }
            // Post elements is an Array which contains out of elements which should be de-selected in the ui and removed from the configuration object
            return aPostElements;
        }

        /**
         * Method which removes the equipment and returns an array of elements which should be removed
         */
        function removeConfigurationEquipment(o, remove, confSource)
        {
        	var iLength,
                tLength,
                i,
                t,
                k,
                kLength,
                omega,
                g,
                us,
                aPostElements = [];

            // Remove the includes from the configuration which have not been user selected!
            iLength = o.IncludeEquipment.length;
            // Array containing the includes of the user selected items
            var aUserSelectedIncludes = [];
            for(i = 0; i < iLength; i++)
            {
                // Get the correct object!
                omega = _aOptionalEquipment?getObject(o.IncludeEquipment[i].ID, _aOptionalEquipment):null;
                if(!omega)
                {
                    omega = _aOptionalAccessories?getObject(o.IncludeEquipment[i].ID, _aOptionalAccessories):null;
                }
                if(omega)
                {
                    tLength = _aUserSelected.length;
                    for(t = 0; t < tLength; t++)
                    {
                        if(omega.ID == _aUserSelected[t].ID)
                        {
                            // Add all elements to the Array
                            aUserSelectedIncludes = aUserSelectedIncludes.concat(omega.IncludeEquipment);
                            t = -1;
                            break;
                        }
                    }
                    // If the element has not been found in the userselected array
                    if(t > -1)
                    {
                        // Check if the element isn't included in another equipment item currently selected
                        // Check the options
                        tLength = _fc.Options.length;
                        for(t = 0; t < tLength; t++)
                        {
                            // Do not include the current being itterated item, and check if the item to be checked is not included in the include array of current being removed item
                            if(o.ID != _configuration.Options[t] && !getObject(_configuration.Options[t], o.IncludeEquipment))
                            {
                                g = _fc.Options[t];
                                // Check the includes of the array that it does not match the item which is going to be removed here!
                                kLength = g.IncludeEquipment.length;
                                for(k = 0; k < kLength; k++)
                                {
                                    // If the include item is found in another equipment item's includeequipment array, do not remove it!
                                    if(g.IncludeEquipment[k].ID == omega.ID)
                                    {
                                        // Check if the item "g" includes the object being removed to, if so remove, if not do not remove!
                                        if(!getObject(o.ID, g.IncludeEquipment))
                                        {
                                            t = -1;
                                            break;
                                        }
                                    }
                                }
                            }
                            // If t is minus one, do not remove it!
                            if(t == -1)break;
                        }

                        // Check the accessories, only if it has not been found in the exterior options
                        if(t > -1)
                        {
                            tLength = _fc.Accessories.length;
                            for(t = 0; t < tLength; t++)
                            {
                                // Do not include the current being itterated item, and check if the item to be checked is not included in the include array of current being removed item
                                if(o.ID != _configuration.Accessories[t] && !getObject(_configuration.Accessories[t], o.IncludeEquipment))
                                {
                                    g = _fc.Accessories[t];
                                    // Check the includes of the array that it does not match the item which is going to be removed here!
                                    kLength = g.IncludeEquipment.length;
                                    for(k = 0; k < kLength; k++)
                                    {
                                        // If the include item is found in another equipment item's includeequipment array, do not remove it!
                                        if(g.IncludeEquipment[k].ID == omega.ID)
                                        {
                                            // Check if the item "g" includes the object being removed to, if so remove, if not do not remove!
                                            if(!getObject(o.ID, g.IncludeEquipment))
                                            {
                                                t = -1;
                                                break;
                                            }
                                        }
                                    }
                                }
                                // If t is minus one, do not remove it!
                                if(t == -1)break;
                            }
                        }

                        // add it to the remove array
                        if(t > -1) aPostElements.push(omega);
                    }
                }
                else
                {
                	// Check if the item which is present in the includes and should be re-added is a wheel
                	omega = _aWheels?getObject(o.IncludeEquipment[i].ID, _aWheels):null;
                	if(omega)aPostElements.push(omega);
                }
            }
            // Check if the postElementsArray contains no elements which are also present in the aUserSelectedIncludes Array
            tLength = aUserSelectedIncludes.length;
            for(i = 0; i < aPostElements.length; i++)
            {
                for(t = 0; t < tLength; t++)
                {
                    if(aPostElements[i].ID == aUserSelectedIncludes[t].ID)
                    {
                        aPostElements.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }

            // Check if other accessories should also be removed if they include this accessory, do this recursively
            removeIncludes(o, _fc.Accessories, _aOptionalAccessories, aPostElements);
            removeIncludes(o, _fc.Options, _aOptionalEquipment, aPostElements);

            // Remove the user selected element from the array, excludes are removed inside the updateEquipmentDependencies function
            us = getObject(o.ID, _aUserSelected);
            if(us)_aUserSelected.splice(_getIndex(_aUserSelected, us), 1);

            // Remove the item from the fullconfiguration object to
            if(remove == "removeAccessory")
            {
            	_fc.Accessories.splice(_getIndex(_configuration.Accessories, o.ID), 1);
            }
            else
            {
            	_fc.Options.splice(_getIndex(_configuration.Options, o.ID), 1);
            }
            // Remove the guid; including the label and the price!
            _configuration[remove](o.ID);
            
            // Return the excludes
            return aPostElements;
        }

        /**
         * Method which recursively removes included equipment
         */
        function removeIncludes(o, confSource, aOptional, aPostElements)
        {
            // Check if other accessories should also be removed if they include this accessory, do this recursively
            var i = 0,
                iL = confSource.length,
                omega,
                t,
                tL;
            for(; i < iL; i++)
            {
            	omega = confSource[i];
                // Offcourse do not incorperate the current object, or items already added to the post array
                if(omega.ID != o.ID && !getObject(omega.ID, aPostElements))
                {
                    tL = omega.IncludeEquipment.length;
                    // Loop through the includes of the omega object and check if o is found
                    for(t = 0; t < tL; t++)
                    {
                        // If omega is found make sure to add it to the postElements
                        if(omega.IncludeEquipment[t].ID == o.ID)
                        {
                            // Add the item to the "to-be-removed" Array
                            aPostElements.push(omega);
                            // Make sure the includes tide to the omega object also get removed!
                            removeIncludes(omega, confSource, aOptional, aPostElements);
                            break;
                        }
                    }
                }
            }
        }

        /**
         * Method which checks for includes which exclude eachother
         * @param o:Object
         * @param aOptional:Array of optional to check (aOptionalAccessories/aOptionalEquipment)
         */
        function checkDuplexIncludes(o, aOptional)
        {
            var i = 0;
            var iL = o.IncludeEquipment.length;
            var t;
            var tL;

            var iLevel = -1;
            var aConflict = [],
                arr;

            var oDouble;

            // Create level one includes, the first array contains the conflict items for "o"
            aConflict[0] = [];
            // Loop through the items!
            for(; i < iL; i++)
            {
                omega = getObject(o.IncludeEquipment[i].ID, aOptional);
                if(omega)
                {
                    checkDuplexIncludeEquipment(omega, o.IncludeEquipment, aConflict[0], aOptional);
                }
            }

            var aSubConflicts,
                k = null;
            // Check level two includes, the second array contains conflicts for the first item in the first array, the third array contains conflicts for the second item in the first array, and so on
            i = 0;
            iL = aConflict[0].length;

            for(; i < iL; i++)
            {
                aSubConflicts = [];
                k = aConflict[0][i];
                tL = k.IncludeEquipment.length;
                for(t = 0; t < tL; t++)
                {
                    omega = getObject(k.IncludeEquipment[t].ID, aOptional);
                    if(omega)
                    {
                        checkDuplexIncludeEquipment(omega, k.IncludeEquipment, aSubConflicts, aOptional);
                    }
                }
                aConflict.push(aSubConflicts);
            }

            return aConflict;
        }

        /**
         * Method which checks the duplex includes on an item present in the IncludeEquipment array
         */
        function checkDuplexIncludeEquipment(o, aIncludeEquipment, aConflict, aOptional)
        {
            var oDoubleOne,
                oDoubleTwo,
                i = 0,
                iLength = o.ExcludeEquipment.length,
                oExcl,
                oOri;
            // Check if the object's exclude Array contains references to the ID's in the o.IncludeEquipment array
            for(; i < iLength; i++)
            {
                // Check if the exclude object is present in the includes array
                oExcl = getObject(o.ExcludeEquipment[i].ID, aIncludeEquipment);
                // If the oExcl is found, check if his exclude Array contains this element (omega)
                if(oExcl)
                {
                    // Get the full object, not the limitted one suplied in the o.IncludeEquipment array
                    oExcl = getObject(oExcl.ID, aOptional);
                    // Check if the original object is found in the excluded objects Array
                    oOri = oExcl?getObject(o.ID, oExcl.ExcludeEquipment):null;
                    // If it is found, add both to the Array
                    if(oOri)
                    {
                        // Make sure not to add doubles!
                        oDoubleOne = getObject(o.ID, aConflict);
                        if(!oDoubleOne)
                        {
                            aConflict.push(o);
                        }
                        oDoubleTwo = getObject(oExcl.ID, aConflict);
                        if(!oDoubleTwo)
                        {
                            aConflict.push(oExcl);
                        }
                    }
                    oOri = null;
                    oExcl = null;
                }
            }
        }

        /**
         * Method which checks the user selected includes in the aConflicts Array, this method is used in co-existance with the checkDuplexIncludes Array
         * @param aConflicts:Array the Array containing conflict include objects
         * @param confSource:Array the Array containing currently selected Equipment/Accessories
         */
        function checkUserIncludes(aConflicts, confSource)
        {
            var i = 0;
            var t = 0;
            var tLength = confSource.length;
            var o = null;
            var aIncludes = [];
            for(i; i < aConflicts.length; i++)
            {
                for(t = 0; t < tLength; t++)
                {
                    o = getObject(confSource[t], aConflicts[i]);
                    if(o)
                    {
                        break;
                    }
                }
                if(o)
                {
                    aIncludes.push(o);
                    aConflicts.splice(i, 1);
                    i--;
                    o = null;
                }
            }
            return [aIncludes, aConflicts];
        }

        /**
         * Method which get's the corresponding equipment item
         * @param id:String
         */
        function getEquipmentItem(id)
        {
            var o = getObject(id, _aOptionalEquipment);
            if(!o)
            {
                o = getObject(id, _aOptionalAccessories);
            }
            if(!o)
            {
                o = getObject(id, _aWheels);
            }
            if(!o)
            {
                o = getObject(id, _aInlays);
            }
            return o;
        }

        /**
         * Function which calculates the price difference objects based on the selected exterior object and it's precessor
         * @param array:Array array which will be iterated to create price objects from
         */
        function calculatePriceDifference(array, guid)
        {
            // Return the id's of the elements which should be altered with the correct comparable price labels
            var aReturn = [];
            var o;
            var nCurrentPrice;
            var nDifference;
            var i;

            var iLength = array.length;
            for(i = 0; i < iLength; i++)
            {
                o = array[i];
                if(guid == o.ID)
                {
                    nCurrentPrice = o.PriceInfo.ListPriceWithDiscount;
                }
            }
            for(i = 0; i < iLength; i++)
            {
                o = array[i];
                nDifference = o.PriceInfo.ListPriceWithDiscount - nCurrentPrice;
                aReturn.push(createPrice(o.ID, nDifference));
            }
            return aReturn;
        }

        /**
         * Method which basically creates a price object, this is done here so if something get's altered we have a centralized point to return to
         * @param id:String the id of the price object
         * @param price:Price of the object
         */
        function createPrice(id, price)
        {
            var oPrice = {};
            oPrice.price = price;
            oPrice.id = id;
            return oPrice;
        }

        /**
         * Method used to update the global price
         * @param bDispatchEvent:Boolean
         */
        function updateConfiguration(dispatchEvent)
        {
            // Only calculate prices if there are any!
            if(_hasPrices)
            {
                // Calculate the total price
                var nTotal = 0,
                    nTDisc = 0;
                nTotal += _configuration.ExteriorColourPrice.ListPrice;
                nTDisc += _configuration.ExteriorColourPrice.ListPriceDiscount;
                nTotal += _configuration.UpholstryPrice.ListPrice;
                nTDisc += _configuration.UpholstryPrice.ListPriceDiscount;
                nTotal += _configuration.WheelPrice.ListPrice;
                nTDisc += _configuration.WheelPrice.ListPriceDiscount;
                if(!_configuration.isEmpty(_configuration.InlayID))
                {
                    nTotal += _configuration.InlayPrice.ListPrice;
                    nTDisc += _configuration.InlayPrice.ListPriceDiscount;
                }
                // Get the equipment & packs labels and prices
                var iL = _configuration.OptionsPrices.length,
                	i,
                	packEquipment = [];
                for(i = 0; i < iL; i++)
                {
                    nTotal += _configuration.OptionsPrices[i].ListPrice;
                    nTDisc += _configuration.OptionsPrices[i].ListPriceDiscount;
                }
                iL = _configuration.PackPrices.length;
                for(i = 0; i < iL; i++)
                {
                	packEquipment = packEquipment.concat(_instance.getSelectedPackOptions(_configuration.Packs[i]));
                    nTotal += _configuration.PackPrices[i].ListPrice;
                    nTDisc += _configuration.PackPrices[i].ListPriceDiscount;
                }
                iL = _configuration.AccessoriesPrices.length;
                for(i = 0; i < iL; i++)
                {
                    // If the wheel id is the same as the one in the accessorie do not add it!
                    if(_configuration.Accessories[i] != _configuration.WheelID)
                    {
                        nTotal += _configuration.AccessoriesPrices[i].ListPrice;
                        nTDisc += _configuration.AccessoriesPrices[i].ListPriceDiscount;
                    }
                }
                
                // Check for pack equipment items which have a parent
                iL = packEquipment.length;
                var pe,
                	parentOptions = {};
                for(i = 0; i < iL; i++)
                {
                	pe = packEquipment[i].ParentOption;
                	// If the parent has a price, also take it into account!
                	if(pe && pe.PriceInVat > 0)
                	{
                		if(!parentOptions[pe.ID])
                		{
                			parentOptions[pe.ID] = true;
                			nTotal += pe.PriceInVat;
                		}
                	}
                }
                
                nTotal += _configuration.BasePrice.ListPrice;
                nTDisc += _configuration.BasePrice.ListPriceDiscount;

                _configuration.TotalPrice = nTotal;
                _configuration.TotalPriceDiscount = nTDisc;
            }

            // Check if there should be dispatched an event/called a call back function
            if(dispatchEvent)
            {
            	// Sort the configuration
            	sortConfig();
                // Parse a copy of the _configuration object, which includes formatted prices
                var config = copyConfiguration(true);
                addImages(config);

                // Dispatch instance change event!
                _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Config.CHANGED,config));
            }
        }

        /**
         * Method which creates the grade images
         */
        function createGradeImages()
        {
            var i = 0,
                iL = _aGrades.length,
                t,
                tL = _aMotorizations?_aMotorizations.length:0,
                o,
                sL,
                sB = "";

            // Add Country
            sB += "/" + _configuration.Country;
            sB += "/" + _configuration.ModelID;
            sB += "/" + ((_configuration.Brand == "toyota")?_configuration.BodyTypeID:_configuration.SubModelID);
            for(; i < iL; i++)
            {
                o = _aGrades[i];
                sL = sB;
                sL += "/" + o.ID;
                // If the _aMotorizations are available, check grade availability
                if(tL > 0)
                {
                	t = 0;
                	for(; t < tL; t++)
                	{
                		if(getObject(o.ID, _aMotorizations[t].Grades))
                		{
                			break;
                		}
                	}
                	// Add the motorizations id to the url (do a check if it exists for some backward compatibility with webservice 2.0.0.17)
                	if(_aMotorizations[t])sL += "/" + _aMotorizations[t].Engine.ID;
                }
                sL += "/width/{WIDTH}/height/{HEIGHT}";
                sL += "/{VIEW}-{SIDE}.{TYPE}";
                // Create "Image" property on the object!
                o.Image = sL;
            }
        }
        
        /**
         * Method which creates the submodel images
         */
        function createImages(a)
        {
            var i = 0,
                iL = a.length,
                o,
                sL,
                sB = "";

            // Add Country
            sB += "/" + _settings.country;
            // Add the vehicle identifier
            sB += "/vehicle";
            // Add the model
            sB += "/" + _configuration.ModelID;

            for(; i < iL; i++)
            {
                o = a[i];
                sL = sB;
                // Add the car id
                sL += "/" + o.CarShortID;
                sL += "/width/{WIDTH}/height/{HEIGHT}";
                sL += "/{VIEW}-{SIDE}.{TYPE}";
                // Create "Image" property on the object!
                o.Image = sL;
            }
        }
        
        /**
         * Method which sorts the options, packs and accessories arrays 
         */
        function sortConfig()
        {
        	sortDependencies(_configuration.Options, [_configuration.OptionsLabels, _configuration.OptionsPrices, _configuration.OptionsTypes]);
        	sortDependencies(_configuration.Packs, [_configuration.PackLabels, _configuration.PackPrices]);
        	sortDependencies(_configuration.Accessories, [_configuration.AccessoriesLabels, _configuration.AccessoriesPrices]);
        	_fc.Options.sort(sortFC);
        	_fc.Packs.sort(sortFC);
        	_fc.Accessories.sort(sortFC);
        }
        
        /**
         * Method used to sort the _fc. Array properties 
         */
        function sortFC(a, b)
        {
        	if(a.ID < b.ID) return -1;
   			if(a.ID > b.ID) return 1;
			return 0;
        }
        
        /**
         * Method which sorts an array an it's dependency arrays 
         */
        function sortDependencies(arr, aDep)
        {
        	var i = 0,
        		iL = arr.length,
        		aPreSort = arr.concat();
        	// Sort the array
        	arr.sort();
        	// Get a list of all updated indexes
        	var aPostIndexes = [];
        	for(; i < iL; i++)
        	{
        		aPostIndexes.push(_getIndex(aPreSort, arr[i]));
        	}
        	// Loop through all the dependent arrays and sort those arrays based on the adjusted indexes
        	var t = 0,
        		tL = aDep.length,
        		aDepCopy;
        	for(; t < tL; t++)
        	{
        		aDepCopy = aDep[t].concat();
        		for(i = 0; i < iL; i++)
        		{
        			aDep[t][i] = aDepCopy[aPostIndexes[i]];
        		}
        	}
        	aPreSort = null;
        	aPostIndexes = null;
        	aDepCopy = null;
        }

        /**
         * Method which creates the links to the images
         */
        function addImages(config)
        {
            var aExteriorImages = [],
                aInteriorImages = [],
                sBaseUrl = "",
                i,
                iL,
                typeAdded = false,
                o,
                isWheelOption = (_fc.Wheel.Type.toLowerCase() === "option");

            // Add Country
            sBaseUrl += "/" + config.Country;
            // Add the vehicle identifier
            sBaseUrl += "/vehicle";
            // Add the model
            sBaseUrl += "/" + config.ModelID;
            // Add the car id
            sBaseUrl += "/" + _fc.Car.ShortID;
            // Add the packs
            i = 0;
            iL = config.Packs.length;
            o = null;
            if(iL > 0)sBaseUrl += "/packs/";
            for(; i < iL; i++)
            {
                o = _fc.Packs[i];
                sBaseUrl += o.ShortID + ",";
            }
            // Add the options
            i = 0;
            iL = config.Options.length;
            o = null;
            if(!_extendedWheel.finish && !_extendedWheel.cap && !_extendedWheel.surround && isWheelOption)
            {
            	typeAdded = true;
            	sBaseUrl += "/options/";
            	sBaseUrl += _fc.Wheel.ShortID;
				sBaseUrl += ",";
	        }
	        if(_fc.Inlay && _fc.Inlay.Type.toLowerCase() === "option")
	        {
	        	if(_fc.Inlay.ShowsOnCar)
	        	{
		        	if(!typeAdded)
	            	{
	            		sBaseUrl += "/options/";
	            		typeAdded = true;
	            	}
	        		sBaseUrl += _fc.Inlay.ShortID + ",";
	        	}
	        }
	        for(; i < iL; i++)
	        {
	        	o = _fc.Options[i];
                if(o.ShowsOnCar || o.ParentOption)
                {
                	if(!typeAdded)
                	{
                		sBaseUrl += "/options/";
                		typeAdded = true;
                	}
	        		sBaseUrl += o.ShortID + ",";
                }
	        }
            // Add the accessories
            i = 0;
            iL = config.Accessories.length;
            typeAdded = false;
            o = null;
            if(_fc.Inlay && _fc.Inlay.Type.toLowerCase() === "accessory")
	        {
	        	if(_fc.Inlay.ShowsOnCar)
	        	{
	        		if(!typeAdded)
            		{
            			sBaseUrl += "/accessories/";
            			typeAdded = true;
            		}
        			sBaseUrl += _fc.Inlay.ShortID + ",";
        		}
	        }
            for(; i < iL; i++)
            {
                o = _fc.Accessories[i];
                if(o.ShowsOnCar || o.ParentOption)
                {
                	if(!typeAdded)
                	{
                		sBaseUrl += "/accessories/";
                		typeAdded = true;
                	}
	        		sBaseUrl += o.ShortID + ",";
                }
            }
            // Add the width & height
            sBaseUrl += "/width/{WIDTH}/height/{HEIGHT}";
            // Add the scale mode
            sBaseUrl += "/scale-mode/{SCALEMODE}";
            // Add the padding
            sBaseUrl += "/padding/{PADDING}";
            // Add the background color
            sBaseUrl += "/background-colour/{BACKGROUNDCOLOUR}";
            // Add the background image
			sBaseUrl += "/background-image/{BACKGROUNDIMAGE}";
            // Add the image quality
			sBaseUrl += "/image-quality/{IMAGEQUALITY}";
            // Configure the file type
            sBaseUrl += "/{VIEW}-{SIDE}_" + escape(_fc.ExteriorColour.InternalCode) + "_" + escape(_fc.Upholstery.InternalCode) + ".{TYPE}";
            // Replace all the ,/ with / (can be caused by the code above)
            sBaseUrl = sBaseUrl.replace(/,\//g, "/");
			
            // Create 36 images
            i = 0;
            for(i; i <= 35; i++)
            {
                aExteriorImages.push(sBaseUrl.replace(/[{]SIDE[}]/g,i));
            }

            // Create the 6 interior images
            i = 0;
            for(i; i <= 5; i++)
            {
                aInteriorImages.push(sBaseUrl.replace(/[{]SIDE[}]/g,i));
            }
            config.InteriorImages = aInteriorImages;
            config.ExteriorImages = aExteriorImages;
            config.InteriorImage = getIntPanoramaImage(_fc.Upholstery);
        }

        /**
         * Method used to parse the configuration into an object
         * @param bFullCopy:Boolean determines wheter to include the labels and prices or not
         */
        function copyConfiguration(bFullCopy)
        {
            var copy = {};
            // Copy the configuration object!
            for(var sProp in _configuration)
            {
                // Filter out the prices; since we don't want a reference to the array into the configuration object!
                if(sProp != "OptionsPrices" && sProp != "PackPrices" && sProp != "Options" && sProp != "Packs" && sProp != "OptionsLabels" && sProp != "OptionsTypes" && sProp != "PackLabels"&& sProp != "Accessories" && sProp != "AccessoriesLabels" && sProp != "AccessoriesPrices")
                {
                    if(bFullCopy)
                    {
                        copy[sProp] = _configuration[sProp];
                    }
                    else
                    {
                        // Don't include the labels or the price!
                        if(sProp.indexOf("Price") == -1	&& sProp.indexOf("Label") == -1)
                        {
                            copy[sProp] = _configuration[sProp];
                        }
                    }
                }
            }

            // Copy the packs/options and relevant labels!
            copy.Options = [];
            copy.Packs = [];
            copy.Accessories = [];

            var i,
                iLength;
            iLength = _configuration.Options.length;
            for(i = 0; i < iLength; i++)
            {
                copy.Options.push(_configuration.Options[i]);
            }
            iLength = _configuration.Packs.length;
            for(i = 0; i < iLength; i++)
            {
                copy.Packs.push(_configuration.Packs[i]);
            }
            iLength = _configuration.Accessories.length;
            for(i = 0; i < iLength; i++)
            {
                copy.Accessories.push(_configuration.Accessories[i]);
            }

            if(bFullCopy)
            {
                copy.OptionsLabels = [];
                copy.PackLabels = [];
                copy.AccessoriesLabels = [];
                copy.OptionsTypes = [];

                iLength = _configuration.OptionsLabels.length;
                for(i = 0; i < iLength; i++)
                {
                    copy.OptionsLabels.push(_configuration.OptionsLabels[i]);
                }
                iLength = _configuration.OptionsTypes.length;
                for(i = 0; i < iLength; i++)
                {
                    copy.OptionsTypes.push(_configuration.OptionsTypes[i]);
                }
                iLength = _configuration.PackLabels.length;
                for(i = 0; i < iLength; i++)
                {
                    copy.PackLabels.push(_configuration.PackLabels[i]);
                }
                iLength = _configuration.AccessoriesLabels.length;
                for(i = 0; i < iLength; i++)
                {
                    copy.AccessoriesLabels.push(_configuration.AccessoriesLabels[i]);
                }

                // Only copy prices if there are any!
                if(_hasPrices)
                {
                    // Do a deep copy of the prices and stuff
                    copy.OptionsPrices = [];
                    copy.PackPrices = [];
                    copy.AccessoriesPrices = [];
                    iLength = _configuration.OptionsPrices.length;
                    for(i = 0; i < iLength; i++)
                    {
                        copy.OptionsPrices.push(_configuration.OptionsPrices[i]);
                    }
                    iLength = _configuration.PackPrices.length;
                    for(i = 0; i < iLength; i++)
                    {
                        copy.PackPrices.push(_configuration.PackPrices[i]);
                    }
                    iLength = _configuration.AccessoriesPrices.length;
                    for(i = 0; i < iLength; i++)
                    {
                        copy.AccessoriesPrices.push(_configuration.AccessoriesPrices[i]);
                    }
                }
            }

            return copy;
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
            pConfig.ModelID = _configuration.ModelID;

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
         * Method used to get specific content from the webservice with specific parameters (required for some logic)
         * @param method:Function the method used for the webservice
         * @param aConfigurationParams:Array additional configuration parameters
         * @param async:Boolean determines how the call should be made, synchronous or asynchronous
         */
        function getContent(method, aConfigurationParams, async)
        {
            _ws[method](getParamConfiguration(aConfigurationParams), async);
        }
        
        /**
         * Method used to enrich the local promotions encountered on different locations, or empty the promotions if the _settings.usePromo is set to false
         * @param aItems:Array the array which need to be enriched with full promotion items
         * @param prop:String the property inside the aItems array which contains the limmited promotions
         */
        function enrichPromotions(aItems, prop)
        {
            if(!_model) return;
            var i = 0,
                iLength = aItems.length,
                t,
                tLength,
                o,
                p,
                l,
                sProp;
            for(i; i < iLength; i++)
            {
                o = aItems[i];
                t = 0;
                if(o[prop])
                {
                    // If the promotions should be used, enrich all promotions
                    if(_settings.usePromo)
                    {
                        tLength = o[prop].length;
                        for(t; t < tLength; t++)
                        {
                            l = o[prop][t];
                            p = getObject(l.ID, _model.AvailablePromotions);
                            // Enrich the local promotion with properties from the global promotion
                            for(sProp in p)
                            {
                                l[sProp] = p[sProp];
                            }
                        }
                    }
                    // Else, clear all available promotions
                    else
                    {
                        clearPromotions(o, prop);
                    }
                }
            }
        }

        /**
         * Method which clears the promotions
         * @param o:Object
         * @param prop:String, "Promotions" or "AvailablePromotions"
         */
        function clearPromotions(o, prop)
        {
            // Clear the promotions array
            if(prop && o[prop])o[prop] = [];
            // Check if the priceInfo object exists
            if(o.PriceInfo)
            {
                // Clear discounts array
                o.PriceInfo.Discounts = [];
                // Remove discount price
                o.PriceInfo.ListPriceDiscount = 0;
                o.PriceInfo.ListPriceWithDiscount = o.PriceInfo.ListPrice;
            }
        }
       	
        /**
         * Remove standard equipment from the optional equipment arrays when no promotions should be shown
         * @param a:Array (_aOptionalEquipment, _aOptionalAccessories)
         */
        function removeStandardEquipment(a)
        {
            var i = 0,
                o;
            for(i; i < a.length; i++)
            {
                o = a[i];
                if(o.Standard)
                {
                    a.splice(i, 1);
                    i--;
                }
            }
        }

        //----------------------------------
        //  Private event handlers
        //----------------------------------

        /**********************
         * Startup flow!
         ***********************/

        /**
         * Handles possible errors which might occur from the webservice
         * @param evt:DataEvent
         */
        function serviceErrorControllerEventHandler(evt)
        {
        	// Clean up queueloader
        	_ql.reset();
            // Dispatch the event ;)
            evt.type = be.marlon.Service.SERVICE_ERROR;
            _instance.dispatchEvent(evt);
        }

        /**
         * Method which handles the logic of activating user selected logic on a specific property, relevant for upholsteries, inlays, exterior colours and wheels
         */
        function parseUserSelectedItem(aElement, configProperty, fConfigProperty)
        {
            // Check if there is a Colour ID selected in the user selected array which is also returned from the webservice
            var i = 0,
                iLength = aElement.length,
                id,
                o,
                userSelected = false;
            for(i; i < iLength; i++)
            {
            	if(!aElement[i])console.error(aElement, configProperty, fConfigProperty);
                id = aElement[i].ID;
                o = getObject(id, _aUserSelected);
                if(o)
                {
                	userSelected = true;
                    // For the wheels apply special logic
                    if(fConfigProperty === "Wheel" && o.finish && (o.cap || o.surround))
                    {
                    	if(!_settings.useExtendedWheelColourFiltering)_instance.setWheels(o.ID, o.finish, o.cap, o.surround, false);
                    	else
                    	{
                    		_extendedWheel = o;
                    		updateExtendedWheel(true);
                    	}
                    }
                    else
                    {
                    	_fc[fConfigProperty] = aElement[i];
                    	_configuration[configProperty] = id;
                    }
                    return true;
                }
            }
            // Check if the first colour in the array matches the exterior colour id
            if(!userSelected && aElement.length > 0)
            {
            	o = aElement[0];
                id = o.ID;
                // Check if the colour is user selected or not (only the first time the application loads)
                if(!_bCompatibilityCheck)
                {
                    // If the configuration's exterior colour differs from the selected default, it means it has been user selected
                    if(id != _configuration[configProperty])
                    {
                    	if(fConfigProperty === "Wheel" && _extendedWheel.finish && (_extendedWheel.cap || _extendedWheel.surround))
                    	{
                    		_aUserSelected.push(_extendedWheel);
                    	}
                    	else
                    	{
                    		_aUserSelected.push(_fc[fConfigProperty]);
                    	}
                    }
                }
                // Upon compatibity check if the colour differs from the default (standard one)
                else
                {
                    // If the configuration's current item differs from the selected item, it means it has been user selected
                    if(id != _configuration[configProperty])
                    {
                        _configuration[configProperty] = id;
                        _fc[fConfigProperty] = o;
                        return true;
                    }
                }
            }
            return false;
        }

        /**
         * Method which checks the availability of each item in the array and add's it to the _aAvailables array
         * @param data:Array
         */
        function updateAvailability(data, checkOptional)
        {
            var i = 0;
            var iL = data.length;
            for(i; i < iL; i++)
            {
                if((data[i].AvailableForExteriorColours && data[i].AvailableForExteriorColours.length > 0) || (data[i].AvailableForCarUpholsteries && data[i].AvailableForCarUpholsteries.length > 0))
                {
                    _aAvailables.push(data[i]);
                    if(checkOptional !== "" && data[i].Standard === false)_hasOptionalAvailables[checkOptional] = true;
                }
            }
        }

        /**
         * Method which updates the promotional value based on the newly received cardata
         * @param a:Array of _aMotorizations or _aGrades
         */
        function updateEnginePromoValues(a)
        {
            var i = 0,
                iLength = a.length,
                t,
                tLength,
                o,
                l,
                p,
                g,
                aReturn = [], // Contains the array of Special motorization objects
                aPromo;  // Contains the array of special promotion arrays which will become a property of the objects in the aReturn array

            for(i; i < iLength; i++)
            {
                o = a[i];
                // Check if there are available Promotions!
                t = 0;
                tLength = o.AvailablePromotions.length;
                if(tLength > 0)
                {
                    // Init array
                    aPromo = [];
                }
                for(t; t < tLength; t++)
                {
                    l = o.AvailablePromotions[t];
                    // Get the current selected grade
                    g = getObject(_configuration.GradeID, o.Grades);
                    // If g does not exist, take the first grade (= default)
                    if(!g)
                    {
                        // Add the change to the array
                        aPromo.push({ID:l.ID, Value:0, Show:false});
                    }
                    else
                    {
                        // Get the appropriate value from the Discounts array
                        p = getObject(l.ID, g.PriceInfo.Discounts);
                        // Set the value
                        if(p)
                        {
                            if(l.Value != p.Amount)
                            {
                                // Update the value
                                l.Value = p.Amount;
                            }
                            // Add the change to the array
                            aPromo.push({ID:l.ID, Value:l.Value, Show:true});
                        }
                        else
                        {
                            aPromo.push({ID:l.ID, Value:0, Show:false});
                        }
                    }
                }
                // If the promo array exists, append it to the aReturn object
                if(aPromo && aPromo.length > 0)
                {
                    aReturn.push({ID:o.Engine.ID + o.Engine.Type.ID + o.Transmission.ID + o.Wheeldrive.ID, Promotions:aPromo});
                }
                aPromo = null;
            }
            return aReturn;
        }

        /**
         * Method which updates the promotional values on the grade objects
         * @param a:Array of grade objects
         */
        function updateGradePromoValues(a)
        {
            var i = 0,
                iL = a.length,
                t,
                tL,
                l,
                o,
                g,
                m,
                k,
                p,
                kLength,
                aReturn = [], // This is the array which will be populated with special grade objects containing an ID and promotion array
                aPromo; // This is the array which will be appended to the objects of the aReturn array

            for(i; i < iL; i++)
            {
                o = a[i];
                // Check if there are available Promotions
                t = 0;
                tL = o.AvailablePromotions.length;
                for(; t < tL; t++)
                {
                    // Init array
                    if(t===0)aPromo = [];
                    l = o.AvailablePromotions[t];
                    // Get the correct value from the list of grades inside the motorizations
                    m = getMotorization(_configuration);
                    // Check if the grade is present in it
                    g = getObject(o.ID, m.Grades);
                    // If it doesn't exist, we have to loop through all the engines one by one and get the first value which we find
                    if(!g)
                    {
                        /*k = 0;
                         kLength = _aMotorizations.length;
                         for(k; k < kLength; k++)
                         {
                         m = _aMotorizations[k];
                         // Check presence in the motorizations
                         g = getObject(o.ID, m.Grades);
                         if(g)break;
                         }*/
                        aPromo.push({ID:l.ID, Value:0, Show:false});
                    }
                    else
                    {
                        p = getObject(l.ID, g.PriceInfo.Discounts);
                        // Set the value
                        if(p)
                        {
                            if(l.Value != p.Amount)
                            {
                                // Update the value
                                l.Value = p.Amount;
                            }
                            // Add the change to the array
                            aPromo.push({ID:l.ID, Value:l.Value, Show:true});
                        }
                        else
                        {
                            aPromo.push({ID:l.ID, Value:0, Show:true});
                        }
                    }

                    // Get the appropriate value from the Discounts array
                    /*p = getObject(l.ID, g.PriceInfo.Discounts);
                     // Set the value
                     if(p)
                     {
                     if(l.Value != p.Amount)
                     {
                     // Update the value
                     l.Value = p.Amount;
                     // Add the change to the array
                     aPromo.push({ID:l.ID, Value:l.Value});
                     }
                     }*/

                }
                // If the promo array exists, append it to the aReturn object
                if(aPromo && aPromo.length > 0)
                {
                    aReturn.push({ID:o.ID, Promotions:aPromo});
                }
                aPromo = null;
            }
            return aReturn;
        }

        /**
         * Fetches a motorization object which matches the properties in the config object
         * @param config:Configuration object
         */
        function getMotorization(config)
        {
            var i = 0,
                iL = _aMotorizations.length,
                o;
            for(; i < iL; i++)
            {
                o = _aMotorizations[i];
                if(o.Engine.ID == config.EngineID && o.Engine.Type.ID == config.FuelTypeID && o.Transmission.ID == config.TransmissionID && o.Wheeldrive.ID == config.WheelDriveID)
                {
                    return o;
                }
            }
            return null;
        }

        /**
         * Method which adds the promo image to the complete object
         * @param data:Object
         */
        function getPromoData()
        {
            var bSM = false,
            	promoImage = "",
            	promoLink = "",
                o;
            // Get the image from the getcarmodel
            if(_aSubModels && _aSubModels.length > 0)
            {
                // Get the image from the submodels
                o = getObject(_configuration.SubModelID, _aSubModels);
                o = getElement("PROMO-IMAGE", o.Assets, "Type");
                if(o)
                {
                    promoImage = o.Url;
                    bSM = true;
                }
            }
            if(!bSM)
            {
                if(_model.Assets)
                {
                    o = getElement("PROMO-IMAGE", _model.Assets, "Type");
                    promoImage = o?o.Url:"";
                }
            }

            // Only fetch link if the image is present
            if(promoImage !== "")
            {
                // Get the link from the getcarmodel
                if(bSM)
                {
                    if(_aSubModels.length > 0)
                    {
                        // Get the image from the submodels
                        o = getObject(_configuration.SubModelID, _aSubModels);
                        o = getElement("PromoPage", o.Links, "Name");
                        promoLink = o?o.Url:"";
                    }
                }
                // Get the link from the bodytype
                else
                {
                    if(_model.Links)
                    {
                        o = getElement("PromoPage", _model.Links, "Name");
                        promoLink = o?o.Url:"";
                    }
                }
            }
            return {promoImage:promoImage, promoLink:promoLink};
        }

        /**
         * Method which returns the asset
         * @param type:String
         * @param assets:Array
         */
        function getElement(type, assets, property)
        {
            var i = 0,
                iLength = assets.length,
                o;
            for(i; i < iLength; i++)
            {
                o = assets[i];
                if(o[property] == type)
                {
                    return o;
                }
            }
            return null;
        }

        /**
         * Method used to get a specific object from a specific array based on a specific id
         * @param id:String
         * @param array:String
         */
        function getObject(id, array)
        {
            var i;
            var iLength = array.length;
            var o;
            // Set the colour 
            for(i = 0; i < iLength; i++)
            {
                o = array[i];
                if(o.ID == id)
                {
                    return o;
                }
                o = null;
            }
            return o;
        }

        /**
         * Method used to remova all event listeners related to the loading flow
         */
        function removeAllEventListeners()
        {
            // Remove compatibility check event handler!
            _ws.removeEventListener(be.marlon.Internal.COMPATIBILITY_CHECK_LOADED, compatibilityChecksLoadedEventHandler);
            _ws.removeEventListener(be.marlon.Internal.FULL_CONFIGURATION_LOADED, fullConfigurationLoadedEventHandler);
        }

        ////////////////////////////////////////////////////////////
        // Compare result flow!
        ////////////////////////////////////////////////////////////
        /**
         * Initial method which starts the compare result flow
         * @param config1:Configuration
         * @param config2:Configuration
         */
        function compatibilityCheck(config1, config2)
        {
        	// Clean the loading first!
        	cleanLoading();
        	// Dispatch load event!
        	_instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.LOAD_DATA));
            _loading = true;
            _bCompatibilityCheck = true;
            _ws.addEventListener(be.marlon.Internal.COMPATIBILITY_CHECK_LOADED, compatibilityChecksLoadedEventHandler);
            _ws.compatibilityCheck(config1, config2);
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
                removeAllEventListeners();

                // Abort the webservice
                _ws.abort();

                // Loading is false
                _loading = false;
            }
        }

        /**
         * Handles return value of the compatibilityChecks method
         * @param evt:DataEvent
         */
        function compatibilityChecksLoadedEventHandler(evt)
        {
            // Remove event listener!
            _ws.removeEventListener(be.marlon.Internal.COMPATIBILITY_CHECK_LOADED, compatibilityChecksLoadedEventHandler);
            var aConflict = evt.data.ConflictItems;
            _initConfiguration = evt.data.Configuration;

            // If there are conflicts and the user selected something
            if(aConflict.length > 0 && _bUserInteracted && _dispatchConflict)
            {
            	// Dispatch event that the compatibility check has completed loading
        		_instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.LOAD_DATA_COMPLETE));
                // Dispatch the event with the conflict items
                evt = new be.marlon.DataEvent(be.marlon.Service.SHOW_CONFLICT, aConflict);
                _instance.dispatchEvent(evt);
            }
            // If there are no conflicts!
            else
            {
                // Start the compare load procedure
                startCompareLoad();
            }
            _dispatchConflict = true;
        }

        /**
         * Method which starts the compare load
         */
        function startCompareLoad()
        {
        	// Load the full configuration object first!
        	_ws.addEventListener(be.marlon.Internal.FULL_CONFIGURATION_LOADED, fullConfigurationLoadedEventHandler);
        	_initConfiguration.Brand = _configuration.Brand;
        	_initConfiguration.Country = _configuration.Country;
        	_initConfiguration.Language = _configuration.Language;
        	_ws.getFullConfiguration(_initConfiguration);
        }
        
        /**
         * Method which handles loading the full configuration object 
         */
        function fullConfigurationLoadedEventHandler(e)
        {
        	// Remove event listener
        	_ws.removeEventListener(be.marlon.Internal.FULL_CONFIGURATION_LOADED, fullConfigurationLoadedEventHandler);
        	
        	// If the motorization has been changed, make sure the _aCompareGrades is cleaned
            if(
                	_configuration.EngineID != _initConfiguration.EngineID ||
                    _configuration.FuelTypeID != _initConfiguration.FuelTypeID ||
                    _configuration.WheelDriveID != _initConfiguration.WheelDriveID ||
                    _configuration.TransmissionID != _initConfiguration.TransmissionID
                )
            {
                _aCompareGrades = null;
            }
            if(_configuration.CarID != _initConfiguration.CarID)
            {
            	_aSpecs = null;
				_aStaEquipment = null;
			}
            // Copy the configuration
            parseConfiguration(_initConfiguration);
            // Reset the queueloader
            _ql.resetData(_bLoadPacks, _bLoadEngineGrades);
            _ql.setFullConfiguration(e.data);
            // Reset the variables
            resetVariables();
            
            // Re-initialize configuration dependencies
	        initConfiguration(e.data);
	        // Update the prices
	        updateConfiguration(false);
	        // Reset all loading boolean
            _bLoadEngineGrades = false;
            _bLoadPacks = false;
        	
        	// Dispatch event that the compatibility check has completed loading
        	_instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.LOAD_DATA_COMPLETE));
        	// Dispatch event to let the implementing application know that data should be reloaded
            _instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.RELOAD_DATA));
        }
        
        /**
         * Method which resets the variables 
         */
        function resetVariables()
        {
        	// Reset the dependency variables
        	_aAvailables = null;
        	_aColours = null;
			_aWheels = null;
			_aOptionalEquipment = null;
			_aUpholstries = null;
			_aInlays = null;
			_aOptionalAccessories = null;
            _initConfiguration = null;
            _carData = null;
            _oPackEquipment = null;
            _extendedWheel = {
	        	ID:"",
	        	finish:null,
	        	cap:null,
	        	surround:null
	        };
	        _aWheelEquipment = null;
        }
        
        /**
         * Method which initializes the configuration 
         */
        function initConfiguration(data)
        {
        	var i,
        		iL,
        		o,
        		s;
        	// Save the configuration!
        	_fc = data;
        	
        	// Add the extended wheels if it is available
        	_extendedWheel.ID = _fc.Wheel.ID;
        	var equipment;
        	if(_fc.Wheel.ChildOptions.length > 0)
        	{
        		// Get the current selected finish and cap from the accessory or options array
        		equipment = _fc.Accessories.concat(_fc.Options);
        		iL = equipment.length;
        		for(i = 0; i < iL; i++)
        		{
        			o = getObject(equipment[i].ID, _fc.Wheel.ChildOptions);
        			if(o)
        			{
        				_extendedWheel.finish = o;
        				break;
        			}
        			_extendedWheel.finish = null;
        		}
        		if(_extendedWheel.finish)
        		{
        			_extendedWheel.cap = null;
        			_extendedWheel.surround = null;
        			for(i = 0; i < iL; i++)
        			{
        				o = equipment[i];
        				s = getObject(o.ID, _extendedWheel.finish.IncludeEquipment);
		    			if(s)
		    			{
		    				o.ColouringMode = s.ColouringMode;
		    				if(o.Path.indexOf("cap surrounds") > -1)
		    				{
		    					_extendedWheel.surround = o;
		    				}
		    				else
		    				{
		    					_extendedWheel.cap = o;
		    				}
		    			}
        			}
        		}
        	}
        	else
        	{
           		_extendedWheel.finish = null;
           		_extendedWheel.cap = null;
           		_extendedWheel.surround = null;
        	}
        	
        	// Fill in the promotion indexes on the object
        	addPromoIndexes(_fc);
        	
        	// Update the equipment prices for the packs
        	updatePackEquipmentPrices(_fc.Packs);
        	
        	// Create an array of pack equipment items
        	///////////////////////////////////////////////////////////////////////////////
        	// TODO Fix the pack equipment prices of the options in the _fc
        	iL = _fc.Packs.length;
        	var packEquipment = {},
        		fPacks = _fc.Packs.map(
        			function(item)
        			{
        				return getObject(item.ID, _aPacks);
        			}
        		),
        		p;
        	for(i = 0; i < iL; i++)
        	{
        		createPackEquipment(fPacks[i].Equipment, packEquipment);
        	}
        	equipment = _fc.Options.concat(_fc.Accessories);
        	iL = equipment.length;
        	for(i = 0; i < iL; i++)
        	{
        		o = packEquipment[equipment[i].ID];
        		if(o)
        		{
        			p = o.PriceInVat;
        			if(p && p > 0)
	        		{
	        			equipment[i].PriceInfo.ListPriceWithDiscount = p;
	        			equipment[i].PriceInfo.ListPrice = p;
	        		}
        		}
        	}
        	///////////////////////////////////////////////////////////////////////////////
        	///////////////////////////////////////////////////////////////////////////////
        	
            // Reference the data
            _carData = data.Car;
            
    		 // Set the baseprice on the configuration object
            if(_carData.PriceInfo)
            {
                _configuration.BasePrice = _carData.PriceInfo;
            }

            // Clear the promotions if there should be no promotions shown
            if(!_settings.usePromo)
            {
                clearPromotions(_carData, "AvailablePromotions");
            }
            
            // Update the configuration prices and labels!
			// Save the label
			_configuration.CarName = data.Car.Name;
            _configuration.BodyTypeLabel = data.Body.Name;
            _configuration.EngineLabel = data.Motorization.Engine.Name;
            _configuration.EngineTypeLabel = data.Motorization.Engine.Type.Name;
            _configuration.TransmissionLabel = data.Motorization.Transmission.Name;
        	_configuration.WheelDriveLabel = data.Motorization.Wheeldrive.Name;
            _configuration.GradeLabel = data.Grade.Name;
            _configuration.PackLabels = [];
        	_configuration.PackPrices = [];
        	iL = _configuration.Packs.length;
            for(i = 0; i < iL; i++)
            {
            	o = getObject(_configuration.Packs[i], data.Packs);
                _configuration.PackLabels.push(o.Name);
                _configuration.PackPrices.push(o.PriceInfo);
            }
            _configuration.ExteriorColourLabel = data.ExteriorColour.Name;
            _configuration.ExteriorColourDisclaimer = data.ExteriorColour.FootNote;
            _configuration.ExteriorColourPrice = data.ExteriorColour.PriceInfo;
            _configuration.WheelLabel = data.Wheel.Name;
            _configuration.WheelPrice = data.Wheel.PriceInfo;
            _configuration.OptionsLabels = [];
        	_configuration.OptionsPrices = [];
			_configuration.OptionsTypes = [];
			i = 0;
			iL = _configuration.Options.length;
			for(; i < iL; i++)
			{
				o = getObject(_configuration.Options[i], data.Options);
                _configuration.OptionsLabels.push(o.Name);
        		_configuration.OptionsPrices.push(o.PriceInfo);
        		_configuration.OptionsTypes.push(o.Category.Code.substring(0,3));
        	}
            _configuration.UpholstryLabel = data.Upholstery.Name;
            _configuration.UpholstryPrice = data.Upholstery.PriceInfo;
            if(!_configuration.isEmpty(_configuration.InlayID) && _fc.Inlay)
            {
            	_configuration.InlayLabel = data.Inlay.Name;
                _configuration.InlayPrice = data.Inlay.PriceInfo;
            }
            _configuration.AccessoriesLabels = [];
        	_configuration.AccessoriesPrices = [];
        	iL = _configuration.Accessories.length;
            for(i = 0; i < iL; i++)
            {
            	o = getObject(_configuration.Accessories[i], data.Accessories);
                _configuration.AccessoriesLabels.push(o.Name);
                _configuration.AccessoriesPrices.push(o.PriceInfo);
            }
        }
        
        /**
         * Method which references the prices correctly for all pack equipment 
         */
        function updatePackEquipmentPrices(arr)
        {
        	var i = 0,
        		iL = arr.length;
        	for(; i < iL; i++)
        	{
        		updateEquipmentPrice(arr[i].Equipment);
        	}
        }
        
        /**
         * Recursive method which re-references the prices 
         */
        function updateEquipmentPrice(arr)
        {
        	var i = 0,
        		iL = arr.length,
        		p,
        		o;
        	for(; i < iL; i++)
        	{
        		o = arr[i];
        		p = o.PriceInVat;
        		if(p && p > 0)
        		{
        			o.PriceInfo.ListPriceWithDiscount = p;
        			o.PriceInfo.ListPrice = p;
        		}
        		if(o.ChildOptions && o.ChildOptions.length > 0)
        		{
        			updateEquipmentPrice(o.ChildOptions);
        		}
        	}
        }
        
        /**
         * Recursive method which fixes the promo indexes on an object 
         */
        function addPromoIndexes(o)
        {
        	if(typeof o !== 'object')return;
        	if(!_model)return;
        	if(_model.AvailablePromotions.length === 0)return;
        	var prop,
        		arr,
        		i,
        		promo,
        		iL;
        	for(prop in o)
        	{
        		if(prop === "AvailablePromotions" || prop === "Promotions")
        		{
        			arr = o[prop];
        			i = 0;
        			iL = arr.length;
        			for(; i < iL; i++)
        			{
        				promo = getObject(arr[i].ID, _model.AvailablePromotions);
        				// Get the promotion from the global model array
        				if(promo)arr[i].Index = promo.Index;
        			}
        		}
        		else
        		{
        			addPromoIndexes(o[prop]);
        		}
        	}
        }

        /**
         * Method which accepts the conflict
         */
        this.acceptConflict = function()
        {
        	// Start loading again
        	_instance.dispatchEvent(new be.marlon.DataEvent(be.marlon.Service.LOAD_DATA));
            // Start the compare load procedure
            startCompareLoad();
        };

        /**
         * Method which declines the conflict
         */
        this.declineConflict = function()
        {
            // Remove configuration
            _initConfiguration = null;

            // Make sure the full load is set to false
            _bLoadEngineGrades = false;
            _bLoadPacks = false;
        };
    };
    be.marlon.Controller.prototype = new be.marlon.EventDispatcher();
    be.marlon.Controller.prototype.constructor = be.marlon.Controller;
})(); 