var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *
 */

T1.financeRates = ( function() {
	'use strict';
	// _private var for facade pattern (return public vars/functions)
	var _private = {
		blFinanceRates: null,
		cbFinanceRates: null,
		enabled: null,
		/* *
		 * initializes the finance rates component
		 * @return {void} void
		 * */
		init: function(){
		//	if(T1.settings.showMonthlyRepaymentRatesBox === 'true') {
				m.blFinanceRates = $('.finance-rates').show();
				m.cbFinanceRates = m.blFinanceRates.find('input[type="checkbox"]');
				PubSub.subscribe(c.FINANCE_RATES_ON, m.enableFinanceRates);
				PubSub.subscribe(c.FINANCE_RATES_OFF, m.disableFinanceRates);

				//add listener
				m.cbFinanceRates.on('change', m.toggleFinanceRates);

				//set initial state
				m.initState();
		//	}
		},
		/**
		 * Sets the initial state of the financeRates, according to local storage.
		 * If local storage var is not set, it will be turned on by default.
		 * @return {void} void
		 */
		initState: function(){
			if (Modernizr.localstorage) {
				if(parseInt(localStorage.getItem("financeRates")) === 0) {
					PubSub.publishSync(c.FINANCE_RATES_OFF);
				}
				else{
					PubSub.publishSync(c.FINANCE_RATES_ON);
				}
			}
		},
		toggleFinanceRates: function(e){
			if($(this).is(':checked')){
				PubSub.publish(c.FINANCE_RATES_ON);
			}
			else{
				PubSub.publish(c.FINANCE_RATES_OFF);
			}
		},
		/**
		 * Activate the finance rates display
		 * @return {void} void
		 */
		enableFinanceRates: function(e){
			localStorage.setItem("financeRates", 1);
			m.cbFinanceRates.prop('checked', true);
			m.enabled = true;
			$('body').addClass('show-finance-rates');
			m.requestRates();
		},
		/**
		 * Disable the finance rates display
		 * @return {void} void
		 */
		disableFinanceRates: function(e){
			localStorage.setItem("financeRates", 0);
			m.cbFinanceRates.prop('checked', false);
			m.clearRates();
			m.enabled = false;
			$('body').removeClass('show-finance-rates');
		},
		requestRates: function() {
			if(m.enabled && T1.settings.finance &&
				T1.settings.finance.showRatesMonthly === 'true' &&
			//	T1.data.finance.configs && $('[data-tfs-code]').size()) {
				T1.data && T1.data.finance && T1.data.finance.configs && $('[data-tfs-code]').size()) {
					T1.financeService.requestFinanceData({
						configs: T1.data.finance.configs,
						success: m.applyRates,
						multiple: true,
						source: 'Global'
					});
			}
		},
		applyRates: function(data) {
			if(data.error) {
				console.log(data.message);
				return;
			}

			$('[data-tfs-code]').each(function() {
				var node = $(this),
					code = node.data('tfs-code'),
					rate = data[code] && data[code].rate ? data[code].rate : null,
					show = data[code] && data[code].show ? data[code].show : null,
					ttle = rate && rate.productName ? rate.productName.formatted : T1.labels.viewDisclaimer;

				if(rate) {
					node.find('.tfs-input').each(function() {
						var input = $(this),
							output = T1.financeService.formatFinanceString(input.attr('data-tfs-input') || input.html(), rate, show);

						if(output || $.trim(output) !== '') {
							input.data('tfs-input', input.html());
							input.html(output).addClass('finance-rate');
						}
					});
					node.find('.tfs-disclaimer').html(T1.financeService.getDisclaimer(rate, true, ttle)).addClass('finance-rate');
				}
			});

			PubSub.publishSync(c.FINANCE_RATES_LOADED);
		},
		clearRates: function() {
			$('[data-tfs-code]').each(function() {
				var node = $(this);

				node.find('.tfs-input').each(function() {
					var input = $(this);

					input.removeClass('finance-rate');
					input.html(input.attr('data-tfs-input') || input.html());
				});
				node.find('.tfs-disclaimer').removeClass('finance-rate').empty();
			});
		}
	};
	var m = _private,
		c = T1.constants;

	return {
		init : _private.init,
		enabled : function() { return _private.enabled; }
	};

})();