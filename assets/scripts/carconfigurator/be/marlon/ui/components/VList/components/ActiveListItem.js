/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a vertical active list item
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	/**
	 * This creates an advanced list item, currently specific for the Aygo logic. It enables selection of pack specific items. 
	 */
	ui.ActiveListItem = React.createClass(
		{displayName: 'ActiveListItem',
			mixins:[ui.VListItemBase],
			cachedSelection:null, // Config object of the previous selected values, will be set when the item becomes selected
			stopColourUpdate:false, // Boolean used when selecting multiple packs to make sure the primary accent color selection gets updated accross all relevant packs
			
			_primaryAccentColors:null, // Contains the accent colors and arrays, optionalEquipment & standardEquipment based on the current bodytype selected color
			_secondaryAccentColors:null, // Contains the secondary accent color references based on the current bodytype selected color (can be based on the primary accent color or the secondary accent color)
			_optionalEquipment:null, // Contains all the equipment possible for selection
			_bodyColorStandardEquipment:null, // Contains the equipment (standard & optional) which are linked to a specific bodytype colour
			_defaultSecondaryAccentColor:"", // The id of the default secondary accent color
			_colorList:null, 
			_equipmentList:null,
			_defaultColor:null, // Primary accent color used when the content has not rendered yet.
			_contentMounted:false,
			_equipmentStatus:0,
			_prevUpdateEquipment:false,
			_updateEquipment:false, // Boolean used to update the optional body colour dependent equipment if there is optional equipment with body colour dependencies
			
			
			// ###########################
			// Private methods
			// ###########################
			
			/**
			 * Method which parses the newly received data 
			 */
			parseData:function(props)
			{
				// Create the Array based on the current selected bodytype color
				var colorCombos = props.colourCombinations,
					exteriorColour = props.exteriorColourID,
					i = 0,
					iL = colorCombos.length,
					o,
					so,
					pac;
				
				// Save new _availableColor object
				this._primaryAccentColors = {};
				this._optionalEquipment = [];
				this._bodyColorStandardEquipment = [];
				this._secondaryAccentColors = [];
				this._defaultSecondaryAccentColor = "";
				
				// Create the available primary accent color object based on the selected bodytype color
				pac = this._primaryAccentColors;
				for(; i < iL; i++)
				{
					o = colorCombos[i];
					if(o.BodyColour.ID == exteriorColour)
					{
						if(!pac[o.PrimaryAccentColour.ID])
						{
							pac[o.PrimaryAccentColour.ID] = {
								RGB:o.PrimaryAccentColour.RGB,
								code:o.PrimaryAccentColour.Code,
								name:o.PrimaryAccentColour.Name === ""?o.PrimaryAccentColour.Code:o.PrimaryAccentColour.Name,
								standardEquipment:[],
								optionalEquipment:[],
								colorDefault:false
							};
						}
						so = pac[o.PrimaryAccentColour.ID];
						if(o.Default)
						{
							so.colorDefault = true;
							this._defaultSecondaryAccentColor = o.SecondaryAccentColour.ID;
						}
						// Add the SecondaryAccentColor availability for the list of PrimaryAccentColours
						if(!so.secondaryAccentColours) so.secondaryAccentColours = [];
						if(o.SecondaryAccentColour.ID !== "00000000-0000-0000-0000-000000000000") so.secondaryAccentColours.push(o.SecondaryAccentColour);
						if(!_utils.checkID(o.SecondaryAccentColour.ID, this._secondaryAccentColors)) this._secondaryAccentColors.push(o.SecondaryAccentColour);
					}
				}
				
				// Create an Array of colors which contain the standard and optional equipment items
				var equipment = props.equipment,
					t,
					prop,
					updateEquipment = false,
					tL;
				i = 0;
				iL = equipment.length;
				for(; i < iL; i++)
				{
					o = equipment[i];
					// Check if it's a standard item with selectable childoptions
					if(o.Standard)
					{
						if(o.ChildOptions.length > 0)
						{
							// Map the child options to the respective availableColor
							t = 0;
							tL = o.ChildOptions.length;
							for(; t < tL; t++)
							{
								so = o.ChildOptions[t];
								// Only add the option if the accent colour matches
								if(pac[so.Colour.ID] && so.ColouringMode === 2)
								{
									pac[so.Colour.ID].standardEquipment.push(so);
								}
								// Check for body colour dependency
								if((so.ColouringMode === 0) || (so.ColouringMode === 1 && so.Colour.ID == exteriorColour))
								{
									this._bodyColorStandardEquipment.push(so);
								}
							}
						}
						else if((o.ColouringMode === 0) || (o.ColouringMode === 1 && o.Colour.ID == exteriorColour))
						{
							// Check for body colour dependency
							this._bodyColorStandardEquipment.push(o);
						}
					}
					// Check if it's an optional item
					else
					{
						// Prepare a property which contains the optional equipment items grouped by color availability for an optional equipment item
						// Basically when ColouringMode === 4 it means the equipment item is able to be coloured on it's own without any dependencies toward BodyColour && PrimaryAccentColour
						o.SecondaryAccentColourEquipment = [];
						// Also add an array which contains the child options which are body colour dependent
						o.BodyColourEquipment = [];
						
						// It's only available for a specific color
						if(o.ChildOptions.length > 0)
						{
							// Map the child options to the respective availableColor
							t = 0;
							tL = o.ChildOptions.length;
							for(; t < tL; t++)
							{
								so = o.ChildOptions[t];
								// Add the option if the accent colour matches
								if(pac[so.Colour.ID] && so.ColouringMode === 2)
								{
									pac[so.Colour.ID].optionalEquipment.push(so);
								}
								// Add the option to the selectable Array if it contains a SecondaryAccentColor
								// TODO Fix support for colouringMode 6!
								if(so.ColouringMode === 4 || so.ColouringMode === 6)
								{
									o.SecondaryAccentColourEquipment.push(so);
								}
								// Check for body colour dependency
								if((so.ColouringMode === 1 && so.Colour.ID == exteriorColour) || so.ColouringMode === 0)
								{
									if((so.ColouringMode === 1 && so.Colour.ID == exteriorColour))updateEquipment = true;
									o.BodyColourEquipment.push(so);
								}
							}
						}
						// If it has no colour mode defined or it's available for the current selected exterior colour
						else if((o.ColouringMode === 0) || (o.ColouringMode === 1 && o.Colour.ID == exteriorColour))
						{
							// TODO What with this case?
						}
						// Add it to the general array
						this._optionalEquipment.push(o);
					}
				}
				
				// Loop through all the properties of the pac and delete the ones which do not have any equipment items (optional && standard) attached
				for(prop in pac)
				{
					o = pac[prop];
					if(o.optionalEquipment.length === 0 && o.standardEquipment.length === 0)
					{
						delete pac[prop];
					}
				}
				
				// If there are no primary accent colors but there is a secondary accent color variation possible
				if(_.isEmpty(pac) && this._secondaryAccentColors.length > 0)
				{
					updateEquipment = true;
				}
				
				if(
					updateEquipment || 
					(this._prevUpdateEquipment && !updateEquipment))
				{
					this._updateEquipment = true;
				}
				this._prevUpdateEquipment = updateEquipment;
				
				//console.log("Active packs data parced: ", this._primaryAccentColors, " || ", this._optionalEquipment);
			},
			
			/**
			 * Handles clicking on the color
			 * @param item:React object 
			 */
			colorClickHandler:function(item)
			{
				this.selectColor(item.props.data);
			},
			
			/**
			 * Selects a color based on the this._primaryAccentColors Array
			 */
			selectColor:function(primaryAccentColor, configChanged, cb)
			{
				// Update the equipment items with new data ellegible for selection
				this.updateEquipment(primaryAccentColor);
				// Select the item in the list
				this._colorList.select(primaryAccentColor.code, configChanged === false?(cb?cb:null):this.colorStateUpdated);
			},
			
			/**
			 * Handles the state update when selecting a primary accent color
			 */
			colorStateUpdated:function()
			{
				// Notify the owner that the configuration has changed
				this.props.configurationChanged(this);
			},
			
			/**
			 * Handles the configuration changed event from within the (colorable) equipment item 
			 */
			configurationChanged:function()
			{
				this.props.configurationChanged(this);
			},
			
			/**
			 * Method which updates the equipment 
			 */
			updateEquipment:function(data)
			{
				// Update the equipment list
				var equipment = this._equipmentList.getData(),
					colorEquipment = data?data.optionalEquipment:[],
					i = 0,
					t,
					tL = colorEquipment.length,
					o,
					co,
					aCo,
					dt,
					iL = equipment.length;
				// Reset equipment status counter
				this._equipmentStatus = 0;
				for(; i < iL; i++)
				{
					o = equipment[i];
					dt = o.props.data;
					// Check if the object is present in the selected colorEquipment
					for(t = 0; t < tL; t++)
					{
						co = colorEquipment[t];
						if(
							(co.ParentOption && co.ParentOption.ID == o.props.key) ||
							(co.ID == o.props.key)
						)
						{
							// Since multiple ChildOptions (with a dependency on the primaryAccentColor) can be present on the object, this is an Array
							if(!aCo)aCo = [];
							aCo.push(co);
						}
					}
					// If there is a primaryAccentColour dependency
					if(data)
					{
						// If no primary accent color optional equipment is found
						if(!aCo)
						{
							// Check if there is body dependent optional equipment items
							if(dt.BodyColourEquipment.length > 0)
							{
								o.setDelegateState({primaryAccentColourEquipment:null, disabled:false, secondaryAccentColours:data.secondaryAccentColours}, this.equipmentStateUpdated);
							}
							// Check if there is secondary accent colour equipment items
							else if(dt.SecondaryAccentColourEquipment.length > 0)
							{
								o.setDelegateState({primaryAccentColourEquipment:null, disabled:false, secondaryAccentColours:data.secondaryAccentColours}, this.equipmentStateUpdated);
							}
							else
							{
								// Else disable it!
								o.setDelegateState({primaryAccentColourEquipment:null, disabled:true, selected:false, secondaryAccentColours:data.secondaryAccentColours}, this.equipmentStateUpdated);
							}
						}
						else
						{
							o.setDelegateState({primaryAccentColourEquipment:aCo, disabled:false, secondaryAccentColours:data.secondaryAccentColours}, this.equipmentStateUpdated);
						}
					}
					// Parse the current object as data
					else
					{
						o.setDelegateState({primaryAccentColourEquipment:null, disabled:false, secondaryAccentColours:this._secondaryAccentColors}, this.equipmentStateUpdated);
					}
					co = null;
					aCo = null;
				}
				// If no optional equipment items are present in the pack, update the height of the element automatically
				if(iL === 0)this.equipmentStateUpdated(true);
			},
			
			/**
			 * Method called when the state has been updated of all equipment items 
			 */
			equipmentStateUpdated:function(force)
			{
				this._equipmentStatus ++;
				// If all equipment items their state has been updated...
				if(force || (this._equipmentStatus == this._equipmentList.getData().length))
				{
					// Call the state open callback to open the component
					if(!this._open)this.stateOpenCompleted();
					else this.heightUpdateHandler();
				}
				
				// If the state is selected and no cachedSelection has been made yet
				if(this.state.selected && !this.cachedSelection)
				{	
					this.cachedSelection = this.getSelected();
				}
			},
			
			/**
			 * Handles clicking on an equipment item
			 * @param item:React object 
			 */
			equipmentClickHandler:function(item)
			{
				// If the item is selected, deselect it
				var selected = this._equipmentList.getSelected(),
					i = 0,
					iL = selected.length;
				for(; i < iL; i++)
				{
					if(selected[i].props.key == item.props.key)
					{
						selected.splice(i, 1);
						i = -1;
						break;
					}
				}
				// If the item is not yet selected, select it
				if(i > -1)
				{
					selected.push(item);
				}
				// Map the objects to keys
				selected = selected.map(
					function(item)
					{
						return item.props.key;
					}
				);
				// Select the items in the list
				this._equipmentList.select(selected, this.equipmentSelectStateUpdated);
			},
			
			/**
			 * Method which handles the stateupdate of an equipment item 
			 */
			equipmentSelectStateUpdated:function()
			{
				// Notify the owner that the configuration has changed
				this.props.configurationChanged(this);
			},
			
			/**
			 * Method which handles the mounting of the color list 
			 */
			colorListMountHandler:function(item)
			{
				this._colorList = item;
			},
			
			/**
			 * Method which handles the mounting of the content 
			 */
			contentMountHandler:function()
			{
				this._contentMounted = true;
				if(this._colorList)
				{
					this.selectColor(this._defaultColor, false);
				}
				else
				{
					this.updateEquipment();
				}
			},
			
			/**
			 * Method which determines if the current primaryAccentColor is the default or not 
			 */
			checkDefaultColor:function(primaryAccentColor, props)
			{
				var i = 0,
					arr = primaryAccentColor.standardEquipment.length > 0?primaryAccentColor.standardEquipment:primaryAccentColor.optionalEquipment,
					iL = arr.length;
				// Check the equipment, if standardEquipment is defined, only check that array if not, check the optionalEquipment
				for(; i < iL; i++)
				{
					// Check the standardEquipment
					if(!_utils.getItem(arr[i].ID, props.selectedEquipment))
					{
						return false;
					}
				}
				return true;
			},
			
			/**
			 * Method used to render the parent's state (== mixin) 
			 */
			renderParentState:function(props)
			{
				var dic = _utils.Dictionary,
					HList = ui.HList,
					content = null,
					prop,
					i = 0,
					iL = this._optionalEquipment.length,
					colors = [],
					equipment = [],
					o,
					colorSection = null,
					equipmentSection = null,
					standardSection = null;
				
				// Create the accent colour section
				this._defaultColor = null;
				for(prop in this._primaryAccentColors)
				{
					o = this._primaryAccentColors[prop];
					
					// Determine the default color, when no selectedEquipment is present
					if(o.colorDefault && !this._defaultColor)
					{
						this._defaultColor = o;
					}
					i ++;
					// Check if this color matches the selectedEquipment array
					if(this.checkDefaultColor(o, props))
					{
						this._defaultColor = o;
					}
					
					// Create a color object and push it to the Array which will be fet to the HList
					colors.push(
						{
							colour:o.RGB,
							name:o.name,
							data:o,
							ID:o.code
						}
					);
				}
				if(i > 0)
				{
					colorSection = (
						React.DOM.div( {className:"cc-relative"}, 
							React.DOM.h2(null, props.equipmentDescription),
							React.DOM.section( {className:"cc-list cc-list-thumbs group"}, 
								HList( {items:colors, inline:true, clickHandler:this.colorClickHandler, selected:false, componentDidMount:this.colorListMountHandler, className:"cc-tab-colours"})
							)
						)
					);
				}
				
				i = 0;
				// Create the color dependent equipment section
				for(; i < iL; i++)
				{
					prop = this._optionalEquipment[i];
					equipment.push(
						EquipmentItem( 
							{key:prop.ID, 
							data:prop, 
							label:prop.ParentOption?prop.ParentOption.Name:prop.Name, 
							clickHandler:this.equipmentClickHandler,
							configurationChanged:this.configurationChanged,
							selectedEquipment:props.selectedEquipment,
							defaultSecondaryAccentColor:this._defaultSecondaryAccentColor})
					);
				}
				this._equipmentList.setData(equipment);
				if(equipment.length > 0)
				{
					equipmentSection = (
						React.DOM.section(null, 
							React.DOM.h2(null, dic.getLabel('packMorePersonalization')),
							equipment
						)
					);
				}
				
				var openText = "";
				// If there are standard equipment items available
				if(this._bodyColorStandardEquipment.length > 0)
				{
					// Map the equipment to the objects used to populate the HList
					equipment = this._bodyColorStandardEquipment.map(
						function(item)
						{
							return {
								asset:_utils.getCARDBAsset(item.Assets),
								name:item.Name,
								description:item.Description,
								//description:"Lorem ipsum dolor sit amed",
								price:item.PriceInfo,
								promotions:item.Promotions,
								ID:item.ID
							};
						}
					);
					
					standardSection = (
						React.DOM.div( {className:"cc-relative"}, 
							React.DOM.h2(null, dic.getLabel('packStandardEquipment')),
							React.DOM.section( {className:"cc-list cc-list-thumbs group"}, 
								HList( {webtrendtag:"view-feature-details", infoTitle:props.infoTitle, items:equipment, inline:true, clickable:false, heightUpdateHandler:this.heightUpdateHandler})
							)
						)
					);
				}
				
				// Determine the packs label
				if(_.isEmpty(this._primaryAccentColors) && 
					this._optionalEquipment.length === 0 && 
					this._bodyColorStandardEquipment.length > 0 && 
					this._secondaryAccentColors.length === 0)
				{
					openText = dic.getLabel('packFeatures').replace("{#}", equipment.length);
				}
				else
				{
					if(colorSection || equipmentSection)
					{
						openText = dic.getLabel('packShow');
					}
				}
				
				// If one of the sections exist, render them!
				if(colorSection || equipmentSection || standardSection)
				{
					content = (
						React.DOM.div( {className:"cc-list-features cc-vmask"}, 
							colorSection,
							standardSection,
							equipmentSection
						)
					);
				}
				
				this.setState(
					{
						openText:openText,
						closeText:dic.getLabel('packHide'),
						content:content,
						contentMounted:this.contentMountHandler
					}
				);
			},
			
			/**
			 * Method which populates the options & accessories arrays 
			 */
			populateArrays:function(src, options, accessories, checkParent)
			{
				var validates;
				src.map(
						function(item)
						{
							validates = true;
							if(checkParent && !item.ParentOption)validates = false;
							if(validates)
							{
								if(item.Type === "option")
								{
									options.push(item);
								}
								else
								{
									accessories.push(item);
								}
							}
						});
			},
			
			// ###########################
			// Public methods
			// ###########################
			
			/**
			 * Method which returns the selected elements (both standard & optional equipment) 
			 */
			getSelected:function()
			{
				var options = [],
					accessories = [],
					instance = this;
				
				// The accent color standard related equipment items
				if(this._defaultColor)
				{
					var	colorConfig = this._colorList?this._colorList.getSelected():null;
					// Loop through the color equipment
					colorConfig = colorConfig?colorConfig.props.data.standardEquipment:this._defaultColor.standardEquipment;
					this.populateArrays(colorConfig, options, accessories);
				}
				
				// Loop through the body colour related standard equipment items
				this.populateArrays(this._bodyColorStandardEquipment, options, accessories, true);
				
				// Loop through the option selectable equipment
				this._equipmentList.getSelected().map(
					function(item)
					{
						var arr;
						// Map the equipment items which are available for the selected bodytype color
						instance.populateArrays(item.props.data.BodyColourEquipment, options, accessories);
						
						// Map the equipment items which are available for the selected primary accent color
						arr = item.state.primaryAccentColourEquipment;
						if(arr)
						{
							instance.populateArrays(arr, options, accessories);
						}
						
						// Map the equipment items which are available for the selected secondary accent color
						instance.populateArrays(item.getSecondaryAccentColourEquipment(), options, accessories);
					}
				);
				return {
					options:options,
					accessories:accessories
				};
			},
			
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Method called when the component is about to be mounted 
			 */
			componentWillMount:function()
			{
				this._equipmentList = new ui.List(true);
				this.parseData(this.props);
				this.renderParentState(this.props);
			},
			
			/**
			 * Method which handles the inbound receiving of new properties 
			 */
			componentWillReceiveProps:function(nextProps, nextState)
			{
				this.parseData(nextProps);
				this.renderParentState(nextProps);
			},
			
			/**
			 * Method called when the component did update 
			 */
			componentDidUpdate:function()
			{
				var colorUpdated = false,
					selected = null;
				if(this._colorList)
				{
					selected = this._colorList.getSelected();
					// If the content is mounted but the previous selected accent color could not be found anymore it means the color is 
					// not available anymore for the body color
					if(this._contentMounted && !selected)
					{
						// If there is a default primary accent color available, select it 
						if(this._defaultColor)
						{
							colorUpdated = true;
							this.selectColor(this._defaultColor, false);
						}
					}
					else if(this._contentMounted && selected && (selected.props.data.code !== this._defaultColor.code && !this.stopColourUpdate))
					{
						var instance = this;
						colorUpdated = true;
						this.selectColor(this._defaultColor, false, 
							function()
							{
								instance.cachedSelection = instance.getSelected();
							}
						);
					}
				}
				
				// If the content has mounted
				if(this._contentMounted && this._updateEquipment && !colorUpdated)
				{
					this._updateEquipment = false;
					this.updateEquipment(selected?selected.props.data:this._defaultColor);
				}
				
				// If the state is selected
				if(this.state.selected && !this.cachedSelection)
				{
					this.renderContent();
				}
				// 
				this.stopColourUpdate = false;
				// If the element is selected, but there is no defaultColor, it means the body color updated and a compatibility check should be made
				if(	this.state.selected && 
					!this._defaultColor && 
					this._optionalEquipment.length === 0 &&
					this._bodyColorStandardEquipment.length === 0 && 
					this._secondaryAccentColors.length === 0)
				{
					this.props.clickHandler(this);
				}
			}
		}
	);
	
	/**
	 * Creates a color item used in the active list item 
	 */
	var ColorItem = React.createClass(
		{displayName: 'ColorItem',
			mixins:[_utils.Mixins.Mount],
			
			/**
			 * Method which handles the clicking on the color item 
			 */
			clickHandler:function()
			{
				this.props.clickHandler(this);
			},
			
			/**
			 * Returns the default state of the grade 
			 */
			getInitialState:function()
			{
				return {selected:false};
			},
			
			/**
			 * Method called when the component is about to be mounted 
			 */
			componentWillMount:function()
			{
				this.componentWillReceiveProps(this.props);
			},
			
			/**
			 * Method which handles the inbound receiving of new properties 
			 */
			componentWillReceiveProps:function(nextProps, nextState)
			{
				if(nextProps.selected === true)
				{
					this.setState({selected:true});
				}
			},
			
			/**
			 * React render method 
			 */
			render:function()
			{
				//totalEquipment
				var style = {backgroundColor:"#" + this.props.RGB},
					pricing = null,
					totalEquipment = this.props.totalEquipment,
					p = totalEquipment.length > 0?totalEquipment[0].ParentOption.PriceInVat:0,
					i = 0,
					iL = totalEquipment.length;
				
				for(; i < iL; i++)
				{
					if(totalEquipment[i].PriceInfo)p += totalEquipment[i].PriceInfo.ListPriceWithDiscount;
				}
				if(p > 0)
				{ 
					// Create the pricing container
			    	pricing = (
			    		React.DOM.div( {className:"cc-pricing"}, 
							React.DOM.span( {className:"cc-price"}, 
								" + " + _utils.formatPrice(p, true)
							)
						)
			    	);
				}
				
				return(
					React.DOM.li( {className:"cc-listitem", onClick:this.state.selected?null:this.clickHandler}, 
	                    React.DOM.label( {style:style, className:"cc-radio cc-thumb"}, 
	                        React.DOM.span( {className:"cc-checkbox" + (this.state.selected?' cc-checked':'')}),
	                        React.DOM.span( {className:"cc-shine"})
	                    ),                                                        
	                    
	                    React.DOM.span( {className:"cc-meta"}, 
	                        React.DOM.span( {className:"cc-title"}, this.props.name),
	                        pricing
	                    )
	                )
				);
			}
		}
	);
	
	/**
	 * Creates a selectable equipment item 
	 */
	var EquipmentItem = React.createClass(
		{displayName: 'EquipmentItem',
			mixins:[_utils.Mixins.Mount],
			_colorList:null,
			
			/**
			 * Method which handles clicking on a color 
			 */
			colorClickHandler:function(item)
			{
				this._colorList.select(item.props.key, this.colorStateUpdated);
			},
			
			/**
			 * Method which handles the updating of the state of the color 
			 */
			colorStateUpdated:function()
			{
				this.props.configurationChanged();
			},			
			
			/**
			 * Method which returns the selected secondary accent color equipment items 
			 */
			getSecondaryAccentColourEquipment:function()
			{
				var selected = this._colorList.getSelected();
				if(selected)
				{
					return selected.props.equipment;
				}
				return [];
			},
			
			/**
			 * Method which handles the clicking on the color item 
			 */
			clickHandler:function()
			{
				this.props.clickHandler(this);
			},
			
			/**
			 * Method which acts as an intermediate function to the setState method, used to determine the selection state of this equipment item 
			 */
			setDelegateState:function(state, cb)
			{
				//console.log("setDelegateState: ", state, " || ", this.props.data);
				
				// Create color list selection if it is relevant
				// Based on the this.state.secondaryAccentColours and the this.props.secondaryAccentColourEquipment we can compute how this equipment item will be presented
				var sace = this.props.data.SecondaryAccentColourEquipment,
					sac = state.secondaryAccentColours,
					aColors = null,
					instance = this,
					aEquipment = null;
				// Check if there is equipment available in the first place
				if(sace.length > 0)
				{
					// Check if there are secondaryAccentColours present
					if(sac && sac.length > 0)
					{
						// Create colors based on the availability of the equipment and the secondaryAccentColour
						sac.map(
							function(item)
							{
								// Loop through the objects from the secondary accent colour equipment array
								// To populate an array of equipment items which are available for the different SecondaryAccentColours
								sace.map(
									function(equipment)
									{
										if(item.ID == equipment.Colour.ID)
										{
											if(!aEquipment)aEquipment = [];
											aEquipment.push(equipment);
										}
									}
								);
								
								// If the equipment exists it means there is a SecondaryAccentColour available with equipment for this optional equipment item
								if(aEquipment)
								{
									// Instantiate the aColors if it does not exist yet
									if(!aColors)aColors = [];
									// Add a color item to the array
									aColors.push(
										ColorItem( {key:item.ID, clickHandler:instance.colorClickHandler, RGB:item.RGB, name:item.Name, equipment:aEquipment})
									);
								}
								// Clear the equipment array
								aEquipment = null;
							}
						);
					}
				}
				// Set the colors on the state
				state.colors = aColors;
				
				// Determine the selection state based on the this.props.selectedEquipment Array
				var selectedEquipment = this.props.selectedEquipment,
					validates = true,
					itemEquipment = this.props.data.BodyColourEquipment;
				
				if(!state.disabled)
				{
					// Check the primaryAccentColourEquipment array
					if(state.primaryAccentColourEquipment)
					{
						itemEquipment = itemEquipment.concat(state.primaryAccentColourEquipment);
						state.primaryAccentColourEquipment.map(
							function(item)
							{
								if(!_utils.getItem(item.ID, selectedEquipment))
								{
									validates = false;
								}
							}
						);
					}
					
					// Check the bodyColourEquipment array
					this.props.data.BodyColourEquipment.map(
						function(item)
						{
							if(!_utils.getItem(item.ID, selectedEquipment))
							{
								validates = false;
							}
						}
					);
					
					// Check the aColors created
					var colorMatch,
						i,
						iL = aColors?aColors.length:0;
					if(iL > 0)
					{
						i = 0;
						var	t,
							tL;
						for(; i < iL; i++)
						{
							colorMatch = true;
							// Loop through the colors equipment to see if it the list of equipment is present in the selectedEquipment or not
							tL = aColors[i].props.equipment.length;
							for(t = 0; t < tL; t++)
							{
								if(!_utils.getItem(aColors[i].props.equipment[t].ID, selectedEquipment))
								{
									colorMatch = false;
								}
							}
							
							// If there is a match, select the color!
							if(colorMatch)
							{
								//console.log("selecting color: ", aColors[i].props);
								// Select the color, only one secondaryAccentColor can be selected
								aColors[i].props.selected = true;
								
								// Add the equipment!
								//itemEquipment = itemEquipment.concat(aColors[i].props.equipment);
								break;
							}
						}
						// Run through the colors and assign the equipment
						for(i = 0; i < iL; i++)
						{
							aColors[i].props.totalEquipment = itemEquipment.concat(aColors[i].props.equipment);
						}
						if(!colorMatch)
						{
							// Select the default color items equipment
							var def = aColors[0];
							for(; i < iL; i++)
							{
								if(aColors[i].props.key === this.props.defaultSecondaryAccentColor)
								{
									def = aColors[i];
									break;
								}
							}
							// Add the equipment!
							//itemEquipment = itemEquipment.concat(def.props.equipment);
							validates = false;
						}
					}
					//if(validates)state.selected = true;
					state.selected = validates;
				}
				else
				{
					state.selected = false;
				}
				//console.log(this.props.label + " selected: " + state.selected);
				state.equipment = itemEquipment;
				this.setState(state, cb);
			},
			
			/**
			 * Returns the default state of the grade 
			 */
			getInitialState:function()
			{
				return {selected:false, disabled:false, primaryAccentColourEquipment:null, secondaryAccentColours:null, colors:null, equipment:[]};
			},
			
			/**
			 * Called when the component will mount 
			 */
			componentWillMount:function()
			{
				this._colorList = new ui.List(false); 
			},
			
			/**
			 * Called when the component did update 
			 */
			componentDidUpdate:function()
			{
				var arr = this._colorList.getData();
				// Only select an element if there is no one selected yet and there are actual colors available
				//if(!this._colorList.getSelected() && arr.length > 0)
				if((!this.state.selected || !this._colorList.getSelected()) && arr.length > 0)
				{
					// Check if the default selectable item exists
					var i = 0,
						iL = arr.length,
						sel;
					for(; i < iL; i++)
					{
						if(arr[i].props.key === this.props.defaultSecondaryAccentColor)
						{
							i = -1;
							break;
						}
					}
					// If the item is present in the list select it!
					if(i === -1)
					{
						sel = this.props.defaultSecondaryAccentColor;
					}
					else
					{
						sel = arr[0].props.key;
					}
					this._colorList.select(
						sel
					);
				}
			},
			
			/**
			 * React render method 
			 */
			render:function()
			{
				//console.log("Rendering equipment item: ", this.state.secondaryAccentColours, " || ", this.props.data.SecondaryAccentColourEquipment);
				// Add the pricing if relevant
				var price = "",
					p,
					equipment = this.state.equipment,
					colors = this.state.colors;
				// When there are secondary accent colors, the price of the equipment item is shown under the colors rather than on the end of the equipment item
				if(_utils.hasPrice && (!colors || colors.length === 0))
				{
					p = equipment.length > 0?equipment[0].ParentOption.PriceInVat:0;
					equipment.map(
						function(item)
						{
							if(item.PriceInfo)p += item.PriceInfo.ListPriceWithDiscount;
						}
					);
					if(p > 0)price = " + " + _utils.formatPrice(p, true);
				}
				// This is the base of an equipment item containing all basic logic
				var base = (
					React.DOM.div( {className:this.state.disabled?"cc-disabled":"", onClick:this.state.disabled?null:this.clickHandler}, 
			            React.DOM.span( {className:"cc-checkbox cc-checkbox-small" + (this.state.selected?' cc-checked':'') + (this.state.disabled?' cc-disabled':'')}),
			            React.DOM.span(null, this.props.label),
			            React.DOM.span( {className:"cc-pack-equipment-price"}, price)
			        )
				);
				
				// If the color state is defined
				if(this.state.colors)
				{
					// Set the data on the list
					this._colorList.setData(this.state.colors);
					// Create the container for this color selection
					base = (
						React.DOM.section( {className:"cc-box cc-box-optional clearfix cc-tab-colours"}, 
				            React.DOM.h1(null, "Optional"),
				            base,
				            React.DOM.div( {className:"cc-list cc-list-thumbs clearfix", style:{height:"auto"}}, 
				                React.DOM.div( {className:"cc-list-page-wrapper clearfix"}, 
				                    React.DOM.div( {className:"cc-list-page-container"}, 
				                        React.DOM.ul( {className:"cc-list-page cc-colours"}, 
				                            this.state.colors
				                        )
				                    )
				                )
				            )
				        ));
				}
				
				return(
					base
				);
			}
		}
	);
})();