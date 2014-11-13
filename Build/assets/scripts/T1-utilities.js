var T1 = T1 || {};

/*
 *	TODO: refactor to:
 *	T1-detect.js,
 *	T1-session.js,
 *	T1-colours.js,
 *	T1-overrides.js
 */

/**
 *	utilities:
 *		1. ie detection: returns version number or -1
 *
 */
T1.utilities = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _ieDetect = {
		getIeVersion : function() {
			if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)){ //test for MSIE x.x;
				return Number(RegExp.$1); // capture x.x portion and store as a number
			} else {
				return 1000;
			}
		},
		isIeMobile: function(){
			return (navigator.userAgent.match(/IEMobile/g) !== null);
		}
	};

	var _browserDetect = {
		isChrome: navigator.userAgent.indexOf('Chrome') > -1,
		isExplorer: navigator.userAgent.indexOf('MSIE') > -1,
		isFirefox: navigator.userAgent.indexOf('Firefox') > -1,
		isSafari: navigator.userAgent.indexOf('Chrome') === -1 && navigator.userAgent.indexOf("Safari") > -1,
		isOpera: navigator.userAgent.indexOf("Presto") > -1
	};

	var _iDevices = {
		isIpad: function(){
			return (navigator.userAgent.match(/iPad/g) === null) ? false : true;
		},
		isIphone:function(){
			return (navigator.userAgent.match(/iPhone/g) === null) ? false : true;
		},
		isIOS: function(){
			return (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) === null) ? false : true;
		}
	};

	var _flashDetect = {
		hasFlash : function() {
			var flash = false;
			try{
				var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
				if(axo){
					flash=true;
				}
			}catch(e){
				if(navigator.mimeTypes ['application/x-shockwave-flash'] !== undefined){
					flash=true;
				}
			}
			return flash;
		}
	};

	var _eventDetect = {
		checkedEvents: {},
		hasEvent: function(evName){
			return _eventDetect.checkedEvents[evName] || evName in document;
		}
	};

	var _androidDetect = {
		isAndroid: function(){
			return (navigator.userAgent.match(/Android/i) === null) ? false : true;
		},
		isMobileAndroid: function() {
			var res = navigator.userAgent.match(/Android|Mobile Safari/g);
			return res ? (res.length>=2) : false;
		}
	};

	var _youtube = {
		youtubeEmbedUrl: 'http://www.youtube.com/embed/<id>?rel=0&hd=<hd>;autoplay=<autoplay>;controls=<controls>;modestbranding=<modestbranding>&wmode=opaque&html5=1',
		/**
		 * translates any youtube url to an embed url
		 * @param url
		 */
		getEmbedUrl: function(url, options){
			if(!url) return '';
			var youtubeId = _youtube.getYouTubeId(url),
				baseurl = _youtube.youtubeEmbedUrl;
			if(!options) options = {};
			if(youtubeId){
				baseurl = baseurl.replace('<hd>', options.hd || '1');
				baseurl = baseurl.replace('<autoplay>', options.autoplay || '1');
				baseurl = baseurl.replace('<controls>', options.controls || '0');
				baseurl = baseurl.replace('<modestbranding>', options.modestbranding || '1');
				return baseurl.replace('<id>', youtubeId);
			}else{
				return url;
			}
		},
		getYouTubeId: function(url){
			if(! url) return '';
			var youtubeId = url.replace(/.*\/(.*?)v=|&.*|.*\/|\?.*/g, '');
			return new RegExp('[:\/.]').test(youtubeId) ? null : youtubeId; //checks if : / or . are present in the id (if so, the id is invalid)
		}
	};

	/* *
	 * Modernizr cannot detect windows tablets/phones cause those devices don't support touch events.
	 * They fire geniously the pointer events (mouse down and mouse up)
	 * This function checks the userAgent and platform
	 * */
	var _windowsTabletDetect = {
		test: function(){
			return (navigator.userAgent.toLowerCase().indexOf("touch") !== -1 && navigator.platform.toLowerCase().indexOf("win") !== -1);
		}
	};

	var _clickEvent = Modernizr.touch ? 'touchend' : 'click';

	var _cookies = {
		getCookie:function (name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)===' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		},
		setCookie:function(name,value,days) {
			var expires = '';
			if (days) {
				var date = new Date();
				date.setTime(date.getTime()+(days*24*60*60*1000));
				expires = "; expires="+date.toGMTString();
			}
			else expires = "";
			document.cookie = name+"="+value+expires+"; path=/";
		},
		rmCookie:function(name) {
			_cookies.setCookie(name,"",-1);
		}
	};

	var _viewport = {
		bp: 'xs',
		changeBp: function(evName, bp){
			_viewport.bp = bp;
		},
		getCurrentBp: function(){
			return _viewport.bp;
		},
		inView: function(obj, offset) {
			var win = $(window),
				scrollPosition = win.scrollTop(),
				visibleArea = win.scrollTop() + win.height(),
				objEndPos = obj.offset().top + obj.outerHeight() - (offset || 0);

			return(visibleArea >= objEndPos && scrollPosition <= objEndPos ? true : false);
		}
	};

	/**
	 * Converts the RGB color space into YIQ, which takes into account the different impacts of its constituent parts.
	 * http://24ways.org/2010/calculating-color-contrast/
	 * @param hexcolor
	 * @returns {string} black or white.
	 */
	var _color = {
		getContrastYIQ:function(hexcolor) {
			var r = parseInt(hexcolor.substr(0,2),16);
			var g = parseInt(hexcolor.substr(2,2),16);
			var b = parseInt(hexcolor.substr(4,2),16);
			var yiq = ((r*299)+(g*587)+(b*114))/1000;
			return (yiq >= 128) ? 'black' : 'white';
		},
		/**
		 * Lighten or darken a supplied color
		 * http://css-tricks.com/snippets/javascript/lighten-darken-color/
		 * @param col			Hexadecimal color to lighten or darken
		 * @param amt			Amount to light(use positive value) or dark (use negative value)
		 * @returns {string}	Altered hexadecimal color
		 */
		lightenDarkenColor:function(col, amt) {
			var usePound = false;

			if (col[0] == "#") {
				col = col.slice(1);
				usePound = true;
			}

			var num = parseInt(col,16);
			var r = (num >> 16) + amt;

			if (r > 255) {
				r = 255;
			} else if  (r < 0) {
				r = 0;
			}

			var b = ((num >> 8) & 0x00FF) + amt;

			if (b > 255) {
				b = 255;
			} else if  (b < 0) {
				b = 0;
			}

			var g = (num & 0x0000FF) + amt;

			if (g > 255) {
				g = 255;
			} else if (g < 0) {
				g = 0;
			}

			return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);

		},
		/**
		 * Check a color and determines if it's too dark
		 * Altered version (added pct param) of http://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black#answer-12043228
		 * @param c		Color to check
		 * @param pct	Lightness percentage
		 * @returns {boolean}
		 */
		isTooDark: function(c,pct) {
			var isDark = false;
			if (!pct) {
				pct = 40;
			}
			var rgb = parseInt(c, 16);   // convert rrggbb to decimal
			var r = (rgb >> 16) & 0xff;  // extract red
			var g = (rgb >>  8) & 0xff;  // extract green
			var b = (rgb >>  0) & 0xff;  // extract blue

			var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

			if (luma < pct) {
				isDark = true;
			}
			return isDark;
		}
	};

	/**
	 * Calculates the visible area of a certain image
	 */
	var _imgVisibleArea = {
		calculate: function(img){
			if(!img) return;
			var con = img.parent();
			var contH = con.height(), contW = con.width(), imgH = img.get(0).naturalHeight, imgW = img.get(0).naturalWidth;
			//find the unvisible parts as pixels
			var diffX = imgW - contW;
			var diffY = imgH - contH;
			//find the unvisible width and height as percentages
			var percX = (diffX/imgW)*100;
			var percY = (diffY/imgH)*100;
			//find the unvisible area
			var imgArea         = imgH*imgW;
			var conArea         = contH*contW;
			var unvisibleArea   = imgArea-conArea;
			//calculate the unvisible area as percentage
			var unvisiblePerc = (unvisibleArea/imgArea)*100;

			PubSub.publish(T1.constants.CALCULATE_VISIBLE_AREA_OF_THE_IMAGE, {
				imageHeight         : imgH+"px",
				imageWidth          : imgW+"px",
				containerHeight     : contH+"px",
				containerWidth      : contW+"px",
				unvisibleX          : diffX+"px",
				unvisibleY          : diffY+"px",
				unvisibleXperc      : Math.round(percX)+"%",
				unvisibleYperc      : Math.round(percY)+"%",
				unvisibleTotalArea  : unvisibleArea+"px²",
				unvisiblePercentage : Math.round(unvisiblePerc)+"%",
				image               : img
			});
		}
	};

	var _finance = {
		getMonthlyAmount: function(months, total){
			var monthlyPayment = 0;
			return monthlyPayment;
		}
	};

	return {
		init			: function(){
			PubSub.subscribe(T1.constants.ON_BREAKPOINT_CHANGE, _viewport.changeBp);
		},
		currentBreakpoint: _viewport.getCurrentBp,
		ieVersion		: _ieDetect.getIeVersion,
		isIeMobile		: _ieDetect.isIeMobile(),
		hasFlash		: _flashDetect.hasFlash,
		hasEvent		: _eventDetect.hasEvent,
		isIpad          : _iDevices.isIpad,
		isIOS			: _iDevices.isIOS,
		isIphone		: _iDevices.isIphone,
		isAndroid		: _androidDetect.isAndroid,
		isMobileAndroid : _androidDetect.isMobileAndroid,
		iswindowsTablet : _windowsTabletDetect.test,
		clickEvent		: _clickEvent,
		cookies			: _cookies,
		contrastYIQ		: _color.getContrastYIQ,
		lightenDarken	: _color.lightenDarkenColor,
		isTooDark		: _color.isTooDark,
		imgVisibleArea  : _imgVisibleArea.calculate,
		financeMonthly  : _finance.getMonthlyAmount,
		youtube			: _youtube,
		browser			: _browserDetect,
		viewport		: _viewport
	};
}());

// vanilla & prototype overrides ----------------------------------------------------
/* ie console fix */
if(! window.console){
	window.console = {
		log: function(){return;},
		dir: function(){return;}
	};
}

/* capitalize: first character to uppercase  */
String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

/* get object properties based on path */
Object.resolve = function(path, obj) {
	var subObjNames = (path||'').split('.');
	for(var iKey = 0; iKey < subObjNames.length; iKey++){
		if(obj) {
			obj = obj[subObjNames[iKey]] !== undefined ? obj[subObjNames[iKey]] : null;
		}
	}
	return obj;
};

/* enable array index on IE8 */
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj, start) {
		for (var i = (start || 0), j = this.length; i < j; i++) {if (this[i] === obj) return i;}
		return -1;
	};
}

/* enable Object.keys when such function isn't present */
if(typeof Object.keys !== "function"){
	Object.keys = function(o) {
		var result = [];
		for(var name in o) {
			if (o.hasOwnProperty(name))
				result.push(name);
		}
		return result;
	};
}

jQuery.loadScript = function(url, options) {
	options = $.extend(options || {}, {
		dataType: 'script',
		async: false,
		cache: true,
		url: url
	});
	return jQuery.ajax(options);
};