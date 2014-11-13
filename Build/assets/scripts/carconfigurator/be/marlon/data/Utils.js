/** @jsx React.DOM */
/**
 * Toyota HTML5 Utility file which includes all kind of handy utility functions
 */
(function() {
	if(typeof be.marlon.utils == "undefined")
    {
    	// Define the steps in this utils object
        be.marlon.utils = {
        	FILTERSTEP:0,
        	PROMOTIONS:1,
			SUBMODELS:2,
			BODYTYPES:3,
			ENGINE_GRADES:4,
			EXTERIOR:5,
			INTERIOR:6,
			ACCESSORIES:7,
			SUMMARY:8,
			FINANCING:9,
			INSURANCE:10,
			
			EXT:"ext",
			INT:"int",
			EXT_LIGHT:"exterior-light",
			EXT_DARK:"exterior-dark",
			INT_LIGHT:"interior-light",
			INT_DARK:"interior-dark",
			XRAY_4X4:"xray-4x4",
			XRAY_HYBRID:"xray-hybrid",
			XRAY_SAFETY:"xray-safety",
			NIGHT:"night",
			BOOT:"boot",
			
			TINY:"tiny",
			SMALL:"small",
			LARGE:"large",
			
			GOTO_MY_TOYOTA:"goto_my_toyota",
			SUMMARY_BTN_CLICKED:"summary_clicked", // Internal pubsub event
			CTA_CLICKED:"summ_cta_clicked", // External pubsub event
			
			TOUCH_CLICK:"cc_touch_clicked", // Because the salesmann app only listents to clicks, we also have to publish this event when only touchUp is defined
			
			PLACEHOLDER:"cc-missing" // The placeholder image for when assets are missing for the accessories or options
        };
    }
    
 	var utils = be.marlon.utils;
 					
 	utils.hasTouch = (function()
 		{	
 							// works on most browsers			// works on ie10;
 			var hasTouch = !!('ontouchstart' in window) || !!('onmsgesturechange' in window);
 			if(hasTouch)
 			{
 				var ua = navigator.userAgent;
 				hasTouch = (ua.match(/Android/i) || 
 					ua.match(/webOS/i) || 
 					ua.match(/iPhone/i) || 
 					ua.match(/iPad/i) || 
 					ua.match(/iPod/i) || 
 					ua.match(/BlackBerry/i) || 
 					ua.match(/Windows Phone/i))?true:false;
 			}
			return hasTouch;
 		})();
 	// Boolean which is used to determine settings specific for the salesman slave
 	utils.smSlave = false;
 	utils.smMaster = false;
 	// Save the CARDB asset path
 	utils.cardbAssetPath = "";
 	// Save the search functionality availability
 	utils.enableListSearch = false;
 	// Seve the hasPrice value
 	utils.hasPrice = false;
 	 
    /**
     * The dictionary this function get's initialized in the CarConfig!
     */
    utils.Dictionary = function()
    {
    	var _instance = this,
    		_labels;
    	
    	this.EMPTY = "not_found";
    	
    	/**
    	 * Initialisation function 
    	 */
    	this.init = function(labels)
    	{
    		_labels = labels;
    	};
    	
    	/**
    	 * Method which returns a label 
    	 */
    	this.getLabel = function(key)
    	{
    		return _labels[key]?_labels[key]:_instance.EMPTY;
    	};
    };
    utils.Dictionary = new utils.Dictionary();
    
    /**
     * This property refers the function from the carconfigurator controller in this .js file
     * @param formatPrice:Function 
     */
    utils.formatPrice = null;
    
    /**
     * Method which is used to check two arrays against each other, to see if there is a difference 
     */
    utils.checkArrays = function(a1, a2, prop, prop2)
    {
    	if(a1.length != a2.length) return false;
    	var i = 0,
    		iL = a1.length;
    	for(; i < iL; i++)
    	{
    		if(prop && prop2)
    		{
    			if(a1[i][prop][prop2] != a2[i][prop][prop2])return false;
    		}
    		else if(prop)
    		{
    			if(a1[i][prop] != a2[i][prop])return false;
    		}
    		else
    		{
    			if(a1[i] != a2[i])return false;
    		}
    	}
    	return true;
    };
    
    /**
     * Method which retrieves the CARDB asset used for rendering the images 
     */
    utils.getCARDBAsset = function(assets, returnPlaceHolder, checkSelector)
    {
    	var asset = getAsset(assets, "IMG_PNG_285x260");
    	if(asset) return asset;
    	if(checkSelector)
    	{
    		asset = getAsset(assets, "SELECTOR");
    		if(asset) return asset;
    	}
		
		return returnPlaceHolder?this.PLACEHOLDER:"";
    };
    
    /**
     * Helper method for the getCARDBAsset function
     * @param type:String 
     */
    function getAsset(assets, type)
    {
    	var i = 0,
			iLength = assets.length;
		for(; i < iLength; i++)
		{
			if(assets[i].Type == type)
			{
				return utils.createResizableAsset(assets[i].Url);
				//return assets[i].Url;
			}
		}
		return false;
    }
    
    /**
     * Utility method which creates a resizable asset 
     */
    utils.createResizableAsset = function(url)
    {
    	var regEx = /(\d|\w){8}-(\d|\w){4}-(\d|\w){4}-(\d|\w){4}-(\d|\w){12}.*/,
			o;
		o = regEx.exec(url);
		return utils.cardbAssetPath + "{SIZE}/" + o[0];
    };
    
    /**
     * Method which checks if an ID is present in the searched array 
     */
    utils.checkID = function(id, arr)
    {
    	var i = 0,
			iL = arr.length;
		for(; i < iL; i++)
		{
			if(arr[i].ID == id)return true;
		}
		return false;
    };
    
    /**
     * Method which checks if the item is present in the array 
     */
    utils.getItem = function(item, arr, prop)
    {
    	var i = 0,
    		iL = arr.length;
    	for(; i < iL; i++)
    	{
    		if(prop)
    		{
    			if(item === arr[i][prop])return arr[i];
    		}
    		else
    		{
    			if(item === arr[i])return arr[i];
    		}
    	}
    	return null;
    };
    
    /**
     * Method which calculates the height based on the children
     * @param $ele:JQuery element 
     */
    utils.getHeight = function($ele)
    {
    	var i = 0,
    		arr = $ele.children(),
    		iL = arr.length,
    		h = 0;
    	for(; i < iL; i++)
    	{
    		h += $(arr[i]).height();
    	}
    	return h;
    };
    
    /**
     * Method used to navigate to a specific promotion index disclaimer 
     */
    utils.navigateToDisclaimer = function(e)
    {
    	var guid = $(e.target).data('guid'),
    		o = $("#q" + guid);
    	window.scrollTo(0, o.offset().top);
    };
    
    /**
     * Method which fetches the position of the event
     * @param e:Event 
     */
    utils.getPosition = function(e)
    {
    	var event = e.originalEvent?e.originalEvent:e,
    		pageX,
    		pageY;
		if(event && event.targetTouches)
		{
			var tt = event.targetTouches[0];
			pageX = tt.clientX;
			pageY = tt.clientY; 
		}
		else
		{
			pageX = e.pageX;
			pageY = e.pageY;
		}
		return {x:pageX, y:pageY};
    };
    
    /**
     * Method which converts a string to a hashcode 
     * @param String:str
     */
    utils.stringToHashCode = function(str) {
        var hash = 0, i, chr, len;
        if (str.length === 0) return hash;
        for (i = 0, len = str.length; i < len; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };
    
    /**
     * React component which implements touch events to simulate a click 
     */
    utils.TouchClicker = React.createClass(
    	{displayName: 'TouchClicker',
    		_pos:null,
    		_executeClick:true,
    		/**
    		 * Method which handles the touchStart 
    		 */
    		onTouchStart:function(e)
    		{
    			var touch = e.targetTouches[0];
    			this._pos = {
    				x:touch.clientX,
    				y:touch.clientY
    			};
    		},
    		
    		/**
    		 * Method which handles the touchMove event 
    		 */
    		onTouchMove:function(e)
    		{
    			var margin = 12,
    				touch = e.targetTouches[0];
    				
    			if(
    				Math.abs(this._pos.x - touch.clientX) > 12 ||
    				Math.abs(this._pos.y - touch.clientY) > 12)
    			{
    				this._executeClick = false;
    			}
    		},
    		
    		/**
    		 * Method which handles the touchEnd 
    		 */
    		onTouchEnd:function(e)
    		{
    			if(this._executeClick)
    			{
    				//
    				/*console.log(e.targetTouches);
    				console.log(e.changedTouches);
    				console.log(e.touches);
    				console.log($(e.currentTarget));
    				console.log($(e.changedTouches[0].target));
    				console.log($(e.currentTarget).data("reactid"));
    				console.log($(e.changedTouches[0].target).data("reactid"));*/
    				var id = (e && e.changedTouches && e.changedTouches.length > 0)?$(e.changedTouches[0].target).data("reactid"):"";
    				this.props.clickHandler(e);
    				if(id !== "")PubSub.publish(utils.TOUCH_CLICK, id);
    			}
    			this._executeClick = true;
    		},
    		
    		/**
    		 * Method which handles the regular click 
    		 */
    		onClick:function(e)
    		{
    			this.props.clickHandler(e);
    		},
    		
	    	/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var ct = this.props.content;
				
				if(utils.hasTouch)
				{
					ct.props.onTouchStart=this.onTouchStart;
					ct.props.onTouchMove=this.onTouchMove;
					ct.props.onTouchEnd=this.onTouchEnd;
				}
				else
				{
					ct.props.onClick=this.onClick;
				}
				
				return this.props.content;
			}
		}
    );
})();
