/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a control
     */
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag;
		
	// Instantiate the InterfaceControl class
	ui.InterfaceControl = {
		mixins:[be.marlon.utils.Mixins.Mount],
		
		_list:null,
		_currentStep:0,
		_navigation:null,
		_comparePane:null,
		_compareData:null,
		_$container:null,
		_naviHeight:null,
		_dic:be.marlon.utils.Dictionary,
		
		// ###########################
		// Private methods
		// ###########################
    	
		/**
		 * Method which handles the clicking on an navigation element 
		 */
		navigationClickHandler:function(index, code)
		{
			bt.track({
                action: 'cc_tab',
                value: code
            });
			
			if(index == this._currentStep)
			{
				this.props.naviHandler();
				this.updateHeight(true);
				return;
			}
			// Notify the implementor that the interface control has been navigated
			this.props.naviHandler();
			// Show the section
			this._currentStep = index;
			this.positionContainer(true);
			this.updateHeight(true);
		},
		
		/**
		 * Method which positions the container based on the current step 
		 */
		positionContainer:function(animate)
		{
			if(this.state.navigation.length === 0) return;
			var $o = $(this.getCurrentElement().getDOMNode());
			// Animate the container based on the current position of the element
			if(animate)
			{
				this._$container.stop();
				this._$container.animate({left:-$o.position().left}, {duration:400, queue:false});
			}
			else
			{
				this._$container.css('left', -$o.position().left);
			}
		},
		
		/**
		 * Method which updates the control's height 
		 */
		updateHeight:function(animate, addHeight, forcedHeight, element)
		{
			if(this.state.navigation.length === 0) return;
			// Add the height of the interface
			var $interface = $(this.getDOMNode()).find(".cc-interface-control"),
				h;
			
			var $currentControl = $(this.getCurrentElement().getDOMNode());
			if(forcedHeight > 0 && element && element === this.getCurrentElement())
			{
				h = forcedHeight + Number($currentControl.css('padding-bottom').replace("px",""));
			}
			else
			{
				h = $currentControl.outerHeight();
			}
			
			// Add potentially additional height, used in the compare panel rendering logic
			if(addHeight)h += addHeight;
			
			// Also add the height of the navigation
			h += this._naviHeight;
			
			// Notify the parent to which height the control is animating
			this.props.heightUpdated(h, this);
			
			// Animate the interface
			if(animate)
			{
				$interface.stop();
				$interface.animate({height:h}, {duration:400, queue:false});
			}
			else
			{
				$interface.height(h);	
			}
		},
		
		/**
		 * Method which handles clicking on the compare packs button 
		 */
		compareDataClickHandler:function(data)
		{
			var cp = this._comparePane;
			if(cp._visible)
			{
				cp.hide();
			}
			else
			{
				cp.setState({data:data}, this.compareStateUpdateComplete);
			}

			// Track removing exterior option
            bt.track({
                componentname: 'carconfig',
                action: 'cc_action',
                value: 'compare-packs'
            });
		},
		
		/**
		 * Method which positions all the elements based on the width of the screen 
		 */
		positionElements:function()
		{
			var w = $(window).width(),
				i = 0,
				arr = this._list.getData(),
				o,
				iL = arr.length;
			for(; i < iL; i++)
			{
				o = arr[i];
				$(o.getDOMNode()).css('left', w * i);
			}
			// Position the container
			this.positionContainer(false);
		},
		
		/**
		 * Method which returns the current active element 
		 */
		getCurrentElement:function()
		{
			var i = 0,
				arr = this._list.getData(),
				o,
				iL = arr.length;
			for(; i < iL; i++)
			{
				o = arr[i];
				if(o.props.key === this._currentStep)return o;
			}
		},
		
		/**
		 * Window resize event handler 
		 */
		windowResizeHandler:function()
		{
			this.positionElements();
		},
		
		/**
		 * Callback method which is called from a child element when the height has changed 
		 * @param height:Number optional height to update the control to
		 * @param element:React object optional react object where the event originates from, only required when a height is present
		 */
		heightUpdated:function(height, element)
		{
			this.updateHeight(true, false, height, element);
		},
		
		/**
		 * Handles mounting of the compare pane 
		 */
		comparePaneMountHandler:function(item)
		{
			this._comparePane = item;
		},
		
		/**
		 * Method which handles the complete update of the setstate for the comparePane 
		 */
		compareStateUpdateComplete:function()
		{
			this._comparePane.show();
		},
		
		/**
		 * Method which handles the updating of the compare pane height 
		 */
		compareHeightUpdated:function(height)
		{
			this.updateHeight(true, height);
		},
		
		/**
		 * Method which handles the mounting of the navigation 
		 */
		naviMountHandler:function(item)
		{
			this._navigation = item;
		},
		
		// ###########################
		// Public methods
		// ###########################
		
		/**
		 * Method which sets the icon on the navigation, collapsed/expanded 
		 */
		setCollapsed:function(collapsed)
		{
			this._navigation.setState(
				{
					collapsed:collapsed
				}
			);
		},
				
		// ###########################
		// Required react methods
		// ###########################
				
		/**
		 * Method called when the component will mount
		 */
		componentWillMount:function()
		{
			this._list = new ui.List();
			this._currentStep = 0;
		},
		
		/**
		 * Method called when the component mounted 
		 */
		componentDidMount:function()
		{
			// Position the elements
			var $this = $(this.getDOMNode());
			this._$container = $this.find('.cc-interface-container');
			if(this.state.navigation.length > 0)this.positionElements();
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
		 * Method called when the component did update 
		 */
		componentDidUpdate:function()
		{
			// Position the elements
			var $this = $(this.getDOMNode());
			this._naviHeight = $this.find('.cc-tabnav').outerHeight();
			this._$container = $this.find('.cc-interface-container');
			if(this.state.navigation.length > 0)
			{
				this.positionElements();
				// Update the height
				this.updateHeight(false);
			}
		},
		
		/**
		 * Method called when the component is about to be updated 
		 */
		componentWillUpdate:function(nextProps, nextState)
		{
			var utils = be.marlon.utils;
			if(!utils.checkArrays(nextState.navigation, this.state.navigation, "id"))
			{
				this._currentStep = 0;
			}
		},
		
		/**
		 * Returns the default state of the grade 
		 */
		getInitialState:function()
		{
			return {
				navigation:[]
			};
		},
		
		/**
		 * The react render function for this class 
		 */
		render:function()
		{
			// Map the elements of the navigation to an array so they can be mounted in the interface control
			var ComparePane = ui.ComparePane,
				instance = this,
				elements = this.state.navigation.map(
				function(item)
				{
					// Save the id on the index of the element for future mapping (hence navigating)
					item.element.props.key = item.id;
					// Add the heightChange callback
					item.element.props.heightUpdateHandler = instance.heightUpdated;
					return item.element;
				}
			);
			this._list.setData(elements);
			
			return(
				React.DOM.div( {className:"cc-content-block group cc-control"}, 
					Navigation( {selected:this._currentStep, navigation:this.state.navigation, clickHandler:this.navigationClickHandler, closeClickHandler:this.props.closeClickHandler, compareDataClickHandler:this.compareDataClickHandler, componentDidMount:this.naviMountHandler}),
					ComparePane( {title:"comparePacks", componentDidMount:this.comparePaneMountHandler, heightUpdate:this.compareHeightUpdated}),
					React.DOM.div( {className:"container cc-container cc-tabs-container cc-interface-control cc-no-overflow"}, 
						React.DOM.div( {className:"cc-abs-item cc-interface-container"}, 
							elements
						)
					)
				)
			);
		}
	};
	
	var Navigation = React.createClass(
		{displayName: 'Navigation',	
			mixins:[be.marlon.utils.Mixins.Mount],
			/**
			 * Method which handles clicking on a navigation step 
			 */
			clickHandler:function(e)
			{
				var target = $(e.target),
					id = target.data('id'),
					code = target.data('code');
				this.props.clickHandler(id, code);
				this.setState({selected:id});
			},
			
			/**
			 * Method called when the component will mount
			 */
			componentWillMount:function()
			{
				this.componentWillReceiveProps(this.props);
			},
			
			/**
			 * Method called when the component will update
			 */
			componentWillReceiveProps:function(nextProps)
			{
				this.setState({selected:nextProps.selected});
			},
			
			/**
			 * Method which returns the initial state of the navigation 
			 */
			getInitialState:function(e)
			{
				return {
					selected:null,
					collapsed:false
				};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var instance = this,
					compareBtn = null,
					utils = be.marlon.utils,
					items = this.props.navigation.map(
						function(item)
						{
							var selected = (item.id == instance.state.selected);
							if(selected)
							{
								if(item.compareData)
								{
									compareBtn = (
										React.DOM.a( {className:"cc-btn cc-btn-link cc-btn-compare", onClick:function(){instance.props.compareDataClickHandler(item.compareData.data);}}, 
						                    React.DOM.i( {className:"icon-chevron-down"}),item.compareData.label
						                )
									);
								}
							}
							return Step( {key:item.id, code:item.code, clickHandler:instance.clickHandler, label:item.label, selected:selected});
						}
					);
				
				var TouchClicker = utils.TouchClicker;
				return(
					React.DOM.nav( {className:"cc-tabnav"}, 
						React.DOM.div( {className:"container cc-container cc-tabs-container"}, 
							React.DOM.ul(null, 
								items
							),
							React.DOM.div( {className:"cc-actions"}, 
								TouchClicker( {content:
										React.DOM.div( {className:"cc-hit-area"}, 
											React.DOM.a( {className:"icon-remove cc-icon-toggle" + (this.state.collapsed?' icon-plus':'') + (utils.smSlave?' cc-sm-slave':'')})
										),
									 
									clickHandler:this.props.closeClickHandler}),
								compareBtn
							)
						)
					)
				);
			}
		}
	);
	
	/**
	 * Creates a navigation step 
	 */
	var Step = React.createClass(
		{displayName: 'Step',
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				return(
					React.DOM.li( {className:this.props.selected?'current cc-selected':''}, 
						React.DOM.a( {onClick:this.props.clickHandler, 'data-code':this.props.code, 'data-id':this.props.key, className:this.props.selected?'current':''}, this.props.label)
					)
				);
			}
		}
	);
}());