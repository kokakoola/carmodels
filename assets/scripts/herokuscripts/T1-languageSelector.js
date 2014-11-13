/**
 * Created with JetBrains WebStorm.
 * User: Hendrik.De.Permentie
 * Date: 1/07/14
 * Time: 14:28
 * To change this template use File | Settings | File Templates.
 */


var T1 = T1 || {};

T1.languageSelector = (function(){
	'use strict';

	var _private = {

		init: function(){
			var langOptions = $('.language-selector label');
			langOptions.click(_private.switchLanguage);
		},

		switchLanguage: function(e){
			// redirect to the right language
			location.href = $(e.target).prev().val();
		}

	};

	return {
		init: _private.init
	};

})();