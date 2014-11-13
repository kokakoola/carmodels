/** @jsx React.DOM */
(function() {
	// Define location in the namespace
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag;
	function ExteriorSpin()
	{
		var _iCurrentImage = 3; // This is used to determine the current image, also used to assemble the Array which contains all 36 positions
		var _aImages = false, // Reference for the img objects
			_sUpdateImg = "", // Variable used to check if the spin should be updated or not
			_downX = -1, // This variable holds the position where the mouse is down, based to calculate the rotation
			_downY = -1,
			_prevPos = -1, // The previous position, use to calculate the rotational direction
			_iDownImage = -1, // The image used when the mouse went down!
			_aPos = false, // Array contains the positions of all images
			_iLoad = 0, // The counter which holds the amount of images which have been loaded
			
			_utils = be.marlon.utils,
			_instance,
		// CONSTANTS //
			_pixelChange = 8, // Each _pixelChange adjustment the spin will calculate a rotation point
			_initLoadingFrames = 1, // The number of frames which are loaded without interaction
		
		// Boolean which indicates full load
			_bLoaded = false,
			_bLoading = false,
			_bUserInteracted = false,
			_currentlyLoadingUrl = "",
			_scroll = true,
			_scrollX,
			_scrollY,
			_didUpdate = true,
			_totalFrames = 36, // Depends on the amount of elements in the this.props.data Array
			_$imgCont;
			
		var _salesmanImages = [];
		
		/**
		 * Method called when the component is about to be rendered 
		 */
		this.componentWillMount = function()
		{
			// Save the instance reference
			if(!_instance)_instance = this;
		};
		
		/**
		 * Method called after the component has rendered 
		 */
		this.componentDidMount = function()
		{
			_$imgCont = $(this.getDOMNode()).find('.imgcont');
            
			// -> $.subscribe('simulateExtSpinSwipe', handleSimulateSpin('simulateExtSpinSwipe'));
			PubSub.subscribe("cc_simulate_extspinswipe", handleSimulateSpin);
			
			var mask = $(this.getDOMNode()).find('.mask');
			mask.on("mousedown", mouseDownHandler);
			mask.on("touchstart", mouseDownHandler);
		};
		
		/**
		 * Method called after the component has rendered, after a data update 
		 */
		this.componentDidUpdate = function(prevProps, prevState)
		{
			_totalFrames = this.props.data.length;
			
			if(prevProps.data[0] != this.props.data[0])_didUpdate = false;
			if(this.props.visible && !_didUpdate)
			{
				update();
			}
		};
		
		/**
		 * Method which returns the initial state of the spin 
		 */
		this.getInitialState = function()
		{
			return {
				enabled:true
			};
		};
			
		/**
		 * React JS render method 
		 */
		this.render = function()
		{
			var size;
			switch(this.props.imgSize)
			{
				case 0: size = "small";
				break;
				case 1: size = "medium";
				break;
				case 2: size = "large";
				break;
			}
			return(
				React.DOM.div( {style:{width:this.props.width, height:this.props.height, top:this.props.top, left:this.props.left, display:(this.props.visible?'block':'none')}, className:"cc-exterior"}, 
					React.DOM.div( {className:"mask"}),
					React.DOM.div( {className:"overlay " + size, style:{width:this.props.width, height:this.props.imgHeight}}),
					React.DOM.div( {className:"imgcont"}
					)
				)
			);
		};
		
		function handleSimulateSpin(msg, data) {
		    
		    // If the items have not been loaded yet, return!
            if(_iLoad < _initLoadingFrames) return;
            
            // User interacted, load other images
            if(!_bUserInteracted && _iLoad == _initLoadingFrames)
            {
                // Restart loading!
                _bLoading = true;
                // Jump out of this method if the initial frames have not yet been loaded
                loadImage(_aImages[_aPos[_iLoad]]);
                _bUserInteracted = true;
            }
		    
		    // Do the move
		    mouseMoveHandler(null, parseInt(data));
        }
		
		/**
		* Initialisation function
		*/
		function update()
		{
			// Save anti update variables
			var data = _instance.props.data;
			if(_sUpdateImg == data[0])return;
			_sUpdateImg = data[0];
			// Create the DOM elements for the images
			_aImages = data.map(
				function(item)
				{
					var o = $('<img/>');
					o.css('display', 'none');
					o.data({'src':item, loaded:false});
					return o;
				}
			);
			
			var i = 0,
				iLength = _aImages.length,
				img;
			
			// Clear all event handlers!
			_instance.stopLoad();
			// Instantiate the images
			_bLoaded = false;
			_bUserInteracted = false;
			
			// Calculate the positions
			_aPos = calculateMidPositions();
			// Create all images
			_iLoad = 0;
			_currentlyLoadingUrl = "";
			loadImage(_aImages[_aPos[_iLoad]]);
		}
		
		/**
		 * Method which makes sure the loading of the images stops 
		 */
		this.stopLoad = function()
		{
			// Clear all event handlers!
			if(_aImages)
			{
				var i = 0,
					iL = _aImages.length,
					img;
				for(; i < iL; i++)
				{
					img = _aImages[i][0];
					img.onload = null;
				}
			}
		};
		
		/**
		 * Method which calculates the mid positions for the full spin, with support for the 72 hero spin 
		 */
		function calculateMidPositions()
		{
			var aRegularPos = calculateRegularMidPositions(),
				aHeroPos = calculateRegularMidPositions(),
				i,
				aReturn,
				iL;
			// Update the indexes of the hero spin
			aHeroPos = aHeroPos.map(
				function(item)
				{
					return item + 36;
				}
			);	
			
			if(_iCurrentImage > 35)
			{
				aReturn = aHeroPos.concat(aRegularPos);
			}
			else
			{
				aReturn = aRegularPos.concat(aHeroPos); 
			}
			return aReturn;
		}
		
		/**
		* Method which calculates the positions used to render the car, for the 35 frames spin
		*/
		function calculateRegularMidPositions()
		{
			var i = 0,
				aPos = [],
				iPos = 0,
				pos,
				t,
				ci = _iCurrentImage > 35?_iCurrentImage - 36:_iCurrentImage,
				// These declarations contain the modification + frames AFTER the first three frames have been set
				mod =    [6,3, 2, 1], // Modification of the interval between frames calculated
				frames = [3,6,12,12]; // Amount of frames for each modification
			
			// Calculate the first three frames
			for(i; i < 3; i++)
			{
				pos = ci + (i* 12);
				// If the pos is higher then 36, subtract 36 and start all over
				if(pos > 35)
				{
					pos -= 36;
				}
				aPos.push(pos);
			}
			// Calculate the other frames arround the three base frames
			i = 0;
			t = 0;
			for(i; i < 33; i++)
			{	
				pos = aPos[iPos] + mod[t];
				// Calc bounds
				if(pos > 35)
				{
					pos -= 36;
				}
				if(pos < 0)
				{
					pos += 36;
				}
				aPos.push(pos);
				
				// Reset pos
				if(iPos == frames[t] - 1)
				{
					t ++;
					iPos = 0;
				}
				else
				{
					// Increment pos
					iPos ++;						
				}
			}
			return aPos;
		}
		
		/**
		* Method which loads an image
		* @param img:JQuerry object
		*/
		function loadImage($img)
		{
			// Add load complete handler
			$img[0].onload = imageLoadCompleteHandler;
			var url = $img.data("src");
			_currentlyLoadingUrl = url;
			// Load the image
			$img.attr({"src":url});
			// Dispatch load progress
			// TODO -> _instance.dispatchEvent({type:_instance.LOAD_PROGRESS, data:(_iLoad + 1)});
		}
		
		/**
		* Handles the error of loading an image
		* @param e:Event
		*/
		function errorHandler(e)
		{
			// TODO -> _instance.dispatchEvent({type:_instance.LOAD_ERROR});
		}
		
		/**
		* handles the complete loading of the image
		* @param e:Event
		*/
		function imageLoadCompleteHandler(e)
		{
			var $img = _aImages[_aPos[_iLoad]];
			$img.data("loaded", true);
			
			var url = $img[0]?$img[0].src:"";
			if(!$img[0] || url === "" || url != _currentlyLoadingUrl)
			{
				return;
			}
			
			// Unbind the load listener
			$img[0].onload = null;
			// If it's the first image which completed loading, show it!
			if(_iLoad === 0)
			{
				_didUpdate = true;
				// Remove all images from the container
				_$imgCont.empty();
				$img.show();
			}
			else
			{
				$img.hide();
			}
			// Add the img to the display list!
			_$imgCont.append($img);
			
			// Increment load counter
			_iLoad ++;

			// Load the next image in the que!
			if(_iLoad < _aImages.length && (_iLoad < _initLoadingFrames || _bUserInteracted))
			{
				loadImage(_aImages[_aPos[_iLoad]]);
			}
			// Load has been completed
			else if(_iLoad >= _aImages.length)
			{
				// Dispatch load complete
				_bLoaded = true;
				_bUserInteracted = true;
				_bLoading = false;
				// TODO _instance.dispatchEvent({type:_instance.LOAD_COMPLETE});
			}
			if(_iLoad == _initLoadingFrames)
			{
				_bLoading = false;
				// TODO _instance.dispatchEvent({type:_instance.PARTIAL_LOAD_COMPLETE});
			}
		}
		
		/**
		* handles the mouse down event
		* @param e:Event
		*/
		function mouseDownHandler(e)
		{
			// Stop mouse propagation
			e.preventDefault();
			
			bt.track({
                action: 'cc_action',
                value: '360-spin-ext'
            });
			
			// Get the pagex
			var pos = _utils.getPosition(e);
			
			// If the items have not been loaded yet, return!
			if(_iLoad < _initLoadingFrames) return;
			
			// Save the position where the mouse went down!
			_downX = pos.x;
			_downY = pos.y;
			_iDownImage = _iCurrentImage;
			
			// Save scroll positions
			_scrollX = window.scrollX;
			_scrollY = window.scrollY;
			
			// User interacted, load other images
			if(!_bUserInteracted && _iLoad == _initLoadingFrames)
			{
				// Restart loading!
				_bLoading = true;
				// Jump out of this method if the initial frames have not yet been loaded
				loadImage(_aImages[_aPos[_iLoad]]);
				_bUserInteracted = true;
				// Dispatch event to let the parent know that the full load has been started
				// TODO _instance.dispatchEvent({type:_instance.FULL_LOAD_START});
			}
			
			var doc = $(document);
			doc.on("mouseup", mouseUpHandler);
			doc.on("mousemove", mouseMoveHandler);
			doc.on("touchmove", mouseMoveHandler);
			doc.on("touchend", mouseUpHandler);
		}
		
		/**
		* Handles the mouse up event
		* @param e:Event
		*/
		function mouseUpHandler(e)
		{
			// Stop mouse propagation
			e.preventDefault();
			
			// Reset scroll flag
	    	_scroll = true;
			
			// Remove event listeners
			var doc = $(document);
			doc.off("mouseup", mouseUpHandler);
			doc.off("mousemove", mouseMoveHandler);
			doc.off("touchmove", mouseMoveHandler);
			doc.off("touchend", mouseUpHandler);
			
			// Reset _prevPos
			_prevPos = -1;
			_iDownImage = -1;
			
			// TODO _instance.dispatchEvent({type:_instance.NOTIFIE, data:"mouse up!"});
		}
		
		/**
		* Method which handles the moving of the mouse
		* @param e:Event
		*/
		function mouseMoveHandler(e, overrideScroll)
		{
			var prevImg;
		    if (typeof overrideScroll !== "undefined")
		    {
		        // Hide current active image
                _aImages[_iCurrentImage].hide();
                prevImg = _iCurrentImage;
                _iCurrentImage = overrideScroll;
                // Get the closest available image if the load has not completed yet
                if(!_bLoaded) {
                    if(_iCurrentImage != prevImg) {
                        getClosestAvailable(overrideScroll > prevImg);
                    }
                }
                // Show the new image
                _aImages[_iCurrentImage].show();
		    }
		    else
		    {
    			var pos = _utils.getPosition(e);
    			// Check default behavior
    			var deltaX = pos.x - _downX,
    				deltaY = pos.y - _downY;
    			if(_utils.hasTouch && Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX))
    			{
    				_scroll = false;
    			}
    			
    			// Do scroll logic
    			if(_scroll)
    			{
    				// Check existance of currentframe
    				if(!_aImages[_iCurrentImage].data("loaded"))return;
    				
    				// Calculate the base range which will be used to determine the frame
    				var calc = Math.abs(pos.x - _downX);
    				// The multiplier is used to subtract the 35 * multiplier frames of the difference in pixels between the down pos
    				var multiplier = Math.floor(calc / ((_totalFrames - 1) * _pixelChange));
    				calc = (calc / _pixelChange);
    				calc = calc - (_totalFrames - 1) * multiplier;
    				
    				// Hide current active image
    				_aImages[_iCurrentImage].hide();
    				prevImg = _iCurrentImage;
    				
    				// If the current x position is bigger then the one saved on mouse down...
    				if(_downX < pos.x)
    				{
    					_iCurrentImage = _iDownImage + Math.round(calc);
    					// Check the bounds
    					if(_iCurrentImage > (_totalFrames - 1))
    					{
    						_iCurrentImage -= _totalFrames;
    					}
    				}
    				// If the current x position is lower then the one saved on mouse up...
    				else
    				{
    					_iCurrentImage = _iDownImage - Math.round(calc);
    					// Check the bounds
    					if(_iCurrentImage < 0)
    					{
    						_iCurrentImage += _totalFrames;
    					}
    				}
    				
    				// Get the closest available image if the load has not completed yet
    				if(!_bLoaded)
    				{
    					if(_iCurrentImage != prevImg)
    					{
    						// Determine whether to rotate left or right!
    						var bLeft = pos.x < _prevPos;
    						_prevPos = pos.x;
    						getClosestAvailable(bLeft);
    					}
    				}
    				
    				// TODO _instance.dispatchEvent({type:_instance.NOTIFIE, data:"mouse move: " + _iCurrentImage});
    				
    				// Show the new image
    				_aImages[_iCurrentImage].show();
    				// <- $.publish('handleGlobalExtSpinSwipe', [_iCurrentImage]);
    				PubSub.publish('cc_salesman_extspinswipe', _iCurrentImage);
    			}
    			else
    			{
    				window.scrollTo(_scrollX - deltaX, _scrollY - deltaY);
    			}
    	    }
		}
		
		/**
		* Method which returns the first available image in the loadedimage array
		* @param bLeft:Boolean subtract or add one?
		*/
		function getClosestAvailable(bLeft)
		{
			var iL = _aImages.length;
			if(bLeft)
			{
				while(!_aImages[_iCurrentImage].data("loaded"))
				{
					_iCurrentImage --;
					if(_iCurrentImage < 0)
					{
						_iCurrentImage = iL - 1;
					}
				}
			}
			else
			{
				while(!_aImages[_iCurrentImage].data("loaded"))
				{
					_iCurrentImage ++;
					if(_iCurrentImage >= iL)
					{
						_iCurrentImage = 0;
					}
				}
			}
		}
	}
	ui.ExteriorSpin = React.createClass(
		new ExteriorSpin()
	);
	
})();