/** @jsx React.DOM */
(function() {
var ui = be.marlon.ui,
    bt = be.marlon.Brighttag;

    // Instantiate the specContainer class
    ui.SpecContainer = React.createClass(
        {displayName: 'SpecContainer',
            mixins:[be.marlon.utils.Mixins.Height, be.marlon.utils.Mixins.Mount],
            _container:null,
            _primaryButtonContainer:null,
            _qrSection:null,
            _equipmentSheet:null,
            _techSpecSheet:null,
            _ctaBTNList:null,
            
            /**
			 * Method which prepares the qr code 
			 */
			prepareQRC:function()
			{
				if(!this._qrSection)return;
				this._qrSection.prepareQRC();
			},
						
			/**
			 * Method which updates the qr code 
			 */
			updateQRC:function(url, code)
			{
				if(!this._qrSection)return;
				this._qrSection.updateQRC(url, code);
			},
			
			/**
			 * Method which hides all CTA loaders 
			 */
			hideCTALoaders:function()
			{
				var arr = this._ctaBTNList.getData(),
					iL = arr.length,
					i = 0;
				for(; i < iL; i++)
				{
					arr[i].hideLoader();
				}
			},
			
			/**
			 * Method which resets the CTA loaders to their original value
			 */
			resetCTALoaders:function()
			{
				var arr = this._ctaBTNList.getData(),
					iL = arr.length,
					i = 0;
				for(; i < iL; i++)
				{
					arr[i].reset();
				}
			},
            
            /**
             * Method which expands the summary button container 
             */
            expandSummaryContent:function()
            {
            	var cb = _.after(2, this.stateUpdateComplete);
            	if(this._qrSection)this._qrSection.expand(true, cb);
                this._primaryButtonContainer.expand(true, cb);
            },
            
            /**
             * Method which collapses the summary button container 
             */
            collapseSummaryContent:function()
            {
            	var cb = _.after(2, this.stateUpdateComplete);
            	if(this._qrSection)this._qrSection.collapse(true, cb);
                this._primaryButtonContainer.collapse(true, cb);
            },
            
            /**
             * Method which navigates back to the first step available 
             */
            resetNavigatedContainer:function()
            {
            	// Animate the container
                this._container.navigate(0, true);
                // Select the correct tab in the navigation
                var ref = "naviContainer";
                ref = this.refs[ref];
				if(ref)ref.reset();
            },
            
            /**
             * Clicking on the navigation 
             */
            naviClickHandler:function(item)
            {
                var step = item.props.key,
                    controller = this.props.controller;

                // Animate the container
                this._container.navigate(step, true);
                // Determine what data to load
                switch(step)
                {
                    case 0:
                        // Track click on your specifications tab
                        bt.track({
                            componentname: 'carconfig',
                            action: 'cc_action',
                            value: 'your-specifications'
                        });
                    break;

                    case 1:
                    	controller.removeEventListener(be.marlon.Service.SPECS_LOADED, this.specsLoadedHandler);
                        controller.addEventListener(be.marlon.Service.SPECS_LOADED, this.specsLoadedHandler);
                        controller.loadSpecifications();

                        // Track click on technical specifications tab
                        bt.track({
                            componentname: 'carconfig',
                            action: 'cc_action',
                            value: 'tech-specification'
                        });
                    break;

                    case 2:
                    	controller.removeEventListener(be.marlon.Service.STANDARD_EQUIPMENT_LOADED, this.equipmentLoadedHandler);
                        controller.addEventListener(be.marlon.Service.STANDARD_EQUIPMENT_LOADED, this.equipmentLoadedHandler);
                        controller.loadStandardEquipment();

                        // Track click on equipment tab
                        bt.track({
                            componentname: 'carconfig',
                            action: 'cc_action',
                            value: 'equipment'
                        });
                    break;
                }
                // Update the height
                this.updateHeight();
            },
            
            /**
             * Handles the loading of the equipment 
             */
            equipmentLoadedHandler:function(e)
            {
            	this.props.controller.removeEventListener(be.marlon.Service.STANDARD_EQUIPMENT_LOADED, this.equipmentLoadedHandler);
            	
                // Convert the data
                var data = this.specDataConversion(e.data[0]);
                // Update the equipment list
                this._equipmentSheet.setState({data:data}, this.stateUpdateComplete);
            },
            
            specDataConversion: function(data)
            {
                var categories = [],
                    dL = data.length,
                    i = 0;

                // Check if item exists
                for(; i < dL; i++)
                {
                    var o = data[i],
                        cat = o.Category,
                        catID = cat.ID,
                        catName = cat.Name,
                        root = cat.Root,
                        rootID = root.ID,
                        catType = root.Code,
                        parent = cat.Parent,
                        parentID = parent.ID,
                        parentCat = parent.Name,
                        level = cat.Level,
						
                        rowData = {
                            id: o.ID,
                            name: o.Name,
                            value: (o.Value)?o.Unit?o.Value.replace(o.Unit, ''):o.Value: '',
                            unit: (o.Unit)?o.Unit:''
                        },
                        currentCategory = null,
                        subCategory = null,
                        rootCategory = null,
                        j;
                        
					//if(o.Name.indexOf("Ablage") > -1)console.log(o);

                    if(level === 1)
                    {
                        for(j = 0; j < categories.length; j++)
                        {
                            if(categories[j].id == catID)
                            {
                                currentCategory = categories[j];
                                break;
                            }
                        }

                        // Doesn't exist
                        if(!currentCategory)
                        {
                            currentCategory = {
                                id: catID,
                                name: catName,
                                rows: [],
                                subCats: []
                            };

                            // Add the row data to array
                            currentCategory.rows.push(rowData);

                            // Add the category to the list
                            categories.push(currentCategory);
                        }
                        else
                        {
                            // Add the row data to array
                            currentCategory.rows.push(rowData);
                        }
                    }
                    
                    else if(level > 1)
                    {
                        // Check if rootCategory is already assigned
                        for(j = 0; j < categories.length; j++)
                        {
                            if(categories[j].id == rootID) {
                                rootCategory = categories[j];
                                break;
                            }
                        }

                        // If root category isn't assigned yet, assign it to the list
                        if(!rootCategory)
                        {
                            rootCategory = {
                                id: rootID,
                                name: (root) ? root.Name : cat.Name,
                                rows: [],
                                subCats: []
                            };

                            categories.push(rootCategory);
                        }

                        // Push sub categories in root category
                        for(j = 0; j < rootCategory.subCats.length; j++)
                        {
                            if(rootCategory.subCats[j].id == catID) {
                                subCategory = rootCategory.subCats[j];
                                break;
                            }
                        }

                        // If not assigned yet, push it to the sub category list
                        if(!subCategory)
                        {
                            subCategory = {
                                id: catID,
                                name: catName,
                                rows: []
                            };

                            rootCategory.subCats.push(subCategory);
                        }

                        // Add the row data to array
                        subCategory.rows.push(rowData);
                    }

                }

                return categories;
            },

            equipmentSheetMountHandler: function(item)
            {
                this._equipmentSheet = item;
            },

            /**
             * Handles the loading of the specifications 
             */
            specsLoadedHandler:function(e)
            {
                //console .log("Specifications loaded: ", e);
                this.props.controller.removeEventListener(be.marlon.Service.SPECS_LOADED, this.specsLoadedHandler);
                
                // Convert the data
                var data = this.specDataConversion(e.data[0]);

                // Set that converted data into the component state
                this._techSpecSheet.setState({data:data}, this.stateUpdateComplete);
            },
            
            /**
             * Handles the state change of the variable elements 
             */
            stateUpdateComplete:function()
            {
            	// Update the height
                this.updateHeight();
            },
            
            techSpecSheetMountHandler: function(item)
            {
                this._techSpecSheet = item;
            },

            /**
             * Handles the mounting of the summary container 
             */
            primaryButtonContainerMountHandler:function(item)
            {
                this._primaryButtonContainer = item;
            },
            
            /**
             * Handles the mounting of the qr section 
             */
            qrSectionMountHandler:function(item)
            {
            	this._qrSection = item;
            },
            
            /**
             * Handles the mounting of thecontainer 
             */
            containerMountHandler:function(item)
            {
                this._container = item;
            },
            
            /**
             * Handles clicking on a summary button 
             */
            buttonClickHandler:function(item, e)
            {
            	e.preventDefault();
            	var $t = $(e.target),
            		cta = $t.attr('data-link') ? $t : $t.parent(),
            		utils = be.marlon.utils,
					ctaType = cta.attr('data-link'),
					ctaTypes = utils.ctaTypes,
					shouldActionSave = false;
				
				switch(ctaType)
				{
					//case ctaTypes.SAVE:
					case ctaTypes.SEND:
					case ctaTypes.PRINT:
					case ctaTypes.DOWNLOAD:
						shouldActionSave = true;
					break;
				}
            	
            	// Check if the button requires a carconfig save
            	if(shouldActionSave)
            	{
            		item.showLoader();
            		PubSub.publishSync(utils.SUMMARY_BTN_CLICKED, $t);
            	}
            	else
            	{
            		PubSub.publishSync(utils.CTA_CLICKED, $t);
            	}
            	//PubSub.publish(be.marlon.utils.CTA_CLICKED, t);
                // Call the function
                /*var ev = eval,
                    href = $(e.target).data('link'),
                    f = ev(href);
                if(typeof f == "function")f();*/
            },
            
            /**
             * Default the props 
             */
            getDefaultProps:function()
            {
                return {
                    config:null,
                    controller:null
                };
            },
            
            /**
             * Method which is called when the component is about to be mounted 
             */
            componentWillMount:function()
            {
            	this._ctaBTNList = new ui.List(); 
            },
            
            /**
             * The react render function for this class 
             */
            render:function()
            {
                // Create the Container elements
                var SpecSheet = ui.SpecSheet,
                    TechSpecSheet = ui.TechSpecSheet,
                    EquipmentSheet = ui.EquipmentSheet,
                    HContainer = ui.HContainer,
                    summaryContent = this.props.summaryContent,
                    footer,
                    pricing = null,
                    utils = be.marlon.utils,
                    dic = utils.Dictionary,
                    config = this.props.configuration,
					DisclaimerSection = ui.DisclaimerSection,
					EcoSection = ui.EcoSection,
                    elements = [];
                
                // Add the specification sheet as first item
                elements.push(SpecSheet( {key:0, navigate:this.props.navigate, specProps:this.props.specProps, config:config, controller:this.props.controller} ));
                
                // Add the technical specifications as second item
                elements.push(TechSpecSheet( {key:1, componentDidMount:this.techSpecSheetMountHandler}));
                
                // Add the standard equipment as thirtiary item
                elements.push(EquipmentSheet( {key:2, componentDidMount:this.equipmentSheetMountHandler}));
                                
                // The top elements in the HList
                var headElements = [
                    Header( {key:0, hasSubmodels:this.props.hasSubmodels, btnList:this._ctaBTNList, navigate:this.props.navigate, buttons:summaryContent?summaryContent.secondary:[], buttonClickHandler:this.buttonClickHandler, settings:this.props.settings}),
                    (this.props.settings.showQRCode?QRCode( {key:1, componentDidMount:this.qrSectionMountHandler}):null),
                    PrimaryButtonContainer( {key:2, btnList:this._ctaBTNList, buttons:summaryContent?summaryContent.primary:[], buttonClickHandler:this.buttonClickHandler, componentDidMount:this.primaryButtonContainerMountHandler, settings:this.props.settings}),
                    NaviContainer( {naviClickHandler:this.naviClickHandler, key:3, ref:"naviContainer"}),
                    (this.props.showMonthlyRate?MonthlyRate( {key:4, monthlyRateToggleHandler:this.props.monthlyRateToggleHandler, monthlyRateToggleDefaultValue:this.props.monthlyRateToggleDefaultValue}):null)
                ];
                
                // The footer element in the HList
                if(config)
                {
                    if(utils.hasPrice)
                    {
                        var activePromos = this.props.controller.getActivePromotions(),
                            basePrice,
                            savings,
                            disclaimers;
                        if(activePromos && activePromos.length > 0)
                        {
                            // Populate the disclaimers
                            disclaimers = activePromos.map(
                                function(item)
                                {
                                    return React.DOM.a( {key:item.ID, className:"cc-number cc-icon"}, item.Index);
                                }
                            );
                            
                            basePrice = (
                                React.DOM.div( {className:"cc-baseprice"}, 
                                    dic.getLabel('priceWithoutPromotions'),
                                    React.DOM.span( {className:"cc-price"}, utils.formatPrice(config.TotalPrice,true))
                                )
                            );
                            savings = (
                                React.DOM.div( {className:"cc-promo-price cc-savings"}, 
                                    disclaimers,
                                    dic.getLabel('youSave'),
                                    React.DOM.strong( {className:"cc-price"}, " " + utils.formatPrice(config.TotalPriceDiscount,true))
                                )
                            );
                        }
                        pricing = (
                        	React.DOM.div( {className:"cc-pricing"}, 
                                basePrice,
                                savings,
                                React.DOM.div( {className:"cc-price-total"}, 
                                    dic.getLabel('finalPrice'),
                                    React.DOM.span( {className:"cc-price"}, utils.formatPrice((config.TotalPrice - config.TotalPriceDiscount), true))
                                )
                            )
                        );
                    }
                    var disclaimer = this.props.disclaimerData?DisclaimerSection( {data:this.props.disclaimerData}):null,
                    	eco = this.props.eco.length > 0?EcoSection( {data:this.props.eco, images:this.props.settings.ecoImages}):null;
                    if(eco || pricing || disclaimer)
                    {
	                    footer = (
	                            React.DOM.div( {className:"container cc-container"}, 
	                                React.DOM.footer(null, 
	                                	pricing,
	                                    disclaimer,
	                                    eco
	                                )
	                            )
	                        );
	                }
                } 
                
                return(
                    React.DOM.section( {className:"cc-specs cc-abs-item"}, 
                        HContainer( {id:"SpecContainer", componentDidMount:this.containerMountHandler, top:headElements, elements:elements, bottom:footer, updateHeight:this.updateHeight})
                    )
                );
            }
        }
    );
    
    /**
     * Creates a CTA button 
     */
    var CTAButton = React.createClass(
    	{displayName: 'CTAButton',
    		mixins:[be.marlon.utils.Mixins.Mount],
    		// Due to the asynchronous running of the setState, we cannot rely solely on the state.showLoader property...
    		_showLoader:false,
    		_labelTimeOut:0,
    		_popupTimeout:0,
    		showLoader:function()
    		{
    			if(this._showLoader || this.props.primary)return;
    			var instance = this;
    			this.clear();
    			this._showLoader = true;
    			this.setState({showLoader:true});
    			this._labelTimeOut = setTimeout(
    				function()
    				{
    					instance.setState({label:be.marlon.utils.Dictionary.getLabel('ctaLoading').replace("{CTA}", instance.props.title)});
    				},
    				1500
    			);
    		},
    		
    		hideLoader:function()
    		{
    			if(!this._showLoader || this.props.primary)return;
    			var instance = this;
    			this.clear();
    			this._showLoader = false;
    			this.setState({showLoader:false, showTooltip:true, label:be.marlon.utils.Dictionary.getLabel('ctaReady').replace("{CTA}", this.props.title)},
    				function()
    				{
    					instance._popupTimeout = setTimeout(
    						instance.fadeOutTooltip,
    						4500);
    				}
    			);
    		},
    		
    		reset:function()
    		{
    			if(this.props.primary)return;
    			this.clear();
    			this._showLoader = false;
    			this.setState({showLoader:false, label:this.props.title});
    		},
    		
    		/**
    		 * Cleans up animations & timeouts 
    		 */
    		clear:function()
    		{
    			var popup = "popup";
				popup = $(this.refs[popup].getDOMNode());
				popup.stop();
    			clearTimeout(this._labelTimeOut);
    			clearTimeout(this._popupTimeout);
    		},
    		
    		/**
    		 * Method which fades out the tooltip 
    		 */
    		fadeOutTooltip:function()
    		{
    			var instance = this,
    				popup = "popup";
				popup = $(instance.refs[popup].getDOMNode());
				popup.fadeOut(
					500,
					function()
					{
						instance.setState({showTooltip:false});
					} 
				);
    		},
    		
    		/**
    		 * Handles the clicking on the button 
    		 */
    		clickHandler:function(e)
    		{
    			this.props.buttonClickHandler(this, e);
    			if(this.state.showTooltip)
    			{
    				this.clear();
    				this.fadeOutTooltip();
    			}
    		},
    		
    		/**
			 * Returns the default state of the React component 
			 */
			getInitialState:function(e)
			{
				return {showLoader:false, label:"", showTooltip:false};
			},
			
			/**
			 * Method which handles when the component is about to be mounted 
			 */
			componentWillMount:function(e)
			{
				this.setState({label:this.props.title});
			},
    		
    		/**
             * The react render function for this class 
             */
            render:function()
            {
            	var icon = this.props.icon;
            	
            	if(this.state.showLoader)
            	{
            		icon = React.DOM.i( {ref:"ldr", className:this.props.primary?"cc-primary":"cc-secondary"});
            	}
            	else
            	{
            		icon = (icon && icon !== "")?React.DOM.i( {ref:"icon", className:icon}):null;
            	}
            	
            	return( 
            		React.DOM.div( {className:"cc-action clearfix"}, 
                    	React.DOM.a( {className:"btn cc-btn" + (this.props.primary?' btn-dark':' btn-grey') + ((icon && !this.state.showLoader)?"":" no-icon"), 
	                    	onClick:this.clickHandler, 
	                    	'data-link':this.props.jsfunction, 
	                    	href:this.props.href,
	                    	target:this.props.target}, this.state.label,icon),
	                    React.DOM.section( {style:{"display":(this.state.showTooltip?"block":"none")}, ref:"popup", className:"cc-popup clearfix"}, 
							React.DOM.div( {className:"cc-contents clearfix"}, 
								React.DOM.div(null, be.marlon.utils.Dictionary.getLabel('ctaReadyTooltip').replace("{CTA}", this.props.title))
							)
						)
	                )
                );
            }
    	}
    );
    
    /**
     * Header for the specification sheet container
     */ 
    var Header = React.createClass(
        {displayName: 'Header',
            getIcon:function(cl)
            {
                switch(cl)
                {
                    case "PRINT":
                        return "cc-icon icon-print";
                    case "PDF":
                        return "cc-icon icon-file-pdf";
                }
                return "";
            },
            /**
             * The react render function for this class 
             */
            render:function()
            {
                var dic = be.marlon.utils.Dictionary,
                    ChangeModelButton = ui.ChangeModelButton,
                    instance = this,
                    i = -1,
                    aButtons = this.props.buttons.map(
                        function(item)
                        {
                        	i++;
                        	return(
                        		CTAButton( 
                        			{primary:false,
                        			buttonClickHandler:instance.props.buttonClickHandler,
                        			icon:instance.getIcon(item["class"]), 
                        			jsfunction:item.jsfunction,
                        			target:item.target?item.target:"_self",
                        			key:i,
                        			href:item.href,
                        			title:item.title})
                        	);
                            /*var icon = instance.getIcon(item["class"]); 
                            icon = (icon !== "")?<i className={icon}></i>:null;
                            return( 
                                <a className={"btn btn-grey cc-btn" + (icon?"":" no-icon")} onClick={this.props.buttonClickHandler} data-link={item.jsfunction} target={item.target?item.target:"_self"} key={i} href={item.href}>{item.title}{icon}</a>
                            );*/
                        }
                    );
                this.props.btnList.setData(aButtons);
                
                // Add the change car button to
                if(!this.props.settings.hideChangeModelButton)
                {
                	aButtons.push(
                	    ChangeModelButton( {hasSubmodels:this.props.hasSubmodels, key:aButtons.length, navigate:this.props.navigate})
                	);
                }  
                
                return(
                    React.DOM.div( {className:"container cc-container"}, 
                        React.DOM.header( {className:"cc-secondary"}, 
                            React.DOM.h1(null, dic.getLabel('yourConfiguration')),
                            React.DOM.div( {className:"cc-actions" + ((be.marlon.utils.smSlave || be.marlon.utils.smMaster)?' cc-sm-slave':'')}, 
                                aButtons
                            )
                        )
                    )
                );
            }
        }
    );
    
    /**
     * The monthly rate disable container 
     */
    var MonthlyRate = React.createClass(
    	{displayName: 'MonthlyRate',
    		// ###########################
			// Private methods
			// ###########################
			
			/**
			 * Method which handles the clicking on the checkbox 
			 */
			clickHandler:function()
			{
				this.setState({selected:!this.state.selected}, this.stateSetCompleteHandler);
			},
			
			/**
			 * Method which handles the completion of the state set 
			 */
			stateSetCompleteHandler:function()
			{
				this.props.monthlyRateToggleHandler(this.state.selected);
			},
			
			// ###########################
			// Public methods
			// ###########################
						
			// ###########################
			// Required react methods
			// ###########################
    		
    		/**
    		 * Method called before the initial render 
    		 */
    		componentWillMount:function()
    		{
    			this.setState({selected:this.props.monthlyRateToggleDefaultValue});
    		},
    		
			/**
			 * Returns the default state of the React component 
			 */
			getInitialState:function(e)
			{
				return {selected:true};
			},
			
    		/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var dic = be.marlon.utils.Dictionary;
				return(
					React.DOM.div( {className:"cc-box cc-box-note"}, 
				        React.DOM.div( {className:"cc-contents"}, 
				            React.DOM.label( {onClick:this.clickHandler}, React.DOM.span( {className:"cc-checkbox cc-checkbox-small" + (this.state.selected?' cc-checked':'')}),dic.getLabel('showMonthlyRates')),
				            React.DOM.p(null, dic.getLabel('showMonthlyRatesDescription'))
				        )
				    )
				);
			}
    	}
    );
    
    /**
     * The QRCode container 
     */
    var QRCode = React.createClass(
    	{displayName: 'QRCode',
    		mixins:[be.marlon.utils.Mixins.Mount],
    		
    		_preLoader:null,
    		_collapsed:false,
    		_$this:null,
    		_height:0,
    		_cb:null,
			
			// ###########################
			// Private methods
			// ###########################
			
			/**
			 * Method which handles the mounting of the preloader 
			 */
			preLoaderMountHandler:function(item)
			{
				this._preLoader = item;
			},
				
			/**
			 * Method which handles the animate out event from the collapsing of the container 
			 */
			animateOutComplete:function()
			{
				this._$this.hide();
				if(this._cb)this._cb();
			},
						
			// ###########################
			// Public methods
			// ###########################
			
			/**
			 * Method which expands the button container 
			 */
			expand:function(animate, cb)
			{
				if(!this._collapsed) return;
				this._collapsed = false;
				this._$this.show();
				if(animate)this._$this.animate({height:this._height}, {duration:500, queue:false, complete:cb});
				else this._$this.height(this._height);
			},
				
			/**
			 * Method which collapses the button container 
			 */
			collapse:function(animate, cb)
			{
				if(this._collapsed) return;
				this._cb = cb;
				this._collapsed = true;
				if(animate)this._$this.animate({height:0}, {duration:500, queue:false, complete:this.animateOutComplete});
				else{
					this._$this.height(0);
					this._$this.hide();
				} 
			},
			
			/**
			 * Method which prepares the qr code 
			 */
			prepareQRC:function()
			{
				// Show the preloader
				this.setState({img:'', code:'', showPreLoader:true});
			},
			
			/**
			 * Method which updates the qr code 
			 */
			updateQRC:function(url, code)
			{
				// Fill in the properties and hide the preloader
				this.setState({img:url, code:code, showPreLoader:false});
			},
						
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Method called when the component did update 
			 */
			componentDidUpdate:function()
			{
				if(this.state.showPreLoader)
				{
					this._preLoader.show();
				}
				else
				{
					this._preLoader.hide();
				}
			},
			
			/**
			 * Returns the default state of the React component 
			 */
			getInitialState:function(e)
			{
				return {img:"", code:"", visible:false, showPreLoader:false};
			},
			
			/**
			 * Method called when the component mounted for the first time 
			 */
			componentDidMount:function()
			{
				this._$this = $(this.getDOMNode());
				this._height = this._$this.outerHeight();
				this.collapse(false);
			},
    		
    		/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var dic = be.marlon.utils.Dictionary,
					PreLoader = ui.PreLoader;
				return(
					React.DOM.div( {className:"container cc-container cc-qr-section"}, 
						React.DOM.div( {className:"cc-qr"}, 
							React.DOM.div( {className:"cc-qr-image"}, 
								PreLoader( {size:be.marlon.utils.SMALL, componentDidMount:this.preLoaderMountHandler}),
				            	React.DOM.img( {src:this.state.img})
				            ),
				            React.DOM.header(null, 
				                React.DOM.div(null, dic.getLabel('qrTitle')),
				                React.DOM.div( {className:"cc-code"}, this.state.code)
				            )
				        ),
				        React.DOM.div( {className:"cc-description"}, 
				        	React.DOM.div( {className:"cc-summary"}, dic.getLabel('qrDescription'))
				        )
					)
				);
			}
    	}
    );
    
    /**
     * This container contains the primary buttons vizualised on the summary screen 
     */
    var PrimaryButtonContainer = React.createClass(
        {displayName: 'PrimaryButtonContainer',
			mixins:[be.marlon.utils.Mixins.Mount],
			_height:0,
			_collapsed:false,
			_$this:null,
			_cb:null,
				
			/**
			 * Method which expands the button container 
			 */
			expand:function(animate, cb)
			{
				if(!this._collapsed) return;
				this._cb = cb;
				this._collapsed = false;
				this._$this.show();
				if(animate)this._$this.animate({height:this._height}, {duration:500, queue:false, complete:this.animateInComplete});
				else this._$this.height("100%");
			},
				
			/**
			 * Method which collapses the button container 
			 */
			collapse:function(animate, cb)
			{
				if(this._collapsed) return;
				this._cb = cb;
				this._collapsed = true;
				if(animate)this._$this.animate({height:0}, {duration:500, queue:false, complete:this.animateOutComplete});
				else{
					this._$this.height(0);
					this._$this.hide();
				}
			},
				
			/**
			 * Method which handles the animate out event from the collapsing of the container 
			 */
			animateOutComplete:function()
			{
				this._$this.hide();
				if(this._cb)this._cb();
			},
				
			/**
			 * Method which handles the animat in event from the expanding of the container 
			 */
			animateInComplete:function()
			{
				this._$this.height("100%");
				if(this._cb)this._cb();
			},
				
			/**
			 * Method called when the component mounted for the first time 
			 */
			componentDidMount:function()
			{
				this._$this = $(this.getDOMNode());
				this._height = this._$this.height();
				this.collapse(false);
			},
				
			/**
			 * Method called when the component updated 
			 */
			componentDidUpdate:function()
			{
				var h = this._$this.height();
				this._$this.css('height', '100%');
				this._height = this._$this.height();
				this._$this.height(h);
			},
				
			/**
			 * Method which checks if the component should update 
			 */
			shouldComponentUpdate:function(nextProps, nextState)
			{
				var utils = be.marlon.utils,
					update = true;
				if(utils.checkArrays(nextProps.buttons, this.props.buttons))
				{
					update = false;
				}
				return update;
			},
				
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var aButtons = [],
					i = 0,
					arr = this.props.buttons,
					o,
					aSEle = [],
					aElements = [],
					btn,
					aBtn = [],
					iL = arr.length;
				for(; i < iL; i++)
				{
					//<a className="btn btn-dark cc-btn" onClick={this.props.buttonClickHandler} data-link={o.jsfunction} target={o.target?o.target:"_self"} key={i} href={o.href}>{o.title}</a>
					o = arr[i];
					btn = CTAButton( 
                    			{jsfunction:o.jsfunction,
                    			target:o.target?o.target:"_self",
                    			href:o.href,
                    			primary:true,
                    			buttonClickHandler:this.props.buttonClickHandler,
                    			title:o.title});
					aBtn.push(btn);
					aSEle.push(
						React.DOM.div( {key:i, className:"cc-col cc-col-4"}, 
							btn,
							React.DOM.p(null, o.subtitle)
						)
					);
					if((i+1)%3 === 0)
					{
						aElements.push(
							React.DOM.div( {key:(i+1)/3, className:"cc-row clearfix"}, aSEle)
						);
						aSEle = [];
					}
				}
				this.props.btnList.setData(aBtn);
				if(aSEle.length > 0)
				{
					aElements.push(
						React.DOM.div( {key:(i+1)/3, className:"cc-row clearfix"}, aSEle)
					);
				}
				return(
					React.DOM.div( {className:"cc-panel-grey" + (((be.marlon.utils.smSlave || be.marlon.utils.smMaster) && !this.props.settings.salesmanShowCTAS)?' cc-sm-slave':'')}, 
						React.DOM.div( {className:"container cc-container"}, 
							React.DOM.div( {className:"cc-cols clearfix"}, 
								React.DOM.div( {className:"cc-row clearfix"}, 
			                        aElements
			                    )
							)
						)
					)
				);
			}
		}
    );
    
    var NaviContainer = React.createClass(
        {displayName: 'NaviContainer',
            _list:null,
            clickHandler:function(item)
            {
                _list.select(item.props.key);
                this.props.naviClickHandler(item);
            },
            
            /**
             * Method which resets the selected navigation element to the first one 
             */
            reset:function()
            {
            	// Select first element in the list
                _list.select(0);
            },
            
            /**
             * Method called right before the element will render 
             */
            componentWillMount:function(rootNode)
            {
                _list = new ui.List();
            },
            
            /**
             * Method called after the element did render 
             */
            componentDidMount:function()
            {
                this.reset();
            },
            
            /**
             * The react render function for this class 
             */
            render:function()
            {
                var dic = be.marlon.utils.Dictionary,
                    navi = [
                        NaviEle( {key:0, label:dic.getLabel('yourSpecifications'), clickHandler:this.clickHandler}),
                        NaviEle( {key:1, label:dic.getLabel('technicalSpecifications'), clickHandler:this.clickHandler}),
                        NaviEle( {key:2, label:dic.getLabel('equipment'), clickHandler:this.clickHandler})
                    ];
                _list.setData(navi);
                
                return(
                    React.DOM.div( {className:"container cc-container"}, 
                        React.DOM.div( {className:"filter-bar cc-filter-bar"}, 
                            React.DOM.div( {className:"btn-group"}, 
                                navi
                            )
                        )
                    )
                );
            }
        }
    );
    
    /**
     * Header navigation element 
     */
    var NaviEle = React.createClass(
        {displayName: 'NaviEle',
            mixins:[be.marlon.utils.Mixins.Mount],
            clickHandler:function(e)
            {
                this.props.clickHandler(this);
            },
            
            /**
             * Returns the default state of the grade feature 
             */
            getInitialState:function(e)
            {
                return {selected:false};
            },
            
            /**
             * The react render function for this class 
             */
            render:function()
            {
                return(
                    React.DOM.a( {className:"btn btn-grey" + (this.state.selected?" active":""), onClick:this.clickHandler}, this.props.label)
                );
            }
        }
    );
})();
