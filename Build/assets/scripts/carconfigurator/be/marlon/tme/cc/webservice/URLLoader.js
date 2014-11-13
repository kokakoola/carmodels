be.marlon.URLLoader = function(_POST, _GET)
{
	var _http_request = false;
	
	// Initialize public properties
	this.startDate = null;
	this.event = null;
	this.parseFunction = null;
	this.type = null;
	this.url = null;
	
	// reference the URLLoader into a global variable
	var _instance = this;
	
	// private reference to the callback responder
	var _callBackResponder;
	
	/**
	* Method which returns the http request
	*/
	this.getRequest = function()
	{
		return _http_request;
	};
	
	/**
	* Method which aborts the current _http_request
	*/
	this.abort = function(removeHandlers)
	{
		if(removeHandlers)
		{
			_http_request.onload = null;
			_http_request.onerror = null;
			_http_request.onreadystatechange = null;
			_http_request.onprogress = null;
			_http_request.ontimeout = null;
		}
		_http_request.abort();
	};
	
	/**
	* Starts the loading of the _http_request object
	* @param url:String the url to call
	* @param params:Array additional parameters to send through the _http_resuest object
	* @param event:DataEvent the dataevent related to the call which is dispatched on complete!
	* @param parseFunction:Function the parseFunction for the _http_request
	* @param callBackResponder:Function the responder function to use
	* @param type:String type of call to be made, post or get
	* @param synchornous:Boolean if the http request has to be fired asynchronous or not
	*/
	this.load = function(url, params, event, parseFunction, callBackResponder, type, async)
	{
		// Save the url
		this.url = url;
		// Initialize the _http_request
		var ieX = init();
		
		if(_http_request)
		{
			// Reference the callback responder
			_callBackResponder = callBackResponder;
			
			// If it's a get, add the params to the url
			if(type === _GET && params)url += params;
			// Open the request
			_http_request.open(type, url, async);
			if(!ieX)
			{
				//_http_request.setRequestHeader("Content-Type","application/json;charset=utf-8");
				_http_request.setRequestHeader("Content-Type","text/plain;charset=UTF-8");
			}
			// Set the responder function
			if(async)_http_request.onreadystatechange = responder;
			// Apply other logic when there is an XDomainRequest and a crossdomain call is made
			if(ieX)
			{
				_http_request.onload = onLoadHandler;
				_http_request.onerror = onLoadError;
				// All handlers need to be specified else it happens that IE cancels load...
				_http_request.onprogress = function() {};
			}
			// Handle the timeout if relevant
			if(typeof(_http_request.ontimeout) != "undefined")
			{
				_http_request.ontimeout = timeouthandler;
			}
			// Fill in the required extra parameters
			this.startDate = (new Date()).getTime();
			this.event = event;
			this.parseFunction = parseFunction;
			
			// Send the params
			if(type === _POST)
			{
				if(params)
				{
					_http_request.send(be.marlon.Utility.stringify(params));
				}
				else
				{
					_http_request.send("{}");
				}
			}
			else if(type === _GET)
			{
				_http_request.send();
			}
			
			// If it's a synchronous call, call the responder emmidiately
			if(!async)responder(this);
		}
	};
	
	/**
	* Method which handles the actual response from the httpRequest
	*/
	function responder()
	{
		// Call the callback responder
		_callBackResponder(_instance);
	}
	
	/**
	 * Method which handles the load complete from the httpRequest
	 */
	function onLoadHandler()
	{
		_http_request.status = 200;
		_http_request.readyState = 4;
		// Call the callback responder
		_callBackResponder(_instance);
	}
	
	/**
	 * Method which handles the error loading from the httpRequest
	 */
	function onLoadError()
	{
		_http_request.status = 500;
		_http_request.readyState = 4;
		// Call the callback responder
		_callBackResponder(_instance);
	}
	
	/**
	* Standard initialisation function
	*/
	function init()
	{
		// Crossdomain check for IE
		if(window.XDomainRequest)
		{
			_http_request = new window.XDomainRequest();
			return true;
		}
		// Check if the request doesn't already exist
		if(window.XMLHttpRequest)
		{
			_http_request = new XMLHttpRequest();
		}
		// IE 5 & 6
		else if(window.ActiveXObject)
		{
			_http_request = new ActiveXObject("Microsoft.XMLHTTP");
		}
		return false;
	}

	/**
	* Handles the timeout of the webservice
	*/
	function timeouthandler()
	{}
};
