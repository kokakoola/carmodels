/**
 * Created by ejder on 12/05/14.
 */

var T1 = T1 || {};

T1.financeService = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		tokens: {},
		history: {},

		/**
		 * subscribe the events to the post request function
		 */
		init: function() {
			m.tokens.postRequestFinance = PubSub.subscribe(T1.constants.FINANCE_EXTERNAL_POST_REQUEST, m.onPostRequest);
			m.tokens.postRequestInsurance = PubSub.subscribe(T1.constants.INSURANCE_EXTERNAL_POST_REQUEST, m.onPostRequest);
			m.handleConfigPage();
		},

		/* handle TFS diagnostic page */
		handleConfigPage: function() {
			$(document).on('keydown', function(e) {
				if(e.ctrlKey && e.shiftKey && e.which === (T1.settings.finance.configPageKey || 88)) {
					PubSub.publish(c.HASH_CHANGE, '/publish/finance_config');
				}
			});

			PubSub.subscribe(c.FINANCE_CONFIG, function(event, data) {
				PubSub.publish(c.PAGEOVERLAYER_OPEN, {url: T1.settings.finance.configPageUrl, ajax: true, sync: true, styleClass: m.ovlClass});
				 var token = PubSub.subscribe(c.PAGEOVERLAYER_LOAD, function(event, data) {
				 	m.loadConfig();
				 	PubSub.unsubscribe(token);
				 });
			});
		},
		loadConfig: function() {
			var container = $('.finance-config'),
				dataSection = container.find('.finance-data');

			// Tridion settings and labels
			m.applyDataTemplate(dataSection, T1);

			// TFS stack traces
			for(var key in m.history) {
				var clone = container.find('.tfs-stack.section.template').clone();
				m.applyDataTemplate(clone, m.history[key]);
				clone.attr('id', '_' + key);
				dataSection.append(clone);
				dataSection.find('>.template').removeClass('template');
			}
			dataSection.find('.tfs-stack.section >h5').on('click', m.historyPanelClick);
		},
		applyDataTemplate: function(container, data) {
			if(container.size()) {
				container.find('[data-path]').each(function() {
					var $this = $(this),
						value = Object.resolve($this.data('path'), data);
					$this.html($.isPlainObject(value) ? m.highlightJSON(JSON.stringify(value, null, 3)) : (value !== null ? value.toString() : '-'));
				});
			}
		},
		highlightJSON: function(json) {
			json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
				var cls = 'number';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'key';
					} else {
						cls = 'string';
					}
				} else if (/true|false/.test(match)) {
					cls = 'boolean';
				} else if (/null/.test(match)) {
					cls = 'null';
				}
				return '<span class="' + cls + '">' + match + '</span>';
			});
		},
		historyPanelClick: function(e) {
			var panel = $(e.currentTarget.parentNode).find('.panel');

			if(!panel.is(':animated')) {
				panel.slideToggle({
					duration: 400,
					complete: function() {
						if($(this).is(':visible')) {
							panel.closest('.tfs-stack').addClass('active');
						}
						else {
							panel.closest('.tfs-stack').removeClass('active');
						}
					}
				});
			}
		},

		/**
		 * run the post request for finance/insurance
		 * @param msg
		 * @param data
		 */
		onPostRequest: function(msg, data){
			// create a dummy model
			var model = {
				'Country': T1.settings.country,
				'Brand': T1.settings.carconfig.brand,
				'Language': T1.settings.language
			};

			// extend the dummy model with the provided data
			for(var sKey in data){
				if(sKey!=='prototype') model[sKey] = data[sKey];
			}

			// set the post form actions
			var options = {
					'target': T1.utilities.browser.isSafari ? '_blank' : '_overlayer',
					'fields': {
						configuration: JSON.stringify(model)
					}
				};

			// set the form action (post url) -> default = finance; can be insurance as well
			if(msg === T1.constants.INSURANCE_EXTERNAL_POST_REQUEST){
				options.action = T1.settings.finance.urlMyInsuranceMiniCC || "http://tfscalcv3uat.synectics-solutions.com/39A2F185-AA9E-46A6-9524-7AA15361A612";
			}else{
				options.action = T1.settings.finance.urlMyFinanceMiniCC || "http://tfscalcv3uat.synectics-solutions.com/1A951604-12B5-489B-A09C-F4D0F9D06661";
			}

			// post the form to the other domain
			PubSub.publish(T1.constants.FORM_CROSS_DOMAIN_POST, options);
		},
		requestFinanceData: function(q) {
			var proxy = (T1.settings.mock)? 'http://t1-dev-proxy.herokuapp.com' : T1.settings.loadSaveServer,
				url = proxy + '/tfs/car' + (q.multiple ? 's/' : '/') + T1.settings.country,
				data = JSON.stringify(q.configs),
				id = new Date().getTime();

			m.stackHistory(id, q.source, q.configs);

			if(T1.utilities.ieVersion() < 10) {
				var xdr = new XDomainRequest();
				xdr.onprogress = function() {};
				xdr.onload = function() {
					if(xdr) {
						var response = JSON.parse(xdr.responseText);
						if(q.success) q.success(response);
						m.stackHistory(id, q.source, q.configs, response);
					}
				};
				xdr.onerror = function() {
					console.log('error handling finance information.');
					m.stackHistory(id, q.source, q.configs, xdr, true);
				};
				xdr.timeout = 60000;
				xdr.open("POST", url);
				xdr.send(data);
			}
			else {
				var query = $.ajax({
					url: url,
					type: 'POST',
					data: data,
					contentType: 'application/json',
					crossDomain: true
				});
				query.done(q.success).done(function(data) {
					m.stackHistory(id, q.source, q.configs, data);
				});
				query.fail(function(jqXHR, status, error) {
					console.log('error handling finance information ' + error);
					m.stackHistory(id, q.source, q.configs, jqXHR, true);
				});
			}
		},
		stackHistory: function(id, source, configs, response, failed) {
			m.history[id] = {
				xdr: T1.utilities.ieVersion() < 10,
				failed: failed || (response && response.error ? response.error : false),
				source: source || 'Unknown',
				configs: configs,
				response: response,
				inProgress: response ? false : true,
				start: m.history[id] ? m.history[id].start : new Date(),
				stop: m.history[id] ? new Date() : null
			};
			if(m.history[id].stop) { m.applyDataTemplate($('#_' + id), m.history[id]); }
		},
		formatFinanceString: function(source, rate, show, tag) {
			if(source && rate && show) {
				// product name
				source = m.replaceNode(source, 'productName', show.name && rate.productName ? m.tag({source: rate.productName.formatted, className: 'finance-product-name', tag: tag}) : null);
				// term
				source = m.replaceNode(source, 'term', show.term && rate.term ? m.tag({source: rate.term.formatted, className: 'finance-trm', tag: tag}) : null);
				// taeg
				source = m.replaceNode(source, 'taeg', show.effectiveRate && rate.effectiveInterestRate ? m.tag({source: rate.effectiveInterestRate.formatted, className: 'finance-taeg', tag: tag}) : null);
				// tan
				source = m.replaceNode(source, 'tan', show.annualRate && rate.annualInterestRate ? m.tag({source: rate.annualInterestRate.formatted, className: 'finance-tan', tag: tag}) : null);
				// monthly payment
				source = m.replaceNode(source, 'price', rate.monthlyPayment ? m.tag({source: rate.monthlyPayment.formatted, className: 'finance-monthly-price', tag: tag}) : null);

				return source;
			}
			return '';
		},
		replaceNode: function(source, node, value) {
			var reg = new RegExp('\\[' + node + '](.*?)\\[/' + node + ']', 'gi');
			return source.replace(reg, function(match, $1, $2, offset, original) { return m.replaceValue($1, value); });
		},
		replaceValue: function(source, value) {
			return value ? source.replace(/{value}/g, value) : '';
		},
		tag: function(data) {
			return '<{tag} class="{class}">{source}</{tag}>'.
				replace(/{tag}/g, data.tag || 'i').
				replace(/{source}/g, data.source || '').
				replace(/{class}/g, data.className || '');
		},
		getDisclaimer: function(rate, calculations, title) {
			if(rate && rate.quote) {
				var disclaimer = $('<div class="finance-disclaimer"/>');
				if(title) { disclaimer.append($('<h4/>').html(title)); }
				if(calculations && rate.quote.calculations) {
					for (var c = 0; c < rate.quote.calculations.length; c++) {
						var row = $('<div/>').addClass('row').appendTo(disclaimer),
							cal = rate.quote.calculations[c];
						row.append($('<div/>').addClass('col-xs-6 col-lg-6').html(cal.name));
						row.append($('<div/>').addClass('col-xs-6 col-lg-6').html(cal.value));
						if(rate.quote.calculations[c].format && rate.quote.calculations[c].format.b) {
							row.css('font-weight', 'bold');
						}
					}
				}
				disclaimer.append($('<p/>').html(rate.quote.value));
				return (calculations || title) ? disclaimer : rate.quote.value;
			}
			return null;
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		init : _private.init,
		requestFinanceData: _private.requestFinanceData,
		formatFinanceString: _private.formatFinanceString,
		getDisclaimer: _private.getDisclaimer
	};
})();