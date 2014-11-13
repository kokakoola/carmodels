/** @jsx React.DOM */
(function() {
	/**
     * List component, contains list-logic
     * It makes sure when retrieving the array of React elements, the elements returned are mounted and can be manipulated with JQuery or whatever
     * All elements referenced in set-data should contain the properties:
     * componentDidMount
     * componentWillUnmount
     * key (which references the ID of the element)
     * state defined with property "selected"
     */
	var ui = be.marlon.ui;
	/**
	 * @param _multi:Boolean indicating if multiple selection is possible in the list 
	 */
	ui.List = function(_multi)
	{
		var _data = [],
			_sorted = false,
			_cb = null,
			_utils = be.marlon.utils;
		
		/**
		 * Method which selects an item in the list
		 * !Important the item must have a state property selected and related logic
		 * @param key:String OR Array of id's which matches one or more of the elements in the _data array
		 * @param cb:Function method called when the state has been set 
		 */
		this.select = function(key, cb)
		{
			_cb = cb;
			var i = 0,
    			iL = _data.length,
    			o,
    			update;
    		
    		var stateUpdated = null; 
    		if(_cb)
    		{
    			stateUpdated = _.after(_data.length, stateSetComplete);
    		}
    		for(; i < iL; i++)
    		{
    			o = _data[i];
    			// If it's an Array, select all the elements in the array and unselect the ones which are not present
				if(typeof key === "object" && key !== null)
				{
					o.setState({selected:_utils.getItem(o.props.key, key)}, stateUpdated);
				}
				else
				{
					o.setState({selected:(o.props.key === key)}, stateUpdated);
				}
    		}
		};
		
		/**
		 * Method which toggles an item in the list
		 * @param key:String id of the item which need to be toggled
		 */
		this.toggle = function(key)
		{
			var i = 0,
				iL = _data.length,
				o;
			for(; i < iL; i++)
			{
				o = _data[i];
				if(key === o.props.key)
				{
					o.setState({selected:!o.state.selected});
					return !o.state.selected;
				}
			}
			return false;
		};
		
		/**
		 * Method which handles the event if the state has been set on the items 
		 */
		function stateSetComplete()
		{
			_cb();
		}
		
		/**
		 * Method which returns the selected items 
		 */
		this.getSelected = function()
		{
			var i = 0,
				arr = this.getData(),
				iL = arr.length,
				ret = _multi?[]:null;
			for(; i < iL; i++)
			{
				if(arr[i].state.selected)
				{
					if(_multi)
					{
						ret.push(arr[i]);
					}
					else
					{
						ret = arr[i];
						break;
					}
				}
			}
			return ret;
		};
		
		/**
		 * Method which contains the data into the _data property 
		 */
		this.setData = function(arr)
		{
			_sorted = false;
			// Add callbacks to the elements in the array
			var i = 0,
				iL = arr.length,
				o;	
			for(; i < iL; i++)
			{
				// Check if the data object is not set yet
				o = arr[i].props;
				// To avoid the overriding of an already defined mountCallback, save the function in a temporary variable
				if(o.componentDidMount)o._mountCallback = o.componentDidMount;
				// Overwrite/set the mountHandlers as defined by the mixins of the elements in the list
				o.componentDidMount = componentMountHandler;
				o.componentWillUnmount = componentUnMountHandler;
			}
		};
		
		/**
		 * Method which returns the data 
		 */
		this.getData = function()
		{
			// Sort the items based on the index in the DOM
			if(!_sorted)
			{
				_data.sort(
					function(a,b)
					{
						return $(a.getDOMNode()).index() - $(b.getDOMNode()).index();
					}
				);
				_sorted = true;
			}
			return _data;
		};
		
		/**
    	 * Method which handles the mounting of an item
    	 * @param item:React Object 
    	 */
    	function componentMountHandler(item)
    	{
    		// Check if there is already an instance of the item being mounted, if so remove it
    		var i = 0,
    			iL = _data.length;
    		for(; i < iL; i++)
    		{
    			if(_data[i] === item)return;
    		}
    		_data.push(item);
    		// Do the main callback if it exists
    		if(item.props._mountCallback)item.props._mountCallback(item);
    	}
    	
    	/**
    	 * Method which handles the unmounting of an item
    	 * @param item:React object 
    	 */
    	function componentUnMountHandler(item)
    	{
    		var i = 0,
    			iL = _data.length;
    		for(; i < iL; i++)
    		{
    			if(_data[i] == item)
    			{
    				_data.splice(i,1);
    				break;
    			}
    		}
    	}
    	
    	
	};
})();
