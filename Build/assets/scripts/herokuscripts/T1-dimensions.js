var T1 = T1 || {};

T1.dimensions = (function(){
	'use strict';

	var _private = {
		container: $('#dimensions'),

		init: function(){
			if(m.container.size()) {
				m.container.find('.body-filter .dropdown-menu a').click(m.bodyFilterChanged);
			}
		},
		bodyFilterChanged: function(e) {
			var target = $(e.target);
			e.preventDefault();

			// control does not manage selection itself???
			target.closest('.dropdown-menu').find('li a').removeClass('selected');
			m.container.find('.body-filter .dropdown-toggle >span').html(target.html());
			target.addClass('selected');

			m.container.find('.specifications.active').removeClass('active');
			m.container.find(target.attr('href')).addClass('active');
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		init: _private.init
	};
}());