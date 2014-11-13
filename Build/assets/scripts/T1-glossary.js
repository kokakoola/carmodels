var T1 = T1 || {};

T1.glossary = (function(){
	'use strict';

	var _private = {
		init: function(){
			PubSub.subscribe(c.PAGEOVERLAYER_LOAD, m.initOverlayer);
		},
		initOverlayer: function(event, data){
			if(data.el.find('#glossary').size()) {
				$('#glossary .index a').click(function(e) {
					e.preventDefault();
					var $this = $(this);
					$this.parents('.overlayerContent:first').scrollTo($this.attr('href'));
				});
			}
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		init: _private.init
	};
}());