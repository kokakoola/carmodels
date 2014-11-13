var T1 = T1 || {};

/**
 * 1.0
 * global error handling module
 * KGH: toast
 */
T1.errorHandler = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		isErrorHandled: false,
		errorToken: '',
		init: function() {
			var m = _private;

			if (window.onerror) {
				window.onerror = m.handleError;
			}

			m.errorToken = PubSub.subscribe(T1.constants.ERROR, m.handleError);
		},
		handleError : function(message, url, line) {
			var m = _private,
				errorInfo = {};

			if (!m.isErrorHandled) {
				m.isErrorHandled = true;

				errorInfo.message = message;
				errorInfo.url = url;
				errorInfo.line = line;

			//	m.logError(errorInfo, line && line.length > 0);
				m.logError(errorInfo, false);

				m.isErrorHandled = false;
			}
		},
		logError : function(errorInfo, showToast) {
			var fullText = 'Error ';

			$.each(errorInfo, function(key, value) {
				if (value) {
					fullText += ': ' + value.toString() + '\n';
				}
			});
			console.log(fullText);

			if (showToast) {
				PubSub.publish(T1.constants.TOAST_CUSTOM, {
					customContainer: $('body'),
					customText: fullText,
					centerScreen: true,
					timeout: 2000
				});
			}
		}
	};
	return {
		init: _private.init,
		handleError: _private.handleError
	};
}());