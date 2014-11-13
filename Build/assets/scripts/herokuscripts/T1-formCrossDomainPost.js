var T1 = T1 || {};

T1.formCrossDomainPost = ( function () {
	'use strict';

	var _private = {
		tokens: {},
		data: null,
		newWindow: null,
		urlPostPage: '/assets/tfs-service.html',

		init: function(){
			PubSub.subscribe(T1.constants.FORM_CROSS_DOMAIN_POST, _private.postExternalForm);
			PubSub.subscribe(T1.constants.FORM_CROSS_DOMAIN_PAGE_READY, _private.crossDomainWindowReady);
		},

		reset: function(){
			_private.data = null;
			_private.newWindow = null;
		},

		postExternalForm: function(evName, data){
			var m = _private,
				target = data.target || '_blank'; //overlayer - blank - self

			m.reset();
			m.data = data;

			if(target==='_self' || target==='_blank'){
				//create the form on the page itself and submit
				m.submit(data);
			}else if (target==='_overlayer'){
				PubSub.publish(T1.constants.HASH_CHANGE, '/iframe/' + encodeURIComponent(m.urlPostPage));
				m.data.target = '_self';
				m.tokens.openedOverlayer = PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, m.sendPageReadyEvent);
			}
		},

		sendPageReadyEvent: function(ev, data){
			//get the window object
			var frame = $('.overlayerContent iframe[src="' + _private.urlPostPage + '"]'),
				win = _private.newWindow || frame[0].contentWindow;
			PubSub.unsubscribe(_private.tokens.openedOverlayer);
			win.PubSub.publish(T1.constants.FORM_CROSS_DOMAIN_PAGE_READY, _private.data);
		},

		createFormElement: function(data){
			var fields = data.fields,
				id = data.id || 'crossDomainForm',
				form = $('#' + id);

			//create or reset the form element
			if(form.length===0){
				form = $('<form/>').css({display: 'none'});
				$('body').append(form);
			}else{
				form.find('input').remove();
			}

			//set all attributes
			form.attr({
				id: id,
				name: data.name || '',
				method: data.method || 'post',
				action: data.action || '',
				target: data.target || '_blank'
			});

			//add the fields
			var field;
			for(var sName in fields){
				if(sName !== 'prototype'){
					field = $('<input/>').attr({
						type: 'text',
						name: sName
					}).val(fields[sName]);
					form.append(field);
				}
			}

			return form;
		},

		crossDomainWindowReady: function(evName, data){
			_private.submit(data);
		},

		submit: function(data){
			var form = _private.createFormElement(data);
			$('body').append(form);
			form.submit();
		}
	};

	return {
		init: _private.init
	};
})();
