/**
 * Created with JetBrains WebStorm.
 * User: Joao.Gomes
 * Date: 28/01/14
 * Time: 16:57
 *
 */
var T1 = T1 || {};

T1.accessories = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		filters: $('.accessories-filter ul'),
		tokenLoadOverlayer: '',
		listState: 'image-view',
		accessories: $('.accessories'),

		/**
		 * initialize
		 * @returns null
		 */
		init: function () {
			var checkboxes = m.filters.find('input[type="checkbox"]'),
				toolbarButtons = m.accessories.find('.btn-group > a');

			m.isTrackingEnabled = typeof(window.t1DataLayer) === 'object';

			//remove the container class to allow full-width access to the responsive carousel (javascript is enabled)
			m.accessories.removeClass('container');

			//initialize the filters
			if (m.filters.length > 0) {
				checkboxes.prop('checked',true).trigger('change');
				checkboxes.on('change', m.filterAccessories);
			}

			//init the view all behaviour
			PubSub.subscribe(T1.constants.ACCESSORIES_INTERACTION_VIEWALL, m.viewAll);
			m.accessories.find('.filter-bar .viewall').on('click',function() {
				PubSub.publish(T1.constants.HASH_CHANGE,'/publish/ACCESSORIES_INTERACTION_VIEWALL/single=false');
			});

			//initialize the switch view links
			var switchView = m.accessories.find('.switch-view');
			switchView.text(T1.labels.switchTo+' '+T1.labels.listView).append('<i class="icon-list-ul"></i>');
			switchView.on('click', m.switchView);

			//connect tabbar button behaviour
			toolbarButtons.click(m.switchTab);

			//set default tab (if no active button is displayed)
			if(toolbarButtons.filter('.active').length===0){
				m.switchTab({target: toolbarButtons.eq(0)});
			}

			// ovl disclaimer button
			PubSub.subscribe(T1.constants.CAROUSEL_SLIDE, m.onCarouselSlide);
			PubSub.subscribe(T1.constants.CAROUSEL_CREATED, m.onCarouselCreated);
			m.accessories.find('.btn-disclaimer').on('click', m.ovlDisclaimerClick);

			// inline disclaimer button
			m.accessories.find('.inline-disclaimer .toggleLink').on('click', m.inlineDisclaimerClick);
		},
		onCarouselCreated: function(event, data) {
			if(data.is(m.accessories.find('.carousel.slide'))) {
				data.find('.item.active .btn-disclaimer').on('click', m.ovlDisclaimerClick);
			}
		},
		onCarouselSlide: function(event, data) {
			if(data.carousel.is(m.accessories.find('.carousel.slide'))) {
				data.carousel.find('.item.active .btn-disclaimer').on('click', m.ovlDisclaimerClick);
			}
		},
		ovlDisclaimerClick: function(e) {
			e.preventDefault();
			var container = $(this).closest('.expansion-content'),
				disclaimer = container.find('.ovl-disclaimer'),
				offset = disclaimer.is(':visible') ? -disclaimer.height() : disclaimer.height();

			disclaimer.slideToggle();
			if(container.hasClass('top')) {
				container.animate({top: container.offset().top - offset});
			}
		},
		inlineDisclaimerClick: function(e) {
			e.preventDefault();

			$(this).closest('.inline-disclaimer').find('.disclaimer-content').slideToggle();
		},
		/**
		 * switch the selected tab-pane or scroll to the selected tab-pane (in overlayer)
		 * @param e
		 */
		switchTab: function(e){
			var target = $(e.target),
				targetTab = $(target.prop('hash'));

			target.addClass('active');

			if (e.preventDefault) {
				e.preventDefault();
			}
			if (m.inOverlayer(target)) {
				//scroll to the right element
				var overlay = $('.overlayerContent').last(),
					selectedPane = overlay.find(e.target.hash),
					$target = $(e.target);

				// tab buttons in the overlayer are used to scroll, they should not have an active state
				$target.removeClass('active');

				// do manual tracking (propagation will be stopped after scroll)
				PubSub.publish(T1.constants.STATS_TRACK, {node: $target});

				// do scroll and prevent the tabswitch event
				overlay.scrollTo(selectedPane, T1.constants.ANIMATION_SPEED_SCROLL);
				e.stopPropagation();
			} else {
				//hide the previous containers
				m.accessories.find('> .tab-content > .tab-pane').css({display: 'none'});
				//fadein the right element
				targetTab.fadeIn(T1.constants.ANIMATION_SPEED_FADE);
			}
		},

		/**
		 * checks if the filter bar uses the scroll behaviour or fade behaviour
		 * @param target: clicked element (one of the filter bar buttons)
		 */
		inOverlayer: function(target){
			return target.closest('section').hasClass('view-all');
		},

		/**
		 * Show only the filtered accessories
		 * @param evName
		 * @param data
		 */
		filterAccessories: function(e) {
			var target = $(e.target),
				section = target.closest('.tab-pane'),
				isChecked = target.prop('checked'),
				filters = section.find('input[type="checkbox"]'),
				filtersChecked = filters.filter(':checked'),
				accessoriesItems = section.find('.accessories-item');

			if (target.val().toLowerCase() === 'all') {
				//toggle the all filter
				accessoriesItems[isChecked ? 'removeClass' : 'addClass']('hide');
			}else {
				//reset filters (hide all)
				accessoriesItems.addClass('hide');
				//show selected items
				var accessory = null,
					filterLabel = '';
				filtersChecked.each(function(iFilter, filter){
					filterLabel = $(filter).val().toLowerCase();
					accessoriesItems.each(function(iAcc, accessoryItem){
						accessory = $(accessoryItem);
						if(accessory.data('filter').toLowerCase().indexOf(filterLabel)!==-1) accessory.removeClass('hide');
					});
				});
			}

			//rebuild the carousel if not in 'view all' mode
			if (!m.inOverlayer(target)) PubSub.publishSync(T1.constants.CAROUSEL_CREATERESPONSIVE,{container: section.find('> .responsive-carousel')});
		},

		/**
		 * Open the overlayer to view all
		 * @param evName
		 * @param data
		 */
		viewAll: function(evName,data) {
			var accessoriesCopy = m.accessories.clone(true);
			//remove the view all button & hide carousel wrappers
			accessoriesCopy.addClass('container view-all');
			accessoriesCopy.find('.container').removeClass('container');
			accessoriesCopy.find('.viewall').remove();
			accessoriesCopy.find('.carousel-wrapper').remove();
			accessoriesCopy.find('.responsive-carousel').removeClass("responsive-carousel");
			accessoriesCopy.find('.tab-pane').css({display:'inline-block'});
			accessoriesCopy.find('.filter-bar > .btn-group > a').removeClass('active');
			accessoriesCopy.find('.orig-data-copy').show();

			accessoriesCopy.find('form, .form').each(function(){
				PubSub.publish(T1.constants.FORM_LOAD, $(this));
			});

			//m.clearNodes(accessoriesCopy);

			//open the overlayer
			PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {
				html: accessoriesCopy,
				el: m.accessories,
				styleClass: 'accessories-all'
			});
		},


		/**
		 * Switch to the list view display
		 * @param evName
		 * @param data
		 */
		switchView: function(e) {
			var accessoriesItems = $(e.target).closest('section').find('.accessories-item'),
				isImageView = m.listState === 'image-view';

			//handle the bootstrap responsive classes
			accessoriesItems.removeClass(isImageView ? 'col-sm-3' : 'col-sm-6').addClass(isImageView ? 'col-sm-6' : 'col-sm-3');

			accessoriesItems.each(function(i, e){
				var divs = $(".row > div", this);
				if(divs.length>0){
					if(isImageView){
						divs.eq(0).removeClass("col-xs-12").addClass("col-xs-3");
						divs.eq(1).removeClass("col-xs-12").addClass("col-xs-9");
					}else{
						divs.eq(0).addClass("col-xs-12").removeClass("col-xs-3");
						divs.eq(1).addClass("col-xs-12").removeClass("col-xs-9");
					}
				}else{
					var ul = $(".list-unstyled", this);
					if(ul.length>0){
						if(isImageView){
							$("li", ul).eq(0).addClass("col-xs-3");
						}else{
							$("li", ul).eq(0).removeClass("col-xs-3");
						}
					}
				}
			});

			//update the clicked label
			$(this).text(T1.labels.switchTo+' '+T1.labels[isImageView ? 'imageView' : 'listView']).append('<i class="'+ (isImageView ? 'icon-th-large' : 'icon-list-ul') +'"></i>');
			//switch the current list state
			m.listState = isImageView ? 'list-view' : 'image-view';

			if(m.isTrackingEnabled) PubSub.publish(T1.constants.STATS_TRACK, {node:$(this), extraData:{action: 'switch_view', value: (isImageView ? 'list' : 'images')}});
		}
	};

	var m = _private;

	return {
		init: _private.init
	};
}());