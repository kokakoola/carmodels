/**
 * Created by Kim.Ghesquiere on 18/09/2014.
 */

var T1 = T1 || {};

T1.integrator = ( function() {
	'use strict';

	var _private = {
		urlContent: '',
		tokens: {},
		init: function(){
			var m = _private;

			m.tokens.load = PubSub.subscribe(T1.constants.IFRAME_REQUEST, m.load);

			$(window).on('message', m.handleMessage);
		},
		handleMessage: function(event) {
			if (event && event.type === 'message') {
				try {
					var originalEvent = event.originalEvent;

					console.log('------ integrator : handleMessage "' + originalEvent.data + '" from ' + originalEvent.origin);
				//	console.dir(originalEvent);

					if (originalEvent.data) {
						var objData = JSON.parse(originalEvent.data),
							eventName = objData.eventName;
						if (eventName) {
							if (objData.sync) {
								PubSub.publishSync(eventName, objData.arg);
							} else {
								PubSub.publish(eventName, objData.arg);
							}
						}
					} else {
						console.log('no data posted');
						return true;
					}
				} catch (e) {
					console.log('postMessage error: ' + event.type);
					return true;
				}
			}
		},
		load: function(eventName, data){
			var m = _private,
				uri = '?';
/*
			console.log('----- integrator : load : ' + eventName);
			if (console.dir) {
				console.dir(data);
			}
*/
			if (data.url) {
				m.urlContent = data.url;
			}
			if (data.content) {
				if (data.content === 'osb') {
					//http://osb-b2c-ui-dev.s3.amazonaws.com/
					m.urlContent = (T1.settings.osb) ? T1.settings.osb.urlContent.trim() : 'http://osb-b2c-ui-prev.s3-website-eu-west-1.amazonaws.com/';
				} else if (data.content === 'cus') {
					m.urlContent = T1.settings.cpo.urlContent || '';
				}
				delete(data.content);
			}

			$.each(data, function(key, value) {
				uri += key + '=' + value + '&';
			});
			if (uri.length > 0) {
				uri = uri.slice(0, -1);
				m.urlContent += uri;
			}

		//	m.tokens.overlay = PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, m.setParams);
			PubSub.publishSync(T1.constants.PAGEOVERLAYER_OPEN, {iframe: true, url: m.urlContent, sync: true, noScroll: !T1.utilities.isIOS()});
		}
	};
	return {
		init: _private.init,
		show: _private.show
	};

}());
