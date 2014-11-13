/** @jsx React.DOM */
(function() {
	// Define location in the namespace
	var ui = be.marlon.ui;
	
	/**
     * This class contains logic for rendering the nextbutton
     */
    ui.NextButton = React.createClass(
    	{displayName: 'NextButton',
    		mixins:[be.marlon.utils.Mixins.Mount],
    		_$this:null,
	    	////////////////////////////
	    	// Private methods
	    	////////////////////////////
	    	
	    	/**
			 * Method called when the next step fadet out completely 
			 */
			onNextStepFadeOutComplete:function()
			{
				this._$this.hide();
			},
			
			////////////////////////////
	    	// Public methods
	    	////////////////////////////
	    	
	    	/**
	    	 * Method which shows the preloader
	    	 */
	    	showPreLoader:function()
	    	{
	    		this.setState({showPreLoader:true});
	    	},
	    	
	    	/**
	    	 * Method which hides the preloader 
	    	 */
	    	hidePreLoader:function()
	    	{
	    		this.setState({showPreLoader:false});
	    	},
	    	
	    	/**
	    	 * Method which shows the button 
	    	 */
	    	show:function(animate)
	    	{
	    		this._$this.stop();
	    		this._$this.css({display:'block', opacity:0});
	    		if(animate)
	    		{
	    			this._$this.fadeTo(300, 1);
				}
				else
				{
					this._$this.fadeTo(0, 1);
				}
	    	},
	    	
	    	/**
	    	 * Method which hides the button 
	    	 */
	    	hide:function(animate)
	    	{
	    		this._$this.stop();
	    		if(animate)
	    		{
	    			this._$this.fadeTo(300, 0, this.onNextStepFadeOutComplete);
	    		}
	    		else
	    		{
	    			this._$this.hide();
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
				return {showPreLoader:true};
			},
			
			/**
			 * Method called when the component will be mounted 
			 */
			componentWillMount:function()
			{
				
			},
			
			/**
			 * Method called when the component is about to be unmounted 
			 */
			componentWillUnmount:function()
			{
				
			},
			
			/**
			 * Method called when the component is about to receive new props 
			 */
			componentWillReceiveProps:function(nextProps, nextState)
			{
				
			},
			
			/**
			 * Method called when the component has been mounted 
			 */
			componentDidMount:function()
			{
				this._$this = $(this.getDOMNode());
			},
			
    		/**
    		 * Method which renders the component 
    		 */
    		render:function()
    		{
    			var dic = be.marlon.utils.Dictionary,
    				PreLoader = ui.PreLoader,
    				icon = this.state.showPreLoader?PreLoader( {size:be.marlon.utils.TINY, visible:true}):React.DOM.i( {className:"icon-chevron-right"});
    			return(
    				React.DOM.a( {className:"btn btn-red btn-small cc-btn cc-btn-next" + (be.marlon.utils.smSlave?' cc-sm-slave':'') + (this.state.showPreLoader?' cc-indent':''), onClick:this.props.clickHandler, style:{display:(this.props.visible?'block':'none')}}, 
    					dic.getLabel('nextStep'),
    					icon
    				)
    			);
    		}
    	}
    );
})();