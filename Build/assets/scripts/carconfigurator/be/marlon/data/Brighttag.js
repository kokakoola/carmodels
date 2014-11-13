/**
 * Global class used for tracking the webtrends
 */
(function() {
    /**
     * Webtrends class 
     */
    be.marlon.Brighttag = function()
    {
        var _step;

        this.defaults = {
            eventclass: 'carconfigevent',
            category: 'tools',
            componentname: 'carconfig'
        };

        this.setProperties = function(options)
        {
            //console.log('[BrightTag] Current step: ', this.getReadableStep());
            
            if(typeof options.carconfigstep === 'undefined')
            {
                options.carconfigstep = this.getReadableStep();
            }

            if(typeof options.value === 'undefined')
            {
                options.value = this.getReadableStep();
            }
        };

        this.setStep = function(s)
        {
            //console.log('[BrightTag] Set step: ', s);
            _step = s;
        };

        this.getStep = function()
        {
            return _step;
        };

        /**
         * Converts the numeric value of step, to the human-readable counterpart 
         */

        this.getReadableStep = function(s)
        {
            var steps = [
                'model-select', //0
                'promotions', //1
                'submodel-select', //2
                'bodytypes', //3
                'engine_grades', //4
                'exterior', //5
                'interior', //6
                'accessories', //7
                'summary', //8
                'financing', //9
                'insurance' //10
            ];

            return steps[this.getStep()];
        };
        
        this.removeModelID = function()
        {
        	//console.log("[Brighttag] removing model id");
        	$('#tmxcc-v6').removeAttr('data-bt--model-modelid');
        };

        this.setModelID = function(id)
        {
        	//console.log("[Brighttag] setting modelid: ", id);
            $('#tmxcc-v6').attr('data-bt--model-modelid', id);
        };

        this.track = function(options, config)
        {
        	if(be.marlon.utils.smSlave)return;
            // Extend object with defaults
            options = $.extend({}, this.defaults, options);
            // Set properties
            this.setProperties(options);
			
			// Set properties in the t1DataLayer, 
			// such as the modelID
			// and the workflow step
			// and the event information (taken from the options object)
			var data = {
				extraData:{
					event:options
				},
				node:$('#tmxcc-v6')
			};
			if(be.marlon.utils.smMaster)data.extraData.userinfo = {platform:"salesman-app"};
			if(config)data.extraData.configuration = config;

			//console.log('[Brighttag] data: ', data);
			PubSub.publish(((typeof T1 !== "undefined") && T1.constants?T1.constants.STATS_TRACK:"onTrack"), data);
		};

		this.trackCTAClicked = function(eventData)
		{
			eventData.action = (((typeof eventData.action) === 'string') && (eventData.action.length > 0))?eventData.action:'cc_cta';
			this.track(eventData);
		};
	};

    // Initialize class here
    be.marlon.Brighttag = new be.marlon.Brighttag();
})();