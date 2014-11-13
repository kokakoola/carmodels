var T1 = T1 || {};

/**
 * dropdown component (extension of bootstrap's dropdown)
 * adds hidden input element to the dropdown after selection
 * version 0.1
 * KGH: init
 */
T1.dropdown = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		currentForm: null,
		originalValue: '',
		dropdownValues: {},
		comboRegionName: null,
		/**
		 * initialize
		 */
		init: function() {
			var m = _private,
				c = T1.constants;

			PubSub.subscribe(c.FORM_LOAD, m.initDropdowns);
		},
		/**
		 * initialize dropdowns on demand
		 * @param msg
		 * @param form
		 */
		initDropdowns: function(msg, form) {
			var m = _private,
				dropdowns = form.find('.dropdown[data-select]');

			m.currentForm = form;

			dropdowns.each(m.initDropdown);
		},
		/**
		 * initialize one dropdown
		 */
		initDropdown: function() {
			var m = _private,
				dropdown = $(this),
				dropdownList = dropdown.find('.dropdown-menu'),
				options = dropdownList.find('li a'),
				selectType = dropdown.attr('data-select');

			if (selectType === 'dealerregion' || selectType === 'dealercity') {
				dropdownList.children('li').remove();
				m.comboRegionName = selectType;
				m.getRegions({'services': dropdown.data('services')});
			}

			options.off('click').on('click', m.handleSelect);
		},
		populateDropdown: function(dropdownSelect, data) {
			var m = _private,
				dropdown = m.currentForm.find('.dropdown[data-select=' + dropdownSelect + ']'),
				dropdownList = dropdown.children('.dropdown-menu'),
				label = dropdown.find('.dropdown-toggle span');

			dropdownList.empty();
			if (m.originalValue.length > 0) {
				label.html(m.originalValue);
				m.originalValue = '';
			}

			$.each(data, function(key, value) {
				var listItem = $('<li></li>'),
					link = $('<a></a>');

				if (typeof(value) === 'object') {
					link.attr('data-value', value.id);
					m.dropdownValues[value.id] = value;
					link.html(m.htmlDecode(value.name));
					link.off('click').on('click', m.handleSelect);
				} else {
					link.attr('data-value', value);
					link.html(m.htmlDecode(value));
					link.off('click').on('click', m.handleSelectRegion);
				}
				link.attr('href', '#');

				listItem.append(link);
				dropdownList.append(listItem);
			});
		},
		/**
		 * handle selection within dropdown
		 * @param e
		 */
		handleSelect: function(e) {
			var m = _private,
				selected = $(e.target),
				value = selected.data('value'),
				text = selected.html(),
				dropdown = selected.parents('.dropdown'),
				label = dropdown.find('.dropdown-toggle span');

			e.preventDefault();

			if (value) {
				m.originalValue = label.html();

				var input = $('<input>'),
					dataContainer = m.currentForm.find('.label-contact-data'),
					list = $('<ul></ul>');

				input.attr('type', 'hidden');
				input.attr('name', dropdown.data('select'));
				input.attr('value', value);

				dropdown.find('input[type="hidden"]').remove();
				dropdown.append(input);
				label.html(text);

				if (dataContainer.length > 0 && dropdown.attr('data-select') === 'dealer') {
					dataContainer.children('ul').remove();

					var detailItem = m.dropdownValues[value];
					list.append($('<li>' + detailItem.name + '</li>'));
					if (detailItem.address.address !== '') {
						list.append($('<li>' + detailItem.address.address + '</li>'));
					} else {
						list.append($('<li>' + detailItem.address.address1 + '</li>'));
					}
					list.append($('<li>' + detailItem.address.zip + ' ' + detailItem.address.city + '</li>'));
					list.append($('<li>' + detailItem.phone + '</li>'));

					dataContainer.append(list);
					dataContainer.addClass('active');
				}
			}
		},
		handleSelectRegion: function(e) {
			var selected = $(e.target),
				value = selected.data('value'),
				text = selected.html(),
				dropdown = selected.parents('.dropdown'),
				label = dropdown.find('.dropdown-toggle span');

			e.preventDefault();

			if (value) {
				var input = $('<input>');

				input.attr('type', 'hidden');
				input.attr('name', dropdown.data('select'));
				input.attr('value', value);

				dropdown.find('input[type="hidden"]').remove();

				dropdown.append(input);
				label.html(text);
			}

			_private.getDealersByRegion(value, dropdown.data('services'));
		},
		destroy: function() {
			var m = _private,
				c = T1.constants;

			PubSub.unsubscribe(c.PAGEOVERLAYER_CLOSED, m.initDropdowns);
		},

		getRegions: function(data) {
			if(!data) data = {};
			var m = _private,
				c = T1.constants,
				request,
			//	useCities = (T1.settings.formsDealersByCity && T1.settings.formsDealersByCity === 'true')? true : false,
				useCities = (m.comboRegionName === 'dealercity') ? true : false,
				urlRegion = (T1.settings.mock) ? 'http://t1-dev-' + T1.settings.country + '.herokuapp.com' + c.URL_DEALERS_REGIONS : c.URL_DEALERS_REGIONS,
				urlCity = (T1.settings.mock) ? 'http://t1-dev-' + T1.settings.country + '.herokuapp.com' + c.URL_DEALERS_CITIES : c.URL_DEALERS_CITIES,
				services = data.services ? ('?services='+data.services) : '',
				urlRequest = ((useCities)? urlCity : urlRegion) + services;

			request = $.ajax({
				type: 'GET',
				dataType: 'JSON',
				url: urlRequest
			});
			request.done(m.handleRegionsSuccess);
			request.fail(m.handleError);
		},
		getDealersByRegion: function(region, services) {
			services = services ? ('?services=' + services) : '';
			var m = _private,
				c = T1.constants,
				request,
				urlDealersByCity = (T1.settings.mock) ? 'http://t1-dev-' + T1.settings.country + '.herokuapp.com' + c.URL_DEALERS_LOCAL : c.URL_DEALERS_LOCAL,
				urlDealersByRegion = (T1.settings.mock) ? 'http://t1-dev-' + T1.settings.country + '.herokuapp.com' + c.URL_DEALERS_REGIONAL : c.URL_DEALERS_REGIONAL,
				urlDealers = (m.comboRegionName==='dealercity' ? urlDealersByCity : urlDealersByRegion);

			request = $.ajax({
				type: 'GET',
				dataType: 'JSON',
				url: urlDealers + encodeURIComponent(region) + services
			});

			request.done(m.handleDealersSuccess);
			request.fail(m.handleError);
		},
		handleRegionsSuccess: function(data) {
			var m = _private,
				comboRegionName = m.comboRegionName || 'dealerregion';
			_private.populateDropdown(comboRegionName, data);
		},
		handleDealersSuccess: function(data) {
			_private.populateDropdown('dealer', data.dealers);
		},
		handleError: function(jqXHR, textStatus, error) {
			console.log(jqXHR.responseText);
		},
		/**
		 * dirty html decoder, look for backend solution?
		 * @param value
		 * @returns {*|jQuery}
		 */
		htmlDecode: function(value) {
			return $('<div/>').html(value).text();
		}
	};
	return {
		init: _private.init,
		destroy: _private.destroy
	};
}());
