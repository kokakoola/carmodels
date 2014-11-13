/** @jsx React.DOM */
(function() {
	
	/**
     * Renders the external frame class
     */
	var ui = be.marlon.ui;
	// Instantiate the ExternalFrame class
	ui.ExternalFrame = React.createClass(
		{displayName: 'ExternalFrame',
			mixins:[be.marlon.utils.Mixins.Height, be.marlon.utils.Mixins.Mount],
			_cachedConfig:null,
			_shouldUpdate:true,
			_$frame:null,
			
			// ###########################
			// Private methods
			// ###########################
			
			/**
			 * Method which successfully handles the load event for the iFrame 
			 */
			/*loadHandler:function()
			{
				console.log("Financing page successfully loaded!");
				// Call the update height method which triggers height update on the component
    			this.updateHeight();
			},*/
			
			/**
			 * Method which handles the loading of the iFrame 
			 */
			/*frameLoadHandler:function()
			{
				console.log("IFrame loaded: ", this.props.src, " || ", this.props.target);
				//this._$frame.show();			
			},*/
			
			/**
			 * Method which handles the resizing of the window 
			 */
			windowResizeHandler:function()
			{
				var width = $(window).width(),
					left = -(width * 0.5 - 923 * 0.5);
				// Set the width and left properties on the externalframe
				this._$frame.css({'width':width, 'left':left});
			},
			
			/**
			 * Method which handles the height resizing 
			 */
			/*heightResizeHandler:function(data)
			{
				console.log("height resize handler: ", data, this._$frame, $(this.getDOMNode()).find('.cc-external-frame'));
				//this.updateHeight(data.height);
			},*/
					
			// ###########################
			// Public methods
			// ###########################
			
			/**
			 * Method which updates the height of the component 
			 */
			setHeight:function(h)
			{
				this._$frame.height(h);
				this.updateHeight();
			},
			
			/**
			 * Method which returns the iFrame reference 
			 */
			getIFrame:function()
			{
				return this._$frame;
			},
			
			/**
			 * Method called when the external frame should load new data 
			 */
			loadExternal:function()
			{
				// If the data should be updated
				//if(this._shouldUpdate)
				//{
					//console.log("update the form!");
					// Create the form and submit
					var $form = $('<form/>', {
							action:this.props.src,
							target:this.props.target,
							method:"post"
						});
					var $input = $('<input/>', {
							type:"hidden",
							name:"configuration",
							value:this.props.controller.getExternalConfigurationObject(true, true)
						});
					var $doc = $(document.body);
					// Append the elements
					$form.append($input);
					$doc.append($form);
					// Submit the form
					$form.submit();
					// Clean up the form
					$form.remove();
					// Set update flag to false
					this._shouldUpdate = false;
				//}
			},
			
			/**
			 * Method which clears the iFrame from previous content 
			 */
			clear:function()
			{
				this._$frame.attr('src', '');
			},
						
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Method called when the component is about to be rendered 
			 */
			componentWillMount:function()
			{
				// Add resize event handler
				$(window).on('resize', this.windowResizeHandler);
			},
			
			/**
			 * Method which is called when the component is about to be removed 
			 */
			componentWillUnmount:function() 
			{
	    		// Remove resize handler
				$(window).off('resize', this.windowResizeHandler);
				//this._$frame.off("load", this.frameLoadHandler);
			},
			
			/**
			 * Method called when the component did mount 
			 */
			componentDidMount:function()
			{
				this._$frame = $(this.getDOMNode()).find('.cc-external-frame');
				//this._$frame.on("load", this.frameLoadHandler);
				this.windowResizeHandler();
			},
			
			/**
			 * Method which determins if the component should update 
			 */
			shouldComponentUpdate:function(nextProps, nextState)
			{
				if(nextProps.configuration)
				{
					if(!this._cachedConfig || (!this._cachedConfig.equals(nextProps.configuration)))
					{
						this._shouldUpdate = true;
					}
										
					// Save the cachedConfig
					this._cachedConfig = nextProps.configuration;
				}
				// Never update this externalframe cause it will reload the iFrame!
				return false;
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				return(
					React.DOM.div( {className:"cc-abs-item"}, 
						React.DOM.div( {className:"container cc-container"}, 
							React.DOM.iframe( {className:"cc-external-frame", name:this.props.target, scrolling:"no"})
						)
					)
				);
			}
		}
	);
})();
