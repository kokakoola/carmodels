var T1 = T1 || {};

T1.enginesComparer = (function(){
	'use strict';

	var _private = T1.comparer.extend({
		override: {
			initView: function initView() {
				this.getBase('initView')();
				this.uniformizeSpecsHeight();
			},
			onDataLoad: function(data) {
				this.indexData();
				this.addDynamicFilters();
				this.addCustomFilters();
				this.loadPricesCategory();

				for(var c in this.data.index.details) {
					if(this.data.index.details[c].full) {
						var category = this.addCategory(c);
						this.loadCategoryDetails(category, this.data.index.details[c].items);
					}
				}
			},
			uniformizeObjectsFilterHeight: function() {
				this.uniformizeHeight(this.compareView.find('.tools'), {rule:'margin-bottom'});
			},
			getCompareEvent: function() {
				return T1.constants.COMPARE_ENGINES;
			},
			onWindowResize: function onWindowResize(event, data) {
				this.getBase('onWindowResize')();
				this.uniformizeSpecsHeight();
			}
		},
		extend: {
			uniformizeSpecsHeight: function() {
				var objects = this.container.find('.objects .specs');
				objects.css('min-height', 0).css('min-height', this.getObjectsMaxHeight(objects));
			},
			indexData: function() {
				var index = {bodyTypes: {}, engines: {}, details: {}};

				for(var b = 0; b < this.data.bodyTypes.length; b++) {
					var bodyType = this.data.bodyTypes[b];
					index.bodyTypes[bodyType.code] = {engines: {}, grades: {}};

					for(var m = 0; m < this.data.subModels.length; m++) {
						var model = this.data.subModels[m];

						for(var g = 0; g < model.grades.length; g++) {
							var grade = model.grades[g];
							grade.bodyTypes.index = {};

							for(var bb = 0; bb < grade.bodyTypes.length; bb++) {
								var bbVar = grade.bodyTypes[bb];
								bbVar.engines.index = {};

								if(bbVar.code === bodyType.code) {
									index.bodyTypes[bodyType.code].grades[grade.code] = grade;
								}

								for(var ee = 0; ee < bbVar.engines.length; ee++) {
									var eeVar = bbVar.engines[ee];
									bbVar.engines.index[eeVar.code] = eeVar;
								}

								grade.bodyTypes.index[bbVar.code] = bbVar;
							}
						}
					}
				}

				for(var e = 0; e < this.data.engines.length; e++) {
					var engine = this.data.engines[e];

					// Bug in data: there is always each body type for each engine
					//if(engine.bodyTypes[bodyType.code]) {
					//	index.bodyTypes[bodyType.code].engines[engine.code] = engine;
					//}

					for(var bbType in engine.bodyTypes) {
						for(var c in engine.bodyTypes[bbType]) {
							var category = engine.bodyTypes[bbType][c];
							index.details[c] = index.details[c] || {items: {}, full: false};

							for(var i = 0; i < category.items.length; i++) {
								var item = category.items[i];

								index.details[c].items[item.id] = index.details[c].items[item.id] || {engines: {}, name: item.name, full: item.full};
								index.details[c].items[item.id].engines[engine.code] = index.details[c].items[item.id].engines[engine.code] || {};
								index.details[c].items[item.id].engines[engine.code][bbType] = category.items[i];
								index.details[c].items[item.id].full = index.details[c].items[item.id].full || item.full;
								index.details[c].full = index.details[c].full || index.details[c].items[item.id].full;

								// data bug workaround
								if(item.value !== this.noDataValue) {
									index.bodyTypes[bbType].engines[engine.code] = engine;
								}
							}
						}
					}

					index.engines[engine.code] = engine;
				}

				this.data.index = index;
			},
			loadPricesCategory: function() {
				if(this.data && T1.settings.hidePrices !== 'true') {
					var category = this.addSubCategory(this.addCategory(T1.labels.comparator.prices));

					for(var m = 0; m < this.data.subModels.length; m++) {
						var model = this.data.subModels[m];

						for(var g = 0; g < model.grades.length; g++) {
							var grade = model.grades[g],
								ccisImage = T1.settings.CCISHost + 'vehicle/' + this.data.code + '/' + grade.car + '/width/100/height/50/' + T1.constants.DEFAULT_EXTERIOR_VIEW,
								statImage = grade.images && grade.images[0] && grade.images[0].fileName ? (T1.settings.cardbImageHost + grade.images[0].fileName) : ('/images/' + T1.constants.MISSING_IMAGE),
								container = $('<div/>').addClass('col-sm-2').add($('<div/>').addClass('col-sm-10'));

							container.filter('.col-sm-10').html(grade.name).addClass(model.isHybrid ? 'hybrid' : null);
							container.filter('.col-sm-2').append($('<img/>').attr('src', this.data.ccVersion === 'None' ? statImage : ccisImage).addClass('img-responsive'));
							this.handleResponsiveImages({
								images: container.find('img'),
								handler: $.proxy(this.uniformizeDetailsHeight, this)
							});

							var item = this.addItem(category, {
								content: container,
								className: this.noHighLightClass
							});

							for(var e = 0; e < this.data.engines.length; e++) {
								var engine = this.data.engines[e];

								for(var b = 0; b < this.data.bodyTypes.length; b++) {
									var bodyType = this.data.bodyTypes[b];

									for(var f = 0; f < this.data.fuelTypes.length; f++) {
										var fuelType = this.data.fuelTypes[f],
											grades = this.data.index.bodyTypes[bodyType.code].grades,
											hasContent =
												grades[grade.code] &&
													engine.fuel === fuelType.code &&
													grades[grade.code].bodyTypes.index[bodyType.code] &&
													grades[grade.code].bodyTypes.index[bodyType.code].engines.index[engine.code],
											prices = hasContent ? grades[grade.code].bodyTypes.index[bodyType.code].engines.index[engine.code].price : null;

										this.addItemObjectValue(item, {
											filters: [
												{name: 'engine', value: engine.code},
												{name: 'body-type', value: bodyType.code},
												{name: 'fuel-type', value: fuelType.code}
											],
											value: prices && prices.listWithDiscount ? prices.listWithDiscount : false,
											displayValue: hasContent ? this.getPricesContainer(prices) : false
										});
									}
								}
							}
						}
					}
				}
			},
			loadCategoryDetails: function(category, details) {
				if(details) {
					category = this.addSubCategory(category);

					for(var id in details) {
						if(details[id].full) {
							var detail = details[id],
								item = this.addItem(category, {content: detail.name});

							for(var e = 0; e < this.data.engines.length; e++) {
								var engine = this.data.engines[e];

								for(var b = 0; b < this.data.bodyTypes.length; b++) {
									var bodyType = this.data.bodyTypes[b],
										condition =
											detail.engines[engine.code] &&
												detail.engines[engine.code][bodyType.code] &&
												detail.engines[engine.code][bodyType.code].value !== this.noDataValue,
										exceptions = condition ? detail.engines[engine.code][bodyType.code].grades : null,
										label = condition ? detail.engines[engine.code][bodyType.code].value : false;

									var cell = this.addItemObjectValue(item, {
										filters: [
											{name: 'engine', value: engine.code},
											{name: 'body-type', value: bodyType.code}
										],
										value: label,
										extra: exceptions ? this.getExceptionBlock(exceptions, label) : null
									});

									if(exceptions) { cell.html(cell.find('>span')); }
								}
							}
						}
					}
				}
			},
			getExceptionBlock: function (exceptions, label) {
				var cod = 'item-' + new Date().getTime(),
					exs = this.getExpansionContainer(cod),
					exc = exs.find('.expansion-inner'),
					ict = $('<span/>').text(label || '?').addClass('readMore exceptions').attr('data-tooltip-selector', '#' + cod);

				for (var c = 0; c < exceptions.length; c++) {
					var row = $('<div class="row"/>');
					row.append($('<div class="col-sm-9"/>').html(exceptions[c].name));
					row.append($('<div class="col-sm-3"/>').html(exceptions[c].value));
					exc.append(row);
				}

				return ict.append(exs);
			},
			// for any comparison between filter values && options.data (!this.data) values use filter.get and filter.getUnsafeData
			addDynamicFilters: function() {
				// 'all fuel' custom filter
				this.addDynamicFilter('all-fuel', function(options) {
					if(!options.filter['fuel-type']) { // no fuel filter means 'all'
						var engine = options.data.index.engines[options.filter.getUnsafeData(this.data('filter-engine'))];
						return (!this.data('filter-fuel-type') ||
							options.selection[this.data('filter-engine')] && engine &&
								options.filter.getUnsafeData(this.data('filter-fuel-type')) == engine.fuel) ? false : true;
					}
					return false;
				});

				// fade out cells with no matching fuel type
				this.addDynamicFilter('fade-out', function(options) {
					if(options.filter['fuel-type']) { // 'all fuel' not concerned
						var engine = options.data.index.engines[options.filter.getUnsafeData(this.data('filter-engine'))];
						return !engine || engine.fuel != options.filter.get('fuel-type') ? true : false;
					}
					return false;
				});

				// fade out cells with no matching body type
				this.addDynamicFilter('fade-out', function(options) {
					if(!this.hasClass('all-fuel')) { // all fuel filter more important
						return !options.data.index.bodyTypes[options.filter.get('body-type')].engines[options.filter.getUnsafeData(this.data('filter-engine'))] ? true : false;
					}
					return false;
				});
			},
			addCustomFilters: function() {
				// fade out engines selector with no matching fuel/body type
				this.addCustomFilter('fade-out', '.expandable-objects .col-sm-3', function(options) {
					return (options.filter['fuel-type'] && options.filter['fuel-type'] != this.data('filter-fuel-type') ? true : false) ||
						(this.data('filter-body-type') && this.data('filter-body-type').indexOf(options.filter['body-type']) === -1 ? true : false);
				});
			}
		}
	}, $('#enginesComparer'));

	var m = _private,
		c = T1.constants;

	return {
		init: $.proxy(_private.init, _private)
	};
}());