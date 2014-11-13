var T1 = T1 || {};

T1.include = (function(){
	'use strict';

	var _private = {
		init: function() {
			var defer = [],
				done = [];

			for(var i = 0; i < r.externals.length; i++) {
				defer.push($.loadScript(r.externals[i].src));
				done.push(r.externals[i].done);
			}

			$.when(defer).done(done);
		}
	};

	var m = _private,
		r = {
			init: _private.init,
			externals: []
	};

	return r;
}());