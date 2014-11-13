var T1 = T1 || {};
/**
 * Spotlights (More about, hybrid, 4WD, ...) v0.55
 * KGH: rename to spotlights
 * KGH: make spotlights generic
 * KGH: fix view all
 */

T1.spotlights = ( function() {
	'use strict';
	/* PRIVATE METHODS - PROPERTIES */
	var _private = {
		labels:{},
		//initialize the component (connect event listeners)
		init: function() {
			var m = _private,
				spotlights = $('.spotlights');
			if (spotlights.length > 0) {
				PubSub.subscribe(T1.constants.SPOTLIGHTS_CLICK, m.changeText);
				spotlights.find('a[data-toggle="collapse"]').on('click', m.pub);
				spotlights.find('.spotlight:not(.direct-link)').on('click', m.clickedSpotlight);
			}
		},
		changeText: function(msg, data) {
			var btnViewAll = $(data),
				spotlights = btnViewAll.parents('.spotlights'),
				CLASS_EXPANDED = 'expanded',
				viewLessText = T1.labels.viewLess,
				viewAllText = T1.labels.viewAll,
				viewAllAppendix = '';

			if (!spotlights.hasClass(CLASS_EXPANDED)) {
				btnViewAll.text('' + viewLessText);
				spotlights.addClass(CLASS_EXPANDED);
				spotlights.attr('data-bt-state', '');
			} else {
				viewAllAppendix = ' (' + $('.spotlight', spotlights).length + ')';
				var btnText = viewAllText + viewAllAppendix;
				btnViewAll.text('' + btnText);
				spotlights.removeClass(CLASS_EXPANDED);
				spotlights.attr('data-bt-state', 'collapse');
			}
		},
		pub: function() {
			PubSub.publish(T1.constants.SPOTLIGHTS_CLICK, this);
		},
		clickedSpotlight: function(e) {
			e.preventDefault();

			//location.hash = "/spotlight/"+$(this).parent().index();
			var $this = $(this),
				spotlights = $this.parents('.spotlights'),
				id = spotlights.attr('id'),
				idx = spotlights.find('.spotlight:not(.direct-link)').index($(this));

			location.hash = '/spotlight/' + id + '/' + idx;
		}
	};

	/* EXPOSED METHODS - PROPERTIES */
	return {
		init: _private.init,
		changeText: _private.changeText
	};

}());