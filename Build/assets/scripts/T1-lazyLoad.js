var T1 = T1 || {};

T1.lazyLoad = (function(){
	'use strict';

	var _private = {
		mode: 'mobile',
		placeholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC',
		dataAttribute: 'lazyload',

		/**
		 * initializes the lazy load (connects the sections/articles to the appear event)
		 */
		init: function(){
			var m = _private;
			// DISABLE LAZYLOAD FOR PAGE SPEED TESTING
			PubSub.subscribe(T1.constants.SCROLL_TRACK_APPEAR, m.appear);
		//	PubSub.subscribe(T1.constants.SCROLL_TRACK_ADD, m.initImageContainer);
			PubSub.publish(T1.constants.SCROLL_TRACK_ADD, {elements: $('.maincontent > section, .maincontent > article, #footfocus'), options:{once:true}});
			//PubSub.publish(T1.constants.SCROLL_TRACK_APPEAR, {element:$('#mainfocus')}); MOVED OUTSIDE THE INIT (to load faster)
		},

		/**
		 * initializes the image tags with empty BASE64-image-binary (this is optional, but can be connected to the SCROLLTRACK_ADD event)
		 * @param evName
		 * @param data
		 */
		initImageContainer: function(evName, data){
			if (!data.elements || !data.initImages) {
				return;
			}
			var m = _private,
				section = null;
			for (var iSection = 0; iSection < data.elements.length; iSection++) {
				section = data.elements.get(iSection);
				if(! section.imagesInitialized){
					m.initImages($(section).find('[data-' + m.dataAttribute + '-^]'));
					section.imagesInitialized = true;
				}
			}
		},

		/**
		 * set blank image from base64-binary for a $nodes (images) collection
		 * @param $nodes (jQuery object) collection of image tags
		 */
		initImages:function($nodes){
			for(var iNode = 0; iNode < $nodes.length; iNode++){
				_private.initImage($nodes.eq(iNode));
			}
		},

		/**
		 * set blank image from base64-binary for 1 $node (image)
		 * @param $node (jQuery object) image object
		 */
		initImage:function($node){
			if ($node.attr('src') === undefined || $node.attr('src') === false) {
				if ($node.is('img')) {
					$node.attr('src', _private.placeholder);
				}
			}
		},

		/**
		 * get ran by the appear event by scroll tracking. It runs when a section reaches the viewport... Collects images &
		 * @param evName (string) eventname that triggers the function (provided by pubsub)
		 * @param data (object {element: the element which reaches the viewport, options: not in use for the moment})
		 */
		appear: function(evName, data){
			var m = _private,
				section = data.element || data,
				options = data.options || {},
				elements = (section.attr('data-' + m.dataAttribute + '-desktop')) ? section : section.find('[data-' + m.dataAttribute + '-desktop]');
			if (section.is && section.is(':visible')) {
				m.loadImages(elements);
			}
		},

		/**
		 * lazyloads a collection of images immediatly
		 * @param $nodes (jquery objects) images/divs with data-lazyload-desktop attribute
		 */
		loadImages: function($nodes){
			var node = null;
			for(var iNode = 0; iNode < $nodes.length; iNode++){
				node = $nodes.eq(iNode);
				_private.loadImage(node);
			}
		},

		/**
		 * lazyloads 1 image
		 * @param $node (jquery object) image/div with data-lazyload-desktop attribute
		 */
		loadImage:function($node){
			var m = _private,
				node = $node.get(0),
				original = $node.attr('data-' + m.dataAttribute + '-' + m.mode) || $node.attr('data-' + m.dataAttribute + '-desktop');
			if(!original || original==='#') node['loaded-' + m.mode] = true;
			if(!node['loaded-' + m.mode]){
				//lazy load images
				if ($node.is('img') || $node.is('iframe')){
					$node.attr('src', original);
				} else if($node.is('figure')){
					$node.attr('data-src', original);
				} else {
					$node.css('background-image', 'url(\'' + original + '\')');
				}
				node['loaded-' + m.mode] = true;
			}
		},

		/**
		 * Calculate the mode
		 */
		getMode: function(){
			var viewportWidth = window.innerWidth || $(window).innerWidth();
			if (viewportWidth > T1.constants.SCREEN_SMALL){
				_private.mode = 'desktop';
			}else{
				_private.mode = 'mobile';
			}
		},

		/**
		 * switch mode to desktop (only load desktop images)
		 */
		switchDesktop: function(){
			_private.mode = 'desktop';
		},

		/**
		 * switch mode to mobile (try to load mobile resources)
		 */
		switchMobile: function(){
			_private.mode = 'mobile';
		}

	};

	_private.getMode();
	_private.appear('preLoad', {element:$('#mainfocus')});

	return {
		init: _private.init,
		switchDesktop: _private.switchDesktop,
		switchMobile: _private.switchMobile
	};
}());