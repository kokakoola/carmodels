/** @jsx React.DOM */
(function() {
	
	/**
     * Navigation component, renders the navigation
     */
	var ui = be.marlon.ui;
	// Create the Navigation class
	function Navigation()
	{
		// Global variables
		var _dic,
			_instance,
			_utils,
			_currentStep = 1,
			_btnNext,
			_mainButtonsVisible = false,
			_finalStep,
			_steps = new ui.List();
			
		this.mixins = [be.marlon.utils.Mixins.Mount];
		
		// ###########################
		// Private methods
		// ###########################
		
		/**
		 * Method which handles clicking on a navigation element 
		 * @param e:Event
		 */
		function clickHandler(e, target)
		{
			// The key property of the target item contains the step which it represents
			_instance.props.naviHandler(target.props.key);
		}
		
		/**
		 * Method which handles clicking on the next button
		 * @param e:Event 
		 */
		function nextClickHandler(e)
		{
			if(_currentStep >= _finalStep)return;
			var step = _currentStep;
			step ++;
			if(_instance.props.data)
			{
				// Check for bodytypes
				if(!_instance.props.data.hasBodytype && step == _utils.BODYTYPES) step++;
				// Check them accessories
				if(!_instance.props.data.hasAccessories && step == _utils.ACCESSORIES) step++;
				// Check them financing
				if(!_instance.props.data.hasFinance && step == _utils.FINANCING) step++;
			}
			//console.log("Navigation: nextClickHandler -> ", _currentStep);
			_instance.props.naviHandler(step);
		}
		
		/**
		 * Method which checks the next step visibility 
		 */
		function checkNextStep()
		{
			if(_currentStep >= _finalStep)
			{
				_instance.props.hideNextStep();
			}
			else
			{
				_instance.props.showNextStep();
			}
		}
		
		/**
		 * Method which handles the fadeout complete 
		 */
		function fadeOutComplete()
		{
			// Get the correct button from the list
			var i = 0,
				arr = _steps.getData(),
				iL = arr.length,
				o;
			for(; i < iL; i++)
			{
				o = arr[i];
				if(o.getDOMNode() == this)
				{
					o.setState({visible:false});
					break;
				}
			}
		}
		
		/**
		 * Method which handles the mounting of the nextstep 
		 */
		function nextStepMountHandler(item)
		{
			_btnNext = item;
		}
		
		// ###########################
		// Public methods
		// ###########################
		
		/**
    	 * Method which shows the preloader
    	 */
    	this.showPreLoader = function()
    	{
    		_btnNext.showPreLoader();
    	};
    	
    	/**
    	 * Method which hides the preloader 
    	 */
    	this.hidePreLoader = function()
    	{
    		_btnNext.hidePreLoader();
    	};
		
		/**
		 * Method which hides the title 
		 */
		this.hideTitle = function()
		{
			$(this.getDOMNode()).find('h1').hide();
		};
		
		/**
		 * Method which shows the title 
		 */
		this.showTitle = function()
		{
			$(this.getDOMNode()).find('h1').show();
		};
		
		/**
		 * Method which performs as if clicked on the next step 
		 */
		this.nextStep = function()
		{
			nextClickHandler();
		};
		
		/**
		 * Method which returns the current selected step 
		 */
		this.currentStep = function()
		{
			return _currentStep;
		};
		
		/**
		 * Method which shows the navigation elements 
		 */
		this.showMainButtons = function()
		{
			if(_mainButtonsVisible) return;
			_mainButtonsVisible = true;
			var i = 0,
				arr = _steps.getData(),
				iL = arr.length,
				o;
			for(; i < iL; i++)
			{
				o = arr[i];
				// Set visible
				o.setState({visible:true, enabled:true});
				// Animate in
				$(o.getDOMNode()).fadeTo(200*i, 1);
			}
		};
		
		/**
		 * Method which hides the main buttons 
		 */
		this.hideMainButtons = function()
		{
			if(!_mainButtonsVisible) return;
			_mainButtonsVisible = false;
			var i = 0,
				arr = _steps.getData(),
				iL = arr.length,
				o;
			for(; i < iL; i++)
			{
				o = arr[i];
				// Set visible
				o.setState({enabled:false});
				// Animate in
				$(o.getDOMNode()).fadeTo(200*i, 0, fadeOutComplete);
			}
		};
		
		/**
		 * Method which selects the current step 
		 */
		this.selectStep = function(step)
		{
			if(typeof step == "undefined")step = _currentStep;
			_currentStep = step;
			var i = 0,
				arr = _steps.getData(),
				iL = arr.length,
				o;
			for(; i < iL; i++)
			{
				o = arr[i];
				if(o.props.key == step)
				{
					o.setState({selected:true});
				}
				else
				{
					o.setState({selected:false});
				}
			}
			// Check the next step visibility
			checkNextStep();
		};
		
		/**
		 * Method which shows the next step 
		 */
		this.showNextStep = function(animate)
		{
			_btnNext.show(animate);
		};
		
		/**
		 * Method which hides the next step 
		 */
		this.hideNextStep = function(animate)
		{
			_btnNext.hide(animate);
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
		 * The react render function for this class 
		 */
		this.render = function()
		{
			// Initialize the navigation
			var steps = [];
    		if(this.props.data && this.props.data.hasBodytype)steps.push({label:_dic.getLabel('bodyType'), step:_utils.BODYTYPES});
    		steps.push({label:_dic.getLabel('engineGrade'), step:_utils.ENGINE_GRADES});
    		steps.push({label:_dic.getLabel('exterior'), step:_utils.EXTERIOR});
    		steps.push({label:_dic.getLabel('interior'), step:_utils.INTERIOR});
    		if(this.props.data && this.props.data.hasAccessories)steps.push({label:_dic.getLabel('accessories'), step:_utils.ACCESSORIES});
    		steps.push({label:_dic.getLabel('summary'), step:_utils.SUMMARY});
    		_finalStep = _utils.SUMMARY;
    		if(this.props.data && this.props.data.hasFinance)
    		{
    			steps.push({label:_dic.getLabel('financing'), step:_utils.FINANCING});
    			_finalStep = _utils.FINANCING;
    		}
    		if(this.props.data && this.props.data.hasInsurance)
    		{
    			steps.push({label:_dic.getLabel('insurance'), step:_utils.INSURANCE});
    			_finalStep = _utils.INSURANCE;
    		}
    		
    		// Map the steps to actual React elements
			steps = steps.map(
				function (item) 
				{
					return NaviItem({
						key:item.step, 
						label:item.label, 
						clickHandler:clickHandler
						});
		    	}
		    );
		    _steps.setData(steps);
		    
		    var NextButton = ui.NextButton;
		    
			return(
				React.DOM.nav( {className:"cc-primary cc-group"}, 
					React.DOM.h1( {style:{display:"none"}}, _dic.getLabel('chooseModel')),
					React.DOM.ul(null, steps),
					NextButton( {clickHandler:nextClickHandler, componentDidMount:nextStepMountHandler})
				)
			);
		};
	}
	
	// Instantiate the Navigation
	ui.Navigation = React.createClass(
		new Navigation()
	);
		
	/**
	 * Navigation dependency item 
	 */
	var NaviItem = React.createClass(
		{displayName: 'NaviItem',
			mixins:[be.marlon.utils.Mixins.Mount],
			clickHandler:function(e)
			{
				this.props.clickHandler(e, this);
			},
			
			/**
			 * Method whcih returns the default state of the navigation item 
			 */
			getInitialState: function() 
			{
    			return {selected:false, visible:false, enabled:true};
  			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				// Set the style
				var style = {
					display:this.state.visible?'block':'none',
					opacity:0
				};
				return(
					React.DOM.li( {style:style, className:(this.state.selected?'current':'')}, 
						React.DOM.a( {onClick:this.state.enabled?this.clickHandler:null, className:(this.state.selected?'current':'')}, this.props.label)
					)
				);
			}
		}
	);
})();
