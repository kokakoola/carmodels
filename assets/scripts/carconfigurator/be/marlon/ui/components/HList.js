/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a horizontal list
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	// Instantiate the topcontainer class
	ui.HList = React.createClass(
		{displayName: 'HList',
			// Variable for internal use
			_info:null,
			
			// ###########################
			// Private methods
			// ###########################
						
			/**
			 * Handles clicking on a list item
			 * @param item:ReactObject the item clicked upon 
			 */
			itemClickHandler:function(item)
			{
				if(_utils.hasTouch && this._scroller)
				{
					if(this._scroller.isDragging())return;
				}
    			// Set the ID on the controller
    			if(this.props.controllerSelectHandler)
    			{
    				this.props.controllerSelectHandler(item.props.key);
    			}
    			if(this.props.clickHandler)
    			{
    				this.props.clickHandler(item);
    			}
			},
			
			/**
			 * Handles when the info panel mounted 
			 */
			infoMountHandler:function(item)
			{
				this._info = item;
			},
			
			/**
			 * Handles clicking on the info button of an item
			 * @param item:ReactObject the item clicked upon 
			 */
			infoClickHandler:function(item)
			{
				// Render the info panel
				this._info.setState(
					{
						item:item.props
					},
					this.itemStateUpdated
				);
				
				// Track the info click
				if(this.props.webtrendtag !== "")
				{
					be.marlon.Brighttag.track({
		                action: 'cc_action',
		                value:this.props.webtrendtag
	            	});
				}
			},
			
			/**
			 * Method which is called when the state of the info panel has been updated 
			 */
			itemStateUpdated:function()
			{
				var $mask = $(this.getDOMNode()).find('.cc-hmask');
				$mask.show();
				var preH = $mask.outerHeight();
				$mask.height('100%');
				// Update the height of the parent container
				this.props.heightUpdateHandler();
				var gH = $mask.outerHeight();
				$mask.height(preH);
				$mask.animate({height:gH}, {duration:400, queue:false});
			},
			
			/**
			 * Handles clicking on the close button of the info panel 
			 */
			closeInfo:function()
			{
				var $mask = $(this.getDOMNode()).find('.cc-hmask');
				$mask.height(0);
				// Update the height of the parent container
				this.props.heightUpdateHandler();
				$mask.height('100%');
				$mask.animate({height:0}, {duration:400, queue:false, complete:this.infoCompletelyClosed});
			},
			
			/**
			 * Method called when the info panel completely animated out 
			 */
			infoCompletelyClosed:function()
			{
				$(this.getDOMNode()).find('cc-hmask').hide();
			},
			
			/**
			 * Method which renders the parent state 
			 */
			renderParentState:function(props)
			{
				var instance = this;
				
				// Create the item list
				var items = props.items.map(
					function(item)
					{
						return ListItem( {deselectable:props.deselectable, 
									enabled:(typeof item.enabled != "undefined")?item.enabled:true, 
									clickable:props.clickable, 
									key:item.ID, 
									category:item.category, 
									colour:item.colour, 
									name:item.name, 
									description:item.description, 
									price:_utils.hasPrice?item.price:null, 
									promotions:item.promotions, 
									asset:item.asset, 
									clickHandler:instance.itemClickHandler, 
									infoClickHandler:instance.infoClickHandler,
									data:item.data,
									showsOnCar:item.showsOnCar,
									whiteBG:item.whiteBG});	
					}
				);
				
				var info = (
					React.DOM.div( {className:"cc-hmask", style:{display:"none"}}, 
						Info( {closeHandler:this.closeInfo, componentDidMount:this.infoMountHandler, infoTitle:props.infoTitle})
					)
				);
				
				var container = (
					React.DOM.ul( {className:"cc-list-page"}, 
						items
					)
				);
				
				// The selected property had to be removed from the state because the state did not update directly in the componentDidMount method of the HListBas component
				this._selected = props.selected; // -> this._selected is defined in the HListBase mixin class!
				this.setState(
					{
						sectionClassName:((props.inline?"cc-list-features ":"cc-tab cc-tab-panel cc-abs-item ") + "cc-hlist ") + (props.className?props.className:''),
						divClassName:"cc-list cc-list-thumbs cc-has-paging group",
						width:780,
						bottom:info,
						data:items,
						container:container,
						itemsPerPage:5,
						hasSearch:true
					}
				);
			},
			
			// ###########################
			// Public methods
			// ###########################
			
			/**
			 * Method which selects an item in the list 
			 */
			select:function(key, cb)
			{
				this._itemList.select(key, cb);
			},
			
			/**
			 * Method which returns the data associated with the list 
			 */
			getData:function()
			{
				return this._itemList.getData();
			},
			
			/**
			 * Method which returns the selected item 
			 */
			getSelected:function()
			{
				return this._itemList.getSelected();
			},
					
			// ###########################
			// Required react methods
			// ###########################
						
			/**
			 * Default the props 
			 */
			getDefaultProps:function()
			{
				return {
					deselectable:false,
					inline:false,
					clickable:true,
					webtrendtag:""
				};
			},
			
			/**
			 * Method called when the component is about to be mounted 
			 */
			componentWillMount:function()
			{
				this.renderParentState(this.props);
			},
			
			/**
			 * Method which handles the inbound receiving of new properties 
			 */
			componentWillReceiveProps:function(nextProps, nextState)
			{
				this.renderParentState(nextProps);
			},
			
			mixins:[_utils.Mixins.Mount, ui.HListBase]
		}
	);
	
	var Info = React.createClass(
		{displayName: 'Info',
			// Define the mixins
			mixins:[_utils.Mixins.Mount],
						
			/**
			 * Returns the default state of the info panel 
			 */
			getInitialState:function()
			{
				return {item:null};
			},
			
			/**
			 * React render method 
			 */
			render:function()
			{
				var dic = _utils.Dictionary,
					item = this.state.item,
					asset = (item && item.asset && item.asset !== _utils.PLACEHOLDER)?(
						React.DOM.div( {className:"cc-col cc-col-3 cc-img-container"}, 
							React.DOM.img( {src:item.asset.replace("{SIZE}", "215")})
						)
					):null,
					title = (this.props.infoTitle)?(
						React.DOM.span( {className:"cc-title"}, this.props.infoTitle)
					):null;
				
				return(
					React.DOM.section( {className:"cc-col cc-col-12 cc-box-feature clearfix"}, 
						React.DOM.div( {className:"cc-contents"}, 
							React.DOM.article( {className:"cc-feature cc-cols clearfix"}, 
								React.DOM.div( {className:"cc-col cc-col-12"}, 
									React.DOM.a( {className:"icon-remove cc-icon-close", onClick:this.props.closeHandler})
								),
								asset,
								React.DOM.div( {className:"cc-col cc-col-6"}, 
									title,
									React.DOM.h1(null, item?item.name:""),
									React.DOM.div( {className:"cc-summary", dangerouslySetInnerHTML:{__html:item?item.description:""}}
									)
								)
							)
						)
					)
				);
			}
		}
	);
	
	var ListItem = React.createClass(
		{displayName: 'ListItem',
			// Define the mixins
			mixins:[_utils.Mixins.Mount],
			
			/**
			 * Handles clicking on the list item 
			 */
			clickHandler:function(e)
			{
				e.stopPropagation();
				
				this.props.clickHandler(this);
			},
			
			/**
			 * Handles the clicking on the info item 
			 */
			infoClickHandler:function(e)
			{
				e.stopPropagation();
				this.props.infoClickHandler(this);
			},
			
			/**
			 * Returns the default state of the grade 
			 */
			getInitialState:function()
			{
				return {selected:false};
			},
			
			/**
			 * React render method 
			 */
			render:function()
			{
				var cat = this.props.category,
					sectionHeader = (cat && cat !== '')?(React.DOM.h3(null, cat)):null,
					price = this.props.price,
					promotions = this.props.promotions,
					pricing = null,
					promoIndexes = null,
					delprice = null,
					shine = null,
					showsOnCar = null,
					style = {},
					clickHandler = this.props.deselectable?this.clickHandler:(this.state.selected?null:this.clickHandler),
					info = (this.props.description && this.props.description !== "")?React.DOM.i( {className:"icon-info-sign cc-icon cc-icon-info", onClick:this.infoClickHandler}):null,
					asset = null,
					checkbox = this.props.clickable?React.DOM.span( {className:"cc-checkbox" + (this.state.selected?' cc-checked':'') + (this.props.enabled?'':' cc-disabled')}):null;
				
				// Check the asset
				if(this.props.asset)
				{
					// Check for the placeholder
					if(this.props.asset === _utils.PLACEHOLDER)
					{
						asset = React.DOM.span( {className:"cc-missing " + (this.props.whiteBG?"cc-white":"")});
					}
					else
					{
						asset = React.DOM.img( {className:this.props.whiteBG?"cc-white":"", src:this.props.asset.replace("{SIZE}", "144")});
					}
				}
				
				// If the item can be shown on the car
				if(this.props.showsOnCar)
				{
					showsOnCar = React.DOM.span( {className:"cc-show-on-car"});
				}
				
				// Create the price section
				if(price && price.ListPriceWithDiscount !== 0)
				{
					// Check the promotions
				    if(promotions.length > 0)
				    {
				    	promoIndexes = promotions.map(
				    		function(item)
				    		{
				    			return React.DOM.span( {key:item.Index, className:"cc-number"}, item.Index);
				    		}
				    	);
				    }
				    // Create the delprice
				    if(price.ListPriceWithDiscount !== price.ListPrice) delprice = React.DOM.del( {className:"cc-price"}, _utils.formatPrice(price.ListPrice, true));
			    	// Create the pricing container
			    	pricing = (
			    		React.DOM.div( {className:"cc-pricing" + (delprice?" cc-promo-price":"")}, 
							React.DOM.span( {className:"cc-price"}, 
								promoIndexes,
								" " + _utils.formatPrice(price.ListPriceWithDiscount, true) + " "
							),
							delprice
						)
			    	);
				}
				
				if(this.props.colour)
				{
					style.backgroundColor="#" + this.props.colour.replace("0x", "");
					shine = React.DOM.span( {className:"cc-shine"});
				}
				if(!sectionHeader && (typeof cat != "undefined"))style.marginTop="23px";
				//<label className="cc-radio cc-thumb" style={style} onClick={!_utils.hasTouch?clickHandler:null} onTouchEnd={_utils.hasTouch?clickHandler:null}>
				var TouchClicker = _utils.TouchClicker;
				return(
					React.DOM.li( {className:"cc-listitem" + (this.state.selected?' selected':'')}, 
						sectionHeader,
						TouchClicker( {content:
								React.DOM.label( {className:"cc-radio cc-thumb", style:style}, 
									checkbox,
									shine,
									asset,
									showsOnCar
								),
							 
							clickHandler:clickHandler}),
						React.DOM.span( {className:"cc-meta"}, 
							React.DOM.span( {className:"cc-title"}, 
								info,
								this.props.name
							),
							pricing
						)
					)
				);
			}
		}
	);
}());