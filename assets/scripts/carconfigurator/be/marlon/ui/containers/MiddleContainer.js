/** @jsx React.DOM */
(function() {
	
	/**
     * Middle container component, this contains the logic for rendering the:
     * -Navigation
     * -Specification sheet
     */
	var ui = be.marlon.ui;
	// Create the bottomcontainer class
	function MiddleContainer()
	{
		// Global variables
		var _dic,
			_instance,
			_utils,
			
			_resetNavigation = true,
			
			_shown = false,
			
			_navigation;
		
		// ###########################
		// Private methods
		// ###########################
		
		/**
		 * Method which handles the mounting of the navigation 
		 */
		function naviMountHandler(navi)
		{
			_navigation = navi;
		}
			
		// ###########################
		// Public methods
		// ###########################
		
		/**
    	 * Method which shows the preloader
    	 */
    	this.showPreLoader = function()
    	{
    		_navigation.showPreLoader();
    	};
    	
    	/**
    	 * Method which hides the preloader 
    	 */
    	this.hidePreLoader = function()
    	{
    		_navigation.hidePreLoader();
    	};
    	
    	/**
    	 * Method which hides the next step 
    	 */
    	this.hideNextButton = function()
    	{
    		_navigation.hideNextStep();
    	};
    	
    	/**
    	 * Method which shows the next step 
    	 */
    	this.showNextButton = function()
    	{
    		_navigation.showNextStep();
    	};
		
		/**
		 * Method which hides the navigation title 
		 */
		this.hideTitle = function()
		{
			_navigation.hideTitle();
		};
		
		/**
		 * Method which shows the navigation title 
		 */
		this.showTitle = function()
		{
			_navigation.showTitle();
		};
		
		/**
		 * Method which performs as if clicked on the next step 
		 */
		this.nextStep = function()
		{
			_navigation.nextStep();
		};
		
		/**
		 * Method which resets the navigation if the reset parameter is filled in or returns the value otherwise 
		 */
		this.resetNavigation = function(reset)
		{
			if(typeof reset != "undefined")_resetNavigation = reset;
			else return _resetNavigation;
		};
		
		
		/**
		 * Method which animates in the navigation 
		 */
		this.showMainButtons = function()
		{
			// Make sure the step is selected
			_navigation.selectStep();
			
			// Animate in the mainbuttons
			_navigation.showMainButtons();
		};
		
		/**
		 * Method which aniamtes out the navigation 
		 */
		this.hideMainButtons = function()
		{
			// Animate out the mainbuttons
			_navigation.hideMainButtons();
		};
		
		/**
		 * Method which selects a step on the navigation 
		 */
		this.selectStep = function(step)
		{
			_navigation.selectStep(step);
		};
		
		/**
		 * Method which animates in the middle container 
		 */
		this.animateIn = function()
		{
			if(_shown)return;
			_shown = true;
			_navigation.showNextStep(true);
		};
		
		/**
		 * Method which animates out the middle container 
		 */
		this.animateOut = function()
		{
			if(!_shown)return;
			_shown = false;
			_navigation.hideNextStep(true);
		};
		
		/**
		 * Method which returns the current step of the navigation 
		 */
		this.getNaviCurrentStep = function()
		{
			return _navigation.currentStep();
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
			var Navigation = ui.Navigation,
				SpecSheet = ui.SpecSheet,
				navi = Navigation( {data:this.props.naviconfig, showNextStep:this.props.showNextStep, hideNextStep:this.props.hideNextStep, naviHandler:this.props.naviHandler, componentDidMount:naviMountHandler});
			
			var style = {
		    };
		    
			return(
				React.DOM.section( {className:"cc-middlecontainer cc-panel", style:style}, 
					React.DOM.div( {className:"container cc-container"}, 
						navi
					)
				)
			);
		};
	}
	// Instantiate the bottomcontainer class
	ui.MiddleContainer = React.createClass(
		new MiddleContainer()
	);
}());