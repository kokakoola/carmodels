var headerIncludes = {

	head: document.getElementsByTagName('head')[0],
	attr: null,

	/* run the header manipulation */
	init: function(){
		this.attr = {
			level: this.head.attributes['data-eprivacy-default-level'],
			cookie: this.head.attributes['data-eprivacy-cookie']
		};

		this.render(
			this.getIncludes(),
			this.getCookieLevel()
		);
	},

	/* get the eprivacy level */
	getCookieLevel: function(){
		var nameEQ = ((this.attr.cookie) ? (this.attr.cookie.nodeValue) : 'TmeEPrivacy') + '=',
			ca = document.cookie.split(';'),
			level = this.getDefaultLevel();

		for(var i = 0; i < ca.length; i++){
			var c = ca[i];
			while(c.charAt(0) === ' ') { c = c.substring(1, c.length); }
			if(c.indexOf(nameEQ) === 0) { level = parseInt(c.substring(nameEQ.length,c.length), 10); }
		}

		return level;
	},
	getDefaultLevel: function(){
		return (this.attr.level) ? parseInt(this.attr.level.nodeValue, 10) : 40;
	},
	/* get the special includes + eprivacy level */
	getIncludes: function(){
		var includeStrings = this.head.innerHTML.replace(/[\n\r]/g, '').match(/<!--SPECIAL\.INC(.*?)SPECIAL\.INC-->/gi),
			includeString = '',
			levelAttr = null,
			includes = [];

		//clean the comment tags, parse the level
		if(includeStrings){
			for(var iInclude=0; iInclude < includeStrings.length; iInclude++){
				includeString = includeStrings[iInclude].replace(/<!--SPECIAL\.INC\s*|\s*SPECIAL\.INC-->$/gi, '');
				levelAttr = includeString.match(/(data-level=)([\s'"]*)([0-9]*)/gi);

				if(levelAttr) includes.push({script: includeString, level: parseInt(levelAttr[0].replace(/[^0-9]*/gi, ''),10)});
			}
		}


		//return the elements to include
		return includes;
	},

	/* write the new tags in the header */
	render: function(includes, level){
		if(includes){
			for(var iInclude = 0; iInclude < includes.length; iInclude++){
				var include = includes[iInclude];
				if(include.level <= level){
					document.write(include.script);
				}
			}
		}
	}
}

//+++ REPLACE HEADER INCLUDES +++
headerIncludes.init();