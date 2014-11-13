var T1 = T1 || {};
/**
 * Spotlights intro text (car chapter introtext spotlights)
 */
T1.specialLink = ( function() {
	'use strict';

	var _private = {
		selectors: '.action-overlayer, .action-overlayer-ajax, .action-scroll-to',

		/**
		 * start listening to the body click event. If the selector matches any of the _private.selectors, then run the open function
		 */
		init: function(){
			//$(m.selectors).click(m.open);
			$('body').on('click', m.selectors, m.open);
		},

		/*
		initOnDemand: function(root) {
			(root || $(document.body)).find(m.selectors).click(m.open);
		},
		*/

		open: function(e){
			var target = $(this),
				href = target.prop('href');

			if(target.hasClass('action-overlayer')){
				e.preventDefault();
				PubSub.publish(T1.constants.HASH_CHANGE, '/iframe/' + encodeURIComponent(href));
			}else if(target.hasClass('action-overlayer-ajax')){
				e.preventDefault();
				PubSub.publish(T1.constants.HASH_CHANGE, '/ajax/' + encodeURIComponent(href));
			}else if(target.hasClass('action-scroll-to')){
				e.preventDefault();
				var overlayer = target.closest('.overlayerContent');
				((overlayer.length>0) ? overlayer : $(window)).scrollTo($(target.prop('hash')), T1.constants.ANIMATION_SPEED_SCROLL);
			}else{
				return;
			}
		}
	};

	var m = _private;

	return {
		init: _private.init,
		initOnDemand: _private.initOnDemand
	};

})();