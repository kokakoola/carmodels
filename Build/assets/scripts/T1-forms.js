var T1 = T1 || {};

/**
 * forms script
 * version 0.1
 * KGH: init
 */
T1.forms = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		currentForm: null,
		formValid: true,
		hasEvents: false,
		isFormInstantiated: false,
		showResults: false,
		formUrls: {},
		resultData: {},
		init: function() {
			var m = _private,
				c = T1.constants;

			m.initUrls();

			PubSub.subscribe(c.FORM_ERROR, m.triggerError);

			//PubSub.subscribe(c.TABS_LOAD, m.initOnDemand);

			PubSub.subscribe(c.TABS_SWITCH, m.initOnDemand);
		},
		/**
		 * init on demand
		 */
		initOnDemand: function(msg, arg) {
			var m = _private,
				c = T1.constants,
				container = $('#forms'),
				activeForm;

			if (arg) {
				activeForm = $('#' + arg + ' form');
			} else {
				activeForm = container.find('.tab-pane.active form');
			}

			if (container.length < 1 || activeForm.is(m.currentForm)) {
				return;
			}

			// set the current form
			m.currentForm = activeForm;

			m.setEvents();

			PubSub.publish(c.FORM_LOAD, m.currentForm);

			if (m.currentForm.attr('name') === 'form-dealer' && msg === c.TABS_SWITCH) {
				PubSub.publish(c.DEALER_LOAD);
			}

			m.isFormInstantiated = true;
		},
		initUrls: function() {
			var m = _private,
				domain = (T1.settings.mock)? 'http://t1-dev-glen.herokuapp.com' : T1.request.getDomainName(),
				proxy = (T1.settings.mock)? 'http://t1-dev-proxy.herokuapp.com' : T1.settings.loadSaveServer;

			m.formUrls = {
				'form-contact': domain + T1.constants.URL_SUBMIT_FORM_CONTACT,
				'form-contact-dealer': domain + T1.constants.URL_SUBMIT_FORM_CONTACT_DEALER,
				'form-brochure': domain + T1.constants.URL_SUBMIT_FORM_BROCHURE,
				'form-my-cars': proxy + T1.constants.URL_SUBMIT_FORM_MY_TOYOTA_SEARCH_CAR,
				'form-login': domain + T1.constants.URL_SUBMIT_FORM_MY_TOYOTA_LOGIN,
				'form-login-save-car': domain + T1.constants.URL_SUBMIT_FORM_MY_TOYOTA_LOGIN,
				'form-save-car': domain + T1.constants.URL_SUBMIT_FORM_MY_TOYOTA_SAVE_CAR,
				'form-register': domain + T1.constants.URL_SUBMIT_FORM_MY_TOYOTA_REGISTER,
				'form-forgotten-password': domain + T1.constants.URL_SUBMIT_FORM_MY_TOYOTA_PASSWORD,
				'form-reset-password': domain + T1.constants.URL_SUBMIT_FORM_MY_TOYOTA_RESET_PASSWORD,
				'form-testdrive': domain + T1.constants.URL_SUBMIT_FORM_TESTDRIVE
			};
		},
		/**
		 * loop elements and set sequential tabindices
		 */
		setTabIndices: function() {
			var m = _private,
				elements = m.currentForm.elements;

			for (var i = 0; i < elements.length; i++) {
				elements[i].tabIndex = i;
			}
		},
		/**
		 * delegate form events
		 */
		setEvents: function() {
			var m = _private,
				btnContainer = m.currentForm.find('.form-btn'),
				btnSubmit = btnContainer.children('.btn-submit'),
				btnCancel = btnContainer.children('.btn-cancel');

			if (m.currentForm.hasClass('form-dynamic')) {
				m.setEventsDynamic();
			}

			if(m.currentForm.data('submitonenter')){
				m.currentForm.find('input').off('keydown', m.formKeyPress).on('keydown', m.formKeyPress);
			}
			btnSubmit.off('click', m.submit).on('click', m.submit);
			btnCancel.off('click', m.cancel).on('click', m.cancel);

			m.hasEvents = true;
		},
		formKeyPress: function(e){
			if (e.keyCode === 13 || e.which === 13) {
				e.preventDefault();

				_private.submit(e);
			}
		},
		/**
		 * set dynamic form events
		 */
		setEventsDynamic: function() {
			var m = _private,
				selectDynamic = m.currentForm.find('.select-dynamic [data-activate]');

			selectDynamic.off('click', m.switchElementDynamic).on('click', m.switchElementDynamic);
		},
		switchElementDynamic: function() {
			var m = _private,
				radio = $(this),
				selector = radio.attr('data-activate'),
				extraInfo = radio.attr('data-extra-info'),
				activeElement = m.currentForm.find('#' + selector),
				dynamicGroup = activeElement.siblings('.element-dynamic');

			dynamicGroup.removeClass('active');
			activeElement.addClass('active');
			if (extraInfo) {
				var extraField = $('#extra-info');

				extraField.attr('value', extraInfo);
			}
		},
		/**
		 * validate the form
		 * @returns {boolean}
		 */
		validate: function() {
			var m = _private,
				c = T1.constants,
				labels = T1.labels;

			if (m.currentForm && m.currentForm.length > 0) {
				var elements = m.currentForm.find('[data-validation]');

				m.setFormValid();

				$.each(elements, m.validateElement);

				if (!m.formValid) {
					m.setError(labels.forms.errorInValid);
					PubSub.publish(c.FORM_VALIDATION_FAILED, {
						form: m.currentForm,
						fields: m.currentForm.find('.' + c.CLASS_ERROR)
					});
				}

				return m.formValid;
			} else {
				m.currentForm = $('form');

				m.validate();
			}

			return false;
		},
		/**
		 * validate one form element
		 */
		validateElement: function() {
			var m = _private,
				c = T1.constants,
				element = $(this),
				rules = element.data('validation').split(' '),
				value = element[0].value;

			// do not validate hidden dynamic input fields
			if (element.hasClass('input-dynamic')) {
				var dynamicParent = element.parents('.element-dynamic');

				if (!dynamicParent.hasClass('active')) {
					return;
				}
			}

			for(var i = 0; i < rules.length; i++)
			{
				if (rules[i] === c.FORM_VALIDATION_RULE_SELECT) {
					if (element.siblings('input[type="hidden"]').length < 1) {
						m.setElementInvalid(element);
						console.log(element.attr('name') + ': no selection');
					}
				} else if (rules[i] === c.FORM_VALIDATION_RULE_LENGTH) {
					var minLength = element.attr('minlength') || element.attr('min-length');

					if (value.length < minLength) {
						m.setElementInvalid(element);
						console.log(element.attr('name') + ': minimum length not met');
					}
				} else if (rules[i] === c.FORM_VALIDATION_RULE_NUMBER) {
					if (!value.isNumeric) {
						m.setElementInvalid(element);
						console.log(element.attr('name') + ': value not numeric');
					}
				} else if (rules[i] === c.FORM_VALIDATION_RULE_EMAIL) {
					if (!m.validateEmail(value)) {
						m.setElementInvalid(element);
						console.log(element.attr('name') + ': not a valid email address');
					}
				} else if (rules[i] === c.FORM_VALIDATION_RULE_PHONE) {
					if (!m.validatePhone(value)) {
						m.setElementInvalid(element);
						console.log(element.attr('name') + ': not a valid phone number');
					}
				} else if (rules[i] === c.FORM_VALIDATION_RULE_PARITY) {
					if (!m.validateParity(element)) {
						m.setElementInvalid(element);
						console.log(element.attr('name') + ': parity check failed');
					}
				}else if (rules[i] === c.FORM_VALIDATION_RULE_REGEXP) {
					var re = element.attr('data-regexp');
					if (!new RegExp(re, 'i').test(value)) {
						m.setElementInvalid(element);
						console.log(element.attr('name') + ': did not match its criteria /' + re + '/i');
					}
				}
			}
		},
		/**
		 * email validation
		 * @param value
		 * @returns {boolean}
		 */
		validateEmail: function(value) {
			var filter = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
				valid = filter.test(value);

			return valid;
		},
		/**
		 * phone validation
		 * @param value
		 * @returns {boolean}
		 */
		validatePhone: function(value) {
			var filter = /^(?:(?:\(?(?:00|\+)([1-4]\d\d|[1-9]\d?)\)?)?[\-\.\ \\\/]?)?((?:\(?\d{1,}\)?[\-\.\ \\\/]?){0,})(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i,
				valid = value.length > 2 && filter.test(value);

			return valid;
		},
		/**
		 * parity validation
		 * @param element
		 * @returns {boolean}
		 */
		validateParity: function(element) {
			var target = _private.currentForm.find('input[name="' + element.data('parity-target') + '"]');
			return target.size() && target.val() === element.val();
		},
		/**
		 * invalidate element
		 * @param element
		 */
		setElementInvalid: function(element) {
			var m = _private,
				c = T1.constants,
				label = (element.hasClass('dropdown-toggle')) ? element.parent().prev('.form-label') : element.prev('.form-label');

			element.addClass(c.CLASS_ERROR);
			label.addClass(c.CLASS_ERROR);

			m.formValid = false;
		},
		/**
		 * reset form valid
		 */
		setFormValid: function() {
			var m = _private,
				c = T1.constants;

			m.formValid = true;

			m.currentForm.removeClass(c.CLASS_ERROR_FORM);

			m.currentForm.find('.' + c.CLASS_ERROR).removeClass(c.CLASS_ERROR);
		},
		/**
		 * submit the form if valid
		 * @param e
		 */
		submit: function(e) {
			var m = _private;

			e.preventDefault();

			m.currentForm = $(e.target).parents('form');

			if (m.validate()) {
				var formId = m.currentForm.attr('id');

				if (formId === 'form-testdrive' || formId === 'form-brochure') {
					m.showResults = true;

					var models = m.currentForm.find('input[name="model"]:checked');

					m.resultData.models = {};
					for (var i = 0; i < models.length; i++) {
						var modelContainer = $(models[i]).closest('.modelitem');
						m.resultData.models[i] = modelContainer;
					}
					m.resultData.name = m.currentForm.find('input[name="firstname"]').val() + ' ' + m.currentForm.find('input[name="lastname"]').val();
					m.resultData.date = m.currentForm.find('input[name="date"]').val();

					var timeContainer = m.currentForm.find('.dropdown[data-select="time"] .dropdown-toggle span');
					m.resultData.time = timeContainer.html();

					m.resultData.address = m.currentForm.find('input[name="street"]').val() + ' ' +
						m.currentForm.find('input[name="housenr"]').val() + '<br/>' +
						m.currentForm.find('input[name="postcode"]').val() + ' ' +
						m.currentForm.find('input[name="city"]').val();

					var dealerInput = m.currentForm.find('input[name="dealer"]');
					if (dealerInput && dealerInput.length > 0) {
						m.resultData.dealer = dealerInput.data('item');
					}
				}

				m.submitAsync();

				if(!m.currentForm.data('preserve')){
					m.resetForm('', formId);
				}
			} else {
				m.currentForm.addClass('error-form');
			}
		},
		/**
		 * ajax submit in background
		 * @param e
		 */
		submitAsync: function() {
			var m = _private,
				eventArgs = {form: m.currentForm, data: $(m.currentForm).serialize(), url: m.getCurrentFormUrl(), cancel: false, json: false},
				request;

			PubSub.publishSync(T1.constants.BEFORE_FORM_SUBMIT, eventArgs);

			if(!eventArgs.cancel) {
				console.log(eventArgs.data);

				request = $.ajax({
					type: m.currentForm.attr('method') || 'POST',
					dataType: m.currentForm.data('type') || 'json',
					beforeSend: eventArgs.json ? _private.xhrBeforeSend : null,
					url: eventArgs.url,
					data: eventArgs.data
				});
				request.done(m.submitSuccess);
				request.fail(m.submitError);
				request.always(m.setEventsAfter);
			}
		},
		xhrBeforeSend: function(xhrObj){
			xhrObj.setRequestHeader('Content-Type', 'application/json');
			xhrObj.setRequestHeader('Accept', 'application/json');
		},
		getCurrentFormUrl: function() {
			var m = _private,
				currentId = m.currentForm.attr('id');
			return m.currentForm.attr('data-url') || m.formUrls[currentId];
		},
		/**
		 * handle submit if successful
		 * @param response
		 */
		submitSuccess: function(data, status, jqXHR) {
			var m = _private,
				c = T1.constants,
				currentTabPane = m.currentForm.parents('.tab-pane'),
				resultPane = $('#' + currentTabPane.attr('id') + '-result'),
				eventArgs = {form: m.currentForm, status: status, data: data, validated: true};

			if (data.success || status === 'success') {
				PubSub.publishSync(c.VALIDATE_FORM_RETURN, eventArgs);

				if (eventArgs.validated && resultPane.size()) {
					if (m.showResults) {
						resultPane.find('.result-name').html(m.resultData.name);
						if (m.resultData.date) {
							resultPane.find('.result-date').html(m.resultData.date);
						} else {
							resultPane.find('.result-date').parent().remove();
						}
						if (m.resultData.date) {
							resultPane.find('.result-time').html(m.resultData.time);
						} else {
							resultPane.find('.result-time').parent().remove();
						}
						resultPane.find('.result-address').html(m.resultData.address);
						if (m.resultData.dealer) {
							resultPane.find('.result-dealer').html(m.resultData.dealer.phone);
						} else {
							resultPane.find('.result-dealer').parent().remove();
						}
						if (m.resultData.models) {
							var modelContainer = resultPane.find('.result-car'),
								modelCopy = null;
							modelContainer.empty();

							$.each(m.resultData.models, function(key, value) {
								modelCopy = value.clone();
								modelCopy.find('a.btn').remove();
								modelContainer.append(modelCopy);
							});
						}
					}
					resultPane.addClass(c.CLASS_ACTIVE);
					currentTabPane.removeClass(c.CLASS_ACTIVE);
				}

				PubSub.publish(c.SUBMIT_FORM_RETURN, eventArgs);
			} else {
				m.submitError(jqXHR, status, data.error);
			}
		},
		/**
		 * handle submit if erratic
		 * @param request
		 * @param status
		 * @param error
		 */
		submitError: function(jqXHR, status, error) {
			var m = _private,
				labels = T1.labels,
				errorMessage = error.message || jqXHR.responseText || labels.forms.errorSubmit,
				eventArgs = {form: m.currentForm, code: jqXHR.status, status: status, message: (error) ? error.message : labels.forms.errorSubmit, showError: true};

			console.log(status + ': ' + errorMessage);

			PubSub.publishSync(T1.constants.SUBMIT_FORM_RETURN, eventArgs);
			if(eventArgs.showError) {
				m.setError(errorMessage);
			}
		},
		/**
		 * set events on form close or tab switch
		 */
		setEventsAfter: function(a, status, b) {
			var m = _private,
				c = T1.constants;

			PubSub.subscribe(c.TABS_SWITCH, m.resetForm);
			PubSub.subscribe(c.PAGEOVERLAYER_CLOSE, m.resetForm);
		},
		/**
		 * set form error with message
		 * @param message
		 */
		setError: function(message) {
			var m = _private,
				c = T1.constants;

			m.formValid = false;
			m.currentForm.addClass(c.CLASS_ERROR_FORM);
			m.currentForm.find('.error-message').html(message);
		},
		triggerError: function(msg, arg) {
			var m = _private;

			m.setError(arg);
		},
		/**
		 * reset current form
		 */
		resetForm: function(msg, arg) {
			var m = _private,
				c = T1.constants,
				currentTabPane = m.currentForm.parents('.tab-pane'),
				currentId = currentTabPane.attr('id'),
				resultPane = $('#' + currentId + '-result');

			m.setFormValid();

			resultPane.removeClass(c.CLASS_ACTIVE);

			if (currentId === arg) {
				currentTabPane.addClass(c.CLASS_ACTIVE);
			}
		},
		/**
		 * cancel and close form
		 * @param e
		 */
		cancel: function(e) {
			PubSub.publish(T1.constants.HASH_REMOVE, '');

			e.preventDefault();
		}
	};
	return {
		init: _private.init,
		initOnDemand: _private.initOnDemand,
		validate: _private.validate,
		submit: _private.submit,
		cancel: _private.cancel
	};
}());
