/** @jsx React.DOM */
(function() {
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag;
	// Create the Spin header
	ui.SpinHeader = React.createClass(
		{displayName: 'SpinHeader',
			mixins:[be.marlon.utils.Mixins.Mount],
			_btnNext:null,
			_disclaimer:null,
			
			/**
	    	 * Method which shows the preloader
	    	 */
	    	showPreLoader:function()
	    	{
	    		this._btnNext.showPreLoader();
	    	},
	    	
	    	/**
	    	 * Method which hides the preloader 
	    	 */
	    	hidePreLoader:function()
	    	{
	    		this._btnNext.hidePreLoader();
	    	},
	    	
	    	/**
	    	 * Method which hides the next step 
	    	 */
	    	hideNextButton:function()
	    	{
	    		this._btnNext.hide();
	    	},
	    	
	    	/**
	    	 * Method which shows the next step 
	    	 */
	    	showNextButton:function()
	    	{
	    		this._btnNext.show();
	    	},
			
			/**
			 * Handles clicking on the next button 
			 */
			nextClickHandler:function(e)
			{
				this.props.nextHandler();
			},
			
			/**
			 * Handles the mount event of the next step 
			 */
			nextStepMountHandler:function(item)
			{
				this._btnNext = item;
			},
			
			/**
			 * Handles clicking on the promo button 
			 */
			promoClickHandler:function(e)
			{
				this.props.navigate(be.marlon.utils.PROMOTIONS);
			},
			
			/**
			 * Handles switching to another mode 
			 */
			modeSwitchHandler:function(e)
			{
				var $t = $(e.target),
					type = $t.data('type');
					
	            bt.track({
	                action: 'cc_action',
	                value: 'view-mode-' + type
	            });
				
				this.props.modeSwitchHandler(type);
			},
			
			/**
			 * Handles the mounting of the disclaimer 
			 */
			disclaimerMountHandler:function(item)
			{
				this._disclaimer = item;
			},
			
			/**
			 * Handles clicking on the disclaimer button of the monthly rate 
			 */
			mrDisclaimerClickHandler:function(e)
			{
				var btn = $(this.getDOMNode()).find('.cc-disclaimer-button');
				this._disclaimer.setState(
					{
						visible:!this._disclaimer.state.visible, 
						//top:Math.round(btn.offset().top + 14),
						top:68,
						left:Math.round(btn.find('a').outerWidth() + 12)
					});
			},
			
			/**
			 * Default the props 
			 */
			getDefaultProps:function()
			{
				return {
					monthlyRate:false
				};
			},
			
			/**
			 * React render method 
			 */
			render:function()
			{
				var utils = be.marlon.utils,
					dic = utils.Dictionary,
					carName = "",
					pricing = null,
					controller = this.props.controller,
					MenuButton = ui.MenuButton,
					NextButton = ui.NextButton,
					changeViewButtons = [],
					config = this.props.configuration,
					modes = this.props.modes,
					monthlyRate = null,
					promoBtn = null;
				
				// Create the available modes to populate the button
				if(modes.visibleInExteriorSpin)
				{
					changeViewButtons.push(
                        React.DOM.li( {key:utils.EXT_DARK}, 
                        	React.DOM.a( {onClick:this.modeSwitchHandler, 'data-type':utils.EXT_LIGHT}, dic.getLabel('exteriorDark'))
                        ),
                        React.DOM.li( {key:utils.EXT_LIGHT}, 
                        	React.DOM.a( {onClick:this.modeSwitchHandler, 'data-type':utils.EXT_DARK}, dic.getLabel('exteriorLight'))
                        )
					);
				}
				// All cars except the hilux have the ability to toggle between the interior dark & light backgrounds
				if(modes.visibleInInteriorSpin)
				{
					changeViewButtons.push(
						React.DOM.li( {key:utils.INT_DARK}, 
                        	React.DOM.a( {onClick:this.modeSwitchHandler, 'data-type':utils.INT_LIGHT}, dic.getLabel('interiorDark'))
                        )
					);
				}
				// In all cases add the light one
				changeViewButtons.push(
						React.DOM.li( {key:utils.INT_LIGHT}, 
                        	React.DOM.a( {onClick:this.modeSwitchHandler, 'data-type':utils.INT_DARK}, dic.getLabel('interiorLight'))
                        )
              	);
				
				if(modes.visibleInXRay4X4Spin)
				{
					changeViewButtons.push(
						React.DOM.li( {key:utils.XRAY_4X4}, 
                        	React.DOM.a( {onClick:this.modeSwitchHandler, 'data-type':utils.XRAY_4X4}, dic.getLabel('xRay4x4'))
                        )
					);
				}
				if(modes.visibleInXRayHybridSpin)
				{
					changeViewButtons.push(
						React.DOM.li( {key:utils.XRAY_HYBRID}, 
                        	React.DOM.a( {onClick:this.modeSwitchHandler, 'data-type':utils.XRAY_HYBRID}, dic.getLabel('xRayHybrid'))
                        )
					);
				}
				if(modes.visibleInXRaySafetySpin)
				{
					changeViewButtons.push(
						React.DOM.li( {key:utils.XRAY_SAFETY}, 
                        	React.DOM.a( {onClick:this.modeSwitchHandler, 'data-type':utils.XRAY_SAFETY}, dic.getLabel('xRaySafety'))
                        )
					);
				}
				if(modes.visibleInNightMode)
				{
					changeViewButtons.push(
						React.DOM.li( {key:utils.NIGHT}, 
                        	React.DOM.a( {onClick:this.modeSwitchHandler, 'data-type':utils.NIGHT}, dic.getLabel('nightMode'))
                        )
					);
				}
				if(modes.visibleInBoot)
				{
					changeViewButtons.push(
						React.DOM.li( {key:utils.BOOT}, 
                        	React.DOM.a( {onClick:this.modeSwitchHandler, 'data-type':utils.BOOT}, dic.getLabel('bootMode'))
                        )
					);
				}
				
				var i = 0,
					iL = changeViewButtons.length - 1;
				for(; i < iL; i++)
				{
					changeViewButtons[i].props.className = "cc-border-bot";
				}
				
				// If the configuration is present
				if(config)
				{
					carName = config.ModelLabel;
					if(utils.hasPrice)
					{
						var activePromos = controller.getActivePromotions(),
				    		delPrice,
				    		disclaimers = null;
				    	if(activePromos && activePromos.length > 0)
				    	{
				    		// Populate the disclaimers
				    		disclaimers = activePromos.map(
				    			function(item)
				    			{
				    				return React.DOM.a( {key:item.ID, className:"cc-number cc-icon"}, item.Index);
				    			}
				    		);
				    		if(config.TotalPriceDiscount > 0)
				    		{
				    			delPrice = React.DOM.del( {className:"cc-price"}, utils.formatPrice(config.TotalPrice,true));
				    		}
				    	}
				    	
				    	pricing = (
				    		React.DOM.div( {className:"cc-pricing" + (disclaimers?" cc-promo-price":"")}, 
				                React.DOM.span( {className:"cc-price"}, 
				                	disclaimers,
				                	utils.formatPrice((config.TotalPrice - config.TotalPriceDiscount), true)
				               	),
				                delPrice
				            )
				    	);
				    	
				    	var data = dic.getLabel("monthlyRateLabel");
				    	if(this.props.monthlyRate && data !== dic.EMPTY)
				    	{
				    		var items = data.replace(/[[]/g, "").split("]"),
				    			mr = this.props.monthlyRate.data,
				    			prop,
				    			ex,
				    			ele = [],
				    			val,
				    			t,
				    			regEx = /([{])(.*?)([}])/,
				    			tL = mr.length;
				    			
				    		i = 0;
				    		iL = items.length;
				    		for(; i < iL; i++)
				    		{
				    			// Filter the property from the split label
				    			ex = regEx.exec(items[i]);
				    			if(ex && ex[2])
				    			{
				    				prop = ex[2].toUpperCase();
				    				// Now get the value for the property
				    				for(t = 0; t < tL; t++)
				    				{
				    					if(prop === mr[t].Name.toUpperCase())
				    					{
				    						val = mr[t].Formatted;
				    						break;
				    					}
				    				}
				    				// If the item is found
				    				if(val)
				    				{
				    					ele.push(
				    						React.DOM.div( {key:i, dangerouslySetInnerHTML:{__html:items[i].replace(ex[0], val)}})
				    					);
				    				}
				    				val = null;
				    			}
				    		}
				    		
				    		//utils.navigateToDisclaimer
				    		// <i onClick={utils.navigateToDisclaimer} data-guid="MONTHLYRATE" className="icon-info-sign cc-icon cc-icon-info"></i>
				    		monthlyRate = (
				    			React.DOM.div( {className:"cc-price-monthly"}, 
				    				ele,
				    				React.DOM.div( {className:"cc-disclaimer-button"}, React.DOM.a( {onClick:this.mrDisclaimerClickHandler, 'data-guid':"MONTHLYRATE"}, dic.getLabel('disclaimer'))),
				    				DisclaimerOverlay( {componentDidMount:this.disclaimerMountHandler, data:this.props.monthlyRate.legaltext})
				    			)
				    		);
				    	}
					}
				}
				
				// Render the promo button if promotions are available on the car
				if(this.props.hasPromo)
				{
					promoBtn = React.DOM.a( {onClick:this.promoClickHandler}, React.DOM.i( {'data-target':"cc-box-promotions", className:"icon-info-sign cc-icon cc-icon-info"}),dic.getLabel('viewAllPromotions'));
				}
				
				return(
					React.DOM.div( {className:"cc-car-header"}, 
						React.DOM.div( {className:"cc-container cc-header-actions"}, 
							React.DOM.div( {className:"cc-actions"}, 
								MenuButton( {style:"btn-dark cc-btn-change-view", hidden:be.marlon.utils.smSlave, label:dic.getLabel('changeView'), elements:changeViewButtons}),
						        NextButton( {clickHandler:this.nextClickHandler, visible:true, componentDidMount:this.nextStepMountHandler})
						    )
						),
						React.DOM.header( {className:"cc-container cc-secondary"}, 
							React.DOM.div( {className:"clearfix"}, 
					            React.DOM.h1(null, carName)    
					        ),
					        React.DOM.div( {className:"cc-price-box"}, 
					            pricing,
					            promoBtn,
					            monthlyRate
					        )
						)
					)
				);
			}
		}
	);
	
	// Create the monthly rate disclaimer
	var DisclaimerOverlay = React.createClass(
		{displayName: 'DisclaimerOverlay',
			mixins:[be.marlon.utils.Mixins.Mount],
			
			/**
			 * Handles clicking on the close button 
			 */
			closeClickHandler:function()
			{
				this.setState({visible:false});
			},
			
			/**
			 * Handles clicking on the document 
			 */
			docClickHandler:function()
			{
				this.closeClickHandler();
			},
			
			/**
			 * Return the initial state 
			 */
			getInitialState:function()
			{
				return {visible:false, top:0, left:0};
			},
			
			/**
			 * Method which checks when the component did update 
			 */
			componentDidUpdate:function()
			{
				if(this.state.visible)
				{
					$(document).on('click', this.docClickHandler);
				}
				else
				{
					$(document).off('click', this.docClickHandler);
				}
			},
			
			/**
			 * Called when the component is about to be unmounted 
			 */
			componentWillUnmount:function()
			{
				$(document).off('click', this.docClickHandler);
			},
			
			/**
			 * React mandatory render class 
			 */
			render:function()
			{
				
				var table = null,
					arr,
					content,
					i = -1;
				if(this.props.data.Calculations)
				{
					arr = this.props.data.Calculations.Calculation.map(
						function(item)
						{
							var style = {
								fontWeight:(item.Bold_Indicator === "N"?"normal":"bold"),
								fontStyle:(item.Italics_Indicator === "N"?"normal":"italic"),
								textDecoration:(item.Underline_Indicator === "N"?"none":"underline")
							};
							i++;
							return (
								React.DOM.tr( {style:style, key:i}, 
									React.DOM.td( {className:"cc-col-6"}, item.Calculation_Name),
									React.DOM.td( {className:"cc-col-6 cc-right", dangerouslySetInnerHTML:{__html:item.Calculation_Value}})
								)
							);
						}
					);
					if(arr.length > 0)
					{
						table = (
							React.DOM.table( {className:"cc-col-12 cc-border"}, 
								React.DOM.tbody(null, 
									arr
								)
							)
						);
					}
				}
				if(table)
				{
					content = (
						React.DOM.div( {className:"cc-cols"}, 
                            React.DOM.div( {className:"cc-col cc-col-12"}, 
                                React.DOM.p(null, React.DOM.strong(null, this.props.data.Product_Name))
                            ),
                            React.DOM.div( {className:"cc-col cc-col-5"}, 
                                table
                            ),
                            React.DOM.div( {className:"cc-col cc-col-7", dangerouslySetInnerHTML:{__html:this.props.data.Legal_Text_Value}})
                        )
					);
				}
				else
				{
					content = (
						React.DOM.div( {className:"cc-cols"}, 
                            React.DOM.div( {className:"cc-col cc-col-12"}, 
                                React.DOM.p(null, React.DOM.strong(null, this.props.data.Product_Name))
                            ),
                            React.DOM.div( {className:"cc-col cc-col-12", dangerouslySetInnerHTML:{__html:this.props.data.Legal_Text_Value}})
                        )
					);
				}
				return (
					React.DOM.section( {style:{"display":(this.state.visible?"block":"none"), "top":this.state.top + "px", "left":this.state.left + "px"}, className:"cc-popup clearfix cc-disclaimer"}, 
                        React.DOM.div( {className:"cc-contents clearfix"}, 
                            content,
                            React.DOM.a( {title:"Close", className:"cc-icon-close", onClick:this.closeClickHandler}, "x")
                        )
                    )
				);
			}
		}
	);
})();
