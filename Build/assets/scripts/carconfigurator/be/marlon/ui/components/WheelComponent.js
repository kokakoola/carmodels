/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering the wheel component
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	// Instantiate the wheelcomponent class
	ui.WheelComponent = React.createClass(
		{displayName: 'WheelComponent',
			// ###########################
			// Private methods
			// ###########################
	    	
	    	_userDidSelect:false,
	    	
	    	/**
	    	 * Method which returns the selected finish 
	    	 */
	    	getSelectedFinish:function(props)
	    	{
	    		// Get the selected finish
				var config = props.config,
					equipment = config.Options.concat(config.Accessories),
					wheel = _utils.getItem(config.WheelID, props.items, "ID"),
					finish,
					i = 0,
					iL = equipment.length;
				for(; i < iL; i++)
				{
					finish = _utils.getItem(equipment[i], wheel.ChildOptions, "ID");
					if(finish)break;
				}
				
				// If none is found, select the first cap from the IncludeEquipment array
				if(!finish)
				{
					finish = wheel.ChildOptions[0];
				}
				return finish;
	    	},
			
			/**
			 * Method which handles selection of an HList item within a ContentListItem for the Wheel
			 */
			wheelSelectHandler:function(item)
			{
				//console.log("wheel select handler: ", item.props.key);
				var finish = null,
					cap = null,
					surround = null,
					o,
					i,
					iL,
					arr;
				// Check if the wheel is an extended Aygo wheel
				if(item.props.data.ChildOptions.length > 0)
				{
					finish = item.props.data.ChildOptions[0];
					// Get the first item which is a cap
					arr = finish.IncludeEquipment;
					iL = arr.length;
					for(i = 0; i < iL; i++)
					{
						o = _utils.getItem(arr[i].ID, this.props.equipment, "ID");
						if(o.Path.indexOf("cap surrounds") > -1)
						{
							if(!surround)surround = o;
						}
						else
						{
							if(!cap)cap = o;
						}
						o = null;
						if(cap && surround)break;
					}
				}
				this._userDidSelect = true;
				this.props.controller.setWheels(item.props.key, finish, cap, surround);
			},
			
			/**
			 * Method which handles selection of a Finish 
			 */
			finishSelectHandler:function(item)
			{
				//console.log("finish select handler: ", item);
				
				// Get the current selected cap
				var config = this.props.config,
					cap,
					arr,
					surround,
					colouringMode,
					useExtendedWheelColourFiltering = this.props.settings.useExtendedWheelColourFiltering,
					primaryAccentColor = this.props.primaryAccentColor,
					exteriorColour = config.ExteriorColourID,
					i,
					iL;
				
				// If none is found, select the first cap from the IncludeEquipment array
				if(item.props.data.IncludeEquipment.length === 0)
				{
					console.error("The selected finish does not have any caps or surrounds in his IncludeEquipment array defined!");
					return;
				}
				//cap = item.props.data.IncludeEquipment[0];
				// Get the first item which is a cap
				arr = item.props.data.IncludeEquipment;
				iL = arr.length;
				for(i = 0; i < iL; i++)
				{
					o = _utils.getItem(arr[i].ID, this.props.equipment, "ID");
					colouringMode = arr[i].ColouringMode;
					if(
						(useExtendedWheelColourFiltering &&
						(
							colouringMode === 0 || 
							(colouringMode === 1 && o.Colour.ID == exteriorColour) ||
							(colouringMode === 2 && primaryAccentColor && o.Colour.ID == primaryAccentColor.ID) ||
							(colouringMode === 3 && ((o.Colour.ID == exteriorColour) || (primaryAccentColor && (o.Colour.ID == primaryAccentColor.ID))))
						)) ||
						!useExtendedWheelColourFiltering
					)
					{
						if(o.Path.indexOf("cap surrounds") > -1)
						{
							if(!surround)surround = o;
						}
						else
						{
							if(!cap)cap = o;
						}
					}
					
					o = null;
					if(cap && surround)break;
				}
				
				this._userDidSelect = true;
				// Set the wheels on the controller
				this.props.controller.setWheels(config.WheelID, item.props.data, cap, surround);
			},
			
			/**
			 * Method which handles selection of a Cap 
			 */
			capSelectHandler:function(item)
			{
				//console.log("cap select handler: ", item);
				var finish = this.getSelectedFinish(this.props);
				// Set the wheels on the controller
				this._userDidSelect = true;
				this.props.controller.setWheels(this.props.config.WheelID, finish, item.props.data, null);
			},
			
			/**
			 * Method which handles selection of a Surround 
			 */
			surroundSelectHandler:function(item)
			{
				var finish = this.getSelectedFinish(this.props);
				// Set the wheels on the controller
				this._userDidSelect = true;
				this.props.controller.setWheels(this.props.config.WheelID, finish, null, item.props.data);
			},
			
			/**
			 * Method which creates the VList item set used in the extended wheel configuration 
			 */
			createVListItemset:function(props)
			{
				var finishListItems = this.createFinishListItems(props),
					capSurrounds = (finishListItems.length > 0)?this.createCapSurroundListItems(props):null,
					capListItems = capSurrounds?capSurrounds[0]:[],
					surroundListItems = capSurrounds?capSurrounds[1]:[],
					equipment = props.config?props.config.Accessories.concat(props.config.Options):false;
				
				//console.log("Finish list items: ", finishListItems);
				//console.log("Caps & surrounds list items: ", {caps:capListItems.map(function(item){return item.data;}), surrounds:surroundListItems.map(function(item){return item.data;})});
				
				//console.log("Blue twinkle matches: ", props.equipment.filter(function(item){return item.Name.indexOf("Dark Blue Twinkle") > -1;}));
				//console.log("configuration: ", props.config);
				
				//console.log("Equipment to be selected: ", equipment);
				var dic = be.marlon.utils.Dictionary,
					vListItems = [
						{
							ID:'geometry',
							name:dic.getLabel('chooseGeometry'),
							equipment:this.createHListContent(props.items, [dic.getLabel('standard'), dic.getLabel('optional')]),
							contentItemSelectHandler:this.wheelSelectHandler,
							selected:(props.config?props.config.WheelID:false),
							enabled:true,
							open:true
						}
					];
				// Only show the following elements in the VList if they are actually available
				if(finishListItems.length > 0)
				{
					vListItems.push(
						{
							ID:'finish',
							name:dic.getLabel('chooseFinish'),
							equipment:finishListItems,
							contentItemSelectHandler:this.finishSelectHandler,
							selected:equipment,
							enabled:true
						}
					);
				}
				if(capListItems.length > 0)
				{
					vListItems.push(
						{
							ID:'cap',
							name:dic.getLabel('chooseCap'),
							equipment:capListItems,
							contentItemSelectHandler:this.capSelectHandler,
							selected:equipment,
							enabled:true,
							contentClassName:"cc-tab-colours"
						}
					);
				}
				if(surroundListItems.length > 0)
				{
					vListItems.push(
						{
							ID:'surround',
							name:dic.getLabel('chooseSurround'),
							equipment:surroundListItems,
							contentItemSelectHandler:this.surroundSelectHandler,
							selected:equipment,
							enabled:true,
							contentClassName:"cc-tab-colours"
						}
					);
				}
				return vListItems;
			},
			
			/**
			 * Method which creates the first list content, also used in a regular HList vizualisation of the wheels 
			 */
			createHListContent:function(items, cat, colour)
			{
				// Map the wheels
				var instance = this;
				return items.map(
						function(item)
						{
							return {
								category:(cat && cat.length > 0)?cat.shift():'',
								asset:(!colour?_utils.getCARDBAsset(item.Assets):null),
								colour:(colour?item.Colour.RGB:null),
								name:item.Name,
								price:item.PriceInfo,
								promotions:item.Promotions,
								ID:item.ID,
								data:item
							};
						}
					);
			},
			
			/**
			 * Method which returns the finish elements based on the selected body colour 
			 */
			createFinishListItems:function(props)
			{
				// Get the current selected item
				var selected = props.config?_utils.getItem(props.config.WheelID, props.items, "ID"):null;
				// Return default empty list
				if(!selected)return [];
				
				var	exteriorColour = props.config.ExteriorColourID,
					i = 0,
					iL = selected.ChildOptions.length,
					o,
					items = [];
				
				// Loop through the ChildOptions and check for the body color dependency
				for(; i < iL; i++)
				{
					o = selected.ChildOptions[i];
					if(o.ColouringMode === 0 || (o.ColouringMode === 1 && o.Colour.ID == exteriorColour))
					{
						items.push(o);
					}
				}
				
				return this.createHListContent(items);
			},
			
			/**
			 * Method which returns the cap elements based on the selected body colour 
			 */
			createCapSurroundListItems:function(props)
			{
				// Get the current selected item
				var selected = props.config?_utils.getItem(props.config.WheelID, props.items, "ID"):null;
				// Return default empty list
				if(!selected)return [];
				// Get the current selected finish
				var finish = this.getSelectedFinish(props);
				// Get the caps for the current finish
				var	exteriorColour = props.config.ExteriorColourID,
					i,
					iL,
					o,
					caps = [],
					colouringMode,
					primaryAccentColor = props.primaryAccentColor,
					useExtendedWheelColourFiltering = props.settings.useExtendedWheelColourFiltering,
					surrounds = [];
				// Loop through the ChildOptions and check for the body color dependency
				iL = finish.IncludeEquipment.length;
				for(i = 0; i < iL; i++)
				{
					o = _utils.getItem(finish.IncludeEquipment[i].ID, props.equipment, "ID");
					colouringMode = finish.IncludeEquipment[i].ColouringMode;
					if(!o.Colour.RGB)console.log("!!!!!!!!!!!!!!!!! Missing RGB COLOUR for Object: ", o);
					if(
						(useExtendedWheelColourFiltering &&
						(
							colouringMode === 0 || 
							(colouringMode === 1 && o.Colour.ID == exteriorColour) ||
							(colouringMode === 2 && primaryAccentColor && o.Colour.ID == primaryAccentColor.ID) ||
							(colouringMode === 3 && ((o.Colour.ID == exteriorColour) || (primaryAccentColor && (o.Colour.ID == primaryAccentColor.ID))))
						)) ||
						!useExtendedWheelColourFiltering
					)
					{
						if(o.Path.indexOf("cap surrounds") > -1)
						{
							surrounds.push(o);
						}
						else
						{
							caps.push(o);
						}
					}
				}
				
				// Categorize the caps and the rings
				return [
					this.createHListContent(caps, null, true),
					this.createHListContent(surrounds, null, true),
				];
			},
			
			/**
			 * Method which handles the heightupdate handler from within the VList 
			 */
			heightUpdateHandler:function(h)
			{
				// Don't forget to add the height of the image!
				h += $(this.getDOMNode()).find('.cc-image-big').outerHeight();
				h += 30; // 30 is the padding bottom and top from the VList
				this.props.heightUpdateHandler(h, this);
			},
			
			// ###########################
			// Public methods
			// ###########################
			
					
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Returns the initial state of the wheel component
			 */
			getInitialState:function()
			{
				return {extended:false, items:null};
			},
			
			/**
			 * Method which is called when the component is about to be rendered
			 */
			componentWillMount:function() 
			{
				this.componentWillReceiveProps(this.props);
			},
			
			/**
			 * Method called when the component is about to be updated 
			 */
			componentWillReceiveProps:function(nextProps)
			{
				var arr = nextProps.items,
					extended = false,
					i = 0,
					iL = arr.length,
					items;
				// Determine what type of wheel this is
				for(; i < iL; i++)
				{
					if(arr[i].ChildOptions.length > 0)
					{
						extended = true;
						break;
					}
				}
				
				// If it's an extended wheel list, create the different categories
				if(extended)
				{
					items = this.createVListItemset(nextProps);
				}
				else
				{
					var dic = be.marlon.utils.Dictionary;
					items = this.createHListContent(nextProps.items, [dic.getLabel('standard'), dic.getLabel('optional')]);
				}
				
				// Update the state!
				this.setState({extended:extended, items:items});
			},
			
			/**
			 * Method called after the component did update 
			 */
			componentDidUpdate:function(prevProps, prevState)
			{
				// If the user selected an item previously, open up the next available section
				if(this._userDidSelect)
				{
					var vList = "vList";
					vList = this.refs[vList];
					if(vList)
					{
						vList.openNextSection();
					}
					this._userDidSelect = false;
				}
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var HList = ui.HList,
					VList = ui.VList,
					content = null,
					items;
					
				// Render the specific Aygo wheel selection screen
				if(this.state.extended)
				{
					var s = this.props.config?this.props.config.ExteriorImages[6]:"";
					s = s.replace(/[{]WIDTH[}]/g, 926);
					s = s.replace(/[{]HEIGHT[}]/g, 280);
					s = s.replace(/[{]TYPE[}]/g, "jpg");
					s = s.replace(/[{]VIEW[}]/g, "hero-exterior");
					s = s.replace(/[{]SCALEMODE[}]/g, "1");
					s = s.replace(/[{]PADDING[}]/g, "0");
					s = s.replace(/[{]BACKGROUNDCOLOUR[}]/g, "334048");
					s = s.replace("/background-image/{BACKGROUNDIMAGE}", ""); // Seems that CCIS does not work if you provide an empty background or just "-"
					s = s.replace(/[{]IMAGEQUALITY[}]/g, "75");
					s = this.props.spinSettings.imagepath + s;
					
					content = (
						React.DOM.section( {className:"cc-tab cc-tab-panel cc-wheels-aygo cc-abs-item"}, 
							React.DOM.div( {className:"cc-image-big"}, 
								React.DOM.img( {src:s})
							),
							VList( {items:this.state.items, ref:"vList", hasContentListItems:true, inline:true, heightUpdateHandler:this.heightUpdateHandler})
						)
					);
				}
				// Render a single HList	
				else
				{
					content = HList( {items:this.state.items, selected:this.props.config?this.props.config.WheelID:false, className:"cc-wheels", controllerSelectHandler:this.props.controller.setWheels, heightUpdateHandler:this.props.heightUpdateHandler});
				}
				
				return(
					content
				);
			},
			
			// Define the mixins
			mixins:[be.marlon.utils.Mixins.Mount]
		}
	);
})();
