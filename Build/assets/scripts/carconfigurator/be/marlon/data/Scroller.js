/**
 * Global class used for scrolling the different lists
 */
(function() {
	/**
	 * Scroller class 
	 */
	be.marlon.Scroller = function()
	{
		// Local variables
    	var _instance = this,
    		_downX = 0,
    		_contDownPos = 0,
    		_downY = 0,
    		_deltaX = 0,
    		_deltaY = 0,
    		_scrollX = 0,
    		_scrollY = 0,
    		_allowDrag = false,
    		_scroll = true,
    		_utils = be.marlon.utils,
    		
    		_paging,
    		_$tc,
    		_$container,
    		
    		// DEBUG FLAG
    		_debug = false;
    		
    	/**
    	 * Method which initializes the scrolling
    	 * @param $tc:JQuery object
    	 * @param $cont:JQuery object 
    	 * @param paging:Paging instance
    	 */
    	this.init = function($tc, $cont, pag)
    	{	
    		// Clean up if it existed before
    		if(_$tc)
    		{
    			this.disable();
    		}
    		
    		_$tc = $tc;
    		_$container = $cont;
    		_paging = pag;
    		
    		// Check all children of the list if they contain click handlers, if so remove them and add custom logic
    		checkChildren(_$tc);
    		
    		_$tc.on("touchstart", mouseDownHandler);
    		if(_debug)_$tc.on("mousedown", mouseDownHandler);
    	};
    	
    	/**
    	 * Method which cleans up scroller functionality 
    	 */
    	this.disable = function()
    	{
    		if(_$tc)
    		{
    			_$tc.off("touchstart", mouseDownHandler);
    			var doc = $(document);
    			doc.off("touchmove", mouseMoveHandler);
    			doc.off("touchend", mouseUpHandler);
    			
    			if(_debug)_$tc.off("mousedown", mouseDownHandler);
    		}
    	};
    	
    	/**
    	 * Method which checks if the scroller is dragging 
    	 */
    	this.isDragging = function()
    	{
    		return _allowDrag;
    	};
    	
    	/**
    	 * Method which loops through all the children and remaps the clickhandlers 
    	 */
    	function checkChildren($ele)
    	{
    		var childs = $ele.children(),
    			i = 0,
    			iL = childs.length;
    		for(; i < iL; i++)
    		{
    			$ele = childs[i];
    			if($ele.onclick !== null)
    			{
    				$ele.toucheventhandler = $ele.onclick;
    				$ele.onclick = null;
    			}
    			checkChildren($($ele));
    		}
    	}
    	
    	 /**
	     * Method which handles the mouse down on the list div
	     * @param e:EventObject 
	     */
	    function mouseDownHandler(e)
	    {
	    	// Get the pos
			var pos = _utils.getPosition(e);
			// Save down pos
			_deltaX = 0;
			_deltaY = 0;
			_scrollX = window.scrollX;
			_scrollY = window.scrollY;
			_downX = pos.x;
			_downY = pos.y;
			_contDownPos = Number(_$container.css('left').replace('px', ''));
			// Don't allow drag!
			_allowDrag = false;
			var doc = $(document);
			// Add event listeners
			doc.on("touchmove", mouseMoveHandler);
			doc.on("touchend", mouseUpHandler);
			if(_debug)
			{
				doc.on("mousemove", mouseMoveHandler);
				doc.on("mouseup", mouseUpHandler);
			}
	    }
	    
	    /**
	     * Method which handle the mouse move on the documen
	     * @param e:EventObject 
	     */
	    function mouseMoveHandler(e)
	    {
	    	// Get pos
	    	var pos = _utils.getPosition(e);
			e.preventDefault();
			
			// Check dragging
			_deltaX = pos.x - _downX;
			if(Math.abs(_deltaX) > 12)
			{
				_allowDrag = true;
			}
			
			// Check default behavior
			_deltaY = pos.y - _downY;
			if(Math.abs(_deltaY) > 25 && Math.abs(_deltaY) > Math.abs(_deltaX))
			{
				_scroll = false;
			}
			
			// Prevent the default if it is required
			if(_scroll)
			{
				//e.stopPropagation();
				if(_allowDrag)_$container.css('left',(_contDownPos + _deltaX) + 'px');
			}
			// Scroll the page
			else
			{
				window.scrollTo(_scrollX - _deltaX, _scrollY - _deltaY);
			}
	    }
	    
	    /**
	     * Method which handles the mouse up on the document
	     * @param e:EventObject 
	     */
	    function mouseUpHandler(e)
	    {
	    	// Reset list scroll flag
	    	_scroll = true;
	    	var doc = $(document);
	    	// Remove event listeners
			doc.off("touchmove", mouseMoveHandler);
			doc.off("touchend", mouseUpHandler);
			if(_debug)
			{
				doc.off("mousemove", mouseMoveHandler);
				doc.off("mouseup", mouseUpHandler);
			}
			// If drag has not yet been allowed when clicking, check for click handler on parent elements
	    	if(!_allowDrag)
	    	{
	    		var o = $(e.target);
	    		while(o && o.length > 0 && (typeof o[0].toucheventhandler === "undefined") && (typeof o[0].className !== "undefined") && !o.hasClass('cc-list'))
	    		{
	    			o = o.parent();
	    		}
	    		if(o && o.length > 0 && (typeof o[0].toucheventhandler !== "undefined"))
	    		{
	    			o[0].toucheventhandler(e);
	    		}
	    	}
	    	else
	    	{	
	    		// Go to the previous page
		    	if(_deltaX > 170)
		    	{
		    		_paging.prev();
		    	}
		    	// Go to the next page!
		    	else if(_deltaX < -170)
		    	{
		    		_paging.next();
		    	}
		    	// Move back!
		    	else
		    	{
		    		_paging.reset();
		    	}
			}
	    }
	};
})();
