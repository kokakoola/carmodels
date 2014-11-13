/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a slider component
     */
	var ui = be.marlon.ui;
	// Instantiate the Exterior class
	ui.Slider = React.createClass(
		{displayName: 'Slider',
		    mixins:[be.marlon.utils.Mixins.Mount],
			
			_thumbDown:0,
			_thumbDownVal:0,
			
			_$thumb:null,
			_$bar:null,
			_$range:null,
			_$rangeFill:null,
			_$rangeValue:null,
			
			_value:0, // <- the actual value of the slider (UN-STEPPED);
			_xPos:0, // <- the actual x position of the slider
			_minRange:0,
			_maxRange:0,
			
			_utils:null,
			_isPrice:false,
			
			/* ------------------------------------------------------------------------------------------------------------------------------------- */
            // PRIVATE
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
			
	        updateSlider:function(animated)
	        {
	            // Calculate range positions
	            var rangeStart,
                    rangeWidth;
                if (this._minRange != this._maxRange) {
                    rangeStart = this.convertValueToPos(this._minRange);
                    rangeWidth = this.convertValueToPos(this._maxRange) - rangeStart;
                } else {
                    rangeStart = this.convertValueToPos(this.props.min);
                    rangeWidth = this.convertValueToPos(this.props.max) - rangeStart;
                }
	            // thumb & blue bar ( cut off 26px from max travel, should not cross bar ending )
	            var thumbState =   {left:Math.min(this._xPos, this.props.width-26)},
	                barState =     {width: Math.min(this._xPos+13, this.props.width-13)};
	            // white & blue background
	            var rangeState =   {left:rangeStart, width:Math.min(rangeWidth+13, 189)},
	                fillState =    {width: Math.min(this._xPos+13-rangeStart, rangeWidth+13, this.props.width-rangeStart)};
	            // Update css
	            if (animated) {
	                var animObj = {duration:200, queue:false};
	                this._$thumb.animate(thumbState, animObj);
                    this._$bar.animate(barState, animObj);       
                    this._$range.animate(rangeState, animObj);
                    this._$rangeFill.animate(fillState, animObj);
	            } else {
	                this._$thumb.css(thumbState);
	                this._$bar.css(barState);
                    this._$range.css(rangeState);
                    this._$rangeFill.css(fillState);
	            }
	        },
	        
	        /* ------------------------------------------------------------------------------------------------------------------------------------- */
            // TOOLS
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
	        
	        // Limits the value to min & max bounds + snaps the value to a step
	        snapValueToStep:function(v) {
	            // Get the closest value based on the step!
	            var dif = v % this.props.step;
	            if (dif < this.props.step * 0.5) { v -= dif; }
	            else { v += this.props.step - dif; }
	            // Limit to out of bounds values
	            if (v > this.props.max) v = this.props.max;
	            if (v < this.props.min) v = this.props.min;
	            return v;
	        },
			
			// Converts a slider value to the actual x-position (0 to this.props.width)
			convertValueToPos:function(v) {
			    // Limit to out of bounds values
			    if (v > this.props.max) v = this.props.max;
                if (v < this.props.min) v = this.props.min;
                // Return width of slider * percentage
			    return (this.props.width * ((v - this.props.min) / (this.props.max - this.props.min)));
			},
			
			// Converts an x-position (for example after click) to the slider value 
			convertPosToValue:function(p) {
			    // Cut off left margin
			    p -= 13;
			    if (p < 0) p = 0;
			    // Cut off right margin
			    if (p > this.props.width - 26) p = this.props.width;
			    // Return current value
			    return this.props.min + ((p / (this.props.width - 26)) * (this.props.max - this.props.min));
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
                if   (e.originalEvent.touches) {
                    touch = e.originalEvent.touches[0];
                } else if (e.originalEvent.changedTouches) {
                    touch = e.originalEvent.changedTouches[0];
                }
                if (touch) return touch.pageX;
                return 0;
            },
			
			/* ------------------------------------------------------------------------------------------------------------------------------------- */
            // INTERACTION HANDLERS
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
			
			/**
             * Method which handles clicking on the background 
             */
            bgClickHandler:function(e)
            {
                e.stopPropagation();
                
                var xPos = e.pageX - $(this.getDOMNode()).offset().left - 13;
                // Limit to out of bounds positions
                if (xPos < 0) xPos = 0;
                if (xPos > this.props.width) xPos = this.props.width;
                // Save position and value
                this._xPos = xPos;
                this._value = this.convertPosToValue(xPos);
                // Update elements
                this.updateSlider(true);
                // Make callback
                this.props.valueUpdated(this.props.code, this._value, true);
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
                // Make callback
                this.props.valueUpdated(this.props.code, this._value, true);
            },
            
            /**
             * Method which handles the mouse move 
             */
            mouseMoveHandler:function(e)
            {
                // Set xPos to diff since touchDown
                this._xPos = this._thumbDownVal - (this._thumbDown - this.getInteractionXPos(e));
                // Limit to out of bounds positions
                if (this._xPos < 0) this._xPos = 0;
                if (this._xPos > this.props.width) this._xPos = this.props.width;
                // Set value based on position
                this._value = this.convertPosToValue(this._xPos);
                // Update visual elements
                this.updateSlider(false);
                // Make callback
                this.props.valueUpdated(this.props.code, this._value, false);
            },
			
			/* ------------------------------------------------------------------------------------------------------------------------------------- */
            // NATIVE REACT METHODS
            /* ------------------------------------------------------------------------------------------------------------------------------------- */
			
			/**
			 * Method called right before the slider is rendered 
			 */
			componentWillMount:function()
			{
			    // Set initial values based on default
			    this._value = this.props.defaultValue;
			    this._xPos = this.convertValueToPos(this.props.defaultValue);
			    
		        this._isPrice = (this.props.code === "PRICE");
			    if(!this._utils) this._utils = be.marlon.utils;
			},
			
			/**
			 * React method called when the component first rendered 
			 */
			componentDidMount:function()
			{
			    // Fetch all elements
				var $inst = $(this.getDOMNode());
				this._$thumb = $inst.find('.cc-thumb');
				this._$bar = $inst.find('.cc-bar');
				this._$range = $inst.find('.cc-rangebar');
				this._$rangeFill = this._$range.find('.cc-fill');
				this._$rangeValue = $inst.find(".cc-range-value");
				// Visually set the default-values
				this.updateSlider(false);
			},
			
			componentDidUpdate : function()
			{
			    if (this.props.reset)
			    {
			        // Reset all values and update
			        this._value = this.props.defaultValue;
                    this._xPos = this.convertValueToPos(this.props.defaultValue);
                    this._minRange = this.props.min;
                    this._maxRange = this.props.max;
                    this.updateSlider(true);
                }
                else if (this.props.shouldUpdate)
                {
                    // Save range values and update
                    if (this.props.range)
                    {
                        this._minRange = this.props.range.From;
                        this._maxRange = this.props.range.To;
                    }
                    this.updateSlider(true);
                }
			},
			
			/**
			 * React method which renders this component 
			 */
			render:function() {
				return(
					React.DOM.div( {className:"cc-filter cc-range-slider"}, 
						React.DOM.span( {className:"cc-range-label", unselectable:"on"}, this.props.title),
						React.DOM.div( {className:"cc-slider-content", style:{width:this.props.width, height:28}}, 
							React.DOM.span( {className:"cc-bg"}),
							React.DOM.span( {className:"cc-bar"}),
							React.DOM.span( {className:"cc-shadowing", style:{width:(this.props.width-4)}}),
							React.DOM.span( {className:"cc-rangebar", style:{width:(this.props.width-1)}}, 
								React.DOM.span( {className:"cc-fill"})
							),
							React.DOM.span( {className:"cc-hit", onClick:this.bgClickHandler}),
							React.DOM.a( {className:"cc-thumb", onMouseDown:this.mouseDownHandler, onTouchStart:this.mouseDownHandler})
						),
						React.DOM.span( {className:"cc-range-value", unselectable:"on"}, this.props.valuetext.replace(/\{.+\}/, this._isPrice && this._utils ? this._utils.formatPrice(this.snapValueToStep(this._value), false) : this.snapValueToStep(this._value)))
					)
				);
			}
		}
	);
}());