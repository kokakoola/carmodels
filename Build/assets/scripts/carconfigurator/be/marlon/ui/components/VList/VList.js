/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a vertical list
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	// Instantiate the topcontainer class
	ui.VList = React.createClass(
		{displayName: 'VList',
			mixins:[_utils.Mixins.Mount],
			
			// Variable for internal use
			_itemList:null,
			_selectedItems:null,
			
			// ###########################
			// Private methods
			// ###########################
			
			/**
			 * Handles clicking on a list item
			 * @param item:ReactObject the item clicked upon 
			 */
			itemClickHandler:function(item)
			{
				//console.log("pack select handler: ", item);
				// Select the item
				var isSelected = this._itemList.toggle(item.props.key);
				
				var config = item.getSelected?item.getSelected():null;
				if(config)
				{
					// Save the current selection on the item
					item.cachedSelection = config;
					// Open the item and render it's contents (if it contains selectable contents)
					if(!item._open && isSelected)item.renderContent();
				}
				//if(item.getSelected)console.log("selected pack equipment: ", item.getSelected());
				
    			// Set the ID on the controller
    			this.props.controllerSelectHandler(item.props.key, config);
			},
			
			/**
			 * Method which handles a configuration change from within an active list item 
			 * @param item:ActiveListItem React object
			 */
			configurationChanged:function(item)
			{
				//console.log("pack equipment select handler: ", item.props.key, " || ", this.props.items);
				//if(item.getSelected)console.log("selected pack equipment: ", item.getSelected());
				// If the pack is not yet selected, select it!
				if(!_utils.getItem(item.props.key, this.props.selected))
				{
					// Select the pack
					item.stopColourUpdate = true;
					this.itemClickHandler(item);
				}
				// Else update the equipment selection
				else
				{
					var cachedConfig = item.cachedSelection;
					// Update selection
					var config = item.getSelected(),
						checkArrays = _utils.checkArrays;
					// Save the current selection on the item
					item.cachedSelection = config;
					if(!checkArrays(cachedConfig.options, config.options, "ID") || !checkArrays(cachedConfig.accessories, config.accessories, "ID"))
					{
						this.props.controllerSecondarySelectHandler(item.props.key, cachedConfig, config);
					}
				}
			},
			
			/**
			 * Method which checks if the pack contains any active selection items
			 * @param equipment:Array 
			 */
			isActiveItem:function(item)
			{
				var i = 0,
					iL = item.equipment.length;
				for(; i < iL; i++)
				{
					if(item.equipment[i].ChildOptions.length > 0)return true;
				}
				return false;
			},
			
			/**
			 * Method which opens the next section on the vList 
			 */
			openNextSection:function()
			{
				var i = 0,
					arr = this._itemList.getData(),
					iL = arr.length,
					prev = null,
					o;
				for(; i < iL; i++)
				{
					o = arr[i];
					if(prev)
					{
						// Height event gets dispatched and you end up in the heightUpdateHandler, closing the other sections
						if(o.state.renderContent)o.openContent(true);
						else o.renderContent();
						break;
					}
					if(o._open)
					{
						prev = o;
					}
				}
			},
			
			/**
			 * Method which handles the height update of one of the VList items 
			 */
			heightUpdateHandler:function(item, height)
			{
				// Else
				var i = 0,
					arr = this._itemList.getData(),
					iL = arr.length,
					o;
					
				// If the vList can only have one opened...
				if(this.props.hasContentListItems)
				{
					for(; i < iL; i++)
					{
						o = arr[i];
						if(o.props.key != item.props.key)
						{
							o.closeContent();
						}
						height += o._baseHeight;
					}
				}
				else
				{
					for(; i < iL; i++)
					{
						o = arr[i];
						if(o.props.key != item.props.key)
						{
							height += $(o.getDOMNode()).outerHeight();
						}
					}
				}
				//console.log("VList heightUpdateHandler: ", height);
				this.props.heightUpdateHandler(height, this);
			},
			
			// ###########################
			// Public methods
			// ###########################
			
					
			// ###########################
			// Required react methods
			// ###########################
						
			/**
			 * Method called after the VList got updated 
			 */
			componentDidUpdate:function()
			{
				// Select the items
				this._itemList.select(this.props.selected);
			},
			
			/**
			 * Method called when the component did mount 
			 */
			componentDidMount:function()
			{
				if(this.props.selected)
				{
					this.componentDidUpdate();
				}
			},
			
			/**
			 * Method called when the component will mount
			 */
			componentWillMount:function()
			{
				this._itemList = new ui.List(true);
			},
						
			/**
			 * Default the props 
			 */
			getDefaultProps:function()
			{
				return {
					items:[],
					hasContentListItems:false,
					inline:false
				};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var instance = this,
					ItemType,
					items;
				
				// Create the item list
				if(this.props.hasContentListItems)
				{
					ItemType = ui.ContentListItem;
					items = this.props.items.map(
						function(item)
						{
							return ItemType(
										{key:item.ID,
										name:item.name,
										equipment:item.equipment,
										heightUpdateHandler:instance.heightUpdateHandler,
										contentItemSelectHandler:item.contentItemSelectHandler,
										data:item,
										selected:item.selected,
										enabled:item.enabled,
										contentClassName:item.contentClassName,
										open:item.open}
										);
						}
					);
				}
				else
				{
					items = this.props.items.map(
						function(item)
						{
							// Determin what type of list item to render
							if(instance.isActiveItem(item))
							{
								ItemType = ui.ActiveListItem;
							}
							else
							{
								ItemType = ui.PassiveListItem;
							}	
							return ItemType( 
										{key:item.ID, 
										name:item.name, 
										enabled:item.enabled, 
										equipment:item.equipment, 
										equipmentDescription:item.equipmentDescription,
										colourCombinations:item.colourCombinations,
										exteriorColourID:item.exteriorColourID,
										price:_utils.hasPrice?item.price:null, 
										promotions:item.promotions, 
										clickHandler:instance.itemClickHandler, 
										heightUpdateHandler:instance.heightUpdateHandler,
										configurationChanged:instance.configurationChanged,
										selectedEquipment:instance.props.selectedEquipment}
										);
						}
					);
				}
				this._itemList.setData(items);
				
				return(
					React.DOM.section( {className:"cc-tab cc-tab-panel " + (this.props.inline?"":"cc-abs-item ") + this.props.className}, 
						React.DOM.div( {className:"cc-list cc-list-view cc-has-paging clearfix"}, 
							React.DOM.div( {className:"cc-list-page-wrapper"}, 
								React.DOM.div( {className:"cc-list-page-container"}, 
									React.DOM.ul( {className:"cc-clearfix tmxcc-list-page"}, 
										items
									)
								)
							)
						)
					)
				);
			}
		}
	);
}());