/** @jsx React.DOM */
(function() {
    
    /**
     * Contains logic for rendering a pro ace slider component
     */
    var ui = be.marlon.ui;
    // Instantiate the Exterior class
    ui.ProAceSlider = React.createClass(
        {displayName: 'ProAceSlider',
            mixins:[be.marlon.utils.Mixins.Mount],
            
            _thumbDown:0,
            _thumbDownVal:0,
            
            _$thumb:null,
            
            _$rangeBar1:null,
            _$rangeBar2:null,
            _$rangeBar3:null,
            
            _$rangeValue:null,
            
            _value:0, // <- the selected value object
            _xPos:0, // <- the actual x position of the slider (is always stepped)
            _range:null,
            _minRange:0,
            _maxRange:0,
            
            _margin:0,
            _spacing:5,
            
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            // PUBLIC
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            
            getCode:function()
            {
                return this.props.code;
            },
            
            getValue:function()
            {
                return _value.ID;
            },
            
            getValues:function()
            {
                return this.props.values;
            },
            
            getElement:function()
            {
                return $(this.getDOMNode());
            },
            
            setValue:function(value)
            {
                // Find value object
                var valObj = null;
                $.each(this.props.values, function(i, v) {
                    if (v.ID === value) { valObj = v; }
                });
                // Set data + xPos & update
                if (valObj) {
                    this._value = valObj;
                    this._xPos = valObj.xPos - 13;
                    this.updateSlider(true);
                }
            },
            
            setRange:function(aID, updateUI)
            {
                this._range = aID;
                // Set full range (full white bar) as default
                var rangeStart = 2,
                    rangeWidth = this.props.width - 12;
                
                // Create availability array for easier looping e.g.: [false, false, true, true, false]
                var binary = [];
                $.each(this.props.values, function(i, v) {
                    binary[i] = ($.grep(aID, function(vv){ return vv.id == v.ID; }).length !== 0);
                });
                // Loop over binary and create array with range positions
                var cnt = binary.length,
                    spa = this._spacing,
                    totalW = this.props.width,
                    itemW = (totalW - (spa * (cnt-1))) / cnt;
                var rangePositions = [];
                var first = true;
                $.each(binary, function(i, b) {
                    if (b) {
                        if (first) {
                            first = false;
                            if (i === 0) {
                                rangeStart = 2;
                                rangeWidth = itemW + 2;
                            } else if (i === binary.length - 1) {
                                rangeStart = (i * (itemW + spa));
                                rangeWidth = itemW + 3;
                            } else {
                                rangeStart = (i * (itemW + spa));
                                rangeWidth = itemW + 3;
                            }
                        } else {
                            if (i === binary.length - 1) {
                                rangeWidth += (spa + itemW) - 1;
                            } else {
                                rangeWidth += (spa + itemW);
                            }
                        }
                    } else {
                        if (first === false) {
                            rangePositions.push({left:rangeStart, width:rangeWidth});
                            first = true;
                        }
                    }
                });
                // Check if not finished yet
                if (first === false) {
                    if (first === false) {
                        rangePositions.push({left:rangeStart, width:rangeWidth});
                        first = true;
                    }
                }
                // Render range array
                var animObj = {duration:200, queue:false};
                for (var i = 0; i < 3; i++) {
                    // Get target element
                    var targetBar;
                    switch (i) {
                        case 0: targetBar = this._$rangeBar1; break;
                        case 1: targetBar = this._$rangeBar2; break;
                        case 2: targetBar = this._$rangeBar3; break;
                    }
                    // Get target data
                    var rangeObj = rangePositions[i];
                    if (!rangeObj) { rangeObj = {left:0, width:0}; }
                    // Animate white bar
                    targetBar.animate(rangeObj, animObj);
                }
            },
            
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            // PRIVATE
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            
            updateSlider:function(animated)
            {
                // thumb & blue bar ( cut off 26px from max travel, should not cross bar ending )
                var thumbState = {left:Math.min(this._xPos, this.props.width-26)};
                // Update css
                if (animated) {
                    this._$thumb.animate(thumbState, {duration:200, queue:false});
                } else {
                    this._$thumb.css(thumbState);
                }
            },
            
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            // TOOLS
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            
            // Snaps an xPosition to the closest value
            snapPos:function(pos) {
                var resultValue = this.props.values[0];
                $.each(this.props.values, function(i, v) {
                    if (pos >= v.range.from && pos <= v.range.to) resultValue = v;
                });
                this._value = resultValue;
                this._xPos = this._value.xPos - 13;
            },
            
            // Returns the x-position of a mouse- or touch-interaction
            getInteractionXPos:function(e)
            {
                // Default pageX on mouse events
                if (typeof e.pageX !== "undefined") return e.pageX;
                // Logic for the React touch event
                if (e.targetTouches && e.targetTouches.length > 0) return e.targetTouches[0].pageX;
                // Logic for the JQuery on mouse move touch event
                var touch;
                if (e.originalEvent.touches) {
                    touch = e.originalEvent.touches[0];
                } else if (e.originalEvent.changedTouches) {
                    touch = e.originalEvent.changedTouches[0];
                }
                if (touch) return touch.pageX;
                return 0;
            },
            
            // Adjust height to heighest textfield
            adjustDynamicHeight:function()
            {
                var ele = $(this.getDOMNode());
                var maxH = 20; // 1 line
                $.each(ele.find('.cc-proace-value'), function(i, txt) {
                    maxH = Math.max(maxH, $(txt).height());
                });
                ele.height(maxH + 60); // 61 = slider + title
            },
            
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            // INTERACTION HANDLERS
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            
            notifyChange:function()
            {
                this.props.callback(this.props, this._value, this._range);
            },
            
            /**
             * Method which handles clicking on the background 
             */
            bgClickHandler:function(e)
            {
                e.stopPropagation();
                
                var xPos = e.pageX - $(this.getDOMNode()).offset().left;
                // Limit to out of bounds positions
                if (xPos < 0) xPos = 0;
                if (xPos > this.props.width) xPos = this.props.width;
                // Snap xposition to value
                this.snapPos(xPos);
                // Update elements
                this.updateSlider(true);
                // Notify parent
                this.notifyChange();
            },
            
            /**
             * Method which handles the mouse down of the thumb 
             */
            mouseDownHandler:function(e)
            {
                // Stop event
                e.stopPropagation();
                e.preventDefault();
                // Save the position where the mouse went down!
                this._thumbDown = this.getInteractionXPos(e);
                this._thumbDownVal = this._xPos;
                // Add event listeners
                var $doc = $(document);
                $doc.on('mouseup',this.mouseUpHandler); 
                $doc.on('touchend',this.mouseUpHandler); 
                $doc.on('mousemove',this.mouseMoveHandler); 
                $doc.on('touchmove',this.mouseMoveHandler);
            },
            
            /**
             * Method which handles the mouse move 
             */
            mouseMoveHandler:function(e)
            {
                // Set xPos to diff since touchDown
                var xPos = this._thumbDownVal - (this._thumbDown - this.getInteractionXPos(e));
                // Limit to out of bounds positions
                if (xPos < 0) xPos = 0;
                if (xPos > this.props.width) xPos = this.props.width;
                // Update 
                this._xPos = xPos;
                // Update visual elements
                this.updateSlider(false);
            },
            
            /**
             * Method which handles the mouse up 
             */
            mouseUpHandler:function(e)
            {
                // remove event listeners
                var $doc = $(document);
                $doc.off('mouseup',this.mouseUpHandler); 
                $doc.off('touchend',this.mouseUpHandler); 
                $doc.off('mousemove',this.mouseMoveHandler); 
                $doc.off('touchmove',this.mouseMoveHandler);
                // Snap to value
                this.snapPos(this._xPos);
                // Update visual elements
                this.updateSlider(true);
                // Notify parent
                this.notifyChange();
            },
            
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            // NATIVE REACT METHODS
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
            
            /**
             * Method called right before the slider is rendered 
             */
            componentWillMount:function()
            {
                // Calculate values
                var cnt = this.props.values.length,
                    spa = this._spacing,
                    totalW = this.props.width + 4,
                    itemW = (totalW - (spa * (cnt-1))) / cnt;
                    dflt = this.props.defaultValue;
                var code = this.props.code;
                // Set xPos for all values
                $.each(this.props.values, function(i, v) {
                    // Set slider itemW & position
                    v.width = itemW;
                    v.left = Math.floor(i * (spa + itemW));
                    v.range = {
                        from: i * (itemW + spa),
                        to: (i + 1) * (itemW + spa)
                    };
                    v.xPos = Math.floor(v.left + (v.width / 2));
                });
                // Set default values
                var defaultID = "1" + this.props.defaultValue;
                var defaultValue = $.grep(this.props.values, function(v){ return v.ID == defaultID; })[0];
                if (!defaultValue) { defaultValue = this.props.values[0]; }
                this._value = defaultValue;
                this._xPos = this._value.xPos - 13;
            },
            
            /**
             * React method called when the component first rendered 
             */
            componentDidMount:function()
            {
                // Fetch all elements
                var $inst = $(this.getDOMNode());
                this._$thumb = $inst.find('.cc-thumb');
                this._$rangeBar1 = $inst.find('.cc-rangebar-1');
                this._$rangeBar2 = $inst.find('.cc-rangebar-2');
                this._$rangeBar3 = $inst.find('.cc-rangebar-3');
                this._$rangeValue = $inst.find(".cc-range-value");
                // Visually set the default-values
                this.updateSlider(false);
                // Update height dynamically
                this.adjustDynamicHeight();
            },
            
            componentWillUpdate : function()
            {
                
            },
            
            componentDidUpdate : function()
            {
                // Update height dynamically
                this.adjustDynamicHeight();
            },
            
            /**
             * React method which renders this component 
             */
            render:function() {
                var range = this._range;
                return(
                    React.DOM.div( {className:"cc-filter cc-range-slider"}, 
                        React.DOM.span( {className:"cc-range-label", unselectable:"on"}, this.props.title),
                        React.DOM.div( {className:"cc-slider-content", style:{width:this.props.width+4, height:28}}, 
                            React.DOM.span( {className:"cc-bg"}),
                            React.DOM.span( {className:"cc-shadowing", style:{width:(this.props.width)}}),
                            React.DOM.span( {className:"cc-rangebar cc-rangebar-1"}),
                            React.DOM.span( {className:"cc-rangebar cc-rangebar-2"}),
                            React.DOM.span( {className:"cc-rangebar cc-rangebar-3"}),
                            React.DOM.span( {className:"cc-hit", onClick:this.bgClickHandler}),
                            React.DOM.a( {className:"cc-thumb", onMouseDown:this.mouseDownHandler, onTouchStart:this.mouseDownHandler}),
                            
                            this.props.values.map(function (value, index) {
                                // Create inline css
                                var css = {
                                    left: value.left + "px",
                                    width: value.width + "px"
                                };
                                // Return element
                                return (
                                    React.DOM.span( {className:"cc-proace-value", key:index, style:css, unselectable:"on"}, value.Label)
                                );
                            })
                        )
                    )
                );
            }
        }
    );
}());