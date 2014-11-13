var T1 = T1 || {};

T1.modelsComparer = (function(){
	'use strict';

	var _private = T1.comparer.extend({
		override: {
			onDataLoad: function(data) {
				this.indexData();
				this.addDynamicFilters();
				this.addCustomFilters();
				this.loadPricesCategory();

				for(var e = 0; e < data.equipment.length; e++) {
					var category = this.addCategory(data.equipment[e].name, data.equipment[e].code);
					this.loadCategoryEquipment(category, data.equipment[e].items);
				}
			},
			getCompareEvent: function() {
				return T1.constants.COMPARE_MODELS;
			}
		},
		extend: {
			indexData: function() {
				if(this.data) {
					var index =  {equipment: {}, grades: {}};

					// index all items first
					for(var c = 0; c < this.data.equipment.length; c++) {
						var equipment = this.data.equipment[c];

						if(equipment.items) {
							for(var i = 0; i < equipment.items.length; i++) {
								var item = equipment.items[i];
								index.equipment[item.code] = {};
							}
						}
					}

					// index body types items
					for(var m = 0; m < this.data.subModels.length; m++) {
						var model = this.data.subModels[m];

						for(var g = 0; g < model.grades.length; g++) {
							var grade = model.grades[g];
							index.grades[grade.code] = index.grades[grade.code] || {bodyTypes: {}};

							for(var b in grade.bodyType) {
								var bodyType = grade.bodyType[b];
								index.grades[grade.code].bodyTypes[b] = {fuelType: bodyType.fuelType};

								for(var e in bodyType.equipment) {
									index.equipment[e] = index.equipment[e] || {};
									index.equipment[e][grade.code] = index.equipment[e][grade.code] || {};
									index.equipment[e][grade.code][b] = {exceptions: bodyType.equipment[e].cars};
								}
							}
						}
					}

					this.data.index = index;
				}
			},
			loadPricesCategory: function() {
				if(this.data && T1.settings.hidePrices !== 'true') {
					var category = this.addSubCategory(this.addCategory(T1.labels.comparator.prices, 'PRC')),
						fuelCategories = {};

					for(var e = 0; e < this.data.engines.length; e++) {
						var engine = this.data.engines[e],
							image = engine.images && (engine.images.IMG_PNG_285x260 || engine.images['IMG_TECH-GUIDE_91x91']) ?
								(T1.settings.cardbImageHost + (engine.images.IMG_PNG_285x260 || engine.images['IMG_TECH-GUIDE_91x91'])) :
								('/images/' + c.MISSING_IMAGE),
							container = $('<div/>').addClass('col-sm-2').add($('<div/>').addClass('col-sm-10')),
							fuelCategory = fuelCategories[engine.fuelCode] || this.addSubCategory(category, engine.fuelName);

						container.filter('.col-sm-10').html(engine.name).addClass(engine.isHybrid ? 'hybrid' : null);
						container.filter('.col-sm-2').append($('<img/>').attr('src', image).addClass('img-responsive'));
						this.handleResponsiveImages({
							images: container.find('img'),
							handler: $.proxy(this.uniformizeDetailsHeight, this)
						});

						var item = this.addItem(fuelCategory, {
							content: container,
							className: this.noHighLightClass
						});

						fuelCategories[engine.fuelCode] = fuelCategory;

						for(var m = 0; m < this.data.subModels.length; m++) {
							var model = this.data.subModels[m];

							for(var g = 0; g < model.grades.length; g++) {
								var grade = model.grades[g];

								for(var b = 0; b < this.data.bodyTypes.length; b++) {
									var bodyType = this.data.bodyTypes[b],
										fuelType = grade.bodyType[bodyType.code] ? grade.bodyType[bodyType.code].fuelType[engine.fuelCode] : null,
										hasContent = fuelType && fuelType.engine[engine.code],
										prices = hasContent ? fuelType.engine[engine.code].minPrice : null;

									this.addItemObjectValue(item, {
										filters: [
											{name: 'grade', value: grade.code},
											{name: 'body-type', value: bodyType.code}
										],
										value: prices && prices.listWithDiscount ? prices.listWithDiscount : false,
										displayValue: hasContent ? this.getPricesContainer(prices) : false
									});
								}
							}
						}
					}
				}
			},
			loadCategoryEquipment: function(category, equipment) {
				if(equipment) {
					category = this.addSubCategory(category);
					for(var e = 0; e < equipment.length; e++) {
						var eq = equipment[e],
							item = this.addItem(category, {content: eq.name}),
							index = this.data.index.equipment[eq.code];

						// index body types items
						for(var m = 0; m < this.data.subModels.length; m++) {
							var model = this.data.subModels[m];

							for(var g = 0; g < model.grades.length; g++) {
								var grade = model.grades[g];

								for(var b = 0; b < this.data.bodyTypes.length; b++) {
									var bodyType = this.data.bodyTypes[b],
										bodyData = (index[grade.code] && index[grade.code][bodyType.code]) ? index[grade.code][bodyType.code] : null,
										exceptions = bodyData && bodyData.exceptions ? this.getExceptionBlock(bodyData.exceptions) : null;

									var cell = this.addItemObjectValue(item, {
										filters: [
											{name: 'grade', value: grade.code},
											{name: 'body-type', value: bodyType.code}
										],
										value: bodyData ? true : false,
										extra: exceptions
									});

									if(exceptions) {
										cell.find('>.icon-minus, >.icon-radio-checked').prependTo(exceptions);
									}
								}
							}
						}
					}
				}
			},
			getExceptionBlock: function (exceptions) {
				var cod = 'item-' + new Date().getTime(),
					exs = this.getExpansionContainer(cod),
					exc = exs.find('.expansion-inner'),
					ict = $('<span/>').text('?').addClass('readMore exceptions').attr('data-tooltip-selector', '#' + cod);

				for (var c = 0; c < exceptions.length; c++) {
					var row = $('<div class="row"/>');
					row.append($('<div class="col-sm-10"/>').html(exceptions[c].name));
					row.append($('<div class="col-sm-2"/>'));
					switch(exceptions[c].equipped) {
						case 's':
							row.find('.col-sm-2').append('<i class="icon-radio-checked" />');
							break;

						case 'o':
							row.find('.col-sm-2').append('<i class="icon-radio-uncheck" />');
							break;

						default:
							row.find('.col-sm-2').append('<i class="icon-minus" />');
					}
					exc.append(row);
				}

				return ict.append(exs);
			},
			// for any comparison between filter values && options.data (!this.data) values use filter.get and filter.getUnsafeData
			addDynamicFilters: function() {
				// fade out cells with no matching body type
				this.addDynamicFilter('fade-out', function(options) {
					var grade = options.data.index.grades[options.filter.getUnsafeData(this.data('filter-grade'))],
						value = (grade && grade.bodyTypes[options.filter.get('body-type')] ? true : false) &&
							$.isEmptyObject(grade.bodyTypes[options.filter.get('body-type')].fuelType);

					this.find('a').attr('disabled', value);
					return value;
				});
			},
			addCustomFilters: function() {
				// fade out grades selector with no matching body type
				this.addCustomFilter('fade-out', '.expandable-objects .col-sm-3', function(options) {
					return this.data('filter-body-type') && this.data('filter-body-type').indexOf(options.filter['body-type']) === -1 ? true : false;
				});
			}
		}
	}, $('#modelsComparer'));

	var m = _private,
		c = T1.constants;

	return {
		init: $.proxy(_private.init, _private)
	};
}());