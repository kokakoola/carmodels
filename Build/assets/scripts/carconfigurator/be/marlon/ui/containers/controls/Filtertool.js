/** @jsx React.DOM */
(function() {

    /**
     * Renders the filtertool
     */
    var ui = be.marlon.ui,
        bt = be.marlon.Brighttag;
    var _lastSliderUpdate = null,
        _showGrades = false;
    
    var _utils,
        _dictionary;
        
    var _selectedModel = null;
    var _shouldReset = false,
    	_errorHandler,
        _shouldUpdate = false;
        
    var _gradeSelectedCallback = null;
    
    // Create the filtertool container
    function Filtertool()
    {
    	this.mixins = [be.marlon.utils.Mixins.Height, be.marlon.utils.Mixins.Mount];
    	
        var _instance,
        	_initialized = false;
        
        // Data
        var _aftController;
        var _filterResults = null;
        var _grades = [];
        
        // Elements
        var _filterBarComponent,
            _filterResultsComponent;
        
        ///////////////////////////////////////////
        // The price formatting is done in the cc controller and has been removed from the aft controller
        // this.props.controller.formatPrice(19568,true);
        ///////////////////////////////////////////
        
        function setFilter(ID, value, shouldFetchGrades) {
            _filterResults = _aftController.setFilterValue(ID, value);
            _instance.setState({filterResults:_filterResults});
            // Also get grades if needed
            if (shouldFetchGrades && _showGrades && _filterResults[0].length <= 3 && _filterResults[0].length > 0) {
                var newIDs = getModelIDsForGrades(_filterResults[0]);
                // Only call controller if neccessary...
                // Grades should have been rendered automatically if already present
                if (newIDs.length > 0) {
                    _instance.props.controller.getModelSubsetGrades(newIDs);
                }
            }
        }
        
        function resetFilter() {
            _filterResults = null;
            _shouldReset = true;
            _aftController.reset();
            _instance.setState({filterResulsts:null}, stateUpdateComplete);
        }
        function stateUpdateComplete()
        {
        	heightUpdate();
        }
        
        function selectModel(model) {
            if (!_selectedModel || _selectedModel.ID !== model.ID) {
                _selectedModel = model;
                _instance.forceUpdate(updateCompleted);
            }
        }
        
        this.resetSelectedModel = function() {
        	_selectedModel = null;
            _instance.forceUpdate();
        };
        
        this.getSelectedModel = function() {
            return _selectedModel;
        };
        /**
         * Method called after the update has been completed when a model has been selected 
         */
        function updateCompleted()
        {
        	this.props.modelSelected(this.getSelectedModel());
        }
        
        function getModelIDsForGrades(models) {
            var IDs = [],
                ID = null,
                found = false;
            // Loop through remaining models
            $.each(models, function (i, m) {
                found = false;
                ID = m.ID ? m.ID : m.ModelId;
                // Check if grades are already loaded for this model
                $.each(_grades, function(j, g) {
                    if (g.ModelSubSetID == m.ID)
                        found = true;
                });
                // Add to retreival list if not loaded yet
                if (!found)
                    IDs.push(ID);
            });
            return IDs;
        }
        
        // Save grades and update render
        function modelSubsetGradesLoaded(newGrades) {
            _grades = _grades.concat(newGrades.data);
            _instance.forceUpdate();
        }
        
        // Attaches the loaded grades to the filtered models
        function combineModelData() {
            var models = _filterResults ? _filterResults[0] : _aftController.getData().filteredModels[0];
            $.each(_grades, function(i, g) {
                $.each(models, function(j, m) {
                    if (m.ID == g.ModelSubSetID || m.modelID == g.ModelSubSetID) {
                        m.Grades = g.Grades;
                    }
                });
            });
            return models;
        }
        
        // Combines filter data with filter ranges, etc.
        function combineFilterData() {
            // Create returnvalue
            var filterData = [];
            // Get original data
            var data = _aftController.getData();
            var values = _aftController.getActiveFilters();
            var ranges = _filterResults ? _filterResults[2] : [];
            // Combine data
            $.each(data.filters, function(i1, f) {
                // Sliders
                if (f.ListOfValues === null) {
                    // Insert current slidervalue
                    $.each(values, function(i2, v) {
                        if (v.Code == f.Code) { f.CurrentValue = v.Value; }
                    });
                    // Push slider ranges
                    f.Range = null;
                    $.each(ranges, function(i3, r) {
                        if (r.Code == f.Code) { f.Range = r; }
                    });
                // Checkboxlists                 
                } else {
                    // Insert current checkbox values
                    $.each(f.ListOfValues, function(i4, co) {
                        $.each(values, function(i5, vco) {
                            if (co.ID == vco.ID) { co.CurrentValue = vco.Value; }
                        });
                    });
                }
                filterData.push(f);
            });
            return filterData;
        }
        
        /**
         * Method which initializes this control as soon as the relevant data is available 
         */
        function initControl(filterData, modelData)
        {
        	if(filterData && modelData && !_initialized)
        	{
        		// Only initialize once
        		_initialized = true;
        		// Flags
	            _showGrades = _instance.props.settings.showFilterGrades;
	            // Initialize controller
	            _aftController = new be.marlon.aft.Controller(_instance.props.settings);
	            _aftController.injectData(filterData, modelData);
	            // Controller
	            _instance.props.controller.addEventListener(be.marlon.Service.MODELSUBSETGRADES_LOADED, modelSubsetGradesLoaded);
        	}
        }
        
        /**
         * Method which is called when the height of the collapsable side bar is updated 
         */
        function heightUpdate()
        {
        	_instance.updateHeight();
        }
        
        /**
         * Method which is called when the preloader has been mounted 
         */
        function preLoaderMountHandler(item)
        {
        	// Set the top of the preloader
        	var h = $(window).height() * 0.5 - 100;
        	$(item.getDOMNode()).css({marginTop:h});
        }
        
        this.componentWillMount = function() {
            // Utils
            if(!_instance) _instance = this;
            if(!_utils) _utils = be.marlon.utils;
            if(!_dictionary) _dictionary = _utils.Dictionary;
            // Save "global" error handler
            _errorHandler = this.props.errorHandler;
            // Save callback reference
            _gradeSelectedCallback = this.props.gradeSelected;
            // Initialize the filtertool control
            initControl(this.props.filterData, this.props.modelData);
        };
        
        this.componentWillUpdate = function(nextProps, nextState)
        {
        	// Initialize the filtertool control
            initControl(nextProps.filterData, nextProps.modelData);
        };
        
        this.render = function() {
        	// Get all data (all models & filters)
            var modelData,
            	filterData,
            	PreLoader = ui.PreLoader,
            	loader = null;
            
            if(_initialized)
            {
            	modelData = combineModelData();
            	filterData = combineFilterData();
            }
            else
            {
            	loader = PreLoader( {size:_utils.LARGE, visible:true, componentDidMount:preLoaderMountHandler});
            }
            
            _filterBarComponent = (filterData && filterData.length > 0)?FilterBarComponent( {data:filterData, setFilterCB:setFilter, resetFilterCB:resetFilter, heightUpdate:heightUpdate}):null;
            _filterResultsComponent = _filterBarComponent?FilterResults( {gradeSelectHandler:this.props.gradeSelected, data:modelData, selectModelCB:selectModel, settings:this.props.settings}):null;

            // Return element
            return (
                React.DOM.div( {className:"cc-abs-item cc-filtertool"}, 
                    React.DOM.div( {className:"cc-cols cc-padding-top clearfix"}, 
                        _filterBarComponent,
                        _filterResultsComponent,
                        loader
                    )
                )
            );
        };
    }
    
    // Instantiate the filtertool class
    ui.Filtertool = React.createClass(
        new Filtertool()
    );
    
    /* --- FILTERS -------------------------------------------------------------------------- */
    
    var FilterBarComponent = React.createClass({displayName: 'FilterBarComponent',
        
        /* --- Fields -------------------------------------- */
        
        setFilterCB:null,
        resetFilterCB:null,
        
        /* --- Callback methods ---------------------------- */
        
        handleCheckboxChange : function (ID, code)
        {
            _shouldUpdate = true;
            var value = true;
            // Find current value for this checkbox in filterValues
            $.each(this.props.data, function(i, f) {
                if (f.ListOfValues) {
                    $.each(f.ListOfValues, function(i2, cf) {
                        if (cf.ID == ID) { value = !cf.CurrentValue; }
                    });
                }
            });
            
            // Manage the webtrends
            var fValue = "";
            switch(code)
            {
            	case "BODY_CHKLIST_1":
            		fValue = "type-of-vehicle";
            	break;
            	case "ENG_CHKLIST_1":
            		fValue = "engine-and-performance";
            	break;
            }
            bt.track({
                action: 'cc_action',
                value: 'filter-' + fValue
            });
            
            // Callback with toggled value
            if (this.setFilterCB !== null) this.setFilterCB(ID, value, true);
        },
        handleSliderChange : function (ID, value, shouldFetchGrades)
        {
            var caller = $.grep(this.props.data, function(fv){ return fv.Code == ID; })[0];
            _lastSliderUpdate = caller;
            
            // Manage the webtrends
            var fValue = "";
            switch(ID)
            {
            	case "PRICE":
            		fValue = "price";
            	break;
            	case "ENV_SLIDE_1":
            		fValue = "emissions";
            	break;
            	case "ENV_SLIDE_2":
            		fValue = "consumption";
            	break;
            	case "BODY_SLIDE_1":
            		fValue = "luggage-capacity";
            	break;
            	case "BODY_SLIDE_2":
            		fValue = "seats";
            	break;
            	case "ENG_SLIDE_1":
            		fValue = "top-speed";
            	break;
            	case "ENG_SLIDE_2":
            		fValue = "power-output";
            	break;
            }
            bt.track({
                action: 'cc_action',
                value: 'filter-' + fValue
            });
            
            if (this.setFilterCB !== null) this.setFilterCB(ID, value, shouldFetchGrades);
        },
        handleReset : function()
        {
            // Track click on reset button
            bt.track({
                componentname: 'carconfig',
                action: 'cc_action',
                value: 'filter-reset'
            });

            //_selectedModel = null;
            _lastSliderUpdate = null;
            if (this.resetFilterCB !== null) this.resetFilterCB();
        },
        
        /* --- Data filtering methods ---------------------- */
        
        getCheckboxValue : function(ID) {
            var returnValue;
            $.each(this.props.data, function(i, f) {
                if (f.ID == ID)
                    returnValue = f.Value; 
            });
            return returnValue;
        },
        createSlider : function(code, key)
        {
            // Find data object
            var data = $.grep(this.props.data, function(fv){ return fv.Code == code; })[0];
            if (data.Visible === false) {
                return null;
            } else {
                // If no range exists, make it match the from and to values
                if (_shouldReset) { data.Range = {Code:data.Code, From:data.From, To:data.To}; }
                // Create slider
                return ui.Slider({
                    key:key,
                    code:code,
                    title:data.Label,
                    width:190,
                    min:data.From,
                    max:data.To,
                    step:data.Step,
                    valuetext:data.SliderText,
                    defaultValue:data.DefaultValue,
                    valueUpdated:this.handleSliderChange,
                    //currentValue:data.CurrentValue,
                    range:data.Range,
                    reset:_shouldReset,
                    shouldUpdate:_shouldUpdate
                });
            }
            
        },
        // Checks to see if filter section should be shown
        hasFilterSection : function (codes)
        {
            var visible = false;
            var data = this.props.data;
            $.each(codes, function(i, c) {
                // Find data object
                var filterData = $.grep(data, function(fv){ return fv.Code == c; })[0];
                // Check if it's visible
                if (filterData.Visible === true) { visible = true; }
            });
            return visible;
        },
        
        /* --- Native methods ------------------------------ */
        
        componentDidUpdate : function()
        {
            _shouldReset = false;
            _shouldUpdate = false;
        },
        componentWillMount : function()
        {
            this.setFilterCB = this.props.setFilterCB;
            this.resetFilterCB = this.props.resetFilterCB;
        },
        render : function()
        {
            // Localize callback methods
            var handleChange = this.handleChange,
                handleCheckboxChange = this.handleCheckboxChange,
                getCheckboxValue = this.getCheckboxValue,
                handleReset = this.handleReset;
            
            // Find checklist data
            var _vehicleTypes,
                _engTypes;
            $.each(this.props.data, function(index, value) {
                switch (value.Code) {
                    case "BODY_CHKLIST_1": _vehicleTypes = value; break;
                    case "ENG_CHKLIST_1": _engTypes = value; break;
                    default: break;
                }
            });
            
            // Set values for vehicleTypes
            $.each(_vehicleTypes.ListOfValues, function(index, vt) {
                vt.Value = getCheckboxValue(vt.ID);
            });
            // Set values for engineTypes
            $.each(_engTypes.ListOfValues, function(index, et) {
                et.Value = getCheckboxValue(et.ID);
            });
            
            // Create the data object which feeds the sidepanel
			var SidePanel = ui.SidePanel,
    			spd = [];
    			
    		if (this.hasFilterSection(["PRICE"])) {
    		    spd.push(
    		        {
                        title:_dictionary.getLabel('priceRange'),
                        content:(
                            this.createSlider("PRICE")
                        ),
                        collapsed:true
                    }
    		    );
    		}
    		if (this.hasFilterSection(["BODY_SLIDE_1", "BODY_SLIDE_2"])) {
    		    spd.push(
    		        {
                        title:_dictionary.getLabel('typeOfVehicle'),
                        content:[
                            CheckBoxList( {key:0, data:_vehicleTypes.ListOfValues, code:_vehicleTypes.Code, callback:handleCheckboxChange} ),
                            this.createSlider("BODY_SLIDE_1", 1),
                            this.createSlider("BODY_SLIDE_2", 2)
                        ]
                    }
    		    );
    		}
    		if (this.hasFilterSection(["ENV_SLIDE_1", "ENV_SLIDE_2"])) {
    		    spd.push(
    		        {
                        title:_dictionary.getLabel('environmentalAspects'),
                        content:[
                            this.createSlider("ENV_SLIDE_1", 1),
                            this.createSlider("ENV_SLIDE_2", 2)
                        ],
                        collapsed:true
                    }
    		    );
    		}
    		if (this.hasFilterSection(["ENG_SLIDE_1", "ENG_SLIDE_2"])) {
    		    spd.push(
    		        {
                        title:_dictionary.getLabel('engineAndPerformance'),
                        content:[
                            CheckBoxList( {key:0, data:_engTypes.ListOfValues, code:_engTypes.Code, callback:handleCheckboxChange} ),
                            this.createSlider("ENG_SLIDE_1", 1),
                            this.createSlider("ENG_SLIDE_2", 2)
                        ],
                        collapsed:true
                    }
    		    );
    		}
			
			var postElements = [
				React.DOM.div( {key:0, className:"cc-box clearfix"}, 
                    React.DOM.div( {onClick:handleReset, className:"cc-contents"}, 
                        React.DOM.a( {className:"cc-restart"}, 
                            React.DOM.i( {className:"cc-icon icon-repeat"}),
                            _dictionary.getLabel('resetFilters')
                        )
                    )
                )
			];
			
			var preElements = [
			    React.DOM.div( {key:1, className:"cc-box cc-box-info clearfix"}, 
                    React.DOM.div( {className:"cc-contents"}, 
                        React.DOM.p(null, 
                            React.DOM.i( {className:"icon-info-sign cc-icon cc-icon-info"}),
                            _dictionary.getLabel('filterInfoDescription')
                        )
                    )
                )
			];
            
            // Build controls
            return (
            	SidePanel( {data:spd, heightUpdate:this.props.heightUpdate, preElements:preElements, postElements:postElements})
            );
        }
    });
    
    var CheckBoxList = React.createClass({displayName: 'CheckBoxList',
        render: function() {
            // Create reference to callbackmethod
            var callback = this.props.callback,
            	instance = this;
            // Return checkboxlist
            return (
                React.DOM.div( {className:"cc-checkboxes"}, 
                    this.props.data.map(function (box) {
                        return (
                            CheckBoxItem( {key:box.ID, code:instance.props.code, label:box.Label, value:box.CurrentValue, callback:callback} )
                        );
                    })
                )
            );
        }
    });
    
    var CheckBoxItem = React.createClass({displayName: 'CheckBoxItem',
        clickHandler: function(event) {
            this.props.callback(this.props.key, this.props.code);
        },
        render: function() {
            // Create reference to callbackmethod
            var handler = this.clickHandler;
            // Css state
            var CheckboxCSS = "cc-checkbox cc-checkbox-small";
            if (this.props.value) CheckboxCSS += " cc-checked";
            // Return checkbox
            return (
                React.DOM.div( {key:this.props.key, className:"cc-checkbox-label", onClick:handler}, 
                    React.DOM.span( {className:CheckboxCSS}),
                    this.props.label
                )
            );
        }
    });
    
    /* --- RESULTS -------------------------------------------------------------------------- */
    
    var FilterResults = React.createClass({displayName: 'FilterResults',
        render: function() {
            var instance = this;
            var cb = this.props.selectModelCB;

            if (this.props.data.length === 0) {
                return (
                    React.DOM.div( {className:"cc-col cc-col-9 cc-filter-results"}, 
                        React.DOM.div( {className:"no-results"}, 
                            React.DOM.i( {className:"icon-car1"}),
                            React.DOM.p(null, _dictionary.getLabel('noCarsFound'))
                        )
                    )
                );
            }
            else if (this.props.data.length < 4)
            {
                // Build items
                var models = this.props.data.map(function (model) {
                    return model !== undefined ? FilterItem( {key:model.ID, gradeSelectHandler:instance.props.gradeSelectHandler, large:true, data:model, selectModelCB:cb, settings:instance.props.settings}) : null;
                });
                // Return element
                return (
                    React.DOM.div( {className:"cc-col cc-col-9 cc-filter-results"}, 
                        React.DOM.div( {className:"cc-cols clearfix"}, 
                            models
                        )
                    )
                );
            }
            else
            {
                // Sort data into rows
                var nrOfRows = Math.ceil(this.props.data.length / 4);
                var rowsData = [];
                for (var i = 0; i < nrOfRows; i++) {
                    var rowData = [];
                    for (var j = 0; j < 4; j++) {
                        var d = this.props.data[(i * 4) + j];
                        if (d !== null) {
                            rowData.push(d);
                        }
                    }
                    rowsData.push(rowData);
                }
                // Render rows
                i = 0;
                var rows = rowsData.map(function (row) {
                    return FilterRow( {key:i++, data:row, gradeSelectHandler:instance.props.gradeSelectHandler, selectModelCB:cb, settings:instance.props.settings});
                });
                // Return element
                return (
                    React.DOM.div( {className:"cc-col cc-col-9 cc-filter-results"}, 
                        React.DOM.div( {className:"cc-cols clearfix"}, 
                            rows
                        )
                    )
                );
            }
        }
    });
    
    var FilterRow = React.createClass({displayName: 'FilterRow',
        render: function() {
            var cb = this.props.selectModelCB,
            	instance = this;
            var models = this.props.data.map(function (model) {
                return model !== undefined ? FilterItem( {key:model.ID, gradeSelectHandler:instance.props.gradeSelectHandler, large:false, data:model, selectModelCB:cb, settings:instance.props.settings}) : null;
            });
            return (
                React.DOM.div(null, 
                    models,
                    React.DOM.div( {className:"clearfix visible-md visible-lg"})
                )
            );
        }
    });
    
    var FilterItem = React.createClass({displayName: 'FilterItem',
        selectHandler: function() {
            this.props.selectModelCB(this.props.data);
        },
        gradeSelectHandler:function(gradeID)
        {
        	this.props.gradeSelectHandler(this.props.data.ModelId, gradeID);
        },
        render: function() {
            
            var selectHandler = this.selectHandler;
            
            {/* Flags */}
            var isLarge = this.props.large,
                isSelected = (_selectedModel !== null && _selectedModel.ID === this.props.data.ID),
                isHybrid = (this.props.data.Hybrid),
                shouldShowPrice = this.props.settings.showprice && (this.props.data.PriceFrom !== 0),
                hasPromo = (this.props.data.PromotionsCount > 0);
            
            {/* Find my filterValue */}
            var myFilterValue;
            if (_lastSliderUpdate !== null)
            {
                var isPrice = _lastSliderUpdate.Code == "PRICE";
                myFilterValue = _lastSliderUpdate.ValueText;
                {/* Find my filter object */}
                var dataObj = $.grep(this.props.data.FilterValues, function(fv){ return fv.FilterCode == _lastSliderUpdate.Code; });
                {/* Find my from-value for this filter */}
                if (dataObj !== null && dataObj[0] !== undefined) {
                    myFilterValue = myFilterValue.replace("{from}", isPrice ? _utils.formatPrice(dataObj[0].From, true) : dataObj[0].From);
                    myFilterValue = myFilterValue.replace("{to}", isPrice ? _utils.formatPrice(dataObj[0].To, true) : dataObj[0].To);
                }
            }
            
            {/* Hybrid or not */}
            var articleCSS = "cc-col";
            articleCSS += isLarge ? " cc-col-4" : " cc-col-3";
            if (isHybrid) articleCSS += " cc-hybrid";
            
            {/* Image url */}
            var imgUrl = this.props.settings.filterImagePath; // "http://150.45.91.70:6161"
            var imgSize = isLarge ? "BIG" : "MEDIUM";
            var imgObj = $.grep(this.props.data.Assets, function(a){ return a.Type == imgSize; });
            if (imgObj !== null && imgObj[0] !== null) {
            	if(typeof imgObj[0] === "undefined")
            	{
            		_errorHandler(
            			"No assets found for model subset " + this.props.data.Label
            		);
            	}
            	else
            	{
                	imgUrl += imgObj[0].Url;
				}
            }
            
            // Set the grade select handler
            var gradeSelectHandler = this.gradeSelectHandler;
            
            return (
                React.DOM.article( {className:articleCSS}, 
                    React.DOM.div( {className:"cc-inner" + (isSelected ? " cc-selected" : ""), onClick:selectHandler}, 
                        React.DOM.div( {className:"cc-thumb" + (isLarge? " cc-big":"")}, 
                            React.DOM.span( {className:"cc-checkbox" + (isSelected ? " cc-checked" : "")}),
                            React.DOM.img( {src:imgUrl}),
                            React.DOM.div( {className:"cc-meta clearfix"}, 
                                isHybrid ? React.DOM.div( {className:"cc-label"}, _dictionary.getLabel('hybrid')) : null,
                                hasPromo ? React.DOM.div( {className:"cc-promotion"}, _dictionary.getLabel('promotions'), " (",this.props.data.PromotionsCount,")") : null
                            )
                        ),
                        React.DOM.header(null, 
                            React.DOM.h1(null, 
                                React.DOM.span( {className:"cc-title"}, this.props.data.Label)
                            ),
                            shouldShowPrice ? React.DOM.div( {className:"cc-price-from"}, "from ", this.props.data.Label) : null,
                            shouldShowPrice || myFilterValue !== null ?
                                React.DOM.div( {className:"cc-price-monthly"}, 
                                    myFilterValue !== null ? myFilterValue : "monthly rate xx.xx€" 
                                )
                                : null
                            
                        )
                    ),
                    isLarge && _showGrades ?
                        React.DOM.div( {className:"cc-box cc-box-grades"}, 
                            React.DOM.div( {className:"cc-contents"}, 
                                React.DOM.h2(null, _dictionary.getLabel('availableGrades')),
                                React.DOM.ul(null, 
                                    this.props.data.Grades ?
                                        this.props.data.Grades.map(function (gi) {
                                            return (
                                                FilterGradeListItem( {key:gi.ID, data:gi, gradeSelectHandler:gradeSelectHandler} )
                                            );
                                        })
                                        : null
                                    
                                )
                            )
                        )
                    : null 
                )
            );
        }
    });
    
    var FilterGradeListItem = React.createClass({displayName: 'FilterGradeListItem',
        getInitialState:function() {
            return {showDetail:false};
        },
        handleOpen: function() {
            this.setState({showDetail : !this.state.showDetail});
        },
        gradeSelectHandler:function()
        {
        	this.props.gradeSelectHandler(this.props.key);
        },
        onMoreInfoClick: function() {
            window.open(this.props.data.DetailPage,'_blank'); // TODO: <- is this relative path correct?
        },
        render: function() {
            return (
                React.DOM.li(null, 
                    React.DOM.a( {onClick:this.handleOpen, className:"cc-toggle-grades-box"}, 
                        React.DOM.i( {className:"icon-info-sign cc-icon"}),
                        this.props.data.Name
                    ),
                    React.DOM.section( {className:"cc-details", style:{display : this.state.showDetail?'block':'none'}}, 
						React.DOM.a( {onClick:this.onMoreInfoClick, className:"btn btn-small cc-btn cc-btn-info"}, _dictionary.getLabel('moreInfo')),
                        React.DOM.a( {onClick:this.gradeSelectHandler, className:"btn btn-red btn-small"}, _dictionary.getLabel('configure')),
                        React.DOM.ul(null, 
                            this.props.data.FeatureEquipment.map(function (g) {
                                return (
                                    React.DOM.li( {key:g.ID}, g.Name)
                                );
                            })
                        )
                    )
                )
            );
        }
    });
    
}());