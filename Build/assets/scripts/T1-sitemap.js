var T1 = T1 || {};

T1.sitemap = ( function() {
	'use strict';

	var _private = {
		collapseContainer: $('.sitemap'),
		sitemapLink: $('li.sitemaplink'),

		init: function() {
			var m = _private;
			m.collapseContainer.on('show.bs.collapse', m.openSitemap);
			$('.footer-collapsed-links a').on('click', function(evt) {
				evt.preventDefault();
			});
		},

		openSitemap: function() {
			$("html, body").animate({ scrollTop: $(document).height() }, "slow");
		},
		switchDesktop: function(){
			_private.sitemapLink.show();
		},
		switchMobile: function(){
			var sitemaprow  = $('.row.sitemap');
			_private.collapseContainer.removeClass('in');
			_private.collapseContainer.addClass('collapse');
			_private.sitemapLink.hide();
		}
	};

	return {
		init: _private.init,
		switchMobile: _private.switchMobile,
		switchDesktop: _private.switchDesktop
	};

}());