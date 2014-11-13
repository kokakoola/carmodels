var T1 = T1 || {};

/**
 *
 *  MDA
 *
 */
T1.compareModelsMobile = ( function() {
	'use strict';

	var _private = {
		container: $('#compareModelsMobile'),
		dataContainer: $('#gcmEquipments'),
		data: {source: null, hybrid:{grades:[]}, nonHybrid:{grades:[]}, index: null},
		currentTab: null,
		deferOvl: null,

		initMobile: function(){
			if(!m.container.size()) return;

			PubSub.subscribe(T1.constants.PAGEOVERLAYER_OPEN, function(evt, data){
				if(data.grade && data.html.is(m.dataContainer)) {
					m.loadDetails(data.grade);
				}
			});

			PubSub.subscribe(T1.constants.MOBILE_COMPARE_MODELS_CHANGE, m.mobileCompareModelsChange);
			PubSub.subscribe(T1.constants.FINANCE_RATES_ON, _private.requestFinanceData);
			PubSub.subscribe(T1.constants.FINANCE_RATES_OFF, _private.clearFinanceData);
			m.container.find('.gcm-section-toggle').click(m.onTabClick);
			m.container.find('.gcm-model-trigger').click(m.onModelNodeClick);
			m.getData();
		},
		onTabClick: function(e){
			if(e.preventDefault) e.preventDefault();

			m.container.find('.gcm-section-toggle').removeClass('active');
			var $this = $(this).addClass('active');

			PubSub.publish(T1.constants.HASH_REPLACE, {
				oldValue  : m.currentTab,
				newValue  : $this.data('gcm-task')
			});

			m.currentTab = $this.data('gcm-task');
			m.container.find('.gcm-sub-container').removeClass('active');
			$('.' + $this.data('gcm-task')).addClass('active');
			scrollTo(0,0);
		},
		onModelNodeClick: function(e) {
			if(e.preventDefault) e.preventDefault();
			if(e.target.nodeName.toLowerCase() !== 'a') {			
				PubSub.publish(
					T1.constants.HASH_ADD,
					'/publish/mobile_compare_models_change/modelCode=' + $(this).data('gcm-model-code')
				);
			}
		},
		loadDetails: function(grade){
			var equipment = m.groupCarEquipment(grade);
			m.dataContainer.find('header h1').html(grade.name);
			m.dataContainer.find('header h4:not(.gcm-promo-count) i').html(globalize.format(grade.minPrice.listWithDiscount, 'c'));
			if(grade.minPrice.discounts) {
				m.dataContainer.find('header .gcm-promo-count-holder').html('(' + grade.minPrice.discounts.length + ')');
			}
			m.dataContainer.find('header .gcm-promo-count').toggle(grade.minPrice.discountsApplied || false);
			m.dataContainer.find('header img').attr('src', T1.settings.CCISHost + 'vehicle/' +
				m.data.source.code + '/' + grade.minPrice.car + '/' + c.DEFAULT_EXTERIOR_VIEW);
			m.dataContainer.find('header p').html(grade.description || '');
			m.dataContainer.find('header a').attr('href', m.data.source.links.CarConfigurator);
			m.loadCarOptions(equipment);
			m.loadCarAccessories(equipment);
		},
		groupCarEquipment: function(grade) {
			var equipment = {};
			if(grade.equipment) {
				for(var i = 0; i < grade.equipment.length; i++) {
					var eq = grade.equipment[i];
					if(!equipment[eq.type]) { equipment[eq.type] = []; }
					equipment[eq.type].push(eq);
				}
			}
			return equipment;
		},
		loadCarOptions: function(equipment) {
			var container = m.dataContainer.find('#topFeatures').hide();
			container.empty();
			if(equipment.CarOption) {
				for(var i = 0; i < equipment.CarOption.length; i++) {
					var item = $('<div class="col-xs-6"></div>'),
						image = m.getOptionImage(equipment.CarOption[i]);
					$('<img/>').attr('src', image ? (T1.settings.cardbImageHost + image.fileName) : '/images/' + c.MISSING_IMAGE).appendTo(item);
					$('<p/>').html(equipment.CarOption[i].name).appendTo(item);
					item.appendTo(container);
				}
				container.show();
			}
		},
		getOptionImage: function(equipment) {
			if(equipment.images) {
				for(var i = 0; i < equipment.images.length; i++) {
					if(equipment.images[i].type === 'IMG_PNG_285x260') {
						return equipment.images[i];
					}
				}
			}
		},
		loadCarAccessories: function(equipment) {
			var container = m.dataContainer.find('#standardFeatures').hide();
			container.empty();
			if(equipment.CarAccessory) {
				for(var i = 0; i < equipment.CarAccessory.length; i++) {
					$('<li/>').html(equipment.CarAccessory[i].name).appendTo(container);
				}
				container.show();
			}
		},
		mobileCompareModelsChange: function(evt, data) {
			if(m.data.source) {
				var grade = m.getGrade(data.modelCode);
				if(grade) {
					PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {
						html: m.dataContainer,
						preserveContent: true,
						grade: grade,
						pageName: m.container.data('section-title')
					});
				}
				m.deferOvl = null;
			}
			else {
				m.deferOvl = {evt: evt, data: data};
			}
		},
		getCarModel: function() {
			return $('.car-model').data('car-model');
		},
		getData: function(){
			$.getJSON('/api/cardb/gradesequipment/' + m.getCarModel(), m.onGetData);
		},
		onGetData: function(data) {
			m.data.source = data;
			for(var i = 0; i< data.subModels.length; i++) {
				var grades = data.subModels[i];
				if(grades.isHybrid) {
					m.data.hybrid = grades;
				}
				else {
					m.data.nonHybrid = grades;
				}
			}
			if(m.deferOvl) { m.mobileCompareModelsChange(m.deferOvl.evt, m.deferOvl.data); }
			m.requestFinanceData();
			m.loadPromotions();
		},
		getGrade: function(modelCode) {
			if(!m.data.source.index) {
				m.data.source.index = {};
				var grades = m.getGrades();
				for(var i = 0; i < grades.length; i++) {
					m.data.source.index[grades[i].code] = grades[i];
				}
			}
			return m.data.source.index[modelCode];
		},
		getGrades: function() {
			return m.data.hybrid.grades.concat(m.data.nonHybrid.grades);
		},
		loadPromotions: function() {
			if(m.data.source) {
				$('.gcm-model-trigger').each(function() {
					var $this = $(this),
						grade = m.getGrade($this.data('gcm-model-code'));
					if(grade &&	grade.minPrice.discountsApplied) {
						$this.find('.promolabel').show();
					}
				});
			}
		},
		requestFinanceData: function() {
			if(T1.settings.finance.showRatesMonthly === 'true' && T1.financeRates.enabled()) {
				var configs = {},
					grades = m.getGrades();

				for (var i = 0; i < grades.length; i++) {
					configs[grades[i].code] = grades[i].minPrice.config;
				}

				T1.financeService.requestFinanceData({
					configs: configs,
					success: _private.loadFinanceData,
					multiple: true,
					source: 'MobileModelsComparer'
				});
			}
			else {
				_private.clearFinanceData();
			}
		},
		loadFinanceData: function(data) {
			var grades = m.getGrades();

			for (var i = 0; i < grades.length; i++) {
				var code = grades[i].code,
					node = _private.container.find('.gcm-model-trigger[data-gcm-model-code="' + code + '"]'),
					rate = data[code] && data[code].rate ? data[code].rate : null,
					show = data[code] && data[code].show ? data[code].show : null;

					// debug
					/*show = {
						miniccFinance: true,
						miniccRate: true,
						miniccInsurance: true,
						ccFinance: true,
						ccRate: true,
						ccInsurance: true,
						aft: true,
						carChapter: true,
						effectiveRate: true,
						annualRate: true,
						term: true,
						name: true
					};*/

				if(rate) {
					// monthly payment
					if(rate.monthlyPayment) {
						node.find('.monthly-payment').html(
							T1.financeService.formatFinanceString(T1.labels.comparator.monthlyPayment, rate, show, 'b'));
					}

					// rate details
					if((show.effectiveRate && rate.effectiveInterestRate) || (show.annualRate && rate.annualInterestRate)) {
						var	finc = T1.financeService.formatFinanceString(T1.labels.comparator.priceRate, rate, show, 'b'),
							ovId = '_' + grades[i].car,
							disc = _private.getExpansionContainer(ovId, true).appendTo(node),
							diss = T1.financeService.getDisclaimer(rate, true, T1.labels.viewDisclaimer);

						node.find('.payment-rate').html(finc + ' ').append($('<a href="#" class="readMore"/>').
							html(T1.labels.viewDisclaimer).attr('data-tooltip-selector', '#' + ovId));
						disc.find('.expansion-inner').empty().append(diss);
					}
				}
			}
		},
		clearFinanceData: function() {
			_private.container.find('.monthly-payment');
			_private.container.find('.payment-rate');
		},
		getExpansionContainer: function (code, arrow) {
			var container = _private.container.find('.expansion-content.template').clone().attr('id', code).removeClass('template');
			if(arrow) { container.append($('<div/>').addClass('expansion-arrow')); }
			return container;
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		initMobile: _private.initMobile,
		switchDesktop: _private.switchDesktop,
		switchMobile: _private.switchMobile
	};
})();