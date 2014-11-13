/** @jsx React.DOM */
(function() {
	
	/**
     * Renders the specification sheet
     */
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag,
		_utils = be.marlon.utils;
		
	// Instantiate the bottomcontainer class
	ui.SpecSheet = React.createClass(
		{displayName: 'SpecSheet',
			mixins:[_utils.Mixins.Height, _utils.Mixins.Mount],
			
			// ###########################
			// Private methods
			// ###########################
			
	    	/**
	    	 * Method used to create all the rows for the specification sheet 
	    	 */
	    	createRows:function()
	    	{
	    		var dic = _utils.Dictionary,
	    			items = [],
	    			config = this.props.config,
	    			controller = this.props.controller,
	    			promoConfig = controller.getPromoConfiguration(),
	    			wheelConfig = controller.getWheelConfiguration(),
	    			i,
	    			iL,
	    			staOptions = [],//controller.getStandardFilterOptions(),
	    			staOpt = [],//controller.getStandardPromotedOptions(),
	    			staAcc = [];//controller.getStandardPromotedAccessories();
	    		// Create the model
	    		var promos = promoConfig?promoConfig.ModelPromo.concat(promoConfig.SubModelPromo):null,
	    			price = {
	    				ListPrice:config.BasePrice.ListPrice,
	    				ListPriceDiscount:0
	    			};
	    		i = 0;
	    		iL = promos?promos.length:0;
	    		for(; i < iL; i++)
	    		{
	    			price.ListPriceDiscount += promos[i].Value;
	    		}
	    		price.ListPriceWithDiscount = price.ListPrice - price.ListPriceDiscount;
	    		items.push(RowItem( {key:0, title:dic.getLabel("scModel"), description:config.ModelLabel, price:price, promo:promos}));
	    		// Create the bodytype
	    		items.push(RowItem( {key:1, title:dic.getLabel("scBodytype"), description:config.BodyTypeLabel, promo:promoConfig?promoConfig.BodyTypePromo:null}));
	    		// Create the engine 
	    		items.push(RowItem( {key:2, title:dic.getLabel("scEngine"), description:config.EngineLabel, promo:promoConfig?promoConfig.EnginePromo:null}));
	    		// Create the transmission
	    		items.push(RowItem( {key:3, title:dic.getLabel("scTransmission"), description:config.TransmissionLabel}));
	    		// Create the grade
	    		items.push(RowItem( {key:4, title:dic.getLabel("scGrades"), description:config.GradeLabel, promo:promoConfig?promoConfig.GradePromo:null}));
	    		// Base price seperator
	    		if(config.TotalPrice > 0 && _utils.hasPrice)
	    		{
	    			items.push(
	    				React.DOM.tr( {key:5, className:"highlight"}, 
	    					React.DOM.td( {className:"cc-col-3"}),
	    					React.DOM.td( {className:"cc-col-6"}),
	    					React.DOM.td( {className:"cc-col-3 cc-right"}, 
	    						dic.getLabel("scBasePrice"),
	    						React.DOM.span( {className:"cc-price"}, _utils.formatPrice(config.BasePrice.ListPriceWithDiscount, true))
	    					)
	    				)
	    			);
				}
	    		// Add the packs
	    		i = 0;
	    		iL = config.Packs.length;
	    		var packEquipment,
	    			groupedEquipment = [];
	    		for(; i < iL; i++)
	    		{
	    			// Check if the pack is a specific aygo pack
	    			packEquipment = controller.getSelectedPackOptions(config.Packs[i]);
	    			// Add the specific aygo-pack equipment to the standard options, so they don't get the remove functionality
	    			items.push(RowItem( {key:config.Packs[i], hasBorder:packEquipment.length === 0, id:config.Packs[i], title:(i===0)?dic.getLabel("packs"):"", description:config.PackLabels[i], price:config.PackPrices?config.PackPrices[i]:null, promo:promoConfig?promoConfig.PackPromo[i]:null, removeHandler:this.removePack}));
	    			if(packEquipment.length > 0)
	    			{
	    				items.push(RowContents( {key:config.Packs[i] + i, data:packEquipment, groupParent:true}));
	    				groupedEquipment = groupedEquipment.concat(packEquipment);
	    			}
	    		}
	    		// Add the exterior
	    		items.push(RowItem( {key:6, title:dic.getLabel("exterior"), description:config.ExteriorColourLabel, price:config.ExteriorColourPrice, promo:promoConfig?promoConfig.ColorPromo:null}));
	    		iL = config.Accessories.length;
	    		for(i = 0; i < iL; i++)
	    		{
	    			if(config.Accessories[i] == config.WheelID)
	    			{
	    				i = -1;
	    				break;
	    			}
	    		}
	    		
	    		var isExtendeWheel = wheelConfig.finish && (wheelConfig.cap || wheelConfig.surround),
	    			wheelEquipment;
	    		// Only append the wheel when no accessory is found
	    		if(i > -1)
	    		{
	    			// Add the wheel
	    			items.push(RowItem( {key:7, description:config.WheelLabel, hasBorder:!isExtendeWheel, price:config.WheelPrice, promo:promoConfig?promoConfig.WheelPromo:null}));
	    			// Check if this is an extended wheel
	    			if(isExtendeWheel)
	    			{
	    				wheelEquipment = [wheelConfig.finish];
	    				if(wheelConfig.cap)wheelEquipment.push(wheelConfig.cap);
	    				if(wheelConfig.surround)wheelEquipment.push(wheelConfig.surround);
	    				items.push(RowContents( {key:8, data:wheelEquipment}));
	    				groupedEquipment = groupedEquipment.concat(wheelEquipment);
	    			}
	    		}
	    		// Add the standard equipment
	    		this.appendStandardItems(items, staOpt, "EXT", "");
	    		var lExt = this.appendEquipment(items, config.Options, config.OptionsLabels, config.OptionsPrices, config.OptionsTypes, promoConfig?promoConfig.OptionsPromo:null, "EXT", "", this.removeExtOption, staOptions, groupedEquipment);
	    		// Add the interior
	    		items.push(RowItem( {key:config.UpholsteryID, title:dic.getLabel("interior"), description:config.UpholstryLabel, price:config.UpholstryPrice, promo:promoConfig?promoConfig.UpholsteryPromo:null}));
	    		if(config.InlayLabel != dic.EMPTY)
	    		{
	    			items.push(RowItem( {key:config.InlayID, description:config.InlayLabel, price:config.InlayPrice, promo:promoConfig?promoConfig.InlayPromo:null}));
	    		}
	    		this.appendStandardItems(items, staOpt, "INT", "");
	    		var lInt = this.appendEquipment(items, config.Options, config.OptionsLabels, config.OptionsPrices, config.OptionsTypes, promoConfig?promoConfig.OptionsPromo:null, "INT", "", this.removeIntOption, staOptions, groupedEquipment);
	    		// Add the accessories
	    		this.appendStandardItems(items, staAcc, "", dic.getLabel("accessories"));
	    		this.appendEquipment(items, config.Accessories, config.AccessoriesLabels, config.AccessoriesPrices, null, promoConfig?promoConfig.AccessoriesPromo:null, false, (staAcc && staAcc.length > 0)?"":dic.getLabel("accessories"), this.removeAccessory, staOptions, groupedEquipment);
	    		// Add the "add" buttons
	    		// Add packs
	    		var sp = this.props.specProps; 
	    		if(sp)
	    		{
		    		// Add exterior options
		    		if(sp.availableExternalOptions > lExt)
		    		{
		    			items.push(this.createAddButton(9, dic.getLabel("scAddExtOptions"), this.addExterior));
		    		}
		    		// Add interior options
		    		if(sp.availableInternalOptions > lInt)
		    		{
		    			items.push(this.createAddButton(10, dic.getLabel("scAddIntOptions"), this.addInterior));
		    		}
		    		// Add accessories
		    		if(sp.availableAccessories > config.Accessories.length)
		    		{
		    			items.push(this.createAddButton(11, dic.getLabel("scAddAccessories"), this.addAccessories));
		    		}
		    	}
	    		//items.push(<RowItem id={} title={} description={} price={} promo={} removeHandler={}/>);
	    		
	    		return items;
	    	},
	    	
	    	/**
	    	 * Method which loops through an Array of equipment items and appends them to the list 
	    	 */
	    	appendEquipment:function(items, aItems, aLabels, aPrices, aTypes, aPromos, type, header, removeFn, staOptions, groupedEquipment)
	    	{
	    		var i = 0,
	    			iL = aLabels.length,
	    			t = 0,
	    			staEquip;
	    		for(; i < iL; i++)
	    		{
	    			if(
	    				(!type || aTypes[i] == type) &&
	    				(_utils.getItem(aItems[i], groupedEquipment, "ID") === null)
	    			)
	    			{
	    				staEquip = _utils.checkID(aItems[i], staOptions);
	    				items.push(RowItem( {key:aItems[i], id:aItems[i], title:(t === 0)?header:"", description:aLabels[i], price:aPrices?aPrices[i]:null, promo:aPromos?aPromos[i]:null, removeHandler:staEquip?null:removeFn}));
	    				if(!staEquip)t ++;
	    			}
	    		}
	    		return t;
	    	},
	    	
	    	/**
	    	 * Method which loops through the standard promoted equipment items 
	    	 */
	    	appendStandardItems:function(items, a, type, title)
			{
				var i = 0,
					iL = a.length,
					o,
					li;
				for(i; i < iL; i++)
				{
					o = a[i];
					if((type !== "" && o.Category.Code.substring(0,3)==type) || (type === ""))
					{
						items.push(RowItem( {key:o.ID, title:(i===0)?title:"", description:o.Name, promo:o.Promotions}));
					}
				}
			},
			
	    	/**
	    	 * Method which creates an add button 
	    	 */
	    	createAddButton:function(id, label, fClick)
	    	{
	    		return (
	    			React.DOM.tr( {key:id}, 
	    				React.DOM.td( {className:"cc-col-3"}, " "),
	    				React.DOM.td( {className:"cc-col-9", colSpan:"2"}, 
	    					React.DOM.a( {className:"cc-btn-add", onClick:fClick}, 
	    						label,
	    						React.DOM.i( {className:"icon-angle-right"})
	    					)
	    				)
	    			)
	    		);
	    	},
	    	
	    	/**
	    	 * Method which handles clicking on the add buttons 
	    	 */
	    	addExterior:function()
	    	{
	    		// Track click on add exterior options button
                bt.track({
                    componentname: 'carconfig',
                    action: 'cc_action',
                    value: 'add-ext-options'
                });

	    		this.props.navigate(_utils.EXTERIOR);
	    	},
	    	addInterior:function()
	    	{
	    		// Track click on add interior options button
                bt.track({
                    componentname: 'carconfig',
                    action: 'cc_action',
                    value: 'add-ext-options'
                });

	    		this.props.navigate(_utils.INTERIOR);
	    	},
	    	addAccessories:function()
	    	{
	    		// Track click on add accessories button
                bt.track({
                    componentname: 'carconfig',
                    action: 'cc_action',
                    value: 'add-accessories'
                });	    	

	    		this.props.navigate(_utils.ACCESSORIES);
	    	},
	    	
	    	/**
	    	 * Method which removes an exterior option 
	    	 */
	    	removeExtOption:function(item)
	    	{
	    		//console.log("Remove ext option: ", item);
	    		// Set the option!
	    		//var guid = J(this).data('guid');
	    		this.props.controller.setOption(item.props.id);

	    		// Track removing exterior option
                bt.track({
                    componentname: 'carconfig',
                    action: 'cc_action',
                    value: 'delete-ext-options'
                });
	    	},
	    	
	    	/**
	    	 * Method which removes an interior option 
	    	 */
	    	removeIntOption:function(item)
	    	{
	    		//console.log("Remove int option: ", item);
	    		// Set the option!
	    		//var guid = J(this).data('guid');
	    		//_controller.setOption(guid);
	    		this.props.controller.setOption(item.props.id);

	    		// Track removing interior option
                bt.track({
                    componentname: 'carconfig',
                    action: 'cc_action',
                    value: 'delete-int-options'
                });
	    	},
	    	
	    	/**
	    	 * Method which removes the accessories 
	    	 */
	    	removeAccessory:function(item)
	    	{
	    		//console.log("Remove accessory: ", item);
	    		// Remove the accessory
	    		//var guid = J(this).data('guid');
	    		//_controller.setAccessorie(guid);
	    		this.props.controller.setAccessory(item.props.id);

				// Track removing accessory
                bt.track({
                    componentname: 'carconfig',
                    action: 'cc_action',
                    value: 'delete-accessories'
                });
	    	},
	    	
	    	/**
	    	 * Method which removes the packs 
	    	 */
	    	removePack:function(item)
	    	{
	    		// Hide the item
	    		$(item.getDOMNode()).hide();
	    		
	    		// Call the controller logic
	    		var id = item.props.id; 
	    		this.props.controller.setPack(id);
	    	},
	    	
	    	/**
	    	 * Method which handles the complete hide event from the hide function 
	    	 */
	    	completeHideEventHandler:function()
	    	{
	    		$(this.getDOMNode()).css('display', 'none');
	    	},
				
			// ###########################
			// Public methods
			// ###########################
						
						
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Method called right after the element has rendered 
			 */
			componentDidMount:function(rootNode)
			{
				this.props.componentDidMount(this);
			},
			
			/**
			 * Method which is called to check if the component should update 
			 */
			shouldComponentUpdate:function(nextProps, nextState)
			{
				var update = true,
					c1,
					c2;
				// Check if the configuration differs
				if(nextProps.config && this.props.config)
				{
					// Check both configurations
					c1 = this.props.config;
					c2 = nextProps.config;
					update = !c1.equals(c2);
				}
				//console.log("Rerender specification sheet?: ", update, " -> new: ", c2, " -> old: ", c1);
				return update;
			},
			
			/**
			 * Default the props 
			 */
			getDefaultProps:function()
			{
				return {
					addPack:null,
					addInterior:null,
					addExterior:null,
					addAccessories:null
				};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var rows;
			    if(this.props.config)
			    {
			    	// Create the rows for the specsheet
					rows = this.createRows();
			    }
			    
			    // Create the return value
				return(
					React.DOM.div( {className:"cc-abs-item"}, 
				    	React.DOM.table(null, 
							React.DOM.tbody(null, 
								rows
							)
						)
					)
				);
			}
		}
	);
	
	/**
	 * A row item
	 */
	var RowItem = React.createClass(
		{displayName: 'RowItem',
			removeHandler:function(e)
			{
				// Call the remove handler
				this.props.removeHandler(this);
			},
			
			/**
			 * Default the props 
			 */
			getDefaultProps:function()
			{
				return {
					hasBorder:true
				};
			},
			
			render:function()
			{
				/*console.log(this.props.key);
				console.log(this.props.promo);
				console.log(this.props.price);
				console.log("--------------------");*/				
				var id = this.props.id,
					title = this.props.title,
					description = this.props.description,
					price = _utils.hasPrice?this.props.price:null,
					promo = this.props.promo,
					removeHandler = this.props.removeHandler,
					removeBTN = null;
					
	    		if(removeHandler)
	    		{
	    			removeBTN = (
	    				React.DOM.a( {className:"cc-btn-remove", 'data-guid':id, onClick:this.removeHandler}, 
	    					React.DOM.i( {className:"cc-icon icon-trash"})
	    				)
	    			);
	    		}
	    		
	    		var pricing;
	    		// Add promotional information
	    		if(promo && promo.length > 0)
	    		{
	    			var priceDiscount;
		    		if(price && price.ListPriceDiscount > 0) priceDiscount = React.DOM.del( {className:"cc-price"}, _utils.formatPrice(price.ListPrice, true));
		    		
		    		// Append the promotion
		    		var i = 0,
		    			iL = promo.length,
		    			indexes = [],
		    			value = 0;
		    		for(; i < iL; i++)
		    		{
		    			indexes.push(
		    				React.DOM.a( {key:promo[i].ID, 'data-guid':promo[i].ID, className:"cc-number cc-icon", onClick:_utils.navigateToDisclaimer}, promo[i].Index)
		    			);
		    			if(!price)value += promo[i].Value;
		    		} 
		    		
		    		pricing = (
	    				React.DOM.div( {className:"cc-pricing cc-promo-price"}, 
	    					React.DOM.span( {className:"cc-price"}, 
	    						indexes,
	    						_utils.formatPrice((price?(price.ListPriceWithDiscount):-value), true)
	    					),
	    					priceDiscount
	    				)
	    			);
		    		
	    		}
	    		else if(price && price.ListPrice !== 0)
	    		{
	    			pricing = (
	    				React.DOM.div( {className:"cc-pricing"}, 
	    					React.DOM.span( {className:"cc-price"}, 
	    						_utils.formatPrice(price.ListPrice, true)
	    					)
	    				)
	    			);
	    		}
	    		
	    		return(
	    			React.DOM.tr( {className:this.props.hasBorder?"":"cc-pack"}, 
	    				React.DOM.th( {className:"cc-col-3"}, title),
	    				React.DOM.td( {className:"cc-col-6"}, 
	    					description,
	    					removeBTN
	    				),
	    				React.DOM.td( {className:"cc-col-3 cc-right"}, pricing)
	    			)
	    		);
			}
		}
	);
	
	/**
	 * A two level row item 
	 */
	var RowContents = React.createClass(
		{displayName: 'RowContents',
			removeHandler:function(e)
			{
				// Call the remove handler
				this.props.removeHandler(this);
			},
			
			render:function()
			{
				var id,
					description,
					//price = _utils.hasPrice?this.props.price:null,
					price,
					data = this.props.data,
					removeHandler = this.props.removeHandler,
					removeBTN = null,
					i,
					iL = data.length,
					item,
					prevItem,
					content = [];
				
				//if(this.props.groupParent)
				// Order the equipment based on their (shared) parent option
				var sorted = {},
					po;
				for(i = 0; i < iL; i++)
				{
					item = data[i];
					po = item.ParentOption;
					if(!po)po={ID:"default" + i, PriceInVat:0};
					
					if(!sorted[po.ID])
					{
						sorted[po.ID] = {
							parent:po,
							equipment:[],
							price:po.PriceInVat
						};
					}
					sorted[po.ID].equipment.push(item);
					sorted[po.ID].price += item.PriceInfo.ListPrice;
				}
				
				// Create all the list items
				var prop,
					hasBorder;
				for(prop in sorted)
				{
					price = null;
					po = sorted[prop];
					iL = po.equipment.length;
					hasBorder = (iL === 1);
					if(_utils.hasPrice && po.price !== 0)
		    		{
		    			price = (
		    				React.DOM.td( {className:"cc-col-3 cc-right"}, 
		    					React.DOM.span( {className:"cc-price"}, 
		    						_utils.formatPrice(po.price, true)
		    					)
		    				)
		    			);
		    		}
		    		else
		    		{
		    			price = React.DOM.td(null);
		    		}
		    		item = po.equipment[0];
		    		content.push(
						React.DOM.tr( {key:item.ID, className:!hasBorder?"no-border":""}, 
							React.DOM.td(null, item.Name),
							price
						)
					);
					
					for(i = 1; i < iL; i++)
					{
						item = po.equipment[i];
						hasBorder = i === (iL -1);
						content.push(
							React.DOM.tr( {key:item.ID, className:!hasBorder?"no-border":""}, 
								React.DOM.td(null, item.Name),
								React.DOM.td(null)
							)
						);
					}
				}
				
				/*for(i = 0; i < iL; i++)
				{
					item = data[i];
					if(i > 0)prevItem = data[i-1];
					removeBTN = null;
					price = null;
					/*if(removeHandler)
		    		{
		    			removeBTN = (
		    				<a className="cc-btn-remove" data-guid={id} onClick={this.removeHandler}>
		    					<i className="cc-icon icon-trash"></i>
		    				</a>
		    			);
		    		}*/
					
					/*if(_utils.hasPrice && item.PriceInfo && item.PriceInfo.ListPrice !== 0)
		    		{
		    			price = (
		    				<td className="cc-col-3 cc-right">
		    					<span className="cc-price">
		    						{_utils.formatPrice(item.PriceInfo.ListPrice, true)}
		    					</span>
		    				</td>
		    			);
		    		}
		    		else
		    		{
		    			price = (
		    				<td></td>
		    			);
		    		}
					
					content.push(
						<tr key={i}>
							<td>{item.Name}</td>
							{price}
						</tr>
					);
				}*/
	    		
	    		
	    		//<td className="cc-col-3 cc-right">{pricing}</td>
	    		return(
	    			React.DOM.tr( {className:"cc-pack-contents"}, 
	    				React.DOM.th(null),
	    				React.DOM.td( {colSpan:"2"}, 
	    					React.DOM.div( {className:"cc-table-wrapper"}, 
								React.DOM.table(null, 
									React.DOM.tbody(null, 
										content
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