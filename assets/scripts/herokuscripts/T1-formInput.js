var T1 = T1 || {};

/**
 * custom form input components
 * version 0.1
 * KGH: init
 */
T1.formInput = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		datePickerOptions: {},
		/**
		 * initialize
		 */
		init: function() {
			var m = _private,
				c = T1.constants;

			$('form, .form').filter(':visible').each(function(){
				m.initInputs('', $(this));
			});

			PubSub.subscribe(c.FORM_LOAD, m.initInputs);
		},
		initOnDemand: function(objs) {
			if(objs) {
				objs.each(function() {
					_private.initInputs(null, $(this));
				});
			}
		},
		/**
		 * init inputs on demand
		 * @param msg
		 * @param form
		 */
		initInputs: function(msg, form) {
			if (form.length > 0) {
				var m = _private,
					checkboxes = form.find('input[type="checkbox"]'),
					radios = form.find('input[type="radio"]'),
					labels = checkboxes.siblings('label').add(radios.siblings('label')),
					dateInputs = form.find('.input-group.date'),
					btnSelect = form.find('.compare-btn');

				checkboxes.off('click', m.handleCheck).on('click', m.handleCheck);
				radios.off('click', m.handleRadioSelect).on('click', m.handleRadioSelect);
				labels.off('click', m.handleLabelClick).on('click', m.handleLabelClick);
				if (dateInputs.length > 0) {
					dateInputs.datepicker(m.getDatePickerOptions());
				}
				form.off('tap click', '.checkbox-btn', m.handleCheckboxButton).on('tap click', '.checkbox-btn', m.handleCheckboxButton);
				btnSelect.off('click', m.handleButtonSelect).on('click', m.handleButtonSelect);
			}
		},
		getDatePickerOptions: function() {
			return {
				format: T1.settings.culture.calendar.patterns.d,
				startDate: '+1d',
				language: T1.settings.language,
				todayHighlight: true
			};
		},
		/**
		 * handle checkbox group logic (select all)
		 * @param e
		 */
		handleCheck: function(e) {
			var checkBox = $(e.target),
				checkBoxGroup = checkBox.closest('.form, form').find('input[name="' + checkBox.attr('name') + '"]'),
				checkBoxAll = checkBoxGroup.filter('.select-all'),
				CHECKED = 'checked';

			// select all?
			if (checkBox.hasClass('select-all')) {
				checkBoxGroup.prop(CHECKED, checkBoxAll.is(':' + CHECKED));
			} else {
				var amountChecked = checkBoxGroup.filter(':' + CHECKED).length;

				// if all checked, uncheck select all
				if (checkBoxAll.is(':' + CHECKED)) {
					checkBoxAll.prop(CHECKED, false);
				// if all but one checked, check select all
				} else if (amountChecked === checkBoxGroup.length - 1) {
					checkBoxAll.prop(CHECKED, true);
				}
			}
		},
		/**
		 * handle click on radio/cb label
		 * @param e
		 */
		handleLabelClick: function(e) {
			var label = $(e.target),
				inputId = label.attr('for');

			e.preventDefault();

			if (inputId) {
				var input = label.closest('form, .form').find('#' + inputId),
					type = input.attr('type');

				if (type === 'checkbox' || type === 'radio') {
					input.trigger('click');
				}
			}
		},
		/**
		 * handle radiobutton select
		 * @param e
		 */
		handleRadioSelect: function(e) {
			var radio = $(e.target),
				radioGroup = radio.siblings('input[type="radio"][name="' + radio.attr('name') + '"]');

			radioGroup.removeAttr('checked');
		},
		/*
		*
		* to do: to be removed when comparers are refactored
		* */
		handleButtonSelect: function(e) {
			var target = $(e.target),
				tag = target.prop('tagName'),
				container = target.closest('[data-validation^="select-"]'),
				btn = (tag === 'A') ? target : target.closest('.compare-btn'),
				checkbox = btn.children('input[type="checkbox"]'),
				isChecked = checkbox.prop('checked'),
				validation = container.attr('data-validation');

			if (target.hasClass('toast')) {
				e.preventDefault();
				return;
			}

			if (tag === 'A') {
				e.preventDefault();
			}

			if (validation) {
				var maxAmount = validation.replace('select-', '') * 1,
					selected = container.find('input[type="checkbox"]:checked');

				if (!isChecked && selected.length > maxAmount - 1) {
					PubSub.publish(T1.constants.TOAST_CUSTOM, {
						customContainer: btn,
						customText: T1.labels.forms.selectItemsRestriction.replace('[0]', maxAmount),
						timeout: 3000
					});
					return;
				}
			}

			if (isChecked) {
				btn.removeClass('btn-dark');
				btn.addClass('btn-grey');
				checkbox.prop('checked', false);
			} else {
				btn.removeClass('btn-grey');
				btn.addClass('btn-dark');
				checkbox.prop('checked', true);
			}
		},
		/*
		* Handle checkbox buttons
		*
		* */
		handleCheckboxButton: function(e) {
			e.preventDefault();
			var button = $(this),
				checkbox = button.find('input[type="checkbox"]');

			checkbox.prop('checked', !checkbox.is(':checked')).change();
			button.toggleClass(button.attr('data-on-class'), checkbox.is(':checked'));
			button.toggleClass(button.attr('data-off-class'), !checkbox.is(':checked'));
		},
		destroy: function() {
			var m = _private,
				c = T1.constants;

			PubSub.unsubscribe(c.PAGEOVERLAYER_CLOSED, m.initInputs);
		}
	};
	return {
		init: _private.init,
		initOnDemand: _private.initOnDemand,
		destroy: _private.destroy
	};
}());
