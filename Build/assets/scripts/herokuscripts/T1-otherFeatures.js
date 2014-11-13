var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *
 */
T1.otherfeatures = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		/*mainContainer wraps the sections*/
		section: $('.otherfeatures'),
		container: $(".fc-group-container"),
		controls: $(".fb-group .fb-item"),
		toggleButton: $(".fb-toggle", ".fb-group"),
		otherFeaturesClass: 'otherfeatures',
		featureGroup: null,
		inOverlayer: false,
		tokenCloseAllFeatures: null,
		feature: $('.feature'),
		onlyHybrid: null,
		/* *
		 * initializes the main container
		 * @return {void} void
		 * */
		initDesktop: function(){
			var m =_private;
			m.onlyHybrid = m.section.hasClass('hybrid-only');
			PubSub.subscribe(T1.constants.OTHER_FEATURES_SHOWALL, m.openAllFeatures);
			// add the featureGroup button events
			m.controls.click(m.tabControlClick);
			// add the toggle button events
			m.toggleButton.click(m.toggleClick);
			//trigger figure replace
			var replaceFigure = function(e) {
				var modalContainer = $(this).parent().prev('.modal-container');
				PubSub.publish(T1.constants.FIGURE_LOAD, modalContainer);
			};
			$('.icon-play.modal-launcher').click(replaceFigure);
			// hide the read more tooltip if the user clicks anywhere on the document
			PubSub.subscribe(T1.constants.ON_DOC_CLICK);
			// run the click event so it will reset the view
			if(m.controls.length > 1) m.tabControlClick({target: m.controls.eq(0)});
			if($(_private.featureGroup).is("hybrid-only")){
				m.toggleClick({target: m.toggleButton});
			}
			if(_private.onlyHybrid) _private.filterHybrid(true);
        },
		tabControlClick: function(e){
			var m = _private,
				btnClicked = $(e.target),
				featureGroup = btnClicked.data("section-filter");
			if(featureGroup !== ".fc-group"){
				if(e.preventDefault) e.preventDefault();
				m.controls.removeClass("active");
				if(!m.inOverlayer) btnClicked.addClass("active");
				m.featureGroup = featureGroup;
				//hide all featureGroup
				m.hideAll();
				//show the choosen one
				m.showOne(m.featureGroup);
			} else {
				window.location.hash = btnClicked.attr('href');
				return false;
			}
		},
		toggleClick: function(e){
			var m = _private,
				clickedBtn = $(e.target),
				section = clickedBtn.closest('section');
			if(e.preventDefault) e.preventDefault();
			clickedBtn.toggleClass("btn-grey").toggleClass("btn-blue");
			clickedBtn.toggleClass("activated").toggleClass("inactivated");
			if(clickedBtn.is(".activated")){
				section.attr('data-bt-state', 'hybrid'); //set state
				clickedBtn.text(clickedBtn.attr('data-viewnonhybrid'));
			}else{
				section.attr('data-bt-state', 'nonhybrid'); //set state
				clickedBtn.text(clickedBtn.attr('data-viewhybrid'));
			}
			m.filterHybrid(clickedBtn.is(".activated"));
		},
		switchDesktop: function() {
			var m = _private;
			m.feature.find('.read-more-container a').removeClass('listed-feature').addClass('readMore');
			m.feature.off('click', m.openFeature);
		},
		switchMobile: function() {
			var m = _private;
			m.feature.find('.read-more-container a').removeClass('readMore').addClass('listed-feature');
			m.feature.on('click touchstart', m.openFeature);
		},
		openFeature : function(evt) {
			evt.preventDefault();
			var article = $(evt.target).closest('article');
			$('.expansion-feature').slideUp().prev('.feature').find('.read-more-container a').removeClass('open-state');
			if(! article.next('.expansion-feature').is(':visible')) {
				article.next('.expansion-feature').slideDown().prev('.feature').find('.read-more-container a').addClass('open-state');
			}
		},
	    /* *
	     * filters hybrid or non-hybrid features
	     * @return {void} void
	     * */
        filterHybrid: function(hybrid){
            hybrid = (typeof hybrid == "undefined") ? false : hybrid;
            if(hybrid){
                $(".fc-group-content").hide().filter(".hybrid").fadeIn(1000);
            }else{
                $(".fc-group-content").hide().not(".hybrid").fadeIn(1000);
            }
        },
	    /* *
	     * hides all sections
	     * @return {void} void
	     * */
        hideAll: function(){
			var m = _private;
			if(! m.inOverlayer){
				m.container.children().hide();
			}
		},
		/* *
		 * shows the certain section
		 * @return {void} void
		 * */
		showOne: function(featureGroup){
			var m = _private;
			if(m.inOverlayer){
				//scroll to 1 element
				$('.overlayerContent').animate({scrollTop: $('.overlayerContent').find(featureGroup).offset().top - 30}, 'slow');
			}else{
				// fade in 1 element
				$(featureGroup, _private.container).eq(0).fadeIn(1000);
			}
		},
		/*
		* Clones all containers & opens all features overlayer
		* */
		openAllFeatures: function(){
			//if in any case video was used in the other featues, than reset the poster node and remove the videoplayer
			PubSub.publishSync(T1.constants.VIDEO_RESET, {});
			//clone the features and open the cloned elements in an overlayer
			var m = _private,
				featuresWrapper = $('<div/>').addClass('allfeatures'),
				featuresMainContainer = $('<div/>').addClass('container').addClass('otherfeatures'),
				features = $("." + m.otherFeaturesClass).clone(true),
				sectionTitle = features.attr('data-section-title');

			// append cloned features to wrapper containers
			featuresMainContainer.append(features);
			featuresWrapper.append(featuresMainContainer);
			// remove the view all button
			features.find('a[data-section-filter=\'.fc-group\']').remove();
			// show all sections at once
			features.find('.fc-group').css({'display': 'inline-block', 'opacity':1});
			// override properties
			m.container = features.find('.fc-group-container');
			m.controls = features.find('.fb-item', '.fb-group');
			m.controls.filter('.active').removeClass('active'); //reset the selected feature group on the cloned elements
			// open the pageoverlayer with the cloned features
			PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {'html': featuresWrapper, 'styleClass': 'otherFeaturesOverlayer', pageName:sectionTitle});
			m.inOverlayer = true;
			m.tokenCloseAllFeatures = PubSub.subscribe(T1.constants.PAGEOVERLAYER_REOPEN_MAINCONTENT, m.closeAllFeatures);
		},
		/*
		* Closes all features container
		* */
		closeAllFeatures: function(){
			var m = _private;
			// reset the target container & controls
			m.container = $(".fc-group-container");
			m.controls = $(".fb-item", ".fb-group");
			m.inOverlayer = false;
			if(m.controls.length > 1) m.controls.eq(0).trigger("click");
			PubSub.unsubscribe(m.tokenCloseAllFeatures);
		}
	 };

	/*returns the public methods of the component*/
	var _public = {
		"initDesktop": _private.initDesktop,
		"switchDesktop": _private.switchDesktop,
		"switchMobile": _private.switchMobile,
		"featureGroup": _private.featureGroup
	};
	return _public;
}());