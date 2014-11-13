/** @jsx React.DOM */
(function(){
	
	/**
	 * Debug class! 
	 */
	var ui = be.marlon.ui;
	be.marlon.Debug = function(_$ele, _controller, _settings)
    {	
		var _keySpace = false,
    	    _keyV = false,
    	    _keyF = false,
    	    _versionTriggered = false,
    	    _debugTriggered = false,
    	    _s = "",
    	    _overlay;
        
        /**
         * Initialisation method 
         */
	    function init()
	    {
	    	// Instantiate the messagepane
	    	var $ele = $('<div/>'),
	    		$doc = $(document);
        	_$ele.append($ele);
        	_overlay = React.renderComponent(ui.Overlay(), $ele[0]);
	    	
	    	// Add event listeners to the mouse up & down events of the document
			$doc.on("keydown", onKeyDown);
			$doc.on("keyup", onKeyUp);
	    }
	    
	    /**
	     * Method which appends the version text! 
	     */
	    this.addVersionContent = function(s)
	    {
	    	// Render a normal window
	    	_s += s;
	    };
	    
	    /**
	     * Method which returns the version content 
	     */
	    this.getVersionContent = function(s)
	    {
	    	return _s;
	    };
	    
	    /**
	     * Handles the keydown event 
 		 * @param e:EventObject
	     */
	    function onKeyDown(e)
	    {
	    	e = e.obj?e.obj:e;
	    	if(typeof e == "undefined")return;
	    	if (e.keyCode == 70)_keyF = true;
	        if (e.keyCode == 86)_keyV = true;
	        if (e.keyCode == 32)_keySpace = true;
	        if (_keyV && _keySpace)
	        {
	        	if(_versionTriggered)
	        	{
	            	_versionTriggered = false;
	            	_overlay.setState({visible:false});
	        	}
	        	else
	        	{
	            	_versionTriggered = true;
	            	_overlay.replaceProps({
		        		title:"Version",
		        		description:_s
		        	});
	           	}
	           	window.scrollTo(0,0);
	        }
	        if(_keyF && _keySpace)
	        {
	        	if(_debugTriggered)
	        	{
	            	_debugTriggered = false;
	            	_overlay.setState({visible:false});
	        	}
	        	else
	        	{
	            	_debugTriggered = true;
	            	_overlay.replaceProps({
		        		title:"Financial information",
		        		contents:FinancialDebug( {controller:_controller, settings:_settings})
		        	});
	           	}
	           	window.scrollTo(0,0);
	        }
	    }
	    
	    /**
	     * Handles the keyup event 
 		 * @param e:EventObject
	     */
	    function onKeyUp(e)
	    {
	    	e = e.obj?e.obj:e;
	    	if(typeof e == "undefined")return;
	    	if (e.keyCode == 70)_keyF = false;
	        if (e.keyCode == 86)_keyV = false;
	        if (e.keyCode == 32)_keySpace = false;
	    }
	    
	    // Initialize
	    init();
	};
	
	var FinancialDebug = React.createClass(
		{displayName: 'FinancialDebug',
			/**
			 * Method which creates the tables given a specific object 
			 */
			createTables:function(o)
			{
				var prop,
					trs = [],
					tables = [],
					i = 0;
				for(prop in o)
				{
					trs.push(
						React.DOM.tr( {key:prop}, 
							React.DOM.td(null, prop),
							React.DOM.td(null, "" + o[prop])
						)
					);
					i++;
					if((i+1)%4 === 0)
					{
						tables.push(
							React.DOM.table( {key:Math.round((i+1)/4)-1, className:"cc-fin-parameters cc-box"}, 
								trs
							)
						);
						trs = [];
					}
				}
				if(trs.length > 0)
				{
					tables.push(
						React.DOM.table( {key:tables.length, className:"cc-fin-parameters cc-box"}, 
							trs
						)
					);
				}
				return tables;
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var settings = this.props.settings,
					fc = this.props.controller.getFullConfiguration(),
					label = be.marlon.utils.Dictionary.getLabel('monthlyRateLabel'),
					av = typeof fc !== "undefined"?fc.Car.Availability:null;
				
				// Include check for if it is not yet available
				if(!av)
				{
					return (
						React.DOM.div( {className:"cc-debug-content"}, 
							"Financial debug information not yet available, please navigate to at least the bodytypes step."
						)
					);
				}
				
				// List of grouped financial settings
				var finSettings = {
					forceShowFinanceButtonCarConfig:settings.forceShowFinanceButtonCarConfig,
					showFinanceButtonCarConfig:settings.showFinanceButtonCarConfig,
					showInsuranceButtonCarConfig:settings.showInsuranceButtonCarConfig,
					showMonthlyRateCarConfig:settings.showMonthlyRateCarConfig,
					showMonthlyRateToggleCarConfig:settings.showMonthlyRateToggleCarConfig,
					monthlyRateToggleDefaultValueCarConfig:settings.monthlyRateToggleDefaultValueCarConfig,
				};
				
				return (
					React.DOM.div( {className:"cc-debug-content"}, 
						React.DOM.h4(null, "Financial availability service"),
						React.DOM.div( {className:"clearfix"}, 
							this.createTables(av)
						),
						React.DOM.h4(null, "Financial tridion settings"),
						React.DOM.div( {className:"clearfix"}, 
							this.createTables(finSettings)
						),
						React.DOM.ul( {className:"cc-box"}, 
							React.DOM.li(null, "financing:",React.DOM.br(null),settings.financing),
							React.DOM.li(null, "insurance:",React.DOM.br(null),settings.insurance),
							React.DOM.li(null, "monthlyRate:",React.DOM.br(null),settings.monthlyRate),
							React.DOM.li(null, "monthlyRateDisclaimer:",React.DOM.br(null),settings.monthlyRateDisclaimer)
						),
						React.DOM.h4(null, "Financial tridion labels"),
						React.DOM.ul( {className:"cc-box"}, 
							React.DOM.li(null, "monthlyRateLabel:",React.DOM.br(null),label === be.marlon.utils.Dictionary.EMPTY?React.DOM.span( {style:{color:"red"}}, "-- Label is not defined --"):label)
						),
						React.DOM.h4(null, "Configuration object"),
						React.DOM.div( {className:"cc-box"}, 
							this.props.controller.getExternalConfigurationObject(true, true)
						)
					)
				);
			}
		}
	);
}());
	
	
