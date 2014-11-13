/** @jsx React.DOM */
(function() {
	// Define location in the namespace
	var ui = be.marlon.ui;
	
	/**
     * This class contains logic for rendering the preloader
     */
    ui.PreLoader = React.createClass(
    	{displayName: 'PreLoader',
    		mixins:[be.marlon.utils.Mixins.Mount],
    		
    		_position:0,
    		_interval:null,
    		
    		_size:null,
    		_height:null,
    		_speed:80,
    		_timeout:null,
    		
    		_$ani:null,
    		
	    	////////////////////////////
	    	// Private methods
	    	////////////////////////////
	    	
	    	/**
			 * Method which handles the interval event
			 */
			intervalHandler:function()
			{
				// Calculate the position of the image
				this._position -= this._size;
				if(this._position < -this._height + this._size)
				{
					this._position = 0;
				}
				// Set the css on the element
				this._$ani.css({"backgroundPosition":"0px " + this._position + "px"});
			},
			
			/**
			 * Method which clears the interval
			 */
			destroyInterval:function(hideElement)
			{
				if(this._interval > -1)
				{	
					clearInterval(this._interval);
					this._interval = -1;
					if(hideElement !== false)this.setState({visible:false});
				}
			},
			
			////////////////////////////
	    	// Public methods
	    	////////////////////////////
	    	
	    	/**
			 * Method which shows the elements and starts the animation
			 */
			show:function()
			{
				this.setState({visible:true}, this.setShowStateComplete);
			},
			
			/**
			 * Method which handles the complete setting of the state 
			 */
			setShowStateComplete:function()
			{
				// Clean up interval first!
				this.destroyInterval(false);
				// Create new one!
				this._interval = setInterval(this.intervalHandler, this._speed);
				// Set the timeout
				clearTimeout(this._timeout);
				//this._timeout = setTimeout(this.hide,15000,true);
			},
			
			/**
			 * Method which hides the element and stops the animation
			 */
			hide:function(animated)
			{
				// Clear the timeout
				clearTimeout(this._timeout);
				var $ele = $(this.getDOMNode());
				if(animated)
				{
					$ele.fadeTo(1000, 0, this.destroyInterval);
				}
				else
				{
					$ele.stop();
					this.destroyInterval();
				}
			},
			
			////////////////////////////
	    	// React methods
	    	////////////////////////////
			
			/**
			 * Returns the default state of the React component 
			 */
			getInitialState:function(e)
			{
				return {visible:false};
			},
			
			/**
			 * Method called when the component will be mounted 
			 */
			componentWillMount:function()
			{
				this._position = 0;
				
				var utils = be.marlon.utils;
				switch(this.props.size)
				{
					case utils.TINY:
						this._size = 14;
						this._height = 112;
					break;
					case utils.SMALL:
						this._size = 40;
						this._height = 320;
					break;
					case utils.LARGE:
						this._size = 60;
						this._height = 480;
					break;
				}
				this.componentWillReceiveProps(this.props);
			},
			
			/**
			 * Method called when the component is about to be unmounted 
			 */
			componentWillUnmount:function()
			{
				// Clean up the animation
				clearTimeout(this._timeout);
				clearInterval(this._interval);
			},
			
			/**
			 * Method called when the component is about to receive new props 
			 */
			componentWillReceiveProps:function(nextProps, nextState)
			{
				if(nextProps.visible === true)
				{
					this.setState({visible:true});
				}
			},
			
			/**
			 * Method called when the component has been mounted 
			 */
			componentDidMount:function()
			{
				this._$ani = $(this.getDOMNode()).find('.cc-image');
				// Start animation if the flag is set to visible
				if(this.state.visible === true)this.setShowStateComplete();
			},
			
    		/**
    		 * Method which renders the component 
    		 */
    		render:function()
    		{
    			var style = {};
    			if(this.state.visible)
    			{
    				style.opacity = 1;
    				style.display = "block";
    			}
    			else
    			{
    				style.display = "none";
    			}
    			return(
	    			React.DOM.div( {className:"cc-preloader", style:style}, 
	    				React.DOM.div( {className:"cc-image"}
	    				)
	    			)
	    		);
    		}
    	}
    );
})();