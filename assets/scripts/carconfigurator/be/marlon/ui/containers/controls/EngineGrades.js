/** @jsx React.DOM */
(function() {
	
	/**
     * Navigation component, renders the navigation
     */
	var ui = be.marlon.ui,
        bt = be.marlon.Brighttag;
	// Create the engine grades class
	function EngineGrades()
	{
		// Global variables
		var _instance,
			_gradeInfoPanel,
			_dic,
			_utils,
			_motorizations,
			_grades,
			_gradeFeatures,
			_gfStateUpdate, // Counter used to track the state updates for the grades
			_comparePane;
		
		// ###########################
		// Private methods
		// ###########################
		
    	/**
    	 * Method which handles clicking on a bodytype
    	 * @param e:Event
    	 * @param item:React obj, the item clicked upon 
    	 */
    	function gradeSelectHandler(e, item)
    	{
    		// Select the grade
    		_grades.select(item.props.key);
    		
    		// Do the callback
    		_instance.props.gradeSelectHandler(item.props.key);
    	}
    	
    	/**
    	 * Method which handles clicking on the info button of a grade
    	 * @param e:Event
    	 * @param item:React obj, the item clicked upon 
    	 */
    	function gradeInfoClickHandler(e, item)
    	{
    		// Pass the data to the info panel
    		var items = item._featureEquipment;
    		_gradeInfoPanel.setState(
    			{
    				grade:item, // Used in this class to position the elements
    				title:_dic.getLabel('gradeFeature'),
    				data:items,
    				hidden:false,
    				step:0
    			},
    			infoStateChangeComplete
    		);
    	}
    	
    	/**
    	 * Method which handles the successfull state change of the info panel 
    	 */
    	function infoStateChangeComplete()
    	{
    		$(_gradeInfoPanel.getDOMNode()).css({opacity:0});
    		positionGrades(true);
    	}
    	
    	/**
    	 * Method which handles the completion of the animation of the info panel 
    	 */
    	function infoAnimateInComplete()
    	{
    		var $info = $(_gradeInfoPanel.getDOMNode());
    		$info.fadeTo(350, 1);
    	}
    	
    	/**
    	 * Method which handles clicking on a motorization
    	 * @param e:Event
    	 * @param item:React obj, the item clicked upon 
    	 */
    	function motorizationClickHandler(e, item)
    	{
    		// Select the motorization
    		_motorizations.select(item.props.key);
    		
    		// Do the callback
    		_instance.props.motorizationSelectHandler(item.props.key);
    	}
    	
    	/**
    	 * Method which handles clicking on a grade feature
    	 * @param e:Event
    	 * @param item:React obj, the item clicked upon 
    	 */
    	function gradeFeatureClickHandler(e, item)
    	{
    		var i,
    			grades = _instance.props.grades,
    			id = item.props.key,
    			selectedFeatures = [],
    			iL,
    			gf = _gradeFeatures.getData(),
    			g = _grades.getData();
    		// Calculate the selected features
    		i = 0;
    		iL = gf.length;
    		for(; i < iL; i++)
    		{
    			if(gf[i].state.selected)
    			{
    				selectedFeatures.push(gf[i].props.key);
    			}
    		}
    		// Get the grades which validate for the selected features
    		var aFGrades = [];
    		i = 0;
    		iL = grades.length;
    		// Filter out the grades which have the selected item as a grade feature
    		for(; i < iL; i++)
    		{
    			if(hasFeatures(selectedFeatures, grades[i]))
    			{
    				aFGrades.push(grades[i]);
    			}
    		}
    		// Calculate the list of features based on the grades which validate for the current selection
    		var aValidFeatures = calculateGradeFeatures(aFGrades);
    		// Disable other features which are not combinable with the selected feature
    		i = 0;
    		iL = gf.length;
    		for(; i < iL; i++)
    		{
    			// Update the state 
    			if(gf[i].ID != id)
    			{
    				gf[i].setState(
    					{
    						enabled:_utils.checkID(gf[i].props.key, aValidFeatures)
    					}
    				);
    			}
    		}
    		// Hide the grades which do not validate anymore
    		i = 0;
    		iL = g.length;
    		_gfStateUpdate = 0;
    		for(; i < iL; i++)
    		{
    			g[i].setState(
    				{
    					hidden:!_utils.checkID(g[i].props.key, aFGrades)
    				},
    				gradeHidingComplete
    			);
    		}
    	}
    	
    	/**
    	 * Method which handles the setting of the grade state 
    	 */
    	function gradeHidingComplete()
    	{
    		_gfStateUpdate ++;
    		if(_gfStateUpdate == _grades.getData().length)
    		{
    			// Animate position of the grades
    			positionGrades(true);
    		}
    	}
    	
    	/**
    	 * Method which checks if a grade feature is present a grade
    	 * @param aFIDS:guid
    	 * @param grade:GradeObject 
    	 */
    	function hasFeatures(aFIDS, grade)
    	{
    		var i = 0,
    			iL = aFIDS.length;
    		for(; i < iL; i++)
    		{
    			if(!_utils.checkID(aFIDS[i], grade.FeatureEquipment))
    			{
    				return false;
    			}
    		}
    		return true;
    	}
    	
    	/**
    	 * Method which calculates the grade features based on the enabled grades
    	 * @param aGrades:Array 
    	 */
    	function calculateGradeFeatures(aGrades)
    	{
    		var i = 0,
    			iL = aGrades.length,
    			t,
    			tL,
    			deDupl = {},
    			aFeatures = [],
    			o,
    			of;
    		for(; i < iL; i++)
    		{
    			o = aGrades[i];
    			tL = o.FeatureEquipment.length;
    			for(t = 0; t < tL; t++)
    			{
    				of = o.FeatureEquipment[t];
    				if(!deDupl[of.ID])
    				{
    					aFeatures.push(of);
    					deDupl[of.ID] = true;
    				}
    			}
    		}
    		deDupl = null;
    		return aFeatures;
    	}
    	
    	/**
    	 * Method which checks if the grade is enabled or not 
    	 */
    	function getEnabledGrade(guid)
    	{
    		var i = 0,
    			iL = _instance.props.enabledGrades.length,
    			o;
    		for(; i < iL; i++)
    		{
    			o = _instance.props.enabledGrades[i]; 
    			if(o.ID == guid)
    			{
    				return o;
    			}
    		}
    		return null;
    	}
    	
    	/**
    	 * Method which positions the grades 
    	 * @param animate:Boolean wheter to animate the positioning or not
    	 */
    	function positionGrades(animate)
    	{
    		var i = 0,
    			arr = _grades.getData(),
    			iL = arr.length,
    			showInfoOnNextRow = false,
    			$g,
    			h,
    			maxRowHeight = 0,
    			$infoNode = $(_gradeInfoPanel.getDOMNode()),
    			t = 0,
    			x = 0,
    			y = 0;
    			
    		for(; i < iL; i++)
    		{
    			if(!arr[i].state.hidden)
    			{
    				$g = $(arr[i].getDOMNode());
	    			h = $g.outerHeight();
	    			// Calculate the max row height
	    			if(maxRowHeight < h)maxRowHeight = h;
	    			// Do the yposition check
	    			if((t%3 === 0 && t>0))
	    			{
    					y += maxRowHeight;
    					x = 0;
    					maxRowHeight = 0;
	    				
	    				// Check if the info should be shown on the next line
	    				if(showInfoOnNextRow)
	    				{
	    					if(animate)
		    				{
		    					$infoNode.animate({top:y}, {duration:350, queue:false, complete:infoAnimateInComplete});
		    				}
		    				else
		    				{
		    					$infoNode.css({top:y});
		    				}
	    					showInfoOnNextRow = false;
	    					y += $infoNode.outerHeight();
	    				}
	    			}
	    			
	    			if(animate)
		    		{
		    			$g.animate(
		    				{
		    					left:x,
		    					top:y
		    				}, 
		    				{
		    					duration:350, 
		    					queue:false
		    				});
		    		}
		    		else
		    		{
		    			$g.css(
	    					{
	    						left:x,
	    						top:y
	    					}
	    				);
		    		}
		    		
		    		// Check the info positioning
		    		if(_gradeInfoPanel.state.grade == arr[i])
	    			{
	    				showInfoOnNextRow = true;
	    			}
		    		
		    		x += $g.width();
		    		t ++;
    			}
    		}
    		
    		if(maxRowHeight === 0 && $g)maxRowHeight = $g.outerHeight();
    		y += maxRowHeight;
    		// After the looping has completed check the info panel again
    		if(showInfoOnNextRow)
	    	{
	    		if(animate)
				{
					$infoNode.animate({top:y}, {duration:350, queue:false, complete:infoAnimateInComplete});
				}
				else
				{
					$infoNode.css({top:y});
				}
	    	}
	    	// Set the height on the grade container
	    	$(_instance.getDOMNode()).find('.cc-grade-container').height(y + (showInfoOnNextRow?$infoNode.outerHeight():0));
	    	// Call the update height method which triggers height update on the component
    		_instance.updateHeight();
    	}
    	
    	/**
    	 * Method which handles mounting the compare pane 
    	 */
    	function comparePaneMountHandler(item)
    	{
    		_comparePane = item;
    	}
    	
    	/**
    	 * Method which handles mounting the info panel
    	 * @param ip:React object 
    	 */
    	function infoPanelMountHandler(ip)
    	{
    		_gradeInfoPanel = ip;
    	}
    	
    	/**
    	 * Method which handles the height update of the info panel
    	 * @param h:Number the height of the info panel 
    	 */
    	function infoPanelHeightUpdateHandler(h)
    	{
    		positionGrades(true);
    	}
    	
    	/**
    	 * Method which handles the height update of the compare pane
    	 * @param h:Number the height of the compare pane 
    	 */
    	function comparePaneHeightUpdateHandler(h)
    	{
    		// Call the update height method which triggers height update on the component
    		// Calculate the height
    		var $this = $(_instance.getDOMNode());
    		var contHeight = $this.find('.cc-grade-container').outerHeight() + 20;
    		var asideHeight = $this.find('aside').outerHeight() + 20;
    		h += (contHeight > asideHeight)?contHeight:asideHeight;
    		_instance.updateHeight(h);
    	}
    	
    	/**
    	 * Method which handles the updating of the side panel height 
    	 */
    	function sidePanelHeightUpdate()
    	{
    		_instance.updateHeight();
    	}
    	
    	/**
    	 * Method which is called once the info panel is closed
    	 * @param e:Event 
    	 */
    	function infoPanelCloseHandler(e)
    	{
    		// Close the panel and reanimate the grades in place
    		_gradeInfoPanel.setState(
    			{
    				grade:null,
    				hidden:true
    			},
    			infoStateChangeComplete
    		);
    	}
    	
    	/**
    	 * Method which creates the asset for the grade 
    	 */
    	function createAsset(src)
    	{
    		///es/813b0db9-bca0-4893-9167-cc0c4f69cfc2/5e254716-612e-4b8a-aa81-bff4793853af/a1a0ccec-4c93-4803-8383-c8611c641ffc/{VIEW}-{SIDE}.{TYPE}
    		//this.props.settings.ccisPath;
    		return _instance.props.settings.ccisPath + src.replace("{VIEW}", "exterior").replace("{SIDE}", 4).replace("{TYPE}", "png").replace("{WIDTH}", "210").replace("{HEIGHT}", "109");
    	}
    	
    	/**
    	 * Method which creates the data for feeding the compare pane 
    	 */
    	function createComparePaneData(original)
    	{
    		var cols = [],
				categories = [];
			// Loop through all rows
			$.each(original, function(i, o) {
				
				// Convert o to a usable object
				var rowData = {
					ID:o.ID,
					Name:o.Name,
					Availability:{},
					OptionalPrice:{}
				};
				
				// Check all grades in StandardOn
				$.each(o.StandardOn, function(j, c) {
					rowData.Availability[c.ID] = "standard";
					if ($.grep(cols, function(cv){ return cv.ID == c.ID; }).length === 0) cols.push({Name:c.Name, ID:c.ID});
				});
				// Check all grades in OptionalOn
				$.each(o.OptionalOn, function(j, c) {
					rowData.Availability[c.ID] = "optional";
					rowData.OptionalPrice[c.ID] = c.Price;
					if ($.grep(cols, function(cv){ return cv.ID == c.ID; }).length === 0) cols.push({Name:c.Name, ID:c.ID});
				});
				// Check all grades in NotAvailableOn
				$.each(o.NotAvailableOn, function(j, c) {
					rowData.Availability[c.ID] = "unavailable";
					if ($.grep(cols, function(cv){ return cv.ID == c.ID; }).length === 0) cols.push({Name:c.Name, ID:c.ID});
				});
				// Convert grades to useable data objects
				var lvl = o.Category.Level,
					myCat = null;
				
				// Data is 2nd level
				if (lvl == 1 || lvl == 2)
				{
					// See if myCat is already assigned
					myCat = $.grep(categories, function(cat){ return cat.ID == o.Category.ID; })[0];
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
    				// Push row-data to category
    				myCat.Rows.push(rowData);
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
					// Push row-data to category
					mySubCat.Rows.push(rowData);
				}
				
			});
			return {cols:cols, rows:categories};
    	}
    	
    	/**
    	 * Method which handles the response from the load of the comparegrades request 
    	 */
    	function compareGradesLoadedHandler(e)
    	{
    		var data = e.data;
    		// If the data has not been cached yet
    		if(!data[1])
    		{	
    			_comparePane.setState({data:createComparePaneData(data[0])});
    		}
    		_comparePane.show();
    	}
    	
    	/**
    	 * Method which fetches the correct promotion for the element 
    	 */
    	function getPromotions(id, arr)
    	{
    		if(arr.length === 0)return arr;
    		var i = 0,
    			iL = arr.length;
    		for(; i < iL; i++)
    		{
    			if(arr[i].ID == id)return arr[i].Promotions;
    		}
    		return [];
    	}
    	
    	/**
    	 * Method which updates the promotions 
    	 */
    	function updatePromotions(arr, promos)
    	{
    		var i = 0,
    			iL = arr.length;
    		for(; i < iL; i++)
    		{
    			arr[i].setState({
					activePromotions:getPromotions(arr[i].props.key, promos)
    			});
    		}
    	}
    	
    	/**
         * Method which is called when the preloader has been mounted 
         */
        function preLoaderMountHandler(item)
        {
        	// Set the top of the preloader
        	var h = $(window).height() * 0.5 - 200;
        	$(item.getDOMNode()).css({marginTop:h});
        }
					
		// ###########################
		// Public methods
		// ###########################
		
		/**
		 * Method which shows the compare grades 
		 */
		this.showCompareGrades = function()
		{
			var controller = this.props.controller;
			controller.loadCompareGrades();
		};
		
		/**
		 * Method which shows the preloader 
		 */
		this.showPreLoader = function()
		{
			this.setState({showPreLoader:true});
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
			_instance = this;
			_utils = be.marlon.utils;
			_dic = _utils.Dictionary;
			
			_motorizations = new ui.List();
			_grades = new ui.List();
			_gradeFeatures = new ui.List();
			
			// Add eventlistener for the compare grades loaded event
			this.props.controller.addEventListener(be.marlon.Service.COMPARE_GRADES_LOADED, compareGradesLoadedHandler);
		};
		
		/**
		 * Invoked when a component is receiving new props. 
		 */
		this.componentWillReceiveProps = function(nextProps)
		{
			// Check if the grade id is found in the nextProps grades
			// We need to use this approach since the grades are still contain the old value...
			if(nextProps.configuration && _utils.getItem(nextProps.configuration.GradeID, nextProps.grades, "ID"))
			{
				this.setState({showPreLoader:false});
			}
		};
		
		/**
		 * Method called when the component is about to be rendered 
		 */
		this.componentWillUnmount = function()
		{
			// Remove eventlistener for the compare grades loaded event
			this.props.controller.removeEventListener(be.marlon.Service.COMPARE_GRADES_LOADED, compareGradesLoadedHandler);
		};
		
		/**
		 * Method which is called after the component has rendered 
		 */
		this.componentDidUpdate = function(prevProps, prevState, rootNode)
		{
			if(!this.props.configuration || this.state.showPreLoader)
			{
				// Update the height anyway
				this.updateHeight();
				return;
			}
			var config = this.props.configuration;
			// Position all the grade elements
			positionGrades(false);
			// Select the current grade
			_grades.select(config.GradeID);
			// Select the current motorization
			_motorizations.select(config.EngineID + config.FuelTypeID + config.TransmissionID + config.WheelDriveID);
			// Update the promotions on the motorizations
			updatePromotions(_motorizations.getData(), this.props.enginePromos);
		};
		
		/**
		 * Returns the default state of the grade 
		 */
		this.getInitialState = function()
		{
			return {
				showPreLoader:true
			};
		};
		
		/**
		 * The react render function for this class 
		 */
		this.render = function()
		{
			var i = 0,
				iL = this.props.grades.length,
				ComparePane = ui.ComparePane,
				SidePanel = ui.SidePanel,
				InfoPanel = ui.InfoPanel,
				PreLoader = ui.PreLoader,
				eg,
				id,
				price,
				dprice,
				featureGrades = [],
				o;
			var grades = [];
			for(; i < iL; i++)
			{
				o = this.props.grades[i];
				// Get the enabled grade object! (null if this grade is not enabled)
				eg = getEnabledGrade(o.ID);
				
				//if(eg)featureGrades.push(o);
				featureGrades.push(o);
				
				price = (eg && _utils.hasPrice)?eg.PriceInfo.ListPriceWithDiscount:0;
				price = (price > 0)?_utils.formatPrice(price, true):"";
				
				if(eg && eg.PriceInfo.ListPriceWithDiscount != eg.PriceInfo.ListPrice) dprice = (price !== "")?_utils.formatPrice(eg.PriceInfo.ListPrice,true):"";
				else dprice = "";
				
				o = Grade({
						key:o.ID,
						data:o,
						enabled:eg?true:false,
						asset:createAsset(o.Image), // Reference the CCIS grade image here
						price:price,
						dprice:dprice,
						availablePromotions:eg?o.AvailablePromotions:null,
						activePromotions:eg?getPromotions(o.ID, this.props.gradePromos):null,
						clickHandler:gradeSelectHandler,
						infoClickHandler:gradeInfoClickHandler
					});
				// Save the react objects in a class variable
				grades.push(o);
			}
			_grades.setData(grades);
			
			// Check if the wheeldrive should be added or not
			var addWheelDrive = false,
				motorizations = this.props.motorizations;
			i = 1;
			iL = motorizations.length;
			if(iL > 1)
			{
				for(; i < iL; i++)
				{
					if(motorizations[i].Wheeldrive.Name != motorizations[i-1].Wheeldrive.Name)
					{
						addWheelDrive = true;
						break;
					}
				}
			}
			
			// Create the motorizations
			motorizations = this.props.motorizations.map(
				function(item){
					
					id = item.Engine.ID + item.Engine.Type.ID + item.Transmission.ID + item.Wheeldrive.ID;
					
					return Motorization(
						{
							key:id,
							title:item.Engine.Name,
							subtitle:item.Transmission.Name + (addWheelDrive?(" " + item.Wheeldrive.Name):""),					
		    				availablePromotions:item.AvailablePromotions,
							infoData:item.Engine,
							eco:item.Specs,
							type:item.Engine.Type,
							clickHandler:motorizationClickHandler
						}
					);
				}
			);
			_motorizations.setData(motorizations);
			
			// Create the grade features
			var gf = calculateGradeFeatures(featureGrades).sort(
					function(a, b)
					{
						return a.SortIndex - b.SortIndex;
					});
			var gradeFeatures = gf.map(
					function(item)
					{
						return GradeFeature(
							{
								key:item.ID,
								label:item.Name,
								clickHandler:gradeFeatureClickHandler
							});
					}
				);
			_gradeFeatures.setData(gradeFeatures);
			
			// Create the data object which feeds the sidepanel
			var spd = [];
			if(gradeFeatures.length > 0)
			{
				spd.push(
					{
						title:_dic.getLabel('gradeFeatures'),
						content:(
							React.DOM.div( {className:"cc-checkboxes"}, 
								gradeFeatures
							)
						),
						collapsed:true
					}
				);
			}
			spd.push(
				{
					title:_dic.getLabel('engines'),
					content:MotorizationSection( {motorizations:motorizations, list:_motorizations, heightUpdate:sidePanelHeightUpdate})
				}
			);
			
			// Create the actual being visualized data object
			var content;
			if(this.state.showPreLoader)
			{
				content = PreLoader( {size:_utils.LARGE, visible:true, componentDidMount:preLoaderMountHandler});
			}
			else
			{
				content = [
					SidePanel( {key:0, data:spd, heightUpdate:sidePanelHeightUpdate}),
					React.DOM.div( {key:1, className:"cc-col cc-col-9"}, 
						React.DOM.section( {className:"cc-cols cc-filter-results cc-group"}, 
							React.DOM.div( {className:"cc-grade-container"}, 
								grades,
								InfoPanel( {componentDidMount:infoPanelMountHandler, heightUpdated:infoPanelHeightUpdateHandler, closeHandler:infoPanelCloseHandler})
							)
						)
					)
				];
			}
		    
			return (
				React.DOM.div( {className:"cc-abs-item cc-engine-grades"}, 
					ComparePane( {key:0, title:"compareGrades", settings:this.props.settings, componentDidMount:comparePaneMountHandler, heightUpdate:comparePaneHeightUpdateHandler} ),
					content
				)
			);
		};
		// Define the mixins here so they get called after the internal methods are finished updating
		this.mixins = [be.marlon.utils.Mixins.Height, be.marlon.utils.Mixins.Mount];
	}
	// Instantiate the react class
	ui.EngineGrades = React.createClass(
		new EngineGrades()
	);
	
	/**
	 * The grade instance 
	 */
	var Grade = React.createClass(
		{displayName: 'Grade',
			mixins:[be.marlon.utils.Mixins.Mount],
			_featureEquipment:null,
			
			/**
			 * Handles clicking on the grade 
			 */
			clickHandler:function(e)
			{
				e.stopPropagation();
				this.props.clickHandler(e, this);
			},
			
			/**
			 * Handles clicking on the grade info button 
			 */
			infoClickHandler:function(e)
			{
				e.stopPropagation();
				e.preventDefault();
				this.props.infoClickHandler(e, this);
			},
			
			/**
			 * Returns the default state of the grade 
			 */
			getInitialState:function()
			{
				return {hidden:false, selected:false};
			},
			
			/**
			 * Animates based on state properties 
			 */
			componentDidUpdate:function()
			{
				var $this = $(this.getDOMNode());
				if(this.state.hidden)
				{
					$this.fadeOut(400);
				}
				else
				{
					$this.fadeIn(400);
				}
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var cn = ("cc-grade-item" + (this.props.enabled?"":" cc-disabled")),
					info,
					utils = be.marlon.utils,
					dic = utils.Dictionary,
					pricing,
					promoIndexes = null,
					arr,
					delprice = null,
					o,
					i,
					TouchClicker = utils.TouchClicker,
					iL;
					
				// Create the featureEquipment label if required
				arr = this.props.data.FeatureEquipment;
				
				if(arr.length > 0)
				{
					i = 0;
					iL = arr.length;
					this._featureEquipment = [];
					for(; i < iL; i++)
					{
						o = arr[i];
						if((o.Description !== "") && (be.marlon.utils.getCARDBAsset(o.Assets) !== ""))this._featureEquipment.push(o);
					}
					if(this._featureEquipment.length > 0)
					{
						info = (
							TouchClicker( {content:
								React.DOM.div( {className:"cc-hit-area"}, 
									React.DOM.a(null, 
										React.DOM.i( {className:"icon-info-sign cc-icon"})
									)
								),
							 
							clickHandler:this.infoClickHandler})
						); 
					}
				}
				
				arr = this.props.availablePromotions;
				// Create the price element
				if(arr && arr.length > 0)
				{
					i = 0;
					iL = arr.length;
					promoIndexes = [];
					for(; i < iL; i++)
					{
						o = this.props.activePromotions[i];
						if(o.Show)
						{
							promoIndexes.push(React.DOM.span( {key:arr[i].Index, className:"cc-number"}, arr[i].Index));
						}
					}
				    
				    // Create the delprice
				    if(this.props.dprice !== "") 
				    {
				    	delprice = (
				    		React.DOM.div(null, 
				    			React.DOM.del( {className:"cc-price"}, 
				    				dic.getLabel('from') + " " + this.props.dprice
				    			)
				    		));
				    }
				}
				
				// Create the pricing container
		    	pricing = this.props.price !== ""?(
			    		React.DOM.div( {className:"cc-pricing" + ((promoIndexes && promoIndexes.length > 0)?" cc-promo-price":"")}, 
			    			delprice,
							React.DOM.div( {className:"cc-price"}, 
								dic.getLabel('from') + " " + this.props.price
							),
							promoIndexes
						)
					):null;
		    	
				
				// Return the submodel object
				return (
					React.DOM.article( {className:cn, onClick:this.props.enabled?this.clickHandler:null}, 
						React.DOM.div( {className:"cc-inner" + (this.state.selected?" cc-selected":"")}, 
							React.DOM.div( {className:"cc-thumb"}, 
								React.DOM.span( {className:"cc-checkbox cc-checkbox-small" + (this.state.selected?" cc-checked":"") + (this.props.enabled?"":" cc-disabled")}),
								React.DOM.img( {alt:"", src:this.props.asset})
							),
							React.DOM.header(null, 
								React.DOM.h1(null, 
									info,
									React.DOM.span( {className:"cc-title" + (info?" cc-indent":"")}, this.props.data.Name)
								),
								pricing
							)
						)
					)
				);
			}
		}
	);
	
	// This renders the motorization section inside the sidepanel
	var MotorizationSection = React.createClass(
		{displayName: 'MotorizationSection',
			_is:null, // The item selector
			
			/**
			 * Handles the mounting of the item selector 
			 */
			itemSelectorMountHandler:function(item)
			{
				this._is = item;
			},
			
			/**
			 * Method which handles selecting an item from the combobox
			 * @param item:Object the item object associated with the list item
			 * @param itemSelector:React object the item selector instance
			 */
			itemSelectHandler:function(o)
			{
				// Select the appropriate tab
				this._is.setState({selected:o.id});
				// Show the matching car objects
				var i = 0,
					arr = this.props.list.getData(),
					utils = be.marlon.utils,
					iL = arr.length,
					tL = o.data.length,
					t,
					stateUpdated = _.after(iL, this.stateChanged);
				
				//console.log("item selected: ", o.data, " || ", arr);
				for(; i < iL; i++)
				{
					for(t = 0; t < tL; t++)
					{
						if(arr[i].props.key == o.data[t].props.key)
						{
							t = -1;
							break;
						}
					}
					if(t == -1)
					{
						arr[i].setState({hidden:false}, stateUpdated);
					}
					else
					{
						arr[i].setState({hidden:true}, stateUpdated);
					}
				}
			},
			
			/**
			 * Method which handles the state change of a motorization object 
			 */
			stateChanged:function()
			{
				this.props.heightUpdate();
			},
			
			/**
			 * Method called after the component has been mounted 
			 */
			componentDidMount:function()
			{
				// Update the selected state of the itemselector
				if(this._is)this._is.setState({selected:"ALL"});
			},
			
			/**
			 * Method called after the component has been updated 
			 */
			componentDidUpdate:function()
			{
				this.componentDidMount();
			},
			
			/**
			 * Method which checks if the component should update 
			 */
			shouldComponentUpdate:function(nextProps, nextState)
			{
				var update = true;
				if(nextProps.motorizations && this.props.motorizations)
				{
					update = !be.marlon.utils.checkArrays(nextProps.motorizations, this.props.motorizations, "key");
				}
				return update;
			},
			
			/**
			 * React render method 
			 */
			render:function()
			{
				var ItemSelector = ui.ItemSelector;
				
				// Group the motorization types together and map them into the ItemSelector
				var i = 0,
					arr = this.props.motorizations,
					o,
					type,
					iL = arr.length,
					categories = {ALL:{label:be.marlon.utils.Dictionary.getLabel('all'), data:arr}};
				for(; i < iL; i++)
				{
					o = arr[i];
					type = o.props.type;
					if(!categories[type.ID])
					{
						categories[type.ID] = {label:type.Name, data:[]};
					}
					categories[type.ID].data.push(o);
				}
				
				// Create the combobox data
				var prop,
					isd = [];
				for(prop in categories)
				{
					categories[prop].id = prop;
					isd.push(categories[prop]);
				}
				
				return(
					React.DOM.div(null, 
						isd.length > 2?ItemSelector( {itemSelectHandler:this.itemSelectHandler, items:isd, componentDidMount:this.itemSelectorMountHandler}):null,
						arr
					)
				);
			}
		}
	);
	
	var Motorization = React.createClass(
		{displayName: 'Motorization',
			mixins:[be.marlon.utils.Mixins.Mount],
			// This boolean is necessary because the state gets reset each time the motorization react instance gets mounted.
			// When switching engine-types this happens quit often
			_selected:false,
			// Contains the instance of the Motorization's own info object
			_info:null,
			// This list contains a reference to all the other Motorization instances' Info objects
			_infoList:new ui.List(),
			
			/**
	    	 * Method which creates the eco data
	    	 * @param eco:Array of elements
	    	 */
	    	addEcoData:function(eco)
	    	{
	    		var i = 0,
	    			iL = eco.length,
	    			sEco = "",
	    			o,
	    			maxValue,
	    			description = [],
	    			bShowEngineEco = true; // = (Settings.getInstance().getValue("showengineeco") == "true" || Settings.getInstance().getValue("showengineeco") == true);
				if(bShowEngineEco)
				{
					for(; i < iL; i++)
					{
						o = eco[i];
						// Only show Fuel consumption combined and CO2 combined
						if(o.InternalCode === "FCC" || o.InternalCode === "CO2COMB" || o.InternalCode === "ENERGY-EFFICIENCY-CLASS" || o.InternalCode === "CO2")
						{
							sEco = o.Name + ": ";
							maxValue = o.MaxValue;
							if(maxValue && maxValue !== "" && maxValue != o.MinValue)
							{
								sEco += o.MinValue + " - " + maxValue;
							}
							else
							{
								sEco += o.MinValue;
							}
							description.push(
								React.DOM.li( {key:i}, sEco)
							);
						}
					}
				}
				return(
					React.DOM.ul( {className:"cc-specs"}, description)
				);
	    	},
			
			/**
			 * Handles the mounting of the info panel 
			 */
			infoMountHandler:function(item)
			{
				this._info = item;
			},
	    	
	    	/**
	    	 * Handles clicking on the engine info 
	    	 */
	    	infoClickHandler:function(e)
	    	{
	    		e.stopPropagation();
	    		var arr = this._infoList.getData(),
	    			i = 0,
	    			iL = arr.length;
	    		for(; i < iL; i++)
	    		{
	    			if(arr[i] == this._info)
	    			{
	    				arr[i].show();
	    			}
	    			else
	    			{
	    				arr[i].hide();
	    			}
	    		}
	    	},
	    	
	    	/**
	    	 * Handles the event when new properties are being received 
	    	 */
	    	componentWillUpdate:function(nextProps, nextState)
	    	{
	    		this._selected = nextState.selected;
	    	},
	    	
	    	/**
	    	 * Handles the event when the component is about to be mounted 
	    	 */
	    	componentWillMount:function()
	    	{
	    		if(this._selected === true)
	    		{
	    			this.setState({selected:true});
	    		}
	    	},
			
			/**
			 * Handles clicking on the bodytype 
			 */
			clickHandler:function(e)
			{
				e.stopPropagation();
				this.props.clickHandler(e, this);

                // Track click on compare grades button
                bt.track({
                    componentname: 'carconfig',
                    action: 'cc_action',
                    value: 'filter-engines'
                });
			},
			
			/**
			 * Returns the default state of the grade feature 
			 */
			getInitialState:function(e)
			{
				return {selected:false, hidden:false, activePromotions:null};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var hasDescription = (this.props.infoData.Description !== ""),
					info = null,
					ap = this.props.availablePromotions,
					acp = this.state.activePromotions,
					promoIndexes = null,
					discount = 0,
					pricing = null,
					i = 0,
					iL;
				
				// Calculate the delta price element
				if(acp && acp.length > 0)
				{
					iL = ap.length;
					promoIndexes = [];
					for(; i < iL; i++)
					{
						o = acp[i];
						if(o.Show)
						{
							promoIndexes.push(React.DOM.span( {key:ap[i].Index, className:"cc-number"}, ap[i].Index));
							discount += o.Value;
						}
					}
				}
				
				// Create the pricing container
		    	pricing = (discount > 0)?(
			    		React.DOM.div( {className:"cc-meta clearfix cc-pricing cc-promo-price"}, 
			    			promoIndexes,
							React.DOM.span( {className:"cc-price"}, 
								" -" + be.marlon.utils.formatPrice(discount, true)
							)
						)
					):null;
				
				// Create the info panel
				if(hasDescription)
				{
					info = MotorizationInfo( {componentDidMount:this.infoMountHandler, description:this.props.infoData.Description, asset:be.marlon.utils.getCARDBAsset(this.props.infoData.Assets), title:this.props.title + " " + this.props.subtitle});
					this._infoList.setData([info]);
				}
				
				return (
					React.DOM.article( {onClick:this.state.selected?null:this.clickHandler, style:{display:(this.state.hidden?'none':'block')}}, 
                        React.DOM.h4(null, 
                            React.DOM.span( {className:"cc-checkbox cc-checkbox-small" + (this.state.selected?" cc-checked":"")}),
                            React.DOM.span( {className:"cc-title"}, 
                            	this.props.title,
                            	hasDescription?React.DOM.i( {className:"icon-info-sign cc-icon cc-icon-info", onClick:this.infoClickHandler}):null
                            )
                        ),
                        info,
                        React.DOM.p( {className:"cc-subtitle"}, this.props.subtitle),
                        pricing,
                        this.addEcoData(this.props.eco)
                    )
				);
			}
		}
	);
	
	var MotorizationInfo = React.createClass(
		{displayName: 'MotorizationInfo',
			mixins:[be.marlon.utils.Mixins.Mount],
			
			/**
			 * Handles showing the info panel 
			 */
			show:function()
			{
				$(document).on('click', this.docClickHandler);
				$(this.getDOMNode()).show();
			},
			
			/**
			 * Handles hiding the info panel 
			 */
			hide:function()
			{
				$(document).off('click', this.docClickHandler);
				$(this.getDOMNode()).hide();
			},
			
			/**
			 * Handles clicking on the document 
			 */
			docClickHandler:function(e)
			{
				this.hide();
			},
			
			/**
			 * Method which handles clicking on the close button 
			 */
			closeHandler:function(e)
			{
				e.stopPropagation();
				this.hide();
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				return(
					React.DOM.section( {className:"cc-popup clearfix"}, 
					    React.DOM.div( {className:"cc-contents clearfix"}, 
					        React.DOM.h1(null, this.props.title),
					        this.props.asset?React.DOM.img( {alt:"", src:this.props.asset.replace("{SIZE}", "224"), height:"224"}):null,
					        React.DOM.div( {dangerouslySetInnerHTML:{__html:this.props.description}}),
					        React.DOM.a( {title:"Close", className:"cc-icon-close", onClick:this.closeHandler}, "x")
					    )
					)
				);
			}
		}
	);
	
	var GradeFeature = React.createClass(
		{displayName: 'GradeFeature',
			mixins:[be.marlon.utils.Mixins.Mount],
			/**
			 * Handles clicking on the gradefeatures 
			 */
			clickHandler:function(e)
			{
				e.stopPropagation();
				this.setState({selected:!this.state.selected}, this.stateCompleted);
			
                // Track click on compare grades button
                bt.track({
                    componentname: 'carconfig',
                    action: 'cc_action',
                    value: 'filter-features'
                });            
            },
			
			/**
			 * Handles the state complete event 
			 */
			stateCompleted:function(e)
			{
				this.props.clickHandler(e, this);
			},
			
			/**
			 * Returns the default state of the grade feature 
			 */
			getInitialState:function(e)
			{
				return {enabled:true, selected:false};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				return(
					React.DOM.div( {className:"cc-checkbox-label" + (this.state.selected?" checked":""), onClick:this.state.enabled?this.clickHandler:null}, 
						React.DOM.span( {className:"cc-checkbox cc-checkbox-small" + (this.state.selected?" cc-checked":"") + (this.state.enabled?'':' cc-disabled')}),
						this.props.label
					)
				);
			}
		}
	);
})();
