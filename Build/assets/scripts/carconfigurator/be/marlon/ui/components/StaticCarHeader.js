/** @jsx React.DOM */
(function() {
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	// Create the static header class
	ui.StaticCarHeader = React.createClass(
		{displayName: 'StaticCarHeader',
			mixins:[be.marlon.utils.Mixins.Mount],
			_url:"",
			_$exterior:null,
			_$interior:null,
			_$shadow:null,
			_shadowVisible:false,
			_spinHeader:null,
			_mode:"",
			_useLigthBG:false,
			_intLoaded:false,
			_extLoaded:false,
			_useHDBG:false,
			
			// ###########################
			// Private methods
			// ###########################
			
			/**
			 * Method which updates the images for the exterior or interior
			 */
			createImage:function(src, width, height, type, bg)
			{
				// Create the image url
				var base = this.props.imagepath + src;
				base = base.replace("{TYPE}", "jpg");
				base = base.replace("{WIDTH}", width);
				base = base.replace("{HEIGHT}", height);
				base = base.replace(/[{]VIEW[}]/g, type);
				base = base.replace(/[{]SCALEMODE[}]/g, "1");
				base = base.replace(/[{]PADDING[}]/g, "0");
				base = base.replace(/[{]BACKGROUNDCOLOUR[}]/g, "0");
				base = base.replace(/[{]BACKGROUNDIMAGE[}]/g, bg);
				base = base.replace(/[{]IMAGEQUALITY[}]/g, "75");
				return base;
			},
			
			/**
			 * Method which loads the image 
			 */
			loadImage:function(base, $container, handler)
			{
				// Load the new image
				var $img = $('<img/>');
				$img[0].onload = handler;
				// Prepend the image
				$container.prepend($img);
				$img.attr({"src":base});
			},
			
			/**
			 * Method which updates the exterior & interior image 
			 */
			updateImages:function()
			{
				var config = this.props.configuration;
				if(!config || !config.ExteriorImages)return;
				// Check interior HD resolution
				if(this.props.carConfiguratorVersion && this.props.carConfiguratorVersion.ID >= 6)
				{
					this._useHDBG = true;
				}
				else
				{
					this._useHDBG = false;
				}
				// If the exterior image should be updated, also update the interior image
				this.updateExteriorImage();
				this.updateInteriorImage();
			},
			
			/**
			 * Method which updates the exterior image 
			 */
			updateExteriorImage:function()
			{
				if(!this.props.configuration)return;
				var mode,
					bg;
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
				
				var extImg = this.createImage(this.props.configuration.ExteriorImages[3], "586", "158", mode, bg);
				// Load the exterior image
				if(this._url != extImg)
				{
					this._intLoaded = false;
					this._extLoaded = false;
					this._url = extImg;
				}
				
				if(this.state.exteriorVisible && !this._extLoaded)this.loadImage(extImg, this._$exterior, this.extImageLoadCompleteHandler);
			},
			
			/**
			 * Method which updates the interior image 
			 */
			updateInteriorImage:function()
			{
				var config = this.props.configuration;
				// If there is an interior image available, load that!
				if(config.InteriorImage)
				{
					if(!this.state.exteriorVisible && !this._intLoaded)this.loadImage(_utils.createResizableAsset(config.InteriorImage).replace("{SIZE}", "586"), this._$interior, this.intImageLoadCompleteHandler);
					return;
				}
				// Else load the regular one
				var inter,
					bg;
				if(this._useHDBG)
				{
					inter = "day-interior";
					bg = this._useLigthBG?"hd-interior-white":"hd-interior";
				}
				else
				{
					inter = "interior";
					bg = this._useLigthBG?"hd-interior-white-lowres":"hd-interior-lowres";
				}
				// Create & load the interior image
				if(!this.state.exteriorVisible && !this._intLoaded)this.loadImage(this.createImage(config.InteriorImages[0], "586", "586", inter, bg), this._$interior, this.intImageLoadCompleteHandler);
			},
			
			/**
			 * Handles the load complete of the image 
			 */
			extImageLoadCompleteHandler:function(e)
			{
				/*var $target;
				if(!e)e = window.event;
				if(e.target)
				{
				    $target = $(e.target);
				}
				else if(e.srcElement)
				{
				    $target = $(e.srcElement);
				}
				if(!$target)return;
				var $cont = $target.data('container');
				$target.removeData('container');
				
				// Remove all images except the first one
				if(!$cont)return;*/
				this._extLoaded = true;
				this._$exterior.remove('img');
				var i = 1,
					arr = this._$exterior.children();
					iL = arr.length;
				for(; i < iL; i++)
				{
					$(arr[i]).remove();
				}
			},
			
			/**
			 * Handles the load complete of the interior  image 
			 */
			intImageLoadCompleteHandler:function(e)
			{
				this._intLoaded = true;
				this._$interior.remove('img');
				var i = 1,
					arr = this._$interior.children();
					iL = arr.length;
				for(; i < iL; i++)
				{
					$(arr[i]).remove();
				}
			},
			
			/**
			 * Handles when the shadow has fade out completely 
			 */
			hideShadowComplete:function()
			{
				this._$shadow.hide();
			},
			
			/**
			 * Handles the mounting of the spinheader 
			 */
			spinHeaderMountHandler:function(item)
			{
				this._spinHeader = item;
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
			 * Method which sets the rendering mode of the spin, rendering modes only apply to the exterior
			 */
			setMode:function(mode)
			{
				if(typeof useLightBG != "undefined")this._useLigthBG = useLightBG;
				var showExterior = (mode != _utils.INT);
				if(showExterior)this._mode = mode;
				// Update the exterior images
				this.updateImages();
				// Force a state update
				this.setState({exteriorVisible:showExterior});
			},
			
			/**
			 * Shows the shadow 
			 */
			showShadow:function()
			{
				/*	
				if(this._shadowVisible)return;
				this._$shadow.stop();
				this._$shadow.show();
				this._$shadow.fadeTo(500, 1);
				this._shadowVisible = true;*/
			},
			
			/**
			 * Hides the shadow 
			 */
			hideShadow:function()
			{
				/*
				if(!this._shadowVisible)return;
				this._$shadow.stop();
				this._$shadow.fadeTo(500, 0, this.hideShadowComplete);
				this._shadowVisible = false;*/
			},
			
			// ###########################
			// Required react methods
			// ###########################
			
			/**
			 * Method called when the component did mount 
			 */
			componentDidMount:function()
			{
				var $this = $(this.getDOMNode());
				this._$exterior = $this.find('.cc-exterior');
				this._$interior = $this.find('.cc-interior');
				this._$shadow = $this.find('.cc-shadow');
				
				// Hide the carheader
				$this.css('top', -$this.height());
			},
			
			/**
			 * Method called when the component did update 
			 */
			componentDidUpdate:function()
			{
				// Update the CCIS image
				this.updateImages();
			},
			
			/**
			 * Method which returns the initial state of the spin 
			 */
			getInitialState:function()
			{
				return {
					exteriorVisible:true
				};
			},
			
			/**
			 * Method called when the component is about to be mounted 
			 */
			componentWillMount:function()
			{
				this._mode = _utils.EXT_DARK;
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var SpinHeader = ui.SpinHeader,
					config = this.props.configuration;
				return(
					React.DOM.section( {className:"cc-mini-header"}, 
						React.DOM.div( {className:"cc-img-container cc-container"}, 
							React.DOM.div( {className:"cc-overlay"}),
							React.DOM.div( {className:"cc-exterior", style:{display:(this.state.exteriorVisible?'':'none')}}),
							React.DOM.div( {className:"cc-interior" + ((config && config.InteriorImage)?" cc-single":""), style:{display:(this.state.exteriorVisible?'none':'')}})
						),
						SpinHeader( {navigate:this.props.navigate, hasPromo:this.props.hasPromo, modes:this.props.modes, modeSwitchHandler:this.props.modeSwitchHandler, controller:this.props.controller, configuration:this.props.configuration, nextHandler:this.props.nextHandler, componentDidMount:this.spinHeaderMountHandler}),
						React.DOM.span( {className:"cc-shadow"})
					)
				);
			}
		}
	);
})();
