/** @jsx React.DOM */
(function() {
	
	/**
     * Top container component, this contains the logic for rendering the:
     * -SpinPlayer
     * -Exterior
     * -Interior
     * -Accessories
     * -Summary
     */
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag;
	// Create the topcontainer class
	function TopContainer()
	{
		// Global variables
		var _dic,
			_instance,
			_$instance,
			_utils,
			
			_spin,
			_st,
			_controlTop = 0, // The offset of the control toward the top of the page (overlays the spinplayer)
			_carHeader, // This is the reference to the StaticCarHeader instance
			_$carHeader,
			_carHeaderShown = false,
			
			// Variables, once set which don't change anymore
			_carHeaderHeight,
			
			// The container/control variables
			_passiveControls,
			_activeControl,
			_$container,
			_containerHeight = 0,
			_step,
			_exterior,
			_interior,
			_accessories,
			
			// Variables used for positioning/animating elements when collapsing the control
			_availableHeight, // The current height where everything is positioned upon
			_posControlHeight, // The height of the control where the general element positioning is based upon
			_posControlMargin = 0, // The margin of the control where the general element positioning is based upon
			
			// The active mode
			_activeMode,
			
			_open = true, // Is the control open or closed?
			
			_mainNaviHeight = 60,
			_secondaryNaviHeight = 42,
			
			_didPosition = false, // Did the component position its elements?
			
			_collapsed = true; // Is the container collapsed or expanded?
		
		// ###########################
		// Private methods
		// ###########################
		
		function simulateToggleHeader(msg, value)
		{
		    if (value == "true") {
		        showCarHeader();
		    } else {
		        hideCarHeader();
		    }
		}
		
		/**
		* Method which shows the popup
		*/
		function showCarHeader()
		{
			if(_carHeaderShown)return;
			_$carHeader.stop();
			_$carHeader.show();
			_$carHeader.animate({top:0}, {duration:500});
			_carHeaderShown = true;
			PubSub.publish("cc_salesman_toggleheader", true);
		}
		
		/**
		* Method which hides the popup
		*/
		function hideCarHeader()
		{
			if(!_carHeaderShown)return;
			_$carHeader.stop();
			_$carHeader.animate({top:(-_$carHeader.height())}, {duration:500, complete:carHeaderHideComplete});
			_carHeaderShown = false;
			
			//  Hide the shadow
			_carHeader.hideShadow();
			PubSub.publish("cc_salesman_toggleheader", false);
		}
		
		/**
		 * Method which handles the complete hiding of the car header 
		 */
		function carHeaderHideComplete()
		{
			_$carHeader.hide();
		}
		
		/**
		 * Method which handles the window resizing
		 * @param e:Event 
		 */
		function windowResizeHandler(e)
		{
			// Make sure to update the position when the window is being resized and the container is not visible!
			if(_collapsed)_didPosition = false;
			if(!_collapsed)updatePosition();
		}
		
		/**
		 * Method which handles the scrolling
		 * @param e:Event 
		 */
		function scrollHandler(e)
		{
		    
			// Save top value
			_st = $(window).scrollTop();
			
			// Determine to animate in the top flap
			// Show the car header again if there isn't enough available space
			if(shouldCarHeaderBeShown())
			{
				showCarHeader();
			}
			else 
			{
				hideCarHeader();
			}
			
			if(_st > 0)
			{
				if(_carHeaderShown)_carHeader.showShadow();
			}
			else
			{
				if(_carHeaderShown)_carHeader.hideShadow();
				if(!_open)hideCarHeader();
			}
		}
		
		/**
		 * Method which updates the position of all relevant controls upon window resize 
		 */
		function updatePosition()
		{
			// Only set this if we are sure the topcontainer is being rendered for the first time
			if(!_instance.props.visible)return;
			_didPosition = true;
			var h = $(window).height(),
				maximum = 700;
			if(h > maximum) h = maximum;
			// Save the height
			_availableHeight = h;
			// Calculate the spin height
			var spinHeight = h - _mainNaviHeight - _secondaryNaviHeight;
			// Calculate the control top
			_controlTop = _containerHeight - _secondaryNaviHeight;
			// Check the top space
			if(spinHeight - _controlTop <= _carHeaderHeight)
			{
				// Constrain the size of the container
				spinHeight = _carHeaderHeight + _controlTop;
				
				if(_open)showCarHeader();
				else hideCarHeader();
			}
			else
			{
				// Hide the car header
				hideCarHeader();
			}
			
			// Save variables
			_posControlHeight = _containerHeight;
			_posControlMargin = -_controlTop;
			
			// Set spin height & controltop offset
			_spin.setHeight(spinHeight);
			_$container.css('marginTop', -_controlTop);
		}
		
		/**
		 * Method which handles the collapsing of the top container 
		 */
		function collapseCompleted()
		{
			_$instance.hide();
		}
		
		/**
		 * Method called when the car header did mount 
		 */
		function carHeaderMountHandler(item)
		{
			_carHeader = item;
			_$carHeader = $(item.getDOMNode());
		}
		
		/**
		 * Method called when the spin has been mounted 
		 */
		function spinMountHandler(item)
		{
			_spin = item;
		}
		
		/**
		 * Method called when the exterior has been mounted 
		 */
		function exteriorMountHandler(item)
		{
			_exterior = item;
		}
		
		/**
		 * Method called when the interior has been mounted 
		 */
		function interiorMountHandler(item)
		{
			_interior = item;
		}
		
		/**
		 * Method called when the accessories has been mounted 
		 */
		function accessoriesMountHandler(item)
		{
			_accessories = item;
		}
		
		/**
		 * Method which calculates the current height of the topcontainer 
		 */
		function getCurrentHeight()
		{
			var preH = _$instance.height();
			_$instance.css('height', '100%');
			var h = _$instance.height();
			_$instance.height(preH);
			return h;
		}
		
		/**
		 * Method which is called when the animation of the height has been completed 
		 */
		function completeHeightAni()
		{
			_$instance.css('height', '100%');
			updateHeight();
			if(shouldCarHeaderBeShown())showCarHeader();
		}
		
		/**
		 * Method which handles the notification callback when the height of the control has been updated
		 * @param h:Number new height of the control 
		 * @param control:React object the control where the callback originated from
		 */
		function controlHeightUpdateHandler(h, control)
		{
			// Update the control container height
			if(_$container && _passiveControls)
			{
				// Only reference the height if the event dispatched from the current active control
				if(
					(h && !_activeControl) ||
					(_activeControl && _activeControl === control))_containerHeight = h;
 				else if(_activeControl)_containerHeight = $(_activeControl.getDOMNode()).height();
				// Update the control container height
				_$container.animate({height:_containerHeight}, {duration:400, queue:false});
				// Update the passive control position
				var i = 0,
					iL = _passiveControls.length;
				for(; i < iL; i++)
				{
					$(_passiveControls[i].getDOMNode()).animate({top:_containerHeight}, {duration:400, queue:false});
				}
			}
			// If height is supplied, it means that the function is called from within a control (exterior, interior, ...)
			if(h)updateHeight();
		}
		
		/**
		 * Method which handles the update height event 
		 */
		function updateHeight()
		{
			if(!_collapsed && !_$container)return;
			// Update the height
			_instance.props.heightUpdated(_containerHeight + -_posControlMargin - 30);
		}
		
		/**
		 * Method which handles clicking on the close button inside a control 
		 */
		function toggleControlClickHandler(e)
		{
			toggleContainerState();
		}
		
		/**
		 * Method which handles the event when inside the containers (interior, exterior, accessories) the user is navigating between steps 
		 */
		function controlNaviHandler()
		{
			if(!_open)toggleContainerState();
		}
		
		/**
		 * Method which checks the available space for the carheader 
		 */
		function shouldCarHeaderBeShown()
		{
			var availableSpace = (_spin.getSpinHeight() - _controlTop) - _st;
			return (availableSpace <= _carHeaderHeight && _spin.getSpinHeight() > 0);
		}
		
		/**
		 * Method which toggles the open/close state of the container 
		 */
		function toggleContainerState()
		{
			_open = !_open;
			var pos = {};
			if(_open)
			{	
				pos.top = 0; 
				pos.marginTop = _posControlMargin;
				
				_$container.animate(pos, {duration:400, queue:false});
				// Show the car header again if there isn't enough available space
				if(shouldCarHeaderBeShown())
				{
					showCarHeader();
				}
			}
			else
			{
				if(_step === _utils.SUMMARY || _step === _utils.FINANCING || _step === _utils.INSURANCE)
				{
					pos.top = 0;
					//pos.marginTop = -(_containerHeight - (_availableHeight - _spin.getSpinHeight()) + _mainNaviHeight);
					pos.marginTop = -(_containerHeight - (_availableHeight - _spin.getSpinHeight()) + _mainNaviHeight + _secondaryNaviHeight);
				}
				else
				{
					pos.top = _containerHeight - _secondaryNaviHeight;
					pos.marginTop = (_posControlMargin + (_posControlHeight - _containerHeight));
				}
				// Update the active control's top
				_$container.animate(pos, {duration:400, queue:false});
				// Hide the car header
				hideCarHeader();
			}
			
			_exterior.setCollapsed(!_open);
			_interior.setCollapsed(!_open);
			_accessories.setCollapsed(!_open);
		}
		
		/**
		 * Handles switching the modes of the spin player/static car header image 
		 */
		function modeSwitchHandler(type)
		{
			if(_activeMode == type)return;
			_activeMode = type;
			switch(type)
			{
				case _utils.BOOT:
					//_spin.animateBoot();
				break;
				case _utils.EXT_LIGHT:
					_carHeader.setMode(_utils.EXT, false);
					_spin.setMode(_utils.EXT, false);
				break;
				case _utils.INT_LIGHT:
					_carHeader.setMode(_utils.INT, false);
					_spin.setMode(_utils.INT, false);
				break;
				case _utils.EXT_DARK:
					_carHeader.setMode(_utils.EXT, true);
					_spin.setMode(_utils.EXT, true);
				break;
				case _utils.INT_DARK:
					_carHeader.setMode(_utils.INT, true);
					_spin.setMode(_utils.INT, true);
				break;
				default:
					_carHeader.setMode(type);
					_spin.setMode(type);
				break;
			}
			if(_spin.isUsingLightBG())_$instance.addClass('cc-light');
			else _$instance.removeClass('cc-light');
		}
		
		/**
		 * Method which calculates the packs for interior & exterior 
		 */
		function calculatePacks(packs)
		{
			/**
			 * Separate the packs into interior & exterior packs 
			 */
			var i = 0,
				iL = packs.length,
				t,
				tL,
				item,
				intOptions,
				extOptions,
				aIntPacks = [],
				aExtPacks = [];
			for(; i < iL; i++)
			{
				intOptions = 0;
				extOptions = 0;
				t = 0;
				tL = packs[i].Equipment.length;
				for(; t < tL; t++)
				{
					item = packs[i].Equipment[t];
					if(item.Category.Root.Code === "INT") intOptions++;
					else if(item.Category.Root.Code === "EXT") extOptions++;
				}
				if(intOptions === 0 && extOptions > 0)aExtPacks.push(packs[i]);
				else if(extOptions === 0 && intOptions > 0)aIntPacks.push(packs[i]);
				else if(intOptions > 0 && extOptions > 0)
				{
					aExtPacks.push(packs[i]);
					aIntPacks.push(packs[i]);
				}
			}
			
			/**
			 * Check if the packs are all disabeld, if so don't pass them through 
			 */
			return {
				extPacks:checkPackAvailability(aExtPacks),
				intPacks:checkPackAvailability(aIntPacks)
			};
		}
		
		/**
		 * Method which checks if the packs should be shown or not based on availability in each array 
		 */
		function checkPackAvailability(packs)
		{
			var i = 0,
				iL = packs.length;
			for(; i < iL; i++)
			{
				if(packs[i].Enabled)
				{
					i = -1;
					break;
				}
			}
			if(i > -1)packs = [];
			return packs;
		}
		
		// ###########################
		// Public methods
		// ###########################
		
		/**
    	 * Method which shows the preloader
    	 */
    	this.showNextButtonPreLoader = function()
    	{
    		_carHeader.showNextStepPreLoader();
    		_spin.showNextStepPreLoader();
    	};
    	
    	/**
    	 * Method which hides the preloader 
    	 */
    	this.hideNextButtonPreLoader = function()
    	{
    		_carHeader.hideNextStepPreLoader();
    		_spin.hideNextStepPreLoader();
    	};
    	
    	/**
    	 * Method which hides the next step 
    	 */
    	this.hideNextButton = function()
    	{
    		_carHeader.hideNextButton();
    		_spin.hideNextButton();
    	};
    	
    	/**
    	 * Method which shows the next step 
    	 */
    	this.showNextButton = function()
    	{
    		_carHeader.showNextButton();
    		_spin.showNextButton();
    	};
		
		/**
		 * Method which navigates to a specific step 
		 */
		this.navigate = function(step, force)
		{
			if(_step == step && !force)return;
			if(!_$container)return;
			// Animate the corresponding controls
			if(step != _step)
			{
				switch(step)
				{
					case _utils.EXTERIOR:
						_activeControl = _exterior;
						_passiveControls = [_interior, _accessories];
						modeSwitchHandler(_utils.EXT);
					break;
					case _utils.INTERIOR:
						_activeControl = _interior;
						_passiveControls = [_exterior, _accessories];
						modeSwitchHandler(_utils.INT);
					break;
					case _utils.ACCESSORIES:
						_activeControl = _accessories;
						_passiveControls = [_exterior, _interior];
						modeSwitchHandler(_utils.EXT);
					break;
					case _utils.SUMMARY:
					case _utils.FINANCING:
					case _utils.INSURANCE:
						_activeControl = null;
						_passiveControls = [_exterior, _interior, _accessories];
						modeSwitchHandler(_utils.EXT);
					break;
				}
			}
			_step = step;
			// Update the control height and related elements
			controlHeightUpdateHandler();
			if(_activeControl)$(_activeControl.getDOMNode()).animate({top:0}, {duration:400, queue:false});
			
			// Toggle the container
			if(step === _utils.SUMMARY || step === _utils.FINANCING || step === _utils.INSURANCE)
			{
				// For the summary & financing make sure the container is closed
				_open = true;
				toggleContainerState();
			}
			else
			{
				if(!_open)toggleContainerState();
			}
			// Update the height callback
			updateHeight();
		};
		
		/**
		 * Method which expands the top container 
		 */
		this.expand = function()
		{
			if(!_collapsed)return;
			_collapsed = false;
			_$instance.show();
			_$instance.delay(500).animate({height:getCurrentHeight()}, {duration:500, complete:completeHeightAni});
		};
		
		/**
		 * Method which collapses the top container 
		 */
		this.collapse = function()
		{
			if(_collapsed)return;
			_collapsed = true;
			// Make sure the car-header is hidden
			hideCarHeader();
			_$instance.animate({height:0}, {duration:500, complete:collapseCompleted});
		};
				
		// ###########################
		// Required react methods
		// ###########################
		
		/**
		 * Method called when the component is about to be rendered 
		 */
		this.componentWillMount = function()
		{
			// Save the instance reference
			if(!_instance)_instance = this;
			if(!_dic)_dic = be.marlon.utils.Dictionary;
			if(!_utils)_utils = be.marlon.utils;
		};
		
		/**
		 * Method called when the component will be unmounted 
		 */
		this.componentWillUnMount = function()
		{
			// Add resize event handler
			$(window).off('resize', windowResizeHandler);
			// Add scroll handler
			$(window).off('scroll', scrollHandler);
		};
		
		/**
		 * Method called when the component did render 
		 */
		this.componentDidMount = function(root)
		{
			_$instance = $(_instance.getDOMNode());
			// Reference the active control
			_activeControl = _exterior;
			// Add resize event handler
			$(window).on('resize', windowResizeHandler);
			// Add scroll handler
			$(window).on('scroll', scrollHandler);
			_carHeaderHeight = _$carHeader.height();
			PubSub.subscribe('cc_simulate_toggleheader', simulateToggleHeader);
		};
		
		/**
		 * Method called when the component did update 
		 */
		this.componentDidUpdate = function()
		{
			// Update the controls container to height of the active control
			_$container = $(".cc-controls-container");
			
			// Force navigation
			if(!_collapsed)this.navigate(_step, true);
			
			// Update the positions of the elements
			if(!_didPosition)updatePosition();
			
			if(!_collapsed)
			{
				// Check the scroll
				scrollHandler();
				// Update conform the height of the loaded elements
				_$instance.animate({height:getCurrentHeight()}, {duration:300, complete:completeHeightAni});
			}
		};
		
		/**
		 * Default the props 
		 */
		this.getDefaultProps = function()
		{
			return {
				colours:[],
				packs:[],
				wheels:[],
				upholsteries:[],
				inlays:[],
				accessories:[],
				modes:[],
				options:[],
				carConfiguratorVersion:null,
				visible:false,
				monthlyRate:false
			};
		};
		
		/**
		 * The react render function for this class 
		 */
		this.render = function()
		{
			var Spin = ui.Spin,
				StaticCarHeader = ui.StaticCarHeader,
				Exterior = ui.Exterior,
				Interior = ui.Interior,
				Accessories = ui.Accessories,
				packs = this.props.packs,
				o = calculatePacks(packs);
			return(
				React.DOM.section( {className:"cc-topcontainer"}, 
					StaticCarHeader( {modes:this.props.modes, 
						navigate:this.props.navigate, 
						hasPromo:this.props.hasPromo, 
						modeSwitchHandler:modeSwitchHandler, 
						componentDidMount:carHeaderMountHandler, 
						nextHandler:this.props.nextHandler, 
						imagepath:this.props.spinSettings.imagepath, 
						controller:this.props.controller, 
						configuration:this.props.configuration, 
						carConfiguratorVersion:this.props.carConfiguratorVersion}),
					Spin( {settings:this.props.spinSettings, 
						monthlyRate:this.props.monthlyRate,
						navigate:this.props.navigate, 
						hasPromo:this.props.hasPromo, 
						modes:this.props.modes, 
						modeSwitchHandler:modeSwitchHandler, 
						configuration:this.props.configuration, 
						componentDidMount:spinMountHandler, 
						nextHandler:this.props.nextHandler, 
						controller:this.props.controller, 
						carConfiguratorVersion:this.props.carConfiguratorVersion}),
					React.DOM.div( {className:"cc-controls-container"}, 
						Exterior( {closeClickHandler:toggleControlClickHandler, naviHandler:controlNaviHandler, controller:this.props.controller, heightUpdated:controlHeightUpdateHandler, colours:this.props.colours, packs:o.extPacks, wheels:this.props.wheels, wheelEquipment:this.props.wheelEquipment, options:this.props.options, configuration:this.props.configuration, componentDidMount:exteriorMountHandler, spinSettings:this.props.spinSettings, settings:this.props.settings}),
						Interior( {closeClickHandler:toggleControlClickHandler, naviHandler:controlNaviHandler, controller:this.props.controller, heightUpdated:controlHeightUpdateHandler, upholsteries:this.props.upholsteries, packs:o.intPacks, inlays:this.props.inlays, options:this.props.options, configuration:this.props.configuration, componentDidMount:interiorMountHandler}),
						Accessories( {closeClickHandler:toggleControlClickHandler, naviHandler:controlNaviHandler, controller:this.props.controller, heightUpdated:controlHeightUpdateHandler, accessories:this.props.accessories, configuration:this.props.configuration, componentDidMount:accessoriesMountHandler})
					)
				)
			);
		};
	}
	// Instantiate the topcontainer class
	ui.TopContainer = React.createClass(
		new TopContainer()
	);
}());