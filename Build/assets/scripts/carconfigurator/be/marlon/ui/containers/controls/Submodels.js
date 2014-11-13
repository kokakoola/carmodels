/** @jsx React.DOM */
(function() {
	
	/**
     * Navigation component, renders the navigation
     */
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag;
	// Instantiate the submodels class
	ui.Submodels = React.createClass(
		{displayName: 'Submodels',	
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
	    	 * Function which returns the index of a promotion from the promotions array
	    	 * @param id:String
	    	 * @param promotions:Array 
	    	 */
	    	getPromoIndex:function(id, promotions)
	    	{
	    		var i = 0,
	    			iL = promotions.length,
	    			o;
	    		for(; i < iL; i++)
	    		{
	    			o = promotions[i];
	    			if(o.ID == id)
	    			{
	    				return o.Index;
	    			}
	    		}
	    		return -1;
	    	},
	    	
	    	/**
	    	 * Method which maps the promotion indexes
	    	 * @param discounts:Array 
	    	 */
	    	mapPromoIndex:function(discounts)
	    	{
	    		var i = 0,
	    			iL = discounts.length,
	    			arr = [];
	    		for(; i < iL; i++)
	    		{
	    			arr.push({Index:this.getPromoIndex(discounts[i].ID, this.props.promotions)});
	    		}
	    		return arr;
	    	},
	    	
	    	/**
	    	 * Method which handles clicking on a submodel
	    	 * @param e:Event
	    	 * @param item:React obj, the item clicked upon 
	    	 */
	    	modelSelected:function(e, item)
	    	{	
	    		// Track click bodyTypes
	            bt.track({
	                componentname: 'carconfig',
	                action: 'cc_workflow',
	                value: 'submodel-select',
	                workflowname: 'carconfigurator',
	                workflowstep: 3
	            });
	            
	    		// Select the submodel
	    		this._submodels.select(item.props.key);
	    		
	    		// Do the callback
				this.props.submodelSelectedHandler({ID:item.props.key, MultiBodyType:item.props.hasBodytype, HasAccessories:item.props.hasAccessories});
	    	},
						
			// ###########################
			// Public methods
			// ###########################
			
			/**
			 * Method which resets the selectd submodel 
			 */
			reset:function()
			{
				// Select the submodel
	    		this._submodels.select(null);
			},
					
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Method called when the component is about to be rendered 
			 */
			componentWillMount:function()
			{
				// Save the instance reference
				this._submodels = new ui.List();
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				// Map the steps to actual React elements
				var instance = this,
					utils = be.marlon.utils,
					submodels = this.props.submodels.map(
					function (item) 
					{
						var price = (utils.hasPrice && item.PriceInfo.ListPriceWithDiscount > 0)?utils.formatPrice(item.PriceInfo.ListPriceWithDiscount,true):'',
							dprice = "";
						// Check the price!
						if(item.PriceInfo.ListPrice != item.PriceInfo.ListPriceWithDiscount)
						{
							dprice = utils.formatPrice(item.PriceInfo.ListPrice,true);
						}
						return Submodel({
							key:item.ID,
							hybrid:item.Hybrid,
							title:item.Name,
							hasBodytype:item.MultiBodyType, 
							hasAccessories:item.HasAccessories, 
							promotions:instance.mapPromoIndex(item.PriceInfo.Discounts),
							asset:instance.getImg(item), 
							specs:item.FullSpecs, 
							price:price,
							dprice:dprice,
							clickHandler:instance.modelSelected
							});
			    	}
			    );
			    this._submodels.setData(submodels);

				return(
					React.DOM.div( {className:"cc-abs-item cc-horizon cc-submodels"}, 
						submodels
					)
				);
			}
		}
	);
	
	/**
	 * The submodel instance 
	 */
	var Submodel = React.createClass(
		{displayName: 'Submodel',
			mixins:[be.marlon.utils.Mixins.VisualItem],
			
			/**
	    	 * Method which returns the eco data for the specific object 
	    	 */
			getEcoData:function(o)
			{
				var sEco = "";
				var	maxValue = o.MaxValue;
				
				var dic = be.marlon.utils.Dictionary,
					seperator = dic.getLabel("decimalsymbol");
				if(seperator == dic.EMPTY || seperator === "" || seperator === " ")
				{
					seperator = ".";
				}
				
				if(maxValue && maxValue !== "" && maxValue != o.MinValue)
				{
					sEco += o.MinValue.replace(/[.]/g, seperator) + " - " + maxValue.replace(/[.]/g, seperator);
				}
				else
				{
					sEco += o.MinValue.replace(/[.]/g, seperator);
				}
				
				return sEco;
			}
		}
	);
	
})();
