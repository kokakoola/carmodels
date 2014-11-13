/** @jsx React.DOM */
(function() {
	
	/**
     * Navigation component, renders the navigation
     */
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag;
	// Instantiate the bodytypes class
	ui.BodyTypes = React.createClass(
		{displayName: 'BodyTypes',
			mixins:[be.marlon.utils.Mixins.Height, be.marlon.utils.Mixins.Mount],
			
			// ###########################
			// Private methods
			// ###########################
			
			/**
			 * Method which handles searching for the appropriate img
			 * @param o:Object
			 */
			getImg:function(o)
			{
				return this.props.imgPath + o.Image.replace("{VIEW}", "exterior").replace("{SIDE}", 9).replace("{TYPE}", "png").replace("{WIDTH}", "371").replace("{HEIGHT}", "195");
			},
			
	    	/**
	    	 * Method which handles clicking on a bodytype
	    	 * @param e:Event
	    	 * @param item:React obj, the item clicked upon 
	    	 */
	    	bodytypeSelectHandler:function(e, item)
	    	{
	    		// Track click bodyTypes
	            bt.track({
	                componentname: 'carconfig',
	                action: 'cc_workflow',
	                value: 'bodytype',
	                workflowname: 'carconfigurator',
	                workflowstep: 4
	            });
	            
	    		// Select the bodytype
	    		this._bodyTypes.select(item.props.key);
	    		
	    		// Do the callback
	    		this.props.bodytypeSelectHandler(item.props.key);
	    	},
						
			// ###########################
			// Public methods
			// ###########################
			
						
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Method called when the component is about to be rendered 
			 */
			componentWillMount:function()
			{
				// Save the instance reference
				this._bodyTypes = new ui.List();
			},
			
			/**
			 * Method called when the component did update 
			 */
			componentDidUpdate:function()
			{
				if(!this.props.configuration)return;
	    		// Select the bodytype
	    		this._bodyTypes.select(this.props.configuration.BodyTypeID);
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				// Map the steps to actual React elements
				var instance = this,
					utils = be.marlon.utils,
					bodytypes = this.props.bodytypes.map(
					function (item) 
					{
						var price = (utils.hasPrice && item.PriceInfo.ListPriceWithDiscount > 0)?utils.formatPrice(item.PriceInfo.ListPriceWithDiscount,true):'',
							dprice = "";
						// Check the price!
		    			if(item.AvailablePromotions.length > 0)
		    			{
		    				dprice = utils.formatPrice(item.PriceInfo.ListPrice,true);
		    			}
						
						return Bodytype({
							key:item.ID,
							title:item.Name, 
							asset:instance.getImg(item), 
							promotions:item.AvailablePromotions,
							price:price,
							dprice:dprice,
							clickHandler:instance.bodytypeSelectHandler
							});
			    	}
			    );
			    this._bodyTypes.setData(bodytypes);

				return(
					React.DOM.div( {className:"cc-abs-item cc-horizon cc-bodytypes"}, 
						bodytypes
					)
				);
			}
		}
	);
	
	/**
	 * The bodytype instance 
	 */
	var Bodytype = React.createClass(
		{displayName: 'Bodytype',
			mixins:[be.marlon.utils.Mixins.VisualItem]
		}
	);
})();
