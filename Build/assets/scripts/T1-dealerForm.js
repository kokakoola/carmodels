var T1 = T1 || {};

/**
 * Dealer form
 */
T1.dealerForm = (function(){
	'use strict';

	var _private = {
		formId: '#form-contact-dealer',
		carsImageSize: {width:300, height:95},
		init: function(){
			PubSub.subscribe(c.FORM_LOAD, m.formLoad);
		},
		formLoad: function(msg, data) {
			if (msg === c.FORM_LOAD && data.is($(m.formId))) {
				m.searchCar($.trim(T1.request.getQueryStringParameter('car')));
			}
		},
		searchCar: function(carId) {
			if(carId) {
				var request = $.ajax({
					type: 'GET',
					dataType: 'JSON',
					url: T1.settings.loadSaveServer + c.URL_SUBMIT_FORM_MY_TOYOTA_SEARCH_CAR + '/' + carId + '/short/'
				});
				request.done(m.loadCar);
				request.fail(m.showError);
			}
		},
		loadCar: function(data) {
			var node = $(m.formId).find('.selected-car').first(),
				query = {id: data.id};

			// request mytoyota for the saved or stored version (for custom name & save date)
			PubSub.publishSync(c.MY_TOYOTA_GET_CAR, query);
			var car = query.out.car || data;

			if(node.size()) {
				node.find('#carId').val(car.id);
				node.find('.obj-desc').attr('data-obj-code', car.id);
				node.find('img').attr('src', m.getCarImagePath(car.ids));
				node.find('.hybrid').toggle(car.hybrid || false);
				node.find('.title').html(m.htmlDecode(car.customName || car.car));
				if (car.price) {
					node.find('.price').html(m.htmlDecode(globalize.format(car.price.listWithDiscount, 'c')));
				}
				//to do: finance will be added later, hide it
				node.find('.desc').hide();
				node.find('.code i').html(m.htmlDecode(car.code));
				node.find('.date').text(car.storeDate).toggle(car.storeDate !== undefined);
				node.find('.saved').toggle(car.saved || false);
				node.show();
			}
		},
		getCarImagePath: function(ids) {
			return T1.settings.CCISHost + 'vehicle/' + ids.model + '/' + ids.car +
				'/exterior-32_' + ids.colour  + '.png?width=' + m.carsImageSize.width + '&height=' + m.carsImageSize.height;
		},
		htmlDecode: function(value) {
			return $('<div/>').html(value).text();
		},
		showError: function(jqXHR, status, error) {
			var container = $(m.formId).find('.selected-car');
			container.find('>div:not(.error)').remove();
			container.find('>div.error h3').html(m.htmlDecode(error || T1.labels.forms.errorSubmit));
			container.show();
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		init: _private.init
	};
}());