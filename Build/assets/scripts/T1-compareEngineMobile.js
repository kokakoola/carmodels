var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *
 */
T1.engineMobileCompare = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		section:   $("#mobilecompare"),
		container: $(".mobile-compare"),
		tabs: null,
		dataContainer: null,
		dataGridContainer: null,
		dataHeadContainer: null,
		dataEngineTriggers: null,
		dataModelTriggers: null,
		backButton: null,
		modelContainer: null,
		modelContainerHeader: null,
		modelId: null,

		data: null,
		engineData: null,
		modelData: null,
		enginePromotions: [],
		bodyPromotions: [],
		currentTab: null,
		hidePrices: null,
		directCall: false,
		directEngine: null,

		initMobile: function(){
			if(!_private.container || _private.container.length === 0) return;
			_private.hidePrices = (T1.settings.hidePrices === "true");
			_private.tabs = $(".ecm-section-toggle", _private.container);
			_private.dataContainer = $(".ecm-data-container", _private.container);
			_private.dataGridContainer = $(".ecm-data-table", _private.container);
			_private.dataHeadContainer = $(".ecm-data-head", _private.container);
			_private.dataEngineTriggers = $(".ecm-engine-trigger", _private.container);
			_private.dataModelTriggers = $(".ecm-model-trigger", _private.container);
			_private.backButton = $(".ecm-back-button", _private.container);
			_private.modelContainer = $(".ecm-grid-container", _private.container);
			_private.modelContainerHeader = $(".ecm-model-container > div.section-title", _private.container);

			PubSub.subscribe(T1.constants.PAGEOVERLAYER_OPEN, function(evt, data){
				var targetName = _private.section.attr("data-extended-param");
				var target = $(".ecm-section-toggle[data-ecm-task='"+targetName+"']");

				_private.currentTab = targetName;

				if(target.length>0) target.trigger("click");
			});

			PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, function(evt, data){
				if($(".ecm-container", data.el[0]).length === 1){
					setTimeout(function(){
						scrollTo(0, 0);
					}, 1);
				}
			});

			PubSub.subscribe(T1.constants.MOBILE_COMPARE_CHANGE, _private.toDataPage);

			_private.tabs.click(_private.onTabClick);
			_private.dataEngineTriggers.click(_private.onEngineNodeClick);
			_private.backButton.click(_private.toOverviewPage);
			_private.getData();
		},

		onTabClick: function(e){
			e.preventDefault();
			_private.tabs.removeClass("active");
			$(this).addClass("active");
			var selectedTab = $(this).data("ecm-task");

			PubSub.publish(T1.constants.HASH_REPLACE, {
				"oldValue"  : _private.currentTab,
				"newValue"  : selectedTab
			});

			_private.currentTab = selectedTab;

			$(".ecm-sub-container").hide();
			$("."+selectedTab).show();
			scrollTo(0,0);
		},
		onEngineNodeClick: function(e){
			if(e.preventDefault) e.preventDefault();
			var engineType  = $(this).data("ecm-engine-type");
			PubSub.publish(T1.constants.HASH_ADD, "/publish/mobile_compare_change/engineCode="+engineType);
		},
		generateDataTable: function(dataNode){
			$(".ecm-selected-title", _private.dataHeadContainer).text(dataNode.name);
			if(dataNode.promotions && dataNode.promotions.length>0){
				$(".ecm-promo-count-holder", _private.dataHeadContainer).text("("+dataNode.promotions.length+")");
				$(".ecm-promo-count").show();
			}else{
				$(".ecm-promo-count").hide();
			}
			_private.showSelectedEnginePromotions(dataNode.code, ".ecm-data-container");
			var specs = dataNode.specs;
			$(".ecm-selected-specs-table", _private.dataGridContainer).remove();
			var table = $("<table/>").addClass("ecm-selected-specs-table table table-striped").prependTo(_private.dataGridContainer);

			for(var i=0; i<specs.length; i++){
				var node = specs[i];
				if(node.quick) {
					var tr = $("<tr/>").addClass("ecm-selected-specs-row").appendTo(table);
					$("<td/>").addClass("ecm-specs-cell-name").text(node.name).appendTo(tr);
					$("<td/>").addClass("ecm-specs-cell-value").text(node.value).appendTo(tr);
				}
			}
			PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {
				html: ".ecm-data-container",
				preserveContent: true,
				pageName: _private.section.data('section-title')
			});
		},
		toDataPage: function(evt, data){
			var engineType = data.engineCode;
			if(_private.engineData === null){
				_private.directCall = true;
				_private.directEngine = engineType;
			}else{
				var dataNode = null;
				for(var i=0; i<_private.engineData.length; i++){
					var node = _private.engineData[i];
					if(node.code === engineType){
						dataNode = node;
						break;
					}
				}
				_private.generateDataTable(dataNode);
			}
		},
		toOverviewPage: function(e){
			e.preventDefault();
			PubSub.publish(T1.constants.HASH_REMOVE, "");
		},
		getData: function(){
			var model = $(".car-model").data("car-model");
			$.getJSON("/api/cardb/mobilespecs/"+model, _private.onGetData);
		},
		onGetData: function(data){
			_private.data = data;
			_private.engineData = _private.data.engines;
			_private.modelData  = _private.data.bodyTypes;
			_private.modelId    = _private.data.modelId.replace("{", "").replace("}", "");
			var promoCount = _private.countPromotions();

			$(".ecm-engine-available-title", _private.container).append("("+_private.engineData.length+")");
			if (promoCount > 0) {
				$(".ecm-engine-promotions-title", _private.container).append("("+promoCount+")");
			}
			else {
				$(".ecm-engine-promotions-title", _private.container).hide();
				$(".ecm-engine-promotions-title", _private.container).prev("span"). hide();
			}

			_private.generateBodySpecs();
		},
		generateBodySpecs: function(){
			var promoCount = _private.countPromotions(true);
			$(".ecm-model-available-title", _private.modelContainerHeader).append("("+_private.modelData.length+")");
			if (promoCount > 0) {
				$(".ecm-model-promotions-title", _private.modelContainerHeader).append("("+promoCount+")");
			}
			else {
				$(".ecm-model-promotions-title", _private.modelContainerHeader).hide();
				$(".ecm-model-promotions-title", _private.modelContainerHeader).prev("span"). hide();
			}
			for(var i=0; i<_private.modelData.length; i++){
				var node = _private.modelData[i];
				_private.addModelTable(node);
			}
			_private.addPromotions();
		},
		addModelTable: function(node){
			var table = $("<table/>").addClass("table table-striped ecm-body-info-table").prependTo(_private.modelContainer);

			if(node.promotions){
				var modelPromoHolder = $("<div/>").addClass("ecm-promotions-holder ecm-promotions-holder-body").prependTo(_private.modelContainer);
				$("<h4/>").append($("<span/>").addClass("ecm-model-promotions-title").text(node.name+" "+T1.labels.comparator.promotions+"("+node.promotions.length+")").append($("<i/>").addClass("icon-tag"))).appendTo(modelPromoHolder);
				_private.generatePromotionsNodes(node.promotions, modelPromoHolder, "body");
			}

			var header = $("<tr/>").addClass("ecm-body-info-row").appendTo(table);
			$("<td/>").addClass("ecm-body-info-header").text(node.name).attr("colspan", 2).appendTo(header);
			for(var i=0; i<node.specs.length; i++){
				if(node.specs[i].quick) {
					var tr = $("<tr/>").addClass("ecm-body-info-row").appendTo(table);
					$("<td/>").addClass("ecm-body-info-cell-name").text(node.specs[i].name).appendTo(tr);
					$("<td/>").addClass("ecm-body-info-cell-value").text(node.specs[i].value).appendTo(tr);
				}
			}
		},
		countPromotions: function(forBody){
			if(typeof forBody === "undefined") forBody = false;

			var collection = (forBody) ? _private.modelData : _private.engineData;
			var promoCount = 0;
			var promoCollection = [];

			for(var i = 0; i<collection.length; i++){
				var node = collection[i];
				if(node.promotions) {
					for (var j = 0; j < node.promotions.length; j++) {
						var promo = node.promotions[j],
							promoCode = ("code" in promo) ? promo.code : null;
						if ($.inArray(promoCode, promoCollection) < 0) {
							promoCollection.push(promoCode);
						}
					}
					promoCount = promoCollection.length;
				}
			}

			return promoCount;
		},
		addPromotions: function(){
			for(var j = 0; j<_private.engineData.length; j++){
				if(_private.engineData[j].promotions){
					$(".promolabel", ".ecm-engine-trigger[data-ecm-engine-type='"+_private.engineData[j].code+"']").show();
					for(var l=0; l<_private.engineData[j].promotions.length; l++){
						var enginePromoObj = _private.engineData[j].promotions[l];
						enginePromoObj.engineCode = _private.engineData[j].code;
						enginePromoObj.engine = true;
						_private.enginePromotions.push(enginePromoObj);
					}
				}
			}
			var enginePromoHolder = $("<div/>").addClass("ecm-promotions-holder ecm-promotions-holder-engine").insertBefore(_private.dataGridContainer);
			_private.generatePromotionsNodes(_private.enginePromotions, enginePromoHolder, "engine");
		},
		generatePromotionsNodes: function(data, container, prefix){
			container.empty();
			var node = "<a class='ecm-promotions-node ecm-promotions-node-{{TYPE}}' ecm-promotion-code='{{CODE}}' href='{{LINK}}'><img src='{{IMG}}' /><span class='ecm-promotions-special-offer'>"+T1.labels.comparator.promotions+"<i class='icon-tag'/></span><h4 class='ecm-promotions-title'>{{NAME}}</h4><span class='ecm-promotions-sub-title'>{{SUB_TITLE}}</span><span class='finance-rate'>{{REPAYMENT_RATE}}</span><i class='icon-angle-right'/></a>";
			for(var i=0; i<data.length; i++){
				var priceTxt = (!_private.hidePrices) ? T1.labels.priceFrom.replace("%s", globalize.format(data[i].price.listWithDiscount, "c")) : "";
				var repaymentsTxt = data[i].payments !== {} && data[i].payments !== undefined  ? T1.labels.pricePerMonth.replace("%a", data[i].payments.amount ).replace('%m', data[i].payments.months ) : ' ';

			//	var imgSRC = T1.constants.URL_MINI_CARCONFIG_IMG.replace(/\[LANG\]/g, T1.settings.language).replace(/\[MODEL\]/g, _private.modelId).replace(/\[GRADE\]/g, data[i].cheapestCar.replace("{", "").replace("}", "")).replace(/\[COLOUR\]/g, "040").concat("?width=160&height=80");
				var imgSRC = T1.settings.CCISHost + T1.constants.URL_MINI_CARCONFIG_IMG.replace(/\[LANG\]/g, T1.settings.language).replace(/\[MODEL\]/g, _private.modelId).replace(/\[GRADE\]/g, data[i].cheapestCar.replace("{", "").replace("}", "")).replace(/\[COLOUR\]/g, "040").concat("?width=160&height=80");

				var html = node.replace(/{{TYPE}}/g, prefix).replace(/{{LINK}}/g, "/promo/"+data[i].code.replace("{", "").replace("}", "")).replace(/{{IMG}}/g, imgSRC).replace(/{{NAME}}/g, data[i].name).replace(/{{SUB_TITLE}}/g, priceTxt);
					html = html.replace(/{{CODE}}/g, (data[i].engine) ? data[i].engineCode : "body");
					html = html.replace(/{{REPAYMENT_RATE}}/g, repaymentsTxt);
				container.append(html);
			}
			container.append($("<div/>").addClass("clearfix"));
			if(_private.directCall && prefix === "engine"){
				_private.showSelectedEnginePromotions(_private.directEngine, container);
				_private.directCall = false;
				_private.toDataPage(T1.constants.MOBILE_COMPARE_CHANGE, {
					engineCode : _private.directEngine
				});
			}
		},
		showSelectedEnginePromotions: function(engineType, container){
			$(".ecm-promotions-node-engine", container).hide();
			$(".ecm-promotions-node-engine[ecm-promotion-code='"+engineType+"']", container).show();
		}
	};
	var _public = {
		"initMobile": _private.initMobile,
		"switchDesktop": _private.switchDesktop,
		"switchMobile": _private.switchMobile
	};
	return _public;
})();