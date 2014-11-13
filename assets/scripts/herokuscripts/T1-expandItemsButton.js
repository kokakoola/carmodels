var T1 = T1 || {};
/**
 * Expand Button for containers with multiple items 
 */

T1.expandItemsButton = ( function() {
	'use strict';
	/* PRIVATE METHODS - PROPERTIES */
	var _private = {
		labels:{},
		//initialize the component (connect event listeners)
		init: function() {
			var m = _private,
				buttons = $('.view-all-button');
			if (buttons.length > 0) {
				PubSub.subscribe(T1.constants.EXPANDITEMSBUTTON_CLICK, m.changeText);
				buttons.on('click', m.pub);
			}
		},
		changeText: function(msg, data) {
			var button			= $(data),
				parent			= $(button.attr('data-parent')),
				items			= parent.find(button.attr('data-itemclass')),
				viewLessText	= T1.labels.viewLess,
				viewAllText		= T1.labels.viewAll,
				viewAllAppendix	= "";

			if( button.hasClass('collapsed') ){
				viewAllAppendix = ' (' + items.length + ')';
				var btnText = viewAllText + viewAllAppendix;
				button.text('' + btnText);
			}
			else{
				button.text('' + viewLessText);
			}

		},
		pub: function() {
			PubSub.publish(T1.constants.EXPANDITEMSBUTTON_CLICK, this);
		}
	};

	/* EXPOSED METHODS - PROPERTIES */
	return {
		init: _private.init,
		changeText: _private.changeText
	};

}());