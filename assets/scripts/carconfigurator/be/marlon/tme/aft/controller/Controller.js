(function(){ 
	// Create the namespace!
	// Only create new be namespace if none already exists
	if(typeof(window.be) == "undefined")
	{
		window.be = {};
	}
	if(typeof be.marlon == "undefined")
	{
		be.marlon = {};
	}
	
	// Instantiate the aft controller
	if(typeof be.marlon.aft == "undefined")
	{
		be.marlon.aft = {};
	}
	
	// The controller class
	be.marlon.aft.Controller = function()
	{	
		//country, language, brand, flashContainer, preConfig, modelID
		//----------------------------------
		//  Properties
		//----------------------------------
		
		var _instance = this;
		
		var _filters;
		var _predefinedFilters;
		var _activeFilters; // This is the array which contains ID/value pair objects of the current filter values
		var _resetFilters; // This is the array containing all the default values, used for resetting the filters
		var _models;
		var _grades;
		
		var _usedFilters = {}; // Object of all actively used filters (excluding default values!);
		
		var _serviceVersion;
		var _version = "1.0.0.0";
		
		// Overwrite eventTypes, else they get shared
		this.eventTypes = [];
		this.eventHandlers = [];
		
		// Constant variables
		var COMPAREMODE = {	MINUS:"MINUS",
							PLUS:"PLUS",
							EQUAL:"EQUAL"};
		
		//----------------------------------
		//  Getters & setters
		//----------------------------------
		
		//----------------------------------
		//  Public methods
		//----------------------------------
		
		this.getData = function() {
		    var data = {};
            data.filters = _filters;
            data.models = _models;
            data.filteredModels = filter(false);
            return data;
		};
		
		// Returns the active filters
		this.getActiveFilters = function() { return _activeFilters; };
		
		// Returns an string containing all used filters
		this.getUsedFilters = function() { return _usedFilters; };
		
		// Method which returns the version of the JavaScript layer
		this.version = function() { return _version; };
		
		
		this.injectData = function(pFilters, pModels) {
		    _filters = pFilters;
		    _models = pModels;
		    initData();
		};
		
		/**
         * Method which sets the filter value
         * @param id:String the id of the filter which is filtered or in the case it's a slider, the code
         * @param value:* the value of the filter (boolean or numeric)
         */
        this.setFilterValue = function(id, value)
        {
            return setFilterValuePriv(id, value);
        };
		
		/**
		 * Method which resetes the active filters back to there default state 
		 */
		this.reset = function()
		{
			var i = 0,
				iLength = _activeFilters.length;
			for(i; i < iLength; i++)
			{
				_activeFilters[i].Value = _resetFilters[i];
			}
		};
		
		//----------------------------------
		//  Private methods
		//----------------------------------
		
		/**
		* Method which initializes the app if it has not been initalized yet
		*/
		function init() { }
		
		/**
		 * Method which is responsible for filtering the models based on the selected values in the filters
		 * @param updateRange:Boolean determines wheter to update the ranges of the slider based on the selected checkbox or not
		 */
		function filter(updateRange)
		{
			var aAdd = [], // This array will be populated with id's of models which are valid for the current filters
				aFAdd = [], // This array contains references to the full objects, internally used to potentially calculate the ranges
				aRemove = [],
				i,
				iLength,
				aValidates,
				validates = false, // Does the model validate
				validateChk = false,
				m,
				aChkGroups = populateCheckGroups(); // This array contains the FilterCode's of the checkbox groups, only the ones which have one or more elements selected are added
			
			// Loop through all the submodels
			i = 0;
			iLength = _models.length;
			for(i; i < iLength; i++)
			{
				// Default validation is false
				validates = true;
				validateChk = true;
				m = _models[i];
				// Check if the model is valid from the server side
				if(m.Valid)
				{
					aValidates = validateModel(m, aChkGroups);
					validates = aValidates[0];
					validateChk = aValidates[1];
				}
				if(validateChk && updateRange)
				{
					aFAdd.push(m);
				}
				if(validates)
				{
					aAdd.push(m);
				}
				else
				{
					aRemove.push(m);
				}
			}
			
			// Based on all models who validate, calculate the minimum ranges for each filter
			var aRanges = [];
			if(updateRange)
			{
				i = 0;
				iLength = aFAdd.length;
				// Add all filters of the specific 
				for(i; i < iLength; i++)
				{
					// Add all filterValues
					addFilters(aRanges, aFAdd[i]);
				}
			}
			return [aAdd, aRemove, aRanges];
		}
		
		/**
		 * Method which adds the filters to the ranges
		 * @param aRanges:Array
		 * @param m:ModelObject
		 */
		function addFilters(aRanges, m)
		{
			var i = 0,
				iLength = m.FilterValues.length,
				f,
				ff,
				o;
			for(i; i < iLength; i++)
			{
				f = m.FilterValues[i];
				if(f.Value === null)
				{
					o = getObject(f.FilterCode, aRanges);
					ff = getObject(f.FilterCode, _filters);
					// If it doesn't exist yet, create it!
					if(!o)
					{
						o = {};
						o.Code = f.FilterCode;
						// Check the compare method
						switch(ff.CompareMode)
						{
							case COMPAREMODE.PLUS:
									o.From = ff.From;
									o.To = f.To;
							break;
							case COMPAREMODE.MINUS:
									o.From = f.From;
									o.To = ff.To;
							break;
						}
						aRanges.push(o);
					}
					// Else check to update it's values
					else
					{
						// Check the compare method
						switch(ff.CompareMode)
						{
							case COMPAREMODE.PLUS:
									if(f.To > o.To)
									{
										o.To = f.To;
									}
							break;
							case COMPAREMODE.MINUS:
									if(f.From < o.From)
									{
										o.From = f.From;
									}
							break;
						}
					}
				}
			}
		}
		
		function setFilterValuePriv(id, value, predefined)
        {
            // Set the correct value on the filter
            var i = 0,
                iLength = _activeFilters.length,
                af,
                updateRange;
            for(i; i < iLength; i++)
            {
                af = _activeFilters[i];
                if(id == af.Code || id == af.ID)
                {
                    if (predefined) {
                        if (af.ID)
                        {
                            if (af.ID == value)
                            {
                                af.Value = true;
                                break;
                            }
                        }
                        else
                        {
                            af.Value = value;
                            break;
                        }
                    } else {
                        _usedFilters[id] = (value == _resetFilters[i]) ? null : value;
                        af.Value = value;
                        // This flag determines whether after filtering the ranges should be updated
                        updateRange = (id == af.ID);
                        break;
                    }
                }
            }
            // Do the filtering
            return filter(updateRange);
        }
		
        /**
         * Method which returns the model for the specific ID 
         */
        function getModel(id)
        {
            var i = 0,
                iL = _models.length,
                o;
            for(i; i < iL; i++)
            {
                o = _models[i];
                if(o.ID == id) return o;
            }
            return null;
        }
		
		/**
		 * Method which returns the object based on the id
		 * @param id:String
		 * @param a:Array
		 */
		function getObject(id, a)
		{
			var i = 0,
				iLength = a.length;
			for(i; i < iLength; i++)
			{
				if(a[i].Code == id)
				{
					return a[i];
				}
			}
			return false;
		}
		
		/**
		 * Method which creates an array containing the groups to skip, relevant to the checkboxe groups
		 * 
		 */
		function populateCheckGroups()
		{
			// Populate the aChkGroups array
			var i = 0,
				iLength = _activeFilters.length,
				af,
				aChkGroups = [];
			for(i; i < iLength; i++)
			{
				af = _activeFilters[i];
				if(af.Value === true)
				{
					if(!contains(aChkGroups, af.Code))
					{
						aChkGroups.push(af.Code);
					}
				}				
			}
			return aChkGroups;
		}
		
		/**
		 * Method which checks if the element is present in the array
		 * @param a:Array
		 * @param element:*
		 */
		function contains(a, element)
		{
			var i = 0,
				iLength = a.length;
			for(i; i < iLength; i++)
			{
				if(a[i] == element)
				{
					return true;
				}
			}
			return false;
		}
		
		/**
		 * Method which validates a model
		 * @param m:ModelObject
		 * @param aChkGroups:Array
		 */
		function validateModel(m, aChkGroups)
		{
			var i = 0,
				iLength = m.FilterValues.length,
				t,
				tLength = _activeFilters.length,
				mf,
				af,
				validates = true,
				chkValidator = [];
			// Loop through all filter values
			for(i; i < iLength; i++)
			{
				mf = m.FilterValues[i];
				// Loop through all the active filters
				t = 0;
				for(t; t < tLength; t++)
				{
					af = _activeFilters[t];
					// Check for the code!
					if(mf.FilterCode == af.Code)
					{
						// Check if it's a slider
						if(af.ID === "")
						{
							if(!checkComparisonMode(af.CompareMode, mf.From, mf.To, af.Value))
							{
								validates = false;
							}
						}
						// If it's a checkbox
						else
						{
							// If it is checked, mark the current filtergroup as true
							if(checkSelection(mf.Value))
							{
								if(!contains(chkValidator, af.Code)) chkValidator.push(af.Code);
							}					
						}
						break;
					}
				}
			}
			
			var validateChk = true;
			// Loop through the chkValidator
			if(chkValidator.length != aChkGroups.length)
			{
				validateChk = false;
				validates = false;
			}
			
			return [validates, validateChk];
		}
		
		/**
		 * Function to check the compare mode for the filter, which will validate the filter
		 * @param type: The compareType which will be used (EQUAL, MINUS, PLUS)
		 * @param from: The from value of the modelSubSet
		 * @param to: The to value of the modelSubSet
		 * @param value: The current selected filter value
		 * @return Boolean:True if it validates, false if it doesn't
		*/
		function checkComparisonMode(type, from, to, value)
		{
			switch(type)
			{
				case COMPAREMODE.PLUS:
					if(to >= value)
					{
						return true;
					}
				break;
				case COMPAREMODE.MINUS:
					if(from <= value)
					{
						return true;
					}
				break;
				case COMPAREMODE.EQUAL:
					if(from == value && to == value)
					{
						return true;
					}
				break;
			}
			return false;
		}
		
		/**
		 * Method which checks if the id of the model filter is present in the activeFilters list
		 * @param id:String
		 */
		function checkSelection(id)
		{
			var i = 0,
				iLength = _activeFilters.length,
				af,
				validates = true;
			
			for(i; i < iLength; i++)
			{
				af = _activeFilters[i];
				if(id == af.ID)
				{
					// If the active filter value is set to true and the id 
					return af.Value === true;
				}
			}
			return false;
		}
		
		//----------------------------------
		//  Private event handlers
		//----------------------------------
		
		/**
		* Method which is called when all the initial data is ready and to be send to the view
		*/
		function initData()
		{
			// Initialize the filters
			initFilters();
			
			// Create the object containing all the properties for further reference
			var data = {};
			data.filters = _filters;
			data.models = _models;
			data.grades = [];
			if (_predefinedFilters) {
			    for (var f in _predefinedFilters) {
			        setFilterValuePriv(_predefinedFilters[f].code, _predefinedFilters[f].value, true);
			    }
			}
			data.filteredModels = filter(false); 
		}
		
		/**
		 * Method which initializes the filters 
		 */
		function initFilters()
		{
			// Populate the _activeFilters array
			var i = 0,
				iLength = _filters.length,
				o,
				t,
				tLength;
			_activeFilters = [];
			_resetFilters = [];
			for(i; i < iLength; i++)
			{
				o = _filters[i];
				// Check the sliders
				if(o.Type == "SLIDER")
				{
					_resetFilters.push(o.DefaultValue);
					_activeFilters.push({"Code":o.Code, "ID":"", "Value":o.DefaultValue, "CompareMode":o.CompareMode});
				}
				// Check the checkboxes
				else if(o.Type == "CHECKBOX")
				{
					t = 0;
					tLength = o.ListOfValues.length;
					for(t; t < tLength; t++)
					{
						_resetFilters.push(false);
						_activeFilters.push({"Code":o.Code, "ID":o.ListOfValues[t].ID, "Value":false, "CompareMode":o.CompareMode});
					}
				}
				o = null;
			}
		}
		
	};
	be.marlon.aft.Controller.prototype = new be.marlon.EventDispatcher();
	be.marlon.aft.Controller.prototype.constructor = be.marlon.aft.Controller;
})(); 