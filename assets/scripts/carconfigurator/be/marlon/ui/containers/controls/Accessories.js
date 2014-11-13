/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering the exterior control
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	
	// Instantiate the accessories class
	ui.Accessories = React.createClass(
		{displayName: 'Accessories',
			mixins:[ui.InterfaceControl],
			
			/**
	    	 * Method which maps the options to sections inside the exterior list 
	    	 */
	    	addAccessories:function(props)
	    	{
	    		var i = 0,
	    			acc = props.accessories,
					iL = acc.length,
					oCategories = {},
					catID,
					catName,
					catType,
					level,
					HList = ui.HList,
					aOptions = [];
				for(; i < iL; i++)
				{
					o = acc[i];
	    			catID = o.Category.ID;
					catName = o.Category.Name;
					catType = o.Category.Root.Code;
					level = Number(o.Category.Level);
					
					if(o.Hide !== true)
					{
						// Create the category if it doesn't exist yet
						if(!oCategories[catID])
						{
							oCategories[catID] = {name:catName, items:[]};
						}
						// Create the list for the accessories
		    			lid = {
							asset:_utils.getCARDBAsset(o.Assets, true),
							name:o.Name,
							enabled:(!o.Standard && (o.StandardFilterEquipment !== true)),
							description:o.Description,
							//description:"Lorem ipsum dolor sit amed.",
							price:o.PriceInfo,
							promotions:o.Promotions,
							ID:o.ID,
							showsOnCar:o.ShowsOnCar
		    			};
		    			oCategories[catID].items.push(lid);
					}
				}
				
				return oCategories;
	    	},
	    	
	    	/**
			 * Method which updates the properties 
			 */
			updateProps:function(props)
			{
				var HList = ui.HList,
					navigation = [];
				
				// Add the navigation elements
				var config = props.configuration,
					id = 0,
					oCat;
				// Loop through the available accessories categories and add them
				oCat = this.addAccessories(props);
				// Add every equipment related to interior
				var sProp;
				for(sProp in oCat)
				{
					navigation.push({code:'accessories-accessories', id:id, label:oCat[sProp].name, element:HList( {webtrendtag:"view-accessory-details", items:oCat[sProp].items, deselectable:true, selected:config?config.Accessories:[], className:"cc-accessories", controllerSelectHandler:props.controller.setAccessory})});
					id++;
				}
				this.setState({navigation:navigation});
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
				this.updateProps(this.props);
			},
			
			
			/**
			 * Method called when the component is about to receive new props 
			 */
			componentWillReceiveProps:function(nextProps, nextState)
			{
				this.updateProps(nextProps);
			}
		}
	);
}());