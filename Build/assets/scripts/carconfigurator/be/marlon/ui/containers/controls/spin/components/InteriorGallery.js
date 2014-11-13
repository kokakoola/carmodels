/** @jsx React.DOM */
(function() {
	
	/**
     * Navigation component, renders the navigation
     */
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag;
    function InteriorGallery()
    {
    	var _instance = null,
    		_width = 926,
    		_imgSize,
    		_$container,
    		_iLoaded = 0,
    		_face = 0,
    		_screen = 0,
    		_x = 0,
    		_animInterval,
    		_offset,
    		_sUpdateImg,
    		_didUpdate = true,
    		_images;
    	
    	// ###########################
		// Private methods
		// ###########################
    	
    	/**
    	 * Method which moves the gallery to the left 
    	 */
    	function rotateLeft()
	    {
	        _face -= _imgSize;
	        _screen--;
	        clearInterval(_animInterval);
	        _animInterval = setInterval(animate, 20);
	    }
	    
	    /**
	     * Method which moves the gallery to the right 
	     */
	    function rotateRight()
	    {
	        _face += _imgSize;
	        _screen ++;
	        clearInterval(_animInterval);
	        _animInterval = setInterval(animate, 20);
	    }
	    
	    /**
	     * Animation function 
	     */
	    function animate(force)
	    {
	    	if(!_images)return;
			_x = force?_face:((3 * _x) + _face) * 0.25;
			if (Math.abs(_x - _face) < 1) {
			    _x = _face;
			    clearInterval(_animInterval);
			}
			var $img,
				xPos;
			for(var i = 0; i < _images.length; i++)
			{
			    $img = _images[i];
			    xPos = (_x + Number($img.data('xOffset')))%(_imgSize * 4);
				if (xPos < -(_imgSize * 2)) { xPos += (_imgSize * 4); }
				if (xPos >  (_imgSize * 2)) { xPos -= (_imgSize * 4); }
				$img.css({left:(_offset + xPos) + "px"});
			}
	    }
	    
	    /**
	     * Method which handles the load complete of the images 
	     */
	    function imageLoadCompleteHandler(e)
	    {
	    	if(_iLoaded === 0)_didUpdate = true;
	    	_iLoaded ++;
	    	this.onload = null;
	    	if(_iLoaded == 4)
	    	{
	    		// Clear the container
				_$container.empty();
				// Add the images now!
				var i = 0,
					iL = _images.length;
				for(; i < iL; i++)
				{
					_$container.append(_images[i]);
				}
				// Animate in!
	    		animate(true);
	    		// Dispatch event
	    		//_instance.dispatchEvent({type:_instance.LOAD_COMPLETE});
	    	}
	    }
	    
	    /**
	     * Method which handles the load complete of the single image 
	     */
	    function singleImageLoadCompleteHandler(e)
	    {
	    	this.onload = null;
	    	_didUpdate = true;
	    	// Clear the container
			_$container.empty();
			_$container.append(_images[0]);
			// Dispatch event
	    	//_instance.dispatchEvent({type:_instance.LOAD_COMPLETE});
	    }
	    
	    /**
    	 * Method which handles the click on the mask
    	 * @param e:EventObject 
    	 */
    	function clickHandler(e)
    	{
    		bt.track({
                action: 'cc_action',
                value: '360-spin-int'
            });
    		if (e.pageX > ($(_instance.getDOMNode()).offset().left + (_width*0.5)))
	        {
	        	rotateLeft();
	        }
	        else
	        {
	        	rotateRight();
	        }
    	}
    	
    	/**
		* Initialisation function
		* @param aImages:Array the array of image url's
		*/
		function update(aImages)
		{
			// Reset x pos
			_x = 0;
			_iLoaded = 0;
			// Empty array
			_images = [];
			// Add the images
			var i = 0,
				iL = 4,
				$img;
			for(; i < iL; i++)
			{
				// Load the new image
				$img = $('<img class="cc-dynamic"/>');
				_images.push($img);
				$img.data("xOffset",(-i * _imgSize));
				$img.css({left:(-i * _imgSize)});
				$img[0].onload = imageLoadCompleteHandler;
				// Load the image
				$img.attr({"src":aImages[i]});
			}
		}
		
		/**
		 * Method which only adds one image
		 * @param src:String 
		 */
		function updateSingle(src)
		{
			// Empty array
			_images = [];
			
			// Load the new image
			var $img = $('<img class="cc-single"/>');
			_images.push($img);
			$img[0].onload = singleImageLoadCompleteHandler;
			// Load the image
			$img.attr({"src":src});
		}
    	
    	// ###########################
		// Public methods
		// ###########################
		
		/**
		 * Method which gets the current settings/properties 
		 */
		this.getProperties = function()
		{
			return {
					"screen":_screen
				};
		};
		
		/**
		 * Method which sets the current settings/properties 
		 */
		this.setProperties = function(prop)
		{
			_screen = prop.screen;
			_face = _screen * _imgSize;
		};
    	
    	// ###########################
		// Required react methods
		// ###########################
    	
		/**
		 * Method which handles if the component did mount 
		 */
		this.componentDidMount = function()
		{
			// Initialize the interior spin
			if(!_instance)
			{
				_instance = this;
				_imgSize = this.props.imgSize;
				_offset = Math.round((_width - _imgSize) * 0.5);
			}
			_$container = $(this.getDOMNode()).find('.cc-gallery-container');
		};
		
		/**
		 * Method which handles the updating of the interior spin 
		 */
		this.componentDidUpdate = function()
		{
			var data = this.props.data;
			if(data.length > 0)
			{
				if(_sUpdateImg != data[0]) _didUpdate = false;
				_sUpdateImg = data[0];
			}
			
			if(this.props.visible && !_didUpdate)
			{
				if(data.length > 1)
				{
					update(data);
				}
				else if(data.length == 1)
				{
					updateSingle(data[0]);
				}
			}
		};
    	
    	/**
    	 * Method which handles the rendering of the react component 
    	 */
		this.render = function()
		{
			return(
				React.DOM.div( {className:"cc-container"}, 
					React.DOM.div( {className:"cc-interior-gallery", onClick:this.props.data.length > 1?clickHandler:null, style:{display:(this.props.visible?'block':'none')}}, 
						React.DOM.div( {className:"cc-gallery-container"}
						)
					)
				)
			);
		};
    }
    ui.InteriorGallery = React.createClass(
		new InteriorGallery()
	);
})();
