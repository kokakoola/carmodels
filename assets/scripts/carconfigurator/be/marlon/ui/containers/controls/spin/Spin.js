/** @jsx React.DOM */
(function() {
	
	/**
     * Spin component which contains the interior and exterior spins
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	// Instantiate the spin class
	ui.Spin = React.createClass(
		{displayName: 'Spin',
			_spinMargin:-1, // The top margin of the spin towards the header
			_$spin:null,
			_$spinHeader:null,
			_spinHeader:null,
			_width:-1, // Exterior width
			_height:-1, // Total height, including the bottom and top padding
			_pBottom:140,
			_pTop:160,
			_intSize:968, // Interior size (for rendering the interior images, a square is used though only a rectangle part of the full image is visible)
			_sizeIndex:1,
			_aExt:[], // Contains all the exterior images
			_aInt:[], // Contains all the interior images
			_hasHero:false,
			_useLigthBG:false,
			_useHDBG:false,
			_mode:"",
				
			// Set the mixins
			mixins:[_utils.Mixins.Height, _utils.Mixins.Mount],
			
			// ###########################
			// Private methods
			// ###########################
			
			/**
			 * Method which updates the spins
			 */
			update:function(config)
			{
				if(!config || (this._height === -1 && this._width === -1))return;
				// Update the interior and the exterior spins
				var i,
					settings = this.props.settings,
					s = "",
					intImg = config.InteriorImage,
					len,
					inter;
				
				// Check interior HD resolution
				if(this.props.carConfiguratorVersion && this.props.carConfiguratorVersion.ID >= 6)
				{
					this._useHDBG = true;
					inter = "day-interior";
				}
				else
				{
					this._useHDBG = false;
					inter = "interior";
				}
				
				// Update the exterior images
				this.updateExteriorImages(config);
				
				// If the interior image is present, render it!
				if(intImg)
				{
					// Show the interior image (used on the Hilux)
					//this._aInt = [config.InteriorImage + ".resize?width="+(this._width)];
					//this._aInt = [config.InteriorImage.replace("{SIZE}", this._width)];
					//this._aInt = [_utils.createResizableAsset(config.InteriorImage).replace("{SIZE}", this._intSize)];
					this._aInt = [config.InteriorImage];
				}
				else
				{
					this._aInt = [];
					len = config.InteriorImages.length;
					var intBg;
					if(this._useHDBG)
					{
						intBg = this._useLigthBG?"hd-interior-white":"hd-interior";
					}
					else
					{
						intBg = this._useLigthBG?"hd-interior-white-lowres":"hd-interior-lowres";
					}
					for(i = 0; i < len; i ++)
					{
						s = config.InteriorImages[i];
						s = s.replace(/[{]WIDTH[}]/g, this._intSize);
						s = s.replace(/[{]HEIGHT[}]/g, this._intSize);
						s = s.replace(/[{]TYPE[}]/g, "jpg");
						s = s.replace(/[{]VIEW[}]/g, inter);
						s = s.replace(/[{]SCALEMODE[}]/g, "0");
						s = s.replace(/[{]PADDING[}]/g, "0");
						s = s.replace(/[{]BACKGROUNDCOLOUR[}]/g, "0");
						s = s.replace(/[{]BACKGROUNDIMAGE[}]/g, intBg);
						s = s.replace(/[{]IMAGEQUALITY[}]/g, "75");
						s = settings.imagepath + s;
						this._aInt[i] = s;
					}
				}
			},
			
			/**
			 * Method which updates the exterior images 
			 */
			updateExteriorImages:function(config)
			{
				var mode,
					bg,
					i = 0,
					len = config.ExteriorImages.length;
				
				// Check the mode
				switch(this._mode)
				{
					case _utils.EXT:
						if(this._useHDBG)
						{
							mode = "day-exterior";
							bg = this._useLigthBG?"hd-day-white":"hd-day";
						}
						else
						{
							mode = "exterior";
							bg = this._useLigthBG?"hd-day-white-lowres":"hd-day-lowres";
						}
					break;
					case _utils.XRAY_4X4:
						mode = "xray-4x4-exterior";
						bg = "hd-xray";
					break;
					case _utils.XRAY_HYBRID:
						mode = "xray-hybrid-exterior";
						bg = "hd-xray";
					break;
					case _utils.XRAY_SAFETY:
						mode = "xray-safety-exterior";
						bg = "hd-xray";
					break;
					case _utils.NIGHT:
						mode = "night-exterior";
						bg = "hd-night";
					break;
				}
				
				this._aExt = [];
				for(; i < len; i ++)
				{
					this.createExteriorImage(config.ExteriorImages[i], mode, bg);
				}
				
				// If the hero spin is available, add them to!
				if(this._hasHero && this._mode == _utils.EXT)
				{
					for(i = 0; i < len; i ++)
					{
						this.createExteriorImage(config.ExteriorImages[i], "hero-exterior", (this._useLigthBG?"hd-hero-white":"hd-hero"));
					}
				}
			},
			
			/**
			 * Method which creates an exterior image 
			 */
			createExteriorImage:function(s, view, bg)
			{
				s = s.replace(/[{]WIDTH[}]/g, this._width);//Math.round(this._width * this._sizeIndex));
				s = s.replace(/[{]HEIGHT[}]/g, this._height);
				s = s.replace(/[{]TYPE[}]/g, "jpg");
				s = s.replace(/[{]VIEW[}]/g, view);
				s = s.replace(/[{]SCALEMODE[}]/g, "1");
				s = s.replace(/[{]PADDING[}]/g, ("0,0," + this._pTop + "," + this._pBottom));
				s = s.replace(/[{]BACKGROUNDCOLOUR[}]/g, "0");
				s = s.replace(/[{]BACKGROUNDIMAGE[}]/g, bg);
				s = s.replace(/[{]IMAGEQUALITY[}]/g, "75");
				s = this.props.settings.imagepath + s;
				this._aExt.push(s);
				return s;
			},
			
			/**
			 * Method which handles the mounting of the spinHeader 
			 */
			spinHeaderMountHandler:function(item)
			{
				this._spinHeader = item;
				this._$spinHeader = $(item.getDOMNode());
			},
			
			/**
			 * Method which handles the preparing of the boot animation 
			 */
			bootStateSetComplete:function()
			{
				
			},
			
			// ###########################
			// Public methods
			// ###########################
			
			/**
	    	 * Method which shows the preloader
	    	 */
	    	showNextStepPreLoader:function()
	    	{
	    		this._spinHeader.showPreLoader();
	    	},
	    	
	    	/**
	    	 * Method which hides the preloader 
	    	 */
	    	hideNextStepPreLoader:function()
	    	{
	    		this._spinHeader.hidePreLoader();
	    	},
	    	
	    	/**
	    	 * Method which hides the next step 
	    	 */
	    	hideNextButton:function()
	    	{
	    		this._spinHeader.hideNextButton();
	    	},
	    	
	    	/**
	    	 * Method which shows the next step 
	    	 */
	    	showNextButton:function()
	    	{
	    		this._spinHeader.showNextButton();
	    	},
			
			/**
			 * Method which returns if the spin is using a light bg or not 
			 */
			isUsingLightBG:function()
			{
				return this._useLigthBG;
			},
			
			/**
			 * Method which sets the rendering mode of the spin, rendering modes only apply to the exterior
			 */
			setMode:function(mode, useLightBG)
			{
				if(typeof useLightBG != "undefined")this._useLigthBG = useLightBG;
				var showExterior = (mode != _utils.INT);
				// Only safe the mode when it applies to the exterior
				if(showExterior)this._mode = mode;
				// Update the exterior images
				this.update(this.props.configuration);
				// Force a state update
				this.setState({exteriorVisible:showExterior});
			},
			
			/**
			 * Method which sets the size of the spin 
			 */
			setHeight:function(h)
			{
				var imgSize;
				// Based on the spin height, set the exterior spin size, 550 is the maximum, 370 is the minimum
				if(h >= 550)
				{
					this._width = 1300;
					this._height = 340;
					this._pBottom = 135;
					this._pTop = 140;
					imgSize = 2;
				}
				else if(h > 460)
				{
					this._width = 1104;
					this._height = 300;
					this._pBottom = 100;
					this._pTop = 112;
					imgSize = 1;
				}
				else
				{
					this._width = 923;
					this._height = 244;
					this._pBottom = 98;
					this._pTop = 102;
					imgSize = 0;
				}
				var imgHeight = this._height + this._pBottom + this._pTop,
					w = Math.round($(window).width()),
					spinLeft = w < this._width?Math.round(w * 0.5 - this._width * 0.5):0;

				//console.log("spin updating height: ", h, " actual height: ", imgHeight, " spinTop: ", (h + 42 - imgHeight));
				// Update the images conform the new sizes
				this.update(this.props.configuration);
				this.setState(
					{
						//height:Math.round(this._height * this._sizeIndex) + 48,
						height:h - this._spinMargin,
						spinWidth:this._width,
						imgSize:imgSize,
						imgHeight:imgHeight,
						spinHeight:h - this._spinMargin,
						spinTop:(h + 42 - imgHeight), // 42 is the height of the secondary navigation
						spinLeft:spinLeft // This fixes the horizontal alignment if the window width is smaller then 1300 (the min supported with is 923px though)
					}
				);
			},
			
			/**
			 * Returns the exact height of the spin
			 */
			getSpinHeight:function()
			{
				return $(this.getDOMNode()).height();
			},
			
			/**
			 * Method used to initialize the boot animation 
			 */
			animateBoot:function()
			{
				/*if(!this.state.exteriorVisible)
				{
					_spin.setState({exteriorVisible:true}, this.bootStateSetComplete);
				}
				else
				{
					this.bootStateSetComplete();
				}*/
			},
						
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Method called when the component is about to be updated 
			 */
			componentWillUpdate:function(nextProps, nextState)
			{
				// Determine if the hero shot is available
				if(nextProps.modes && nextProps.modes.visibleInHero)
				{
					this._hasHero = true;
				}
				
				// Determine to update the assets generated
				var update = false;
				if(nextProps.configuration)
				{
					if(this.props.configuration)
					{
						if(!nextProps.configuration.equals(this.props.configuration))
						{
							update = true;
						}
					}
					else
					{
						update = true;
					}
				}
				if(update)this.update(nextProps.configuration);
			},
			
			/**
			 * Method called when the component is about to be mounted 
			 */
			componentWillMount:function()
			{
				this._mode = _utils.EXT_DARK;
				if(!ui.Sprite3D.isSupported())this._intSize = Math.round(this._intSize-(this._intSize*0.12));
			},
			
			/**
			 * Method called when the component did render 
			 */
			componentDidMount:function(root)
			{
				this._$spin = $(this.getDOMNode()).find('.cc-spin');
				// Only update the margin first time the component mounts!
				if(this._spinMargin === -1)
				{
					this._spinMargin = this._$spinHeader.height() + this._$spin.outerHeight(true);
				}
			},
			
			/**
			 * Method which returns the initial state of the spin 
			 */
			getInitialState:function()
			{
				return {
					height:0,
					spinWidth:"100%",
					spinHeight:"100%",
					spinTop:0,
					spinLeft:0,
					imgSize:2,
					imgHeight:"100%",
					exteriorVisible:true
				};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var ExteriorSpin = ui.ExteriorSpin,
					InteriorSpin = ui.InteriorSpin,
					InteriorGallery = ui.InteriorGallery,
					SpinHeader = ui.SpinHeader,
					config = this.props.configuration,
					interior = null;
				
				if(config)
				{
					if(ui.Sprite3D.isSupported() && !config.InteriorImage)
					{
						interior = (
							InteriorSpin( {data:this._aInt, visible:!this.state.exteriorVisible})
						);
					}
					else
					{
						interior = (
							InteriorGallery( {data:this._aInt, visible:!this.state.exteriorVisible, imgSize:this._intSize})
						);
					}
				}
				// style={{width:this.state.spinWidth, height:this.state.spinHeight}}
				// Force the height of the container element (sometimes adjusting the margin can cause calculation errors in FF)
				return(
					React.DOM.div( {style:{height:this.state.height}}, 
						React.DOM.div( {className:"cc-container cc-spin-header"}, 
							SpinHeader( {monthlyRate:this.props.monthlyRate, navigate:this.props.navigate, hasPromo:this.props.hasPromo, modes:this.props.modes, modeSwitchHandler:this.props.modeSwitchHandler, controller:this.props.controller, configuration:this.props.configuration, nextHandler:this.props.nextHandler, componentDidMount:this.spinHeaderMountHandler})
						),
						React.DOM.section( {className:"cc-spin", style:{width:Math.round($(window).width())}}, 
							ExteriorSpin( {data:this._aExt, width:this.state.spinWidth, height:this.state.spinHeight, imgHeight:this.state.imgHeight, imgSize:this.state.imgSize, top:this.state.spinTop, left:this.state.spinLeft, visible:this.state.exteriorVisible}),
							interior
						)
					)
				);
			}
		}
	);
}());