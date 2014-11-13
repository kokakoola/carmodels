var T1 = T1 || {};

/**
 * request cycle functions V0.1
 * KGH: init
 */
T1.request = (
	function() {
		'use strict';

		// _private var for facade pattern (return public vars/functions)
		var _request = {
			parameters : {},
			/**
			 * get all qs params
			 * @returns {object} holds qs param key-value pairs
			 */
			getQueryStringParameters: function() {
				var m = _request,
					url = decodeURIComponent(document.URL);

				if (url.indexOf('?') > -1) {
					var uri = url.split('?')[1],
						pairs = uri.split('&');

					for (var i = 0; i < pairs.length; i++) {
						var params = pairs[i].split('=');

						m.parameters[params[0].toString()] = params[1].split('#')[0];
					}
				}
				return m.parameters;
			},
			/**
			 * get qs param value by key
			 * @param key
			 * @returns {*} value
			 */
			getQueryStringParameter: function(key) {
				var m = _request;

				m.parameters = m.getQueryStringParameters();

				return m.parameters[key];
			},
			/**
			 * get domain name or defaults to dev server for mockup
			 * @returns {string}
			 */
			getDomainName: function() {
				return (T1.settings.mock)? 'http://t1-dev-glen.herokuapp.com' : window.location.protocol + '//' + window.location.host;
			}
		};

		return {
			getQueryStringParameter		: _request.getQueryStringParameter,
			getQueryStringParameters	: _request.getQueryStringParameters,
			getDomainName				: _request.getDomainName
		};
	}
());