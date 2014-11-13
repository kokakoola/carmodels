/** @jsx React.DOM */
(function() {
	// Define location in the namespace
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag;
	/**
	* The interior spin plug in containing logic for rendering the interior spin
	*/
	function InteriorSpin()
	{
		// Constants
		var SIZE = 968 * 0.5; // Size of Sprites / 2
		var CANVAS_CENTER_X =  SIZE; //385; // ViewPort-Width / 2
		var CANVAS_CENTER_Y = 260; //169; //260; // ViewPort-Height / 2
		
		var _fov = 460, //400,		
		// Sprite3D Stage
			_stage,
			_cube,
			_instance,
			
			_sUpdateImg, // Img used to check if the spin should be updated or not
		
		// RotationVariables
			_horizontalAngle = 0,
			_verticalAngle = 346,
		
		// Mouse & Touch variables
			_startDragX = 0,
			_startDragY = 0,
			_dragging = false,
			_xSpd = 0,
			_ySpd = 0,
			_onEF,
			
			_didUpdate = true,
			
			_zOffset = 1,
			_extraSize = 4, // this variable holds the amount of pixels the extra planes get expanded with
			
		// Variable which contains the numeric reference of the loaded images
			_loaded = 0,			
		
		// 12 Cube planes
        	_planes = {
	            "top" :    {xRotOffset:-90, yRotOffset:  0, zRotOffset:  0, minH: -1, maxH: -1, invH:false, minV:269, maxV:346, aaH:true,  aaV:true},
				"top_s" :    {xRotOffset:-90, yRotOffset:  0, zRotOffset:  0, minH: -1, maxH: -1, invH:false, minV:269, maxV:346, aaH:true,  aaV:true, offset:true},
	            "bottom" : {xRotOffset: 90, yRotOffset:  0, zRotOffset:  0, minH: -1, maxH: -1, invH:false, minV: 14, maxV: 91, aaH:true,  aaV:true},
				"bottom_s" : {xRotOffset: 90, yRotOffset:  0, zRotOffset:  0, minH: -1, maxH: -1, invH:false, minV: 14, maxV: 91, aaH:true,  aaV:true, offset:true},
	            "front" :  {xRotOffset:  0, yRotOffset:  0, zRotOffset:  0, minH:103, maxH:257, invH:false, minV: -1, maxV: -1, aaH:true,  aaV:false},
				"front_s" :  {xRotOffset:  0, yRotOffset:  0, zRotOffset:  0, minH:103, maxH:257, invH:false, minV: -1, maxV: -1, aaH:true,  aaV:false, offset:true},
	            "back" :   {xRotOffset:  0, yRotOffset:180, zRotOffset:  0, minH: 77, maxH:283, invH:true,  minV: -1, maxV: -1, aaH:true,  aaV:false},
				"back_s" :   {xRotOffset:  0, yRotOffset:180, zRotOffset:  0, minH: 77, maxH:283, invH:true,  minV: -1, maxV: -1, aaH:true,  aaV:false, offset:true},
	            "left" :   {xRotOffset:  0, yRotOffset: 90, zRotOffset:  0, minH: 14, maxH:168, invH:false, minV: -1, maxV: -1, aaH:false, aaV:false},
				"left_s" :   {xRotOffset:  0, yRotOffset: 90, zRotOffset:  0, minH: 14, maxH:168, invH:false, minV: -1, maxV: -1, aaH:false, aaV:false, offset:true},
	            "right" :  {xRotOffset:  0, yRotOffset:-90, zRotOffset:  0, minH:192, maxH:346, invH:false, minV: -1, maxV: -1, aaH:false, aaV:false},
				"right_s" :  {xRotOffset:  0, yRotOffset:-90, zRotOffset:  0, minH:192, maxH:346, invH:false, minV: -1, maxV: -1, aaH:false, aaV:false, offset:true}
        	};
		
		// ###########################
		// Public methods
		// ###########################
		
		/**
		 * Method which gets the current settings/properties 
		 */
		this.getProperties = function()
		{
			return {
					va:_verticalAngle,
					ha:_horizontalAngle
					};
		};
		
		/**
		 * Method which sets the current settings/properties 
		 */
		this.setProperties = function(prop)
		{
			_verticalAngle = prop.va;
            _horizontalAngle = prop.ha;
		};
		
		/**
		 * Method used to activate the control 
		 */
		this.activate = function()
		{
			renderCube();
		};
		
		// ###########################
		// Private methods
		// ###########################
		
		/**
		* Initialisation function
		*/
		function update(aImages)
		{
			// If there is a 3D rendering of the interior
			if(_stage)
			{
				// Reset loaded
				_loaded = 0;
				// The children of the cube
				var childs = _cube.children,
					top = childs[0].domElement,
					bottom = childs[2].domElement,
					front = childs[4].domElement,
					back = childs[6].domElement,
					left = childs[8].domElement, 
					right = childs[10].domElement,
					imgs = $(_cube.domElement).find('img'),
					img,
					i = 0,
					iL = imgs.length;
				
				// Remove all possible event listeners which are still active
				for(; i < iL; i++)
				{
					img = imgs[i];
					img.onload = null;
				}
				
				// Load all images
				loadImage(top, aImages[5]);
				loadImage(bottom, aImages[4]);
				loadImage(front, aImages[0]);
				loadImage(back, aImages[2]);
				loadImage(left, aImages[1]);
				loadImage(right, aImages[3]);
				// Load the extra planes to
				loadImage(childs[1].domElement,createBigImg(aImages[5]));
				loadImage(childs[3].domElement,createBigImg(aImages[4]));
				loadImage(childs[5].domElement,createBigImg(aImages[0]));
				loadImage(childs[7].domElement,createBigImg(aImages[2]));
				loadImage(childs[9].domElement,createBigImg(aImages[1]));
				loadImage(childs[11].domElement,createBigImg(aImages[3]));
			}
			renderCube();
		}
		
		/**
		 * Create the big images to fix the thin "white" line behind some of the panes 
		 */
		function createBigImg(s)
		{
			s = s.replace(/(width=)([0-9]+)/, matchReg);
            s = s.replace(/(height=)([0-9]+)/, matchReg);
			return s;
		}
		
		/**
		 * Create the new widths
		 */
		function matchReg(s, s1, s2)
		{
			return (s1 + (Number(s2) + _extraSize));
		}
		
		/**
		 * Method which starts loading the image for the specific pane
		 * @param pane:JObject reference to the container div
		 * @param url:String pointing to the image which needs to be loaded
		 */
		function loadImage(pane, url)
		{
			var $img = $('<img/>');
			// Add load complete handler
			$img[0].onload = imageLoadCompleteHandler;
			// Load the image
			$img.attr({"src":url});
			$img.hide();
			pane.appendChild($img[0]);
		}
		
		/**
		* Handles the error of loading an image
		* @param e:Event
		*/
		function errorHandler(e)
		{
			//_instance.dispatchEvent({type:_instance.LOAD_ERROR});
			//console.log("error loading interior image");
		}
		
		/**
		* handles the complete loading of the image
		* @param e:Event
		*/
		function imageLoadCompleteHandler(e)
		{
			// Unbind the load listener
			this.onload = null;
			//J.removeEvent(this, "onload", imageLoadCompleteHandler);
			//J.removeEvent(this, "error", errorHandler);
			if(_loaded === 0)_didUpdate = true;
			_loaded ++;
			// If all sides have been loaded
			if(_loaded == 12)
			{
				// The children of the cube
				var childs = _cube.children,
					$img;
				
				var i = 0,
					iL = childs.length,
					$ele;
				for(; i < iL; i++)
				{
					$ele = $(childs[i].domElement);
					$img = $ele.children().last();
					$img.show();
					$ele.empty();
					$ele.append($img);
				}
			}
		}
		
		/**
		 * Method which initizalizes the cube!
		 * @param cont:DomObject object which will be used to initialize the cube 
		 */
		function initCube(cont)
		{
			// 1. Generate stage-object
			_stage = new ui.Sprite3D(cont);
			_cube = new ui.Sprite3D()
						.setZ(_fov)
						.setX(CANVAS_CENTER_X)
						.setY(CANVAS_CENTER_Y)
						.update();
			_stage.addChild(_cube);
			// 2. Generate planes
			for (var key in _planes) { createPlane(key); }
			// 3. Render planes
			renderCube();
			// 4. Enable user input
			var st = $(_stage.domElement);
			st.on("mousedown", onMouseDown);
			st.on("touchstart", onTouchStart);
			// List for simulate
			// -> $.subscribe('simulateIntSpinSwipe', handleSimulateSpin('simulateIntSpinSwipe'));
			PubSub.subscribe("cc_simulate_intspinswipe", handleSimulateSpin);
		}
		
		function createPlane(type)
		{
			// Get type data
            var data = _planes[type],
				offset = _extraSize * 0.5,
				sz = SIZE,
				sd = SIZE;
			// Adjust the size
			sz += (data.offset?offset:0);
			sd += (data.offset?_zOffset:0);
			
			var plane = new ui.Sprite3D()
					.setClassName("image" + (data.offset?" expand":""))
					.setTransformOrigin( 0, 0 )
					//.setPosition( (data["aaH"]?-1:0)-SIZE, (data["aaV"]?-1:0)-SIZE, -SIZE )
					//.setPosition(-SIZE, -SIZE, -SIZE)
					.setPosition(-sz, -sz, -sd )
					.rotateY( data.yRotOffset )
					.rotateX( data.xRotOffset )
					.rotateZ( data.zRotOffset )
					.setRotateFirst(true)
					.update();
			data.img = plane;
			_cube.addChild(plane);
		}
		
		function renderCube()
		{	
			// Rotate cube
			_cube.setRotationY(_horizontalAngle);
			_cube.setRotationX(_verticalAngle);
			_cube.update();
			// Loop through planes and set visible/insivible
			var plane;
			var visible;
			for (var key in _planes)
			{
				plane = _planes[key];
				visible = true;
				if (!plane.invH) {
					if (_horizontalAngle > plane.minH && _horizontalAngle < plane.maxH) { visible = false; }
				} else {
					if (_horizontalAngle < plane.minH || _horizontalAngle > plane.maxH) { visible = false; }
				}
				if (_verticalAngle > plane.minV && _verticalAngle < plane.maxV) { visible = false; }
				plane.img.style.display = visible ? "block" : "none";
			}
			// Pass values to salesman
			// <- $.publish('handleGlobalIntSpinSwipe', [_horizontalAngle, _verticalAngle]);
			if (!isNaN(_horizontalAngle) && !isNaN(_verticalAngle))
			{
			    PubSub.publish("cc_salesman_intspinswipe", {horizontal:_horizontalAngle, vertical:_verticalAngle});
			}
		}
		
		// STARTING DRAG
		function onTouchStart(evt)
		{
			evt.preventDefault();
			var e = evt.obj?evt.obj:evt;
			var doc = $(document);
			doc.on("touchmove", onTouchMove);
			doc.on("touchend", onTouchEnd);
			if(e.originalEvent)e = e.originalEvent;
			startDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
		}
		function onMouseDown(evt)
		{
			evt.preventDefault();
			var e = evt.obj?evt.obj:evt;
			
			var doc = $(document);
			doc.on("mousemove", onMouseMove);
			doc.on("mouseup", onMouseUp);
			
			startDrag(e.clientX, e.clientY);
		}
		function startDrag(xStart, yStart)
		{
			bt.track({
                action: 'cc_action',
                value: '360-spin-int'
            });
			// Start the drag
			_startDragX = xStart;
			_startDragY = yStart;
			// Add drag handler
			_dragging = true;
			clearInterval(_onEF);
			_onEF = setInterval(tweenCube, 33);
		}
		
		// DRAGGING
		function onTouchMove(evt)
		{
			evt.preventDefault();
			var e = evt.obj?evt.obj:evt;
			if(e.originalEvent)e = e.originalEvent;
			dragCar(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
		}
		function onMouseMove(evt)
		{
			evt.preventDefault();
			var e = evt.obj?evt.obj:evt;
			dragCar(e.clientX, e.clientY);
		}
		function dragCar(xDrag, yDrag)
		{
			// Rotate image
			if (_dragging)
			{
				_xSpd -= (xDrag - _startDragX);
				_startDragX = xDrag;
				_ySpd += (yDrag - _startDragY);
				_startDragY = yDrag;
			}
		}
		
		// STOPPING DRAG
		function onMouseUp(evt)
		{
			evt.preventDefault();
			_dragging = false;
			
			var doc = $(document);
			doc.off("mousemove", onMouseMove);
			doc.off("mouseup", onMouseUp);
		}
		function onTouchEnd(evt)
		{
			evt.preventDefault();
			_dragging = false;
			
			var doc = $(document);
			doc.off("touchmove", onTouchMove);
			doc.off("touchend", onTouchEnd);
		}
		
		// ANIMATE ROTATION
		function tweenCube()
		{
			// Rotate and render cube
			_xSpd *= 0.8;
			_ySpd *= 0.8;
			_horizontalAngle = _horizontalAngle + (_xSpd/25);
			_verticalAngle = _verticalAngle + (_ySpd/25);
			// Keep angles in 0°-360° range (Modulo doesn't work properly in javascript.. hence the 360%)+360)%360 )
			_horizontalAngle = ((_horizontalAngle%360)+360)%360;
			_verticalAngle = ((_verticalAngle%360)+360)%360;
			// Limit verticalAngle
			if (_verticalAngle > 90 && _verticalAngle < 270)
			{
				_verticalAngle = ((_verticalAngle - 180) < 0) ? 90 : 270; 
			}
			renderCube();
			// Stop interval when user stopped dragging
			if (!_dragging && Math.abs(_xSpd) <= 1 && Math.abs(_ySpd <= 1))
			{
				_xSpd = 0;
				_ySpd = 0;
				clearInterval(_onEF);
			}
		}
		
		// DEBUG (ZOOM CAR)
		function onMouseWheel(evt)
		{
			evt.preventDefault();
			evt = window.event || evt; //equalize event object
			var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta; //check for detail first so Opera uses that instead of wheelDelta
			_fov += (delta > 0) ? 10 : -10;
	   		_cube.setZ(_fov);
	   		renderCube();
		}
		
		function handleSimulateSpin(msg, data) {
            _horizontalAngle = parseFloat(data.horizontal);
            _verticalAngle = parseFloat(data.vertical);
            renderCube();
        }
		
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
				initCube($(this.getDOMNode()).find('.cc-interior-spin')[0]);
			}
		};
		
		/**
		 * Method which handles the updating of the interior spin 
		 */
		this.componentDidUpdate = function()
		{
			// Don't update if it isn't necessary
			if(this.props.data.length > 0)
			{
				if(_sUpdateImg != this.props.data[0])_didUpdate = false;
				_sUpdateImg = this.props.data[0];
				
				if(this.props.visible && !_didUpdate)update(this.props.data);
			}
		};
		
		/**
		 * Method which handles the unmounting 
		 */
		this.componentWillUnmount = function()
		{
			var st = $(_stage.domElement);
			st.off("mousedown", onMouseDown);
			st.off("touchstart", onTouchStart);
		};
		
		/**
		 * Method used to render the component 
		 */
		this.render = function()
		{
			return(
				React.DOM.div( {className:"cc-container"}, 
					React.DOM.div( {className:"cc-interior-spin", style:{display:(this.props.visible?'block':'none')}}
					)
				)
			);
		};
	}
	ui.InteriorSpin = React.createClass(
		new InteriorSpin()
	);
})();