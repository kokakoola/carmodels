var T1 = T1 || {};

T1.packsComparer = (function(){
	'use strict';

	var _private = T1.comparer.extend({
		override: {
			initView: function() {
				PubSub.subscribe(T1.constants.CAROUSEL_SLIDE, $.proxy(this.onCarouselSlide, this));
				PubSub.subscribe(T1.constants.CAROUSEL_CREATED, $.proxy(this.onCarouselCreated, this));
				PubSub.subscribe(this.getCompareEvent(), $.proxy(this.compare, this));
			},
			onWindowResize: function(event, data) {
				// on window resize carousel is automatically  re-created (CAROUSEL_CREATED fired)
			},
			onDataLoad: function(data) {
				this.indexData();

				// categories
				for(var c = 0; c < data.categories.length; c++) {
					var category = this.addCategory(data.categories[c].name);
					this.loadCategoryEquipment(category, data.categories[c].equipment);

					// sub categories
					for(var s = 0; s < data.categories[c].categories.length; s++) {
						var subCategory = this.addSubCategory(category, data.categories[c].categories[s].name);
						this.loadCategoryEquipment(subCategory, data.categories[c].categories[s].equipment);
					}
				}
			},
			getPageCheckboxesArea: function() {
				return this.container.find('.objects.checkboxes-area >.carousel-wrapper');
			},
			getCompareEvent: function() {
				return T1.constants.COMPARE_PACKS;
			}
		},
		extend: {
			onCarouselCreated: function(event, data) {
				if(data.is(this.container.find('.carousel.slide'))) {
					this.uniformizeHeight(data);
					this.handleResponsiveImages({
						root: this.container.find('.objects'),
						handler: this.uniformizeHeight
					});
					this.container.find('.carousel-inner').addClass('checkboxes-area');
				}
			},
			onCarouselSlide: function(event, data) {
				if(data.carousel.is(this.container.find('.carousel.slide'))) {
					this.uniformizeHeight(data.carousel.find('.item.active'));
				}
			},
			indexData: function() {
				if(this.data) {
					var index =  {items: {}, packs: {}};

					for(var p = 0; p < this.data.packs.length; p++) {
						var pack = this.data.packs[p];
						pack.index = {items: {}};

						if(!index.packs[pack.code]) { index.packs[pack.code] = pack; }
						if(pack.items) {
							for(var i = 0; i < pack.items.length; i++) {
								var item = pack.items[i];

								pack.index.items[item.code] = item;
								if(!index.items[item.code]) { index.items[item.code] = {packs: {}}; }
								if(!index.items[item.code].packs[pack.code]) { index.items[item.code].packs[pack.code] = pack; }
							}
						}
					}

					this.data.index = index;
				}
			},
			loadCategoryEquipment: function(category, equipment) {
				if(equipment) {
					for(var e = 0; e < equipment.length; e++) {
						var eq = equipment[e],
							item = this.addItem(category, {content: eq.name, more: eq.description});

						// packs equipment value
						for(var p in this.data.index.packs) {
							var items = this.data.index.packs[p].index.items,
								obj = items[eq.code],
								prices = obj && obj.price && obj.price.listWithDiscount ? obj.price : null,
								val = obj ? (prices ? prices.listWithDiscount : obj.standard) : false,
								displayVal = obj && prices ? this.getPricesContainer(prices) : null;

							this.addItemObjectValue(item, {
								filters: [{name: 'pack', value: p}],
								value: val,
								displayValue: displayVal
							});
						}
					}
				}
			}
		}
	}, $('#packsComparer'));

	return {
		init: $.proxy(_private.init, _private)
	};
}());