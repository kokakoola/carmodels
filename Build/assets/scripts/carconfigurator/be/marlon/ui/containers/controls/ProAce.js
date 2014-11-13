/** @jsx React.DOM */
(function() {
    
    var _utils,
        _dictionary;
        
    var _visible = false,
        _aSliders,
        
        _aPrevSelected = [],
        _aCars = null,
        _aFilters = null,
        _userConfig = null,
        _car,
        _defaultCar,
        _equipment,
        _updateVehicleRanges = false,
        
        _btImage,
        _capImage1,
        _capImage2,
        _doorsImage,
        
        // Constants
        _BT_SLIDER_1 = "TYPE_SLIDER_1",
        _BT_SLIDER_2 = "TYPE_SLIDER_2",
        _CAP_SLIDER_1 = "CAP_SLIDER_1",
        _CAP_SLIDER_2 = "CAP_SLIDER_2",
        _CAP_SLIDER_3 = "CAP_SLIDER_3",
        _DOOR_SLIDER_1 = "DOORS_SLIDER_1",
        _DOOR_SLIDER_2 = "DOORS_SLIDER_2",
        
        _excludeEquipSliders = [_CAP_SLIDER_3, _DOOR_SLIDER_1, _DOOR_SLIDER_2];
    
    /**
     * Contains logic for rendering a ProAce component
     */
    var ui = be.marlon.ui;
    // Instantiate the Exterior class
    ui.ProAce = React.createClass(
        {displayName: 'ProAce',
            _instance:null,
            // Reference the max height of the filterstep here
            totalHeight:1024,
            
            /* ---------------------------------------------------------------------------------------------------------------
             * PUBLIC
            --------------------------------------------------------------------------------------------------------------- */
            
	        /**
	    	 * Method which returns the current selected configuration 
	    	 */
	    	getConfiguration:function()
	    	{
	    		if(_car && _equipment)
	    		{
	    			return {
	    				CarID:_car.ID,
	    				Options:_equipment
	    			};
	    		}
	    		else
	    		{
	    			return null;
	    		}
	    	},
            
            /**
             * Method which configures the slider based on the given configuration 
             */
            setConfiguration:function(config)
            {
                // Save the userconfig
                _userConfig = config;
                // Temp references
                var i = 0,
                    iL = _aCars.length,
                    o,
                    aMatches = [];
                // Check if the currently selected _car matches with the config CarID
                if (_car) this.checkConfiguration(_car, config, aMatches);
                // Check if any of the cars matches the config CarID
                if (aMatches.length === 0) {
                    for (; i < iL; i++) {
                        o = _aCars[i];
                        this.checkConfiguration(o, config, aMatches);
                        o = null;
                    }
                }
                // If matches are found, do stuff
                if (aMatches.length > 0) {
                    // Sort the matches
                    aMatches.sort(this.sortMatches);
                    o = aMatches.pop().o;
                }
                if (o) {
                    this.reset(o);
                }
            },
            
            /**
             * Method which resets the filter step 
             */
            reset:function(car)
            {
                // Reset vehicle ranges array
                _updateVehicleRanges = false;
                // Set the filters with default values!
                _car = !car ? _defaultCar : car;
                // Add the index of the first filter's value to the previous selected
                this.addPreviousSelected({
                    id:_car.FilterValues[0].ID,
                    index:0
                });
                this.setFilters(_car, false);
                this.calcEquipment();
                // Populate the capacity table
                this.renderCapacityTable();
                // Update the images
                this.updateImages();
                // Initiate the callback
                this.props.selectHandler(this.getConfiguration());
            },
            
            /**
             * Method which activates this control 
             */
            activate:function(reset)
            {
                // Set the default car
                _defaultCar = this.getDefaultCar();
                // Reset the filterstep
                if(reset) this.reset();
            },
            
            /**
             * Method which returns the default configuration 
             */
            getDefaultCar:function()
            {
                // Return if not set
                //if (!_aCars || !_aFilters) return;
                // Temp references
                var i = 0,
                    iL = _aCars.length,
                    t,
                    tL = _aFilters.length,
                    c,
                    f;
                // Return first
                if (typeof _aFilters[0].DefaultValueID == "undefined") return _aCars[0];
                // Loop  
                for (; i < iL; i++) {
                    c = _aCars[i];
                    for (t = 0; t < tL; t++) {
                        if (c.FilterValues[t].ID != _aFilters[t].DefaultValueID) {
                            t = -1;
                            break;
                        }
                    } if (t != -1) {
                        return c;
                    }
                }
                return _aCars[0];
            },
            
            /* ---------------------------------------------------------------------------------------------------------------
             * PRIVATE
            --------------------------------------------------------------------------------------------------------------- */
            
            
            
            /* ---------------------------------------------------------------------------------------------------------------
             * TOOLS
            --------------------------------------------------------------------------------------------------------------- */
            
            /**
             * Method which sorts the array based on the length of the child elements 
             */
            sortMatches:function(a,b)
            {
                if(a.length > b.length) return 1;
                if(a.length == b.length) return 0;
                return 0; 
            },
            /**
             * Method which calculates the amount of equipment 
             */
            calcEquipment:function()
            {
                // Check if equipment should be added to the image or not
                _equipment = this.createEquipmentArray(_car);
            },
            
            /**
             * Method which creates a simple id array from the filtervalues 
             */
            createEquipmentArray:function(car)
            {
                // Check if equipment should be added to the image or not
                var i = 0,
                    iL = car.SelectedOptions.length,
                    equipment = [];
                for(; i < iL; i++)
                {
                    equipment.push(car.SelectedOptions[i].ID);
                }
                return equipment;
            },
            
            /**
             * Method which creates the image, from the image service 
             */
            createImage:function(frame, w, h)
            {
                var base = this.props.settings.ccisPath;
                // Add Country
                base += "/" + this.props.settings.country;
                // Add the vehicle identifier
                base += "/vehicle";
                // Add the model
                base += "/" + this.props.settings.modelID;
                // Add the car id
                base += "/" + _car.ShortID;
                // Add the rest of the image
                base += "/exterior-"+ frame + "_EYJ.jpg?width=" + w + "&height=" + h + "&scale-mode=1";
                // Add the equipment
                var i = 0,
                    aEquip = _car.SelectedOptions,
                    iL = aEquip.length,
                    o,
                    t = 0;
                for(; i < iL; i++)
                {
                    o = aEquip[i];
                    if(o.ShowsOnCar === true)
                    {
                        t ++;
                        if(t==1)base += "&option=";
                        base += o.ShortID;
                        base += ",";
                    }
                }
                if(t>0)base = base.substr(0,base.length-1);
                return base;
            },
            
            /**
             * Method which checks a car object against the given full configuration object 
             */
            checkConfiguration:function(car, config, aMatches)
            {
                var aEquipment,
                    gL = config.Options.length,
                    tL,
                    t,
                    g;
                if (config.CarID == car.ID) {
                    aEquipment = this.createEquipmentArray(car);
                    tL = aEquipment.length;
                    // Or that no equipment is present at all
                    if (gL === 0 && tL === 0) {
                        aMatches.push({o:car, length:aEquipment.length});
                        return;
                    }
                    // Make sure the configurations options length is bigger then the length of the equipment
                    else if(gL >= tL && tL >= 0) {
                        // Check availability of the options on the full configuration object
                        for (t = 0; t < tL; t++) {
                            for (g = 0; g < gL; g++) {
                                if (aEquipment[t] == config.Options[g]) {
                                    // Match made!
                                    g = -1;
                                    break;
                                }
                            }
                            if (g != -1) {
                                t = -1;
                                break;
                            }
                        }
                        if (t != -1) {
                            aMatches.push({o:car, length:aEquipment.length});
                        }
                    }
                }
            },
            
            /**
             * Method which adds a value to the previous selected array 
             */
            addPreviousSelected:function(obj)
            {
                var i = 0,
                    iL = _aPrevSelected.length;
                for (; i < iL; i++) {
                    if(_aPrevSelected[i].index == obj.index) {
                        _aPrevSelected.splice(i,1);
                        break;
                    }
                }
                if (_aPrevSelected.length == 3) _aPrevSelected.shift();
                _aPrevSelected.push(obj);
            },
            /**
             * Method which returns a car, taking into account the previous selected logic 
             */
            getPreviousSelectedCar:function()
            {
                var i = _aPrevSelected.length-1,
                    ps,
                    mtch,
                    aMatches = [_aCars];
                
                for(; i >= 0; i--)
                {
                    ps = _aPrevSelected[i];
                    aMatches.push(this.getMatches(ps.id, ps.index, aMatches[aMatches.length-1]));
                    // Check if the newly added array contains elements/matches
                    if(aMatches[aMatches.length-1] === 0)break;
                }
                // Remove the entire cars array reference
                aMatches.shift();
                // Now get the last array which contained elements
                i = aMatches.length - 1;
                for(; i >= 0; i--)
                {
                    mtch = aMatches[i];
                    if(mtch.length > 0)break;
                }
                
                return (mtch.length > 0) ? mtch : null;
            },
            /**
             * Method which returns an array of matches based on the given criteria 
             */
            getMatches:function(filterValueID, filterIndex, aCars)
            {
                var i = 0,
                    iL = aCars.length,
                    aMatches = [];
                    
                for (; i < iL; i++) {
                    if (aCars[i].FilterValues[filterIndex].ID === filterValueID) {
                        aMatches.push(aCars[i]);
                    }
                }
                return aMatches;
            },
            
            /* ---------------------------------------------------------------------------------------------------------------
             * UPDATE VIEW
            --------------------------------------------------------------------------------------------------------------- */
            
            renderCapacityTable:function()
            {
            	var sName = "capacityList";
                if (this.refs && this.refs[sName])this.refs[sName].setState({data:_car.Capacity});
            },
            
            updateImages:function()
            {
            	var sName,
            		base = be.marlon.utils.cardbAssetPath;
            	if(this.refs)
            	{
            		sName = "btImage";
            		$(this.refs[sName].getDOMNode())[0].src = this.createImage(27, 380, 200);
            		sName = "capImage1";
            		$(this.refs[sName].getDOMNode())[0].src = base + "300" + "/" + _car.TrunkViewUrl;
            		sName = "capImage2";
            		$(this.refs[sName].getDOMNode())[0].src = base + "300" + "/" + _car.TopViewUrl;
            		sName = "doorsImage";
            		$(this.refs[sName].getDOMNode())[0].src = base + "300" + "/" + _car.OpenViewUrl;
            	}
            },
            
            setFilters:function(cd, updateUI)
            {
                // It is expected that the index of the value in the _aCars array matches the index of the corresponding slider in the _aSliders array
                var i = 0,
                    iL = cd.FilterValues.length;
                for (; i < iL; i++) {
                    if (_aSliders[i])
                        _aSliders[i].setValue(cd.FilterValues[i].ID);
                }
                // Calculate the ranges
                this.calculateRanges(updateUI);
            },
            
            calculateRanges:function(updateUI)
            {
                var i = 0,
                iL = _aSliders.length,
                slid,
                id,
                t,
                tL,
                k,
                kL,
                car,
                code,
                excluded,
                validates,
                aLogs,
                aRanges;
                
                for(; i < iL; i++)
                {
                    slid = _aSliders[i];
                    code = slid.getCode();
                    excluded = (code == _BT_SLIDER_1 || code == _BT_SLIDER_2);
                    aRanges = [];
                    // Get the car objects with the same values as the current selected one
                    tL = _aCars.length;
                    for(t = 0; t < tL; t++)
                    {
                        car = _aCars[t];
                        k = 0;
                        validates = true;
                        if(!_updateVehicleRanges && excluded && updateUI)
                        {
                            if (!this.checkFilterIndex((code == _BT_SLIDER_1) ? this.getSliderIndex(_BT_SLIDER_2) : this.getSliderIndex(_BT_SLIDER_1), i, car, false)) validates = false;
                        }
                        else
                        {
                            for(; k < iL; k++)
                            {
                                if(
                                    !this.checkFilterIndex(k, i, car, false)
                                )
                                {
                                    validates = false;
                                    break;
                                }
                            }
                        }
                        if(validates)
                        {
                            // Only add the first, so if no item with that id exists yet 
                            kL = aRanges.length;
                            id = car.FilterValues[i].ID;
                            validates = true;
                            for(k = 0; k < kL; k++)
                            {
                                if(aRanges[k].id == id)
                                {
                                    validates = false;
                                    break;
                                }
                            }
                            if(validates)
                            {
                                aRanges.push(
                                    {
                                        id:id,
                                        carindex:[t]
                                    }
                                );
                            }
                            else
                            {
                                aRanges[k].carindex.push(t);
                            }
                        }
                    }
                    slid.setRange(aRanges, updateUI);
                }
            },
            
            createSlider : function(code, index, width)
            {
                // Find data object
                var data = $.grep(_aFilters, function(fv) { return fv.Code == code; }) [0];
                if (data)
                {
                    // Create slider
                    var slider = ui.ProAceSlider({
                    	ref:code,
                        key:index,
                        code:code,
                        title:data.Label,
                        width:width,
                        values:data.Values,
                        defaultValue:data.DefaultValueID,
                        callback:this.updateSliderEventHandler
                    });
                    return slider;
                } else {
                    return null;
                }
            },
            
            /**
             * Method which returns a slider based on the code 
             */
            getSliderIndex:function(code)
            {
                var i = 0,
                    iL = _aSliders.length;
                for(; i < iL; i++)
                {
                    if(_aSliders[i].getCode() == code) return i;
                }
                return -1;
            },
            
            /**
             * Method which checks if the given slider index matches 
             */
            checkFilterIndex:function(i, index, car, compareEquip)
            {
                var val = false;
                if (i == index) {
                    val = true;
                } else {
                    if ( (car.FilterValues[i].ID == _car.FilterValues[i].ID) && (compareEquip ? compareEquipment(car.FilterValues[i].OptionalEquipment, _car.FilterValues[i].OptionalEquipment) : true)) {
                        val = true;
                    }
                }
                return (val);
            },
            
            /**
             * Method which creates the _aSliders array based on references 
             */
            referenceSliders:function()
            {
            	_aSliders = [];
            	var sName,
            		o;
            	if(this.refs)
            	{
					sName = "TYPE_SLIDER_1";
					o = this.refs[sName];
					if(o)_aSliders.push(o);
					sName = "TYPE_SLIDER_2";
					o = this.refs[sName];
					if(o)_aSliders.push(o);
					sName = "CAP_SLIDER_1";
					o = this.refs[sName];
					if(o)_aSliders.push(o);
					sName = "CAP_SLIDER_2";
					o = this.refs[sName];
					if(o)_aSliders.push(o);
					sName = "CAP_SLIDER_3";
					o = this.refs[sName];
					if(o)_aSliders.push(o);
					sName = "DOORS_SLIDER_1";
					o = this.refs[sName];
					if(o)_aSliders.push(o);
					sName = "DOORS_SLIDER_2";
					o = this.refs[sName];
					if(o)_aSliders.push(o);
            	}
            },
            
            /* ---------------------------------------------------------------------------------------------------------------
             * EVENT HANDLERS
            --------------------------------------------------------------------------------------------------------------- */
            
            /**
             * Method which handles the update event from the sliders 
             */
            updateSliderEventHandler:function(sliderData, sliderValue, sliderRange)
            {
                // Get carindex
                var carIndex = "";
                $.each(sliderRange, function(i, sr) {
                    if (sr.id === sliderValue.ID)
                        carIndex = sr.carindex;
                });
                // Notify salesman iOS app
                this.updateSlider(sliderData.code, sliderData.key, sliderValue.ID, carIndex);
                PubSub.publish('cc_salesman_proaceslider', {code:sliderData.code, key:sliderData.key, hash:be.marlon.utils.stringToHashCode(sliderValue.Label), carindex:carIndex});
            },
            
            simulateUpdateSlider:function(sliderCode, sliderKey, sliderValueInternalID, carIndex)
            {
                var sliderValueID = sliderValueInternalID;
                // Find matching sliderValueID
                $.each(_aSliders, function(i, s) {
                    if (s.props.code == sliderCode)
                    {
                        $.each(s.getValues(), function(ii, v) {
                            if (be.marlon.utils.stringToHashCode(v.Label) == sliderValueInternalID) {
                                sliderValueID = v.ID;
                            }
                        });
                    }
                });
                
                this.updateSlider(sliderCode, sliderKey, sliderValueID, carIndex);
            },
            
            updateSlider:function(sliderCode, sliderKey, sliderValueID, carIndex)
            {
                var i = 0,
                    t,
                    iL = _aFilters.length,
                    car = null,
                    matches;
                
                if (sliderCode !== _BT_SLIDER_1 && sliderCode !== _BT_SLIDER_2) _updateVehicleRanges = true;
                
                // Add the index of the previous selected value
                this.addPreviousSelected( { id:sliderValueID, index:sliderKey } );
                
                // If the data navigated to is enabled, get the first car id which matches the slider value
                if(carIndex !== "" && _updateVehicleRanges)
                {
                    matches = carIndex;
                    if(_userConfig)
                    {
                        iL = matches.length;
                        for(i = 0; i < iL; i++)
                        {
                            car = _aCars[matches[i]];
                            if(car.ID == _userConfig.CarID)
                            {
                                break;
                            }
                            car = null;
                        }
                    }
                    if(!car)car = _aCars[matches[0]];
                }
                // If the data isn't enabled, get the first car id which is available for the new data value
                else {
                    matches = this.getPreviousSelectedCar();
                    if (matches) {
                        if (_userConfig) {
                            iL = matches.length;
                            for(i = 0; i < iL; i++)
                            {
                                car = matches[i];
                                if(car.ID == _userConfig.CarID)
                                {
                                    break; 
                                }
                                car = null;
                            }
                        }
                        if (!car) car = matches[0];
                    }
                }
                // Save the car
                if (car) {
                    _car = car;
                } else {
                    return;
                }
                
                if(carIndex !== "" && _updateVehicleRanges)
                {
                    // Calculate the ranges
                    this.calculateRanges(true);
                }
                // Why was this in else method?? v v v
                //else
                //{
                    // Update the filter values!
                    this.setFilters(_car, true);
                //}
                
                // Calculate the equipment
                this.calcEquipment();
                // Populate the capacity table
                this.renderCapacityTable();
                // Update the images
                this.updateImages();
                // Initiate the callback
                this.props.selectHandler(this.getConfiguration());
            },
            
            nextStepClickHandler:function(e)
            {
                this.props.nextHandler();
            },
            
            showFullscreenImageHandler:function(e)
            {
                var url = "",
                	base = be.marlon.utils.cardbAssetPath;
                switch (e) {
                    case "type": url = this.createImage(27, 380, 200); break;
                    case "cap1": url = base + "300" + "/" + _car.TrunkViewUrl; break;
                    case "cap2": url = base + "300" + "/" + _car.TopViewUrl; break;
                    case "door": url = base + "300" + "/" + _car.OpenViewUrl; break;
                }
                // TODO > show fullscreen image + adjust sizes here ^
                //console.log("show fullscreen: " + url);
            },
            
            
            /* ---------------------------------------------------------------------------------------------------------------
             * REACT METHODS
            --------------------------------------------------------------------------------------------------------------- */
            
            componentWillMount:function()
            {
                // Utils
                if(!this._instance) this._instance = this;
                if(!_utils) _utils = be.marlon.utils;
                if(!_dictionary) _dictionary = _utils.Dictionary;
                
                // Save values
                _aCars = this.props.data.Cars;
                _aFilters = this.props.data.Filters;
                _hasPacks = this.props.data.HasPacks;
                _hasAccessories = this.props.data.HasAccessories;
            },
            
            /**
             * Method called when the component did mount 
             */
            componentDidMount:function()
            {
            	this.referenceSliders();
            	this.activate(true);
            },
            
            /**
             * Method called right before the proace is updated 
             */
            componentWillUpdate:function(nextProps, nextState)
            {
            	if(nextState.config)
            	{
                	// Set the config!
                	this.setConfiguration(nextState.config);
                	// Save the default car
                	_defaultCar = this.getDefaultCar();
                	// Reset the filterstep
                	//this.reset();
				}
            },
            
            /**
             * Method which checks if the proace should update when receiving new data 
             */
            shouldComponentUpdate:function(nextProps, nextState)
            {
            	if(this.updateHeight)this.updateHeight();
            	return false;
            },
            
            /**
             * Method called when the component did update 
             */
            componentDidUpdate:function()
            {
                this.referenceSliders();
            },
            
            /**
             * Returns the initial state of the proace 
             */
            getInitialState:function() {
                return ({});
            },
            
            /**
             * React method which renders this component 
             */
            render:function() {
                var showFullscreenImage = this.showFullscreenImageHandler,
                    nextStepClick = this.nextStepClickHandler;
                
                var sliders = [];
                var i = 0,
                	o;
                o = this.createSlider("TYPE_SLIDER_1", i, 516);
                sliders.push(o);
                if(o)i++;
                o = this.createSlider("TYPE_SLIDER_2", i, 516);
                sliders.push(o);
                if(o)i++;
                o = this.createSlider("CAP_SLIDER_1", i, 280);
                sliders.push(o);
                if(o)i++;
                o = this.createSlider("CAP_SLIDER_2", i, 280);
                sliders.push(o);
                if(o)i++;
                o = this.createSlider("CAP_SLIDER_3", i, 280);
                sliders.push(o);
                if(o)i++;
                o = this.createSlider("DOORS_SLIDER_1", i, 516);
                sliders.push(o);
                if(o)i++;
                o = this.createSlider("DOORS_SLIDER_2", i, 516);
                sliders.push(o);
                
                return(
                    React.DOM.section( {className:"cc-proace cc-abs-item"}, 
                        /* TYPE OF VEHICLE */
                        React.DOM.section( {className:"cc-border cc-first"}, 
                            React.DOM.h1(null, _dictionary.getLabel("typeOfVehicle")),
                            React.DOM.div( {className:"cc-cols clearfix"}, 
                                React.DOM.div( {className:"cc-col cc-col-7"}, 
                                    sliders[0],
                                    sliders[1]
                                ),
                                React.DOM.div( {className:"cc-col cc-col-5 cc-image"},                         
                                    React.DOM.img( {src:"", alt:"", ref:"btImage"})
                                    /*<a onClick={function(e){ showFullscreenImage("type"); }} className="btn btn-grey btn-small cc-btn cc-btn-enlarge">
                                        <i className="cc-icon icon-search"></i>
                                    </a>*/
                                )
                            )
                        ),
                        
                        /* CAPACITY */
                        React.DOM.section( {className:"cc-border"}, 
                            React.DOM.h1(null, _dictionary.getLabel("filterCapacity")),
                            React.DOM.div( {className:"cc-cols clearfix"}, 
                                sliders[2],
                                sliders[3],
                                sliders[4]
                            ),
                            /* DIMENSION LIST */
                            React.DOM.div( {className:"cc-cols clearfix"}, 
                                React.DOM.div( {className:"cc-col cc-col-8"}, 
                                    React.DOM.div( {className:"cc-box clearfix"}, 
                                        React.DOM.div( {className:"cc-cols clearfix"}, 
                                            React.DOM.div( {className:"cc-col cc-col-6"}, 
                                                CapacityList( {ref:"capacityList"})
                                            ),
                                            React.DOM.div( {className:"cc-col cc-col-6 cc-image"}, 
                                                React.DOM.img( {src:"", alt:"", ref:"capImage1"})
                                                /*<a onClick={function(e){ showFullscreenImage("cap1"); }} className="btn btn-grey btn-small cc-btn cc-btn-enlarge">
                                                    <i className="cc-icon icon-search"></i>
                                                </a>*/
                                            )
                                        )
                                    )
                                ),
                                React.DOM.div( {className:"cc-col cc-col-4 cc-image"}, 
                                    React.DOM.img( {src:"", alt:"", ref:"capImage2"})
                                    /*<a onClick={function(e){ showFullscreenImage("cap2"); }} className="btn btn-grey btn-small cc-btn cc-btn-enlarge">
                                        <i className="cc-icon icon-search"></i>
                                    </a>*/
                                )
                            )
                        ),
                        
                        /* DOORS */
                        React.DOM.section( {className:"cc-border"}, 
                            React.DOM.h1(null, _dictionary.getLabel("filterDoors")),
                            React.DOM.div( {className:"cc-cols clearfix"}, 
                                React.DOM.div( {className:"cc-col cc-col-7"}, 
                                    sliders[5],
                                    sliders[6]
                                ),
                                React.DOM.div( {className:"cc-col cc-col-5 cc-image"}, 
                                    React.DOM.img( {src:"", alt:"", ref:"doorsImage"})
                                    /*<a onClick={function(e){ showFullscreenImage("door"); }} className="btn btn-grey btn-small cc-btn cc-btn-enlarge">
                                        <i className="cc-icon icon-search"></i>
                                    </a>*/
                                )
                            )
                        ),
                        
                        /* FOOTER (NextStep button) */
                        React.DOM.section( {className:"cc-actions"}, 
                            React.DOM.a( {onClick:nextStepClick, className:"current-parent btn btn-red btn-small cc-btn cc-btn-next"}, 
                                _dictionary.getLabel("nextStep"),
                                React.DOM.i( {className:"icon-chevron-right"})
                            )
                        )
                        
                    )
                );
           },
           
           // Define the mixins here so they get called after the internal methods are finished updating
           mixins:[be.marlon.utils.Mixins.Mount]
        }
    );
    
    var CapacityList = React.createClass({displayName: 'CapacityList',
        render: function() {
            // Return table
            if (this.state && this.state.data)
            {
                var i = 0;
                return (
                    React.DOM.table(null, 
                        React.DOM.tbody(null, 
                            this.state.data.map(function (c) {
                                i++;
                                return (
                                    React.DOM.tr( {key:i}, 
                                        React.DOM.td(null, 
                                            React.DOM.span( {className:"cc-number"}, i),
                                            c.Name
                                        ),
                                        React.DOM.td( {className:"cc-right"}, c.Value)
                                    )
                                );
                            })
                        )
                    )                    
                );
            } else {
                return (React.DOM.table(null));
            }
        }
    });
    
}());