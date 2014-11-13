var T1 = T1 || {};

/**
 * socialShareEprivacy
 * User: MDA
 */

T1.socialSharePrivacy = (function(){
	'use strict';

	var _private = {
		targetClass: 'socialshareprivacy',
		infoClass: 'settings_info',
		params: {
			services: {
				facebook: {
					'status' : 'off'
				},
				twitter : {
					'status' : 'off'
				},
				gplus : {
					'status' : 'off'
				}
			},
			css_path: '/bower_components/jquery.socialshareprivacy/socialshareprivacy/socialshareprivacy.css'
		},

		init: function() {
			if(T1.settings.socialSharePrivacy === 'true') {
				PubSub.subscribe(T1.constants.SOCIAL_SHARE_INIT, m.checkSharePrivacy);
				m.checkSharePrivacy();
			}
		},
		checkSharePrivacy: function(event, args) {
			if($.fn.socialSharePrivacy) { m.applySharePrivacy(args); }
			else { m.getPrivacyScript(args); }
		},
		getPrivacyScript: function(args) {
			$.loadScript('/bower_components/jquery.socialshareprivacy/jquery.socialshareprivacy.min.js').done(function(e) {
				m.applySharePrivacy(args);
			});
		},
		applySharePrivacy: function(args) {
			if(args && args.targets) {
				var params = $.extend({}, m.params),
					targets = args.targets.find('.' + m.targetClass);

				params.services[args.service].status = 'on';
				params.services[args.service].language = T1.settings.language + '_' + T1.settings.country.toUpperCase();
				params.services[args.service].txt_info = T1.labels[args.service + 'PrivacyTxtInfo'];
				args.cancel = true;

				targets.socialSharePrivacy(params);
				targets.find('.' + m.infoClass).remove();
			}
		}
	};

	var m = _private;

	return {
		init: _private.init
	};
}());