/** @jsx React.DOM */
(function() {
    
    /**
     * Bottom container component, this contains the logic for rendering the:
     * -Submodels
     * -Bodytypes
     * -Engines and grades
     */
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag;
	// Create the bottomcontainer class
	function BottomContainer()
	{
		// Global variables
		var _dic,
			_instance,
			_utils = be.marlon.utils,
			
			_step = -1,
			
			_hasPromo = false,
			
			_mainContainer,
			_secondaryContainer, // Contains logic for navigating between hte submodels, bodytypes, enginegrades
			_engineGrades,
			_specContainer,
			_financing,
			_insurance,
			_header,
			_filterStep,
			_proAceStep;
		
		// ###########################
		// Private methods
		// ###########################
				
		/**
		 * Method called when the header has been mounted 
		 */
		function headerMountHandler(item)
		{
			_header = item;
		}
		
		/**
		 * Method which handles the mounting of the filterstep 
		 */
		function filterStepMountHandler(item)
		{
			_filterStep = item;
		}
		
		/**
		 * Method which handles the mounting of the proace step 
		 */
		function proaceStepMountHandler(item)
		{
			_proAceStep = item;
		}
		
		/**
		 * Method called when the main container has been mounted 
		 */
		function mainContainerMountHandler(item)
		{
			_mainContainer = item;
		}
		
		/**
		 * Method called when the hContainer has been mounted 
		 */
		function secondaryContainerMountHandler(item)
		{
			_secondaryContainer = item;
		}
		
		/**
		 * Method which handles the mounting of the engineGrades container 
		 */
		function engineGradesMountHandler(item)
		{
			_engineGrades = item;
		}
		
		/**
		 * Method which handles the mounting of the specification sheet 
		 */
		function specContainerMountHandler(item)
		{
			_specContainer = item;
		}
		
		/**
		 * Method which handles the mounting of the financing container 
		 */
		function financingMountHandler(item)
		{
			_financing = item;
		}
		
		/**
		 * Method which handles the mounting of the insurance calculator 
		 */
		function insuranceMountHandler(item)
		{
			_insurance = item;
		}
		
		/**
		 * Method which handles the clicking on the compare grades button 
		 */
		function compareGradesClickHandler(e)
		{
			// Show the compare grades
			_engineGrades.showCompareGrades();

			//console.log('compare grades clicked');

			// Track click on compare grades button
            bt.track({
                componentname: 'carconfig',
                action: 'cc_action',
                value: 'compare-grade'
            });
		}
		
		/**
		 * Method which handles clicking on the reset button of the pro ace filterstep 
		 */
		function resetProAceFiltersClickHandler(e)
		{
			// TODO RESET
			_proAceStep.reset(_proAceStep.getDefaultCar());
		}
		
		/**
		 * Method which handles the updating of the container height 
		 */
		function containerHeightUpdated()
		{
			_instance.props.heightUpdated($(_instance.getDOMNode()).outerHeight());
		}
		
		function handleSimulateProAceSlider(msg, data) {
            var parts = data.split("."),
                sliderCode = parts[0],
                sliderKey = parts[1],
                sliderValueInternalID = parts[2],
                carIndex = parts[3];
            if (carIndex !== "") {
                carIndexStrings = carIndex.split(',');
                carIndex = [];
                $.each(carIndexStrings, function(i, cis) {
                    carIndex.push(parseInt(cis));
                });
            } else {
                carIndex = "";
            }
            _proAceStep.simulateUpdateSlider(sliderCode, parseInt(sliderKey), sliderValueInternalID, carIndex);
        }
        
        /**
         * Method which handles the event when the iFrame is resized 
         */
        function iFrameResizeHandler(data)
        {
        	var r;
        	// Check which iFrame did update
        	if(data.iframe == _financing.getIFrame()[0])
        	{
        		r = _financing;
        	}
        	else if(data.iframe == _insurance.getIFrame()[0])
        	{
        		r = _insurance;
        	}
        	//r.setHeight(data.height);
        	
        	//console.log("iFrameResizeHandler: ", data.height, " || ", r.getIFrame().height(), " || ", $("body").height());
        }
        
        /**
         * Method which handles the callback from within the iFrame 
         */
        function iFrameMessageCallback(data)
        {
        	//console.log("iFrameMessageCallback: ", data);
        	
        	var msg = data.message,
        		r;
        	// Check which iFrame did update
        	if(data.iframe == _financing.getIFrame()[0])
        	{
        		r = _financing;
        	}
        	else if(data.iframe == _insurance.getIFrame()[0])
        	{
        		r = _insurance;
        	}
        	
        	// Check which action should be done
        	if(msg.indexOf("height:") !== -1)
        	{
        		var h = Number(data.message.replace("height:",""));
	        	r.setHeight(h);
        	}
        	else if(msg.indexOf("scroll:") !== -1)
        	{
        		var anch = Number(msg.replace("scroll:","")),
        			top = anch + $(r.getDOMNode()).offset().top;
        		// If the carconfig is also in an iFrame, propagate the scroll to position
        		if('parentIFrame' in window)
				{
					window.parentIFrame.sendMessage("scroll:" + top, '*');
				}
				else
				{
					window.scrollTo(0, top - 158); // 158 is the height of the top flap which would else overlap the element
				}
        	}
        }
        
        /**
    	 * Retrieve the disclaimer from the array with objects 
 		 * @param o:Object
    	 */
    	function getDisclaimer(o)
		{
			var i = 0,
				iLength = o.Labels.length;
			for(i; i < iLength; i++)
			{
				if(o.Labels[i].Code === "DISCLAIMER")
				{
					return o.Labels[i].Value;
				}
			}
			return "";
		}
			
		// ###########################
		// Public methods
		// ###########################
		
		/**
		 * Method which resets the submodels 
		 */
		this.resetSubModels = function()
		{
			if(!this.props.hasSubmodels)return;
			var ref = "submodels";
			this.refs[ref].reset();
		};
		
		/**
		 * Method which hides all CTA loaders 
		 */
		this.hideCTALoaders = function()
		{
			_specContainer.hideCTALoaders();
		};
		
		/**
		 * Method which resets the CTA loaders to their original value 
		 */
		this.resetCTALoaders = function()
		{
			_specContainer.resetCTALoaders();
		};
		
		/**
		 * Method which prepares the qr code 
		 */
		this.prepareQRC = function()
		{
			_specContainer.prepareQRC();
		};
		
		/**
		 * Method which updates the qr code 
		 */
		this.updateQRC = function(url, code)
		{
			_specContainer.updateQRC(url, code);
		};
		
		/**
		 * Returns if the proace filterstep is present 
		 */
		this.hasProAce = function()
		{
			var filterInfo = this.props.proAceFilterInfo;
			return (filterInfo.Filters.length > 0 && filterInfo.Cars.length > 0);
		};
		
		/**
		 * Returns the current selected filterstep model object 
		 */
		this.getSelectedFilterStepModel = function()
		{
			return _filterStep.getSelectedModel();
		};
		
		/**
		 * Method which resets the selected model 
		 */
		this.resetSelectedModel = function()
		{
			return _filterStep.resetSelectedModel();
		};
		
		/**
		 * Method which prepares a screen for load, basically visualizing the preloader 
		 */
		this.prepareForLoad = function(step)
		{
			var control;
			switch(step)
			{
				case _utils.ENGINE_GRADES:
					control = _engineGrades;
				break;
			}
			control.showPreLoader();
		};
		
		/**
		 * Method which animates in the correct control 
		 */
		this.navigate = function(step, animate, force)
		{
			if(step == _step && !force)return;
			_step = step;
			var style,
				mainStep,
				secondaryStep,
				showCompareGrades = false,
				showResetFilters = false;
				
			if(step !== _utils.FINANCING)_financing.clear();
			if(step !== _utils.INSURANCE)_insurance.clear();
			var hasSubmodels = this.props.hasSubmodels;
			switch(step)
			{
				case _utils.FILTERSTEP:
				 	mainStep = 0;
				 	secondaryStep = 0;
				break;
				case _utils.PROMOTIONS:
    				mainStep = 1;
				 	secondaryStep = 0;
    			break;
				case _utils.SUBMODELS:
					mainStep = _hasPromo?2:1;
					secondaryStep = 0;
					hasSubmodels = false;
				break;
				case _utils.BODYTYPES:
					mainStep = _hasPromo?2:1;
					secondaryStep = this.props.hasSubmodels?1:0;
					if(_proAceStep)showResetFilters = true;
				break;
				case _utils.ENGINE_GRADES:
					mainStep = _hasPromo?2:1;
					// Navigate to the last element in the list
					secondaryStep = _secondaryContainer.getTotalElements() - 1;
					showCompareGrades = true;
				break;
				case _utils.FINANCING:
					mainStep = _hasPromo?4:3;
					secondaryStep = _secondaryContainer.getTotalElements() - 1;
					// Load the external frame
					_financing.loadExternal();
				break;
				case _utils.INSURANCE:
					mainStep = _hasPromo?5:4;
					secondaryStep = _secondaryContainer.getTotalElements() - 1;
					// Load the external frame
					_insurance.loadExternal();
				break;
				default:
					mainStep = _hasPromo?3:2;
					secondaryStep = _secondaryContainer.getTotalElements() - 1;
			}
			
			// If the shown step is not the specification sheet, reset its navigation
			if(mainStep !== (_hasPromo?3:2))
			{
				_specContainer.resetNavigatedContainer();
			}
			
			// If it's the summary, navigate in the summary elements in the specification sheet
			if(step === _utils.SUMMARY)
			{
				_specContainer.expandSummaryContent();
			}
			else
			{
				_specContainer.collapseSummaryContent();
			}
			
			//console.log("BottomContainer navigate: ", step, " -- ", mainStep, " -- ", secondaryStep, " container elements: ", _secondaryContainer.props.elements.length);
			
			_mainContainer.navigate(mainStep, animate);
			_secondaryContainer.navigate(secondaryStep, animate);
			_header.setState({showCompareGrades:showCompareGrades, showResetFilters:showResetFilters, hasSubmodels:hasSubmodels});
			
			// Since the maincontainer does not necessarely update it's height when navigating to the proace filterstep, force it here
			if(showResetFilters)
			{
				_mainContainer.updateHeight();
			}
		};
					
		// ###########################
		// Required react methods
		// ###########################
		
		/**
		 * Method called when the component is about to be rendered 
		 */
		this.componentWillMount = function()
		{
			// Save the instance reference
			if(!_instance)_instance = this;
			if(!_dic)_dic = be.marlon.utils.Dictionary;
		};
		
		/**
		 * Method called when the component did mount 
		 */
		this.componentDidMount = function()
		{
            PubSub.subscribe("cc_simulate_proaceslider", handleSimulateProAceSlider);
            
            // Check the iFrame resize handler
            // TODO Fix iFrame resizer!
			if(typeof iFrameResize !== "undefined")
			{
				var opts = {
					checkOrigin:false,
					log:false,
					enablePublicMethods:true,
					autoResize:false,
					//heightCalculationMethod:"documentElementOffset",
					//resizedCallback:iFrameResizeHandler,//_.debounce(iFrameResizeHandler, 300)
					messageCallback:iFrameMessageCallback
				};
				// The resizedCallback is shared between all iFrames which might resize their content, thus we implement this logic
				_financing.getIFrame().iFrameResize(opts);
				_insurance.getIFrame().iFrameResize(opts);
			}
		};
		
		/**
		 * Method called when the component did update 
		 */
		this.componentDidUpdate = function(prevProps, prevState)
		{
			//console.log("BottomContainer did update");
			// if _step is bigger than 0, it means the control has been used/initialized
			if(prevProps.hasBodytype !== this.props.hasBodytype && _step > -1)
			{
				// Force the step
				this.navigate(_step, false, true);
			}
			else if(_step > -1)
			{
				// Force the step
				this.navigate(_step, false, true);
			}
		};
		
		/**
		 * Default the props 
		 */
		this.getDefaultProps = function()
		{
			return {
				submodels:[],
				bodytypes:[],
				motorizations:[],
				grades:[],
				enginePromos:[],
				gradePromos:[],
				modelData:null,
				filterData:null,
				specProps:null,
				proAceFilterInfo:{
					Filters:[],
					Cars:[]
				},
				eco:[],
				showMonthlyRate:false
			};
		};
		
		/**
		 * The react render function for this class 
		 */
		this.render = function()
		{
			var elements = [],
				sElements = [],
				promos = this.props.promotions,
				Submodels = ui.Submodels,
				BodyTypes = ui.BodyTypes,
				ProAce = ui.ProAce,
				EngineGrades = ui.EngineGrades,
				FilterTool = ui.Filtertool,
				SpecContainer = ui.SpecContainer,
				PromoScreen = ui.PromoScreen,
				HContainer = ui.HContainer,
				DisclaimerSection = ui.DisclaimerSection,
				ExternalFrame = ui.ExternalFrame,
				disclaimerData,
				secondaryContainerFooter = null;
			
			// Create the array for the first HContainer
			elements.push(FilterTool( {key:"filtertool", errorHandler:this.props.errorHandler, componentDidMount:filterStepMountHandler, filterData:this.props.filterData, modelData:this.props.modelData, settings:this.props.settings, controller:this.props.controller, modelSelected:this.props.modelSelected, gradeSelected:this.props.gradeSelected}));
			
			if(promos && promos.length > 0)
			{
				_hasPromo = true;
				elements.push(PromoScreen( {key:"promoscreen", promoData:promos, promoCallback:this.props.promoSelectHandler, settings:this.props.settings, controller:this.props.controller}));
				disclaimerData = promos.map(
					function(item)
					{
						return {
							id:"q" + item.ID,
							description:getDisclaimer(item),
							index:item.Index,
							from:item.From,
							until:item.Until,
							name:item.Name
						};
					}
				);
			}
			else
			{
				_hasPromo = false;
			}
			
			// If the disclaimerdata exists, create the appropriate section
			if(disclaimerData)
			{
				secondaryContainerFooter = (DisclaimerSection( {data:disclaimerData.concat(), className:"cc-border"}));
			}
			
			// Add the submodels, bodytypes and engine grades
			var header = Header( 
							{hasPromo:this.props.hasPromo, 
							compareGradesClickHandler:compareGradesClickHandler, 
							resetProAceFiltersClickHandler:resetProAceFiltersClickHandler, 
							navigate:this.props.navigate, 
							title:this.props.title, 
							componentDidMount:headerMountHandler,
							hasSubmodels:this.props.hasSubmodels,
							settings:this.props.settings});
			if(this.props.hasSubmodels)
			{
				sElements.push(Submodels( {key:"submodels", ref:"submodels", imgPath:this.props.settings.ccisPath, submodels:this.props.submodels, promotions:this.props.promotions, submodelSelectedHandler:this.props.submodelSelectedHandler}));
			}
			
			// Regarding bodytypes step, OR it is the pro ace OR it is the bodytypes step
			if(this.hasProAce())
			{
				sElements.push(ProAce( {key:"proace", settings:this.props.settings, data:this.props.proAceFilterInfo, componentDidMount:proaceStepMountHandler, selectHandler:this.props.proAceSelectHandler, nextHandler:this.props.nextHandler}));
			}
			else if(this.props.hasBodytype)
			{
				sElements.push(BodyTypes( {key:"bodytypes", imgPath:this.props.settings.ccisPath, configuration:this.props.configuration, bodytypes:this.props.bodytypes, bodytypeSelectHandler:this.props.bodytypeSelectHandler}));
			}
			sElements.push(EngineGrades( {key:"enginegrades", componentDidMount:engineGradesMountHandler, settings:this.props.settings, configuration:this.props.configuration, grades:this.props.grades, enabledGrades:this.props.enabledGrades, gradeSelectHandler:this.props.gradeSelectHandler, motorizations:this.props.motorizations, motorizationSelectHandler:this.props.motorizationSelectHandler, controller:this.props.controller, enginePromos:this.props.enginePromos, gradePromos:this.props.gradePromos}));
			elements.push(HContainer( {absolute:true, id:"SecondaryContainer",  key:"secondarycontainer", top:header, bottom:secondaryContainerFooter, elements:sElements, componentDidMount:secondaryContainerMountHandler}));
			
			// Add the specification sheet
			elements.push(
				SpecContainer( 
					{key:"speccontainer", 
					monthlyRateToggleHandler:this.props.monthlyRateToggleHandler, 
					showMonthlyRate:this.props.showMonthlyRate, 
					monthlyRateToggleDefaultValue:this.props.monthlyRateToggleDefaultValue,
					settings:this.props.settings, 
					eco:this.props.eco, 
					disclaimerData:disclaimerData?disclaimerData:null, 
					componentDidMount:specContainerMountHandler, 
					navigate:this.props.navigate, 
					specProps:this.props.specProps, 
					summaryContent:this.props.summaryContent, 
					configuration:this.props.configuration, 
					controller:this.props.controller,
					hasSubmodels:this.props.hasSubmodels}));
			
			// Add the financing
			elements.push(ExternalFrame( {key:"financing", target:"cc-financing-iframe", componentDidMount:financingMountHandler, src:this.props.settings.financing, configuration:this.props.configuration, controller:this.props.controller}));
			
			// Add the insurance
			elements.push(ExternalFrame( {key:"insurance", target:"cc-insurance-iframe", componentDidMount:insuranceMountHandler, src:this.props.settings.insurance, configuration:this.props.configuration, controller:this.props.controller}));
			
			return(
				React.DOM.section( {className:"cc-bottomcontainer"}, 
					React.DOM.div( {className:"container cc-container"}, 
						React.DOM.div( {className:"clearfix"}, 
							HContainer( {updateHeight:containerHeightUpdated, elements:elements, id:"MainContainer", componentDidMount:mainContainerMountHandler})
						)
					)
				)
			);
		};
	}
	// Instantiate the bottomcontainer class
	ui.BottomContainer = React.createClass(
		new BottomContainer()
	);
	
	/**
	 * The header which is shared between the bottom container's controls
	 */
	var Header = React.createClass(
		{displayName: 'Header',
			mixins:[be.marlon.utils.Mixins.Mount],
			
			/**
			 * Handles clicking on the promo button 
			 */
			promoClickHandler:function(e)
			{
				this.props.navigate(be.marlon.utils.PROMOTIONS);
			},
			
			/**
			 * Method whcih returns the default state of the navigation item 
			 */
			getInitialState: function() 
			{
    			return {showCompareGrades:false, showChangeModelBox:false, showResetFilters:false, hasSubmodels:false};
  			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var ChangeModelButton = ui.ChangeModelButton,
					dic = be.marlon.utils.Dictionary,
					promoButton = this.props.hasPromo?
						(React.DOM.a( {className:"cc-promotion-info", onClick:this.promoClickHandler}, 
							React.DOM.i( {className:"icon-info-sign cc-icon cc-icon-info"}), " ", dic.getLabel('viewAllPromotions')
						))
						:null;
					
				return(
					React.DOM.header( {className:"cc-secondary clearfix"}, 
						React.DOM.h1(null, this.props.title),
						promoButton,
						React.DOM.div( {className:"cc-actions"}, 
							React.DOM.a( {className:"cc-btn cc-btn-link cc-btn-compare", style:{display:(this.state.showCompareGrades?'block':'none')}, onClick:this.props.compareGradesClickHandler}, 
								React.DOM.i( {className:"icon-chevron-down"}),
								dic.getLabel('compareGrades')
							),
							React.DOM.a( {className:"cc-btn", style:{display:(this.state.showResetFilters?'block':'none')}, onClick:this.props.resetProAceFiltersClickHandler}, 
                                React.DOM.i( {className:"cc-icon icon-repeat"}),
                                dic.getLabel("resetFilters")
                            ),
							this.props.settings.hideChangeModelButton?null:ChangeModelButton( {hasSubmodels:this.state.hasSubmodels, navigate:this.props.navigate})
						)
					)
				);
			}
		}
	);
}());