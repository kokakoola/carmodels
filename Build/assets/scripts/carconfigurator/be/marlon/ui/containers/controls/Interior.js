/** @jsx React.DOM */
(function(){
	
	/**
     * Contains logic for rendering the interior control
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	// Instantiate the Interior class
	ui.Interior = React.createClass(
		{displayName: 'Interior',
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
					
					if(catType == "INT" && (o.Hide !== true))
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
							//description:"o.Description",
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
			 * Method which handles selection of an upholstery or inlay
			 * @param id of the selected item 
			 */
			handleUpholsteryInlaySelection:function(id)
			{
				// Check if the id is an upholstery or an inlay
				var i = 0,
					arr = this.props.upholsteries,
					iL = arr.length;
				for(; i < iL; i++)
				{
					if(arr[i].ID === id)
					{
						// Set the upholstery
						this.props.controller.setUpholstery(id);
						return;
					}
				}
				// Set the inlay
				this.props.controller.setInlay(id);
			},
			
			/**
			 * Method which updates the properties 
			 */
			updateProps:function(props)
			{
				var HList = ui.HList,
					VList = ui.VList,
					o,
					instance = this,
					navigation = [],
					cat = [this._dic.getLabel('upholsteries')];
					
				// Map the upholsteries
				var items = props.upholsteries.map(
					function(item)
					{
						return {
							category:(cat.length > 0)?cat.shift():'',
							asset:_utils.getCARDBAsset(item.Assets, false, true),
							name:item.Name,
							price:item.PriceInfo,
							promotions:item.Promotions,
							ID:item.ID,
							//description:"Lorem ipsum dolor sit amet"
							description:item.Description,
							whiteBG:true
						};
					}
				);
				
				// Map the inlays
				cat = [this._dic.getLabel('inlays')];
				items.concat(props.inlays.map(
					function(item)
					{
						return {
							category:(cat.length > 0)?cat.shift():'',
							asset:_utils.getCARDBAsset(item.Assets, false, true),
							name:item.Name,
							price:item.PriceInfo,
							promotions:item.Promotions,
							ID:item.ID,
							whiteBG:true
						};
					}
				));
				
				var config = props.configuration,
					id = 0;
				
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
				
				// Add the navigation elements
				navigation.push({code:'interior-upholsteries-inlays', id:id, label:this._dic.getLabel('upholsteriesAndInlays'), element:HList( {webtrendtag:"view-seats-details", items:items, deselectable:false, selected:config?[config.UpholsteryID, config.InlayID]:[], className:"cc-tab-interior", controllerSelectHandler:this.handleUpholsteryInlaySelection})});
				if(packs.length > 0)
				{
					id++;
					var selectedEquipment = config?config.Options.concat(config.Accessories):null;
					navigation.push({code:'interior-packs', id:id, label:this._dic.getLabel('packs'), compareData:{data:this._comparePacksData, label:this._dic.getLabel('comparePacks')}, element:VList( {infoTitle:this._dic.getLabel('packEquipmentInfoTitle'), items:packs, selectedEquipment:selectedEquipment, selected:config?config.Packs:false, className:"cc-packs", controllerSelectHandler:props.controller.setPack, controllerSecondarySelectHandler:props.controller.setPackEquipment})});
				}
				
				// Loop through the available option categories and add them
				cat = this.addOptions(props);
				// Add every equipment related to interior
				var sProp;
				for(sProp in cat)
				{
					id++;
					navigation.push({code:'interior-options', id:id, label:cat[sProp].name, element:HList( {webtrendtag:"view-option-details", items:cat[sProp].items, deselectable:true, selected:config?config.Options:[], className:"cc-options", controllerSelectHandler:props.controller.setOption})});
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