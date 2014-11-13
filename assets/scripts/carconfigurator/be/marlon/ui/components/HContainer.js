/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a horizontal list, used in the bottomcontainer
     */
	var ui = be.marlon.ui;
	// Create the HContainer class
	ui.HContainer = React.createClass(
		{displayName: 'HContainer',
			mixins:[be.marlon.utils.Mixins.Mount],
			
			totalHeight:0,
			_list:null,
			_$container:null,
			_container:null,
			_step:0,
			_isUpdating:false,
			_shouldPosition:true,
			
			
			// ###########################
			// Private methods
			// ###########################
			
			/**
			 * Method which handles the window resizing
			 * @param e:Event 
			 */
			windowResizeHandler:function(e)
			{
				this._shouldPosition = true;
				this.updatePosition();
				this.navigate(this._step, false, true);
			},
			
			/**
			 * Method which handles updating the container height 
			 */
			updateHeight:function()
			{
				var arr = this._list.getData(),
					iL = arr.length;
				if(this._step >= iL)return;
				
				var h = arr[this._step].totalHeight;
				
				// Step heights:
				/*for(var i = 0; i < arr.length; i++)
				{
					console.log("step " , i , " :", arr[i].totalHeight, "    ", arr[i].getDOMNode());
				}
				
				console.log("HContainer updating height: ", h);*/
				$(this._$container.parent()).height(h);
				
				// Save the totalheight
				this.totalHeight = $(this.getDOMNode()).outerHeight();
			},
			
			/**
			 * Method which handles a force-recalculation of the height 
			 */
			forceHeight:function()
			{
				this.updateHeight();
				if(this.props.updateHeight)this.props.updateHeight();
			},
			
			/**
			 * Handles the mounting of the container 
			 */
			containerMountHandler:function(item)
			{
				this._container = item;
				this._$container = $(item.getDOMNode());
			},
			
			/**
			 * Method which updates the position of the elements
			 */
			updatePosition:function()
			{
				if(this._shouldPosition)
				{
					// Add 34 pixels to solve some clipping issues on the 923px resolution
					var w = $(window).width() + 34;
					// Set the correct positions of the elements
					var i = 0,
						arr = this._list.getData(),
						iL = arr.length;
					for(; i < iL; i++)
					{
						$(arr[i].getDOMNode()).css('left', i * w);
					}
					
					this._shouldPosition = false;
				}
				// Update the height
				this.updateHeight();
			},
			
			// ###########################
			// Public methods
			// ###########################
			
			/**
			 * Method which animates in the correct control 
			 */
			navigate:function(step, animate, force)
			{
				if(step == this._step && !force)return;
				this._$container.stop();
				this._step = step;
				var data = this._list.getData();
				if(step >= data.length || data.length === 0)return;
				var style = {
					left:-$(data[step].getDOMNode()).position().left
				};
				
				if(animate)
				{
					this._$container.animate(style, {duration:500, queue:false});
				}
				else
				{
					style.left += "px";
					this._$container.css(style);
				}
				// Update the height of the container
				this.updateHeight();
			},
			
			/**
			 * Method which returns the total amount of animatable children 
			 */
			getTotalElements:function()
			{
				return this._list.getData().length;
			},
					
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Method called after the VList got updated 
			 */
			componentDidUpdate:function(prevProps, prevState)
			{
				// Adjust the step if it is out of bounds with the updated elements list
				var total = this.getTotalElements() -1;
				if(this._step >= total)
				{
					//console.log("--> element difference, navigating to step: ", total);
					this._step = total;
					// Update the position of all elements
					this.updatePosition();
					// Navigate to the correct step
					this.navigate(this._step, false, true);
					return;
				}
				
				// Update the positions of the elements
				this.updatePosition();
			},
			
			/**
			 * Method called when the component did render 
			 */
			componentDidMount:function(root)
			{
				// Update the positions of the elements
				this.updatePosition();
				
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
			},
			
			/**
			 * Invoked when a component is receiving new props. This method is not called for the initial render. 
			 */
			componentWillReceiveProps:function(nextProps)
			{
				if(this.props.elements.length != nextProps.elements.length)
				{
					this._shouldPosition = true;
				}
			},
			
			/**
			 * Method called when the component will mount
			 */
			componentWillMount:function()
			{
				this._step = 0;
				this._list = new ui.List();
			},
						
			/**
			 * Default the props 
			 */
			getDefaultProps:function()
			{
				return {
					top:null,
					bottom:null,
					absolute:false
				};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				// Save the elements data
				// CAUTION this is called each time the HContainer is updated, however the contents (this.props.elements) remain the same, there is an anti duplicate check in the _list to avoid duplicates.
				this._list.setData(this.props.elements);
				
				// Add update height function callback to all elements
				var i = 0,
					arr = this.props.elements,
					iL = arr.length;
				for(; i < iL; i++)
				{
					arr[i].props.updateHeight = this.forceHeight;
				}
				
				return(
					React.DOM.div( {className:(this.props.absolute?' cc-abs-item':'')}, 
						this.props.top,
						React.DOM.div( {className:"cc-hcontainer clearfix"}, 
							Container( {elements:this.props.elements, componentDidMount:this.containerMountHandler})
						),
						this.props.bottom
					)
				);
			}
		}
	);
	
	var Container = React.createClass(
		{displayName: 'Container',
			mixins:[be.marlon.utils.Mixins.Mount],
			render:function()
			{
				return(
					React.DOM.div( {className:"cc-abs-item"}, 
						this.props.elements
					)
				);
			}
		}
	);
}());