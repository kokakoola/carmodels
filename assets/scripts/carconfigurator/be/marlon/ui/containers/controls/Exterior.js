/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering the exterior control
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	// Instantiate the Exterior class
	ui.Exterior = React.createClass(
		{displayName: 'Exterior',
			mixins:[ui.InterfaceControl],
			_comparePacksData:null,
			
			// ###########################
			// Private methods
			// ###########################
	    	
	    	/**
	    	 * Method which maps the options to sections inside the exterior list 
	    	 */
	    	addOptions:function(props)
	    	{
	    		var i = 0,
					options = props.options,
					iL = options.length,
					oCategories = {},
					catID,
					catName,
					catType,
					level,
					aOptions = [];
				for(; i < iL; i++)
				{
					o = options[i];
	    			catID = o.Category.ID;
					catName = o.Category.Name;
					catType = o.Category.Root.Code;
					level = Number(o.Category.Level);
					
					if(catType == "EXT" && (o.Hide !== true))
					{
						// Create the category if it doesn't exist yet
						if(!oCategories[catID])
						{
							oCategories[catID] = {name:catName, items:[]};
						}
						// Create the list for the options
		    			lid = {
							asset:_utils.getCARDBAsset(o.Assets, true),
							name:o.Name,
							enabled:(!o.Standard && (o.StandardFilterEquipment !== true)),
							description:o.Description,
							//description:"Lorem ipsum dolor",
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
			 * Method which constructs the compare packs data based on the source given 
			 */
			constructComparePacks:function(data)
			{
				var cols = [],
					categories = [];
				// Create cols & equipment list
				$.each(data, function(i, p) {
					//if (p.Equipment.length > 0) {
						// Add column
						cols.push({ID:p.ID, Name:p.Name});
						// Check if equipment exists
						$.each(p.Equipment, function(j, o) {
							// Convert o to a usable object
		    				var rowData = null;
							// Convert packs to useable data objects
		    				var lvl = o.Category.Level;
		    				
		    				// Data is 2nd level
		    				if (lvl == 2)
		    				{
		    					// See if myCat is already assigned
		    					var myCat = $.grep(categories, function(cat){ return cat.ID == o.Category.ID; })[0];
		    					// If not assigned yet, push to category-list
		    					if (typeof myCat === "undefined") {
			    					myCat = {
			    						ID:o.Category.ID,
			    						Name:o.Category.Name,
			    						Rows:[],
			    						SubCats:[]
			    					};
			    					categories.push(myCat);
			    				}
			    				// Find existing rowdata
		    					rowData = $.grep(myCat.Rows, function(row) { return row.ID == o.ID; })[0];
		    					// If no row data found, create new one and push to myCat
			    				if (typeof rowData === "undefined") {
			    					rowData = { ID:o.ID, Name:o.Name, Availability:{} };
			    					myCat.Rows.push(rowData);
			    				}
			    				// Set availability for this pack			    			
		    					rowData.Availability[p.ID] = "standard";
		    				}
		    				else if (lvl == 3)
		    				{
		    					// See if myRootCat is already assigned
		    					myRootCat = $.grep(categories, function(cat){ return cat.ID == o.Category.Root.ID; })[0];
		    					// If not assigned yet, push to category-list
		    					if (typeof myRootCat === "undefined") {
		    						myRootCat = {
		    							ID:o.Category.Root.ID,
		    							Name:o.Category.Root.Name,
		    							Rows:[],
		    							SubCats:[]
		    						};
		    						categories.push(myRootCat);
		    					}
		    					// Push SubCat in RootCat
		    					mySubCat = $.grep(myRootCat.SubCats, function(cat){ return cat.ID == o.Category.ID; })[0];
		    					// If not assigned yet, push to subcat list
		    					if (typeof mySubCat === "undefined") {
		    						mySubCat = {
		    							ID:o.Category.ID,
		    							Name:o.Category.Name,
		    							Rows:[]
		    						};
		    						myRootCat.SubCats.push(mySubCat);
		    					}
		    					// Find existing rowdata
		    					rowData = $.grep(mySubCat.Rows, function(row) { return row.ID == o.ID; })[0];
		    					// If no row data found, create new one and push to mySubCat
			    				if (typeof rowData === "undefined") {
			    					rowData = { ID:o.ID, Name:o.Name, Availability:{} };
			    					mySubCat.Rows.push(rowData);
			    				}
			    				// Set availability for this pack			    			
		    					rowData.Availability[p.ID] = "standard";
		    				}
							
						});
					//}
				});
				return {cols:cols, rows:categories};
			},
			
			/**
			 * Method which updates the properties 
			 */
			updateProps:function(props)
			{
				var HList = ui.HList,
					VList = ui.VList,
					WheelComponent = ui.WheelComponent,
					cat = {},
					o,
					instance = this,
					navigation = [],
					// Map the colours
					colours = props.colours.map(
						function(item)
						{
							o = {
								category:(!cat[item.Type])?item.Type:'',
								colour:item.RGB,
								name:item.Name,
								price:item.PriceInfo,
								promotions:item.Promotions,
								ID:item.ID
							};						
							cat[item.Type] = true;
							return o;
						}
					);
				
				var config = props.configuration,
					id = 0,
					oCat;
				
				// Map the packs
				var packs = props.packs.map(
					function(item)
					{
						return {
							name:item.Name,
							enabled:item.Enabled?instance.checkAvailability(props, item.AvailableForExteriorColours, item.AvailableForUpholsteries):false,
							ID:item.ID,
							price:item.PriceInfo,
							promotions:item.Promotions,
							equipment:item.Equipment,
							equipmentDescription:item.EquipmentDescription,
							colourCombinations:item.AccentColourCombination,
							exteriorColourID:config?config.ExteriorColourID:false
						};
					}
				);
				
				// Determine the primary accent color selected
				var primaryAccentColor = null;
				
				// Add the navigation elements
				navigation.push({code:'exterior-colours', id:id, label:this._dic.getLabel('colours'), element:HList( {items:colours, selected:config?config.ExteriorColourID:false, className:"cc-tab-colours", controllerSelectHandler:props.controller.setExteriorColour})});
				if(packs.length > 0)
				{
					id++;
					var selectedEquipment = config?config.Options.concat(config.Accessories):null;
					primaryAccentColor = props.controller.getPrimaryAccentColor();
					// Add it to the navigation
					navigation.push({code:'exterior-packs', id:id, label:this._dic.getLabel('packs'), compareData:{data:this._comparePacksData, label:this._dic.getLabel('comparePacks')},  element:VList( {infoTitle:this._dic.getLabel('packEquipmentInfoTitle'), items:packs, selected:config?config.Packs:null, selectedEquipment:selectedEquipment, className:"cc-packs", controllerSelectHandler:props.controller.setPack, controllerSecondarySelectHandler:props.controller.setPackEquipment})});
				}
				id++;
				navigation.push({code:'exterior-wheels', id:id, label:this._dic.getLabel('wheels'), element:WheelComponent( {config:config, items:props.wheels, equipment:props.wheelEquipment, controller:props.controller, spinSettings:props.spinSettings, settings:props.settings, primaryAccentColor:primaryAccentColor})});
				
				// Loop through the available option categories and add them
				oCat = this.addOptions(props);
				// Add every equipment related to interior
				var sProp;
				for(sProp in oCat)
				{
					id++;
					navigation.push({code:'exterior-options', id:id, label:oCat[sProp].name, element:HList( {webtrendtag:"view-option-details", items:oCat[sProp].items, deselectable:true, selected:config?config.Options:[], className:"cc-options", controllerSelectHandler:props.controller.setOption})});
				}
				
				this.setState({navigation:navigation});
			},
			
			/**
			 * Method which checks the availability based on the AvailableForExteriorColours & AvailableForUpholsteries properties 
			 */
			checkAvailability:function(props, aFEC, aFU)
			{
				var config = props.configuration,
					available = true;
				if(!config)return true;
				if(aFEC && aFEC.length > 0)
				{
					available = _utils.getItem(config.ExteriorColourID, aFEC, "ID")?true:false;
				}
				if(aFU && aFU.length > 0)
				{
					if(available)available = _utils.getItem(config.UpholsteryID, aFU, "ID")?true:false;
				}
				return available;
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
				// Construct the compare packs data based on the next props given
				if(!_utils.checkArrays(nextProps.packs, this.props.packs))
				{
					this._comparePacksData = this.constructComparePacks(nextProps.packs);
				}
				this.updateProps(nextProps);
			}
		}
	);
}());