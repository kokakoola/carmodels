var T1 = T1 || {};

/**
 *	eprivacy
 *
 * USR: MDA
 */

T1.ePrivacy = (function(){
	'use strict';

	var _private = {
		ePrivacyDisclaimer: $('#ePrivacyDisclaimer'),
		ePrivacyDisclaimerTimoutId: null,
		overlayerOpen: false,
		figures: $([]),
		isMobile: false,
		CLASS_FIGURE: 'eprivacy-component',
		enabled: false,
		init: function(){
			m.enabled = (T1.settings.enableEprivacy === 'true' && T1.settings.eprivacy) ? true : false;
			PubSub.subscribe(c.EPRIVACY_LOAD_COMPONENT, m.loadComponent);

			//check if the brighttag policy cookie is set... otherwise set the BT privacy
			if(! T1.utilities.cookies.getCookie('btpstkn')){
				m.checkBrighttagPrivacy();
			}

			if(m.enabled) {
				/* overlayer events */
				PubSub.subscribe(c.PAGEOVERLAYER_RESIZE, m.setSpecsFooterPosition);
				PubSub.subscribe(c.PAGEOVERLAYER_CLOSED, m.overlayerClosed);
				PubSub.subscribe(c.EPRIVACY_OPEN, m.open);
				PubSub.subscribe(c.PAGEOVERLAYER_LOAD, m.initOverlayer);

				/* disclaimer events */
				if(m.ePrivacyDisclaimer.size()) {
					PubSub.subscribe(c.EPRIVACY_AUTO_APPROVED, m.autoApprove);
					$('.ePrivacyOpenLink').click(function(e){
						e.preventDefault();
						PubSub.publishSync(c.EPRIVACY_OPEN, {url:$(this).attr('href')});
					});
					$('.ePrivacyAutoApproveLink').on('click', function(e){
						e.preventDefault();
						PubSub.publishSync(c.EPRIVACY_AUTO_APPROVED);
					});
					if(!m.isLevelSet()){ $(window).load(m.showDisclaimer); }
				}
			}
		},
		initOverlayer: function(){
			if(!m.overlayerOpen && $('#ePrivacy').size()) {
				$('#eprivacyCancel').click(m.cancel);
				$('#eprivacySave').click(m.save);
				$('#functionalBox').click(m.functionalChanged);
				$('#targetingBox').click(m.targetingChanged);

				m.applyCurrentLevel(true);
				m.overlayerOpen = true;
				PubSub.publish(c.PAGEOVERLAYER_RESIZE);
				m.setOverlayerClass();
			}
		},
		switchMobile: function(){
			m.switchDevice(true);
		},
		switchDesktop: function(){
			m.switchDevice(false);
		},
		switchDevice: function(isMobile) {
			m.isMobile = isMobile;
			if(m.ePrivacyDisclaimer.is(':visible')) {
				m.applyStyles(m.getDisclaimerAnimations().show);
			}
		},
		open: function(event, result){
			if(!m.overlayerOpen){
				PubSub.publish(T1.constants.HASH_CHANGE, '/publish/pageoverlayer_open/url=' + encodeURIComponent(result.url) + '/ajax=true');
			}
		},
		setOverlayerClass: function() {
			$('#ePrivacy').parents('.overlayerWrapper').addClass('ePrivacy');
		},
		/**
		* checkBrighttagPrivacy: checks if bright tagprivacy is activated
		*/
		checkBrighttagPrivacy: function(){
			if(window.BTPrivacy) BTPrivacy.getPrivacySettings(m.setBrighttagPrivacy);
		},
		/**
		* setBrighttagPrivacy: sets the right eprivacy level if needed
		*/
		setBrighttagPrivacy: function(data){
			if(data && ! data.doNotTrack){
				var currentLevel = m.getCurrentLevel();

				//set the eprivacy level
				if(currentLevel && currentLevel > "20"){
						BTPrivacy[(currentLevel>"30" ? 'optIn':'functional')]();
				}else{
					BTPrivacy.optOut();
				}
			}
		},
		getDisclaimerAnimations: function(){
			return {
				hide:[
					{
						objects: $('body'),
						style: {
							name: 'padding-bottom',
							value: '0px'
						}
					}
				],
				show:[
					{
						objects: $('body'),
						style: {
							name: 'padding-bottom',
							value: m.ePrivacyDisclaimer.innerHeight() + 'px'
						}
					},
					{
						objects: m.ePrivacyDisclaimer,
						style: {
							name:'bottom',
							value: '0px'
						}
					}
				]
			};
		},
		removeAnimationsStyles: function(){
			var animations = m.getDisclaimerAnimations().hide;
			for(var i = 0; i < animations.length; i++)
			{
				var style = {};
				style[animations[i].style.name] = '';
				animations[i].objects.css(style);
			}
		},
		setSpecsFooterPosition: function() {
			if(m.overlayerOpen)
			{
				var footsMaxHeight = m.getObjectsMaxHeight($('#cookie-specs > li > footer'), true);
				$('#cookie-specs > li > footer').each(function(){
					var spec = $(this);
					spec.css('margin-top', '').css('min-height', footsMaxHeight + 'px');
					if(spec.hasClass('fixed-line-height')){spec.css('line-height', footsMaxHeight + 'px');}
				});
				var specsMaxHeight =  m.getObjectsMaxHeight($('#cookie-specs > li'));
				$('#cookie-specs > li > footer').each(function(){
					var spec = $(this);
					spec.css('margin-top', (specsMaxHeight -  spec.position().top - footsMaxHeight) + 'px');
				});
			}
		},
		getObjectsMaxHeight: function(objs, innerHeight) {
			var maxHeight = 0;
			objs.each(function(){
				var $this = $(this), h = innerHeight ? $this.innerHeight() : $this.height();
				maxHeight = h > maxHeight ? h : maxHeight;
			});
			return maxHeight;
		},
		cancel: function(e) {
			e.preventDefault();
			m.setHash();
			PubSub.publish(c.EPRIVACY_CANCELED);
		},
		save: function(e) {
			e.preventDefault();
			m.saveCurrentLevel();
			m.reviewComponents();
			m.setHash();
			PubSub.publish(c.EPRIVACY_SAVED);
		},
		autoApprove: function() {
			if(!m.ePrivacyDisclaimer.size()) return;

			if(!m.isLevelSet()) {
				m.applyCurrentLevel(true);
				m.saveCurrentLevel(true);
			}

			m.hideDisclaimer();
		},
		showDisclaimer: function() {
			m.ePrivacyDisclaimer.show();
			if(!m.ePrivacyDisclaimer.size()) return;

			$(function () {
				m.ePrivacyDisclaimer.css('bottom', -m.ePrivacyDisclaimer.innerHeight()).show();
				var targets = $([]), animations = m.getDisclaimerAnimations().show;
				for(var i = 0; i < animations.length; i++)
				{
					targets = targets.add(m.playAnimation(animations[i]));
				}
				targets.promise().done(function(){
					if(T1.settings.eprivacy.type === 'implicit') {
						m.ePrivacyDisclaimer.mouseenter(m.stopDisclaimerTimeout).mouseleave(m.startDisclaimerTimeout);
						m.startDisclaimerTimeout();
					}
					m.startSurveyDisclaimerSize();
				});
			});
		},
		hideDisclaimer: function(){
			if(!m.ePrivacyDisclaimer.size()) return;

			m.stopDisclaimerTimeout();
			$(function () {
				var targets = $([]), animations = m.getDisclaimerAnimations().hide;
				for(var i = 0; i < animations.length; i++)
				{
					targets = targets.add(m.playAnimation(animations[i]));
				}
				targets.promise().done(function(){
					m.removeDisclaimer();
				});
			});
		},
		overlayerClosed: function(){
			if(m.overlayerOpen){
				m.overlayerOpen = false;
				m.hideDisclaimer();
			}
		},
		setHash: function(hash){
			PubSub.publish(((hash) ? c.HASH_ADD : c.HASH_REMOVE), hash || '');
		},
		removeDisclaimer: function(){
			m.stopSurveyDisclaimerSize();
			m.ePrivacyDisclaimer.remove();
			m.removeAnimationsStyles();
		},
		playAnimation: function(animation){
			var style = {};
			style[animation.style.name] = animation.style.value;
			return animation.objects.animate(style);
		},
		applyStyles: function(styles) {
			for(i = 0; i < styles.length; i++)
			{
				var style = {};
				style[styles[i].style.name] = styles[i].style.value;
				styles[i].objects.css(style);
			}
		},
		startDisclaimerTimeout: function(){
			m.stopDisclaimerTimeout();
			m.ePrivacyDisclaimerTimeoutId = setTimeout(m.autoApprove, T1.settings.eprivacy.delay || 7000);
		},
		stopDisclaimerTimeout: function(){
			clearTimeout(m.ePrivacyDisclaimerTimeoutId);
			m.ePrivacyDisclaimerTimeoutId = null;
		},
		startSurveyDisclaimerSize: function(){
			$(window).on('load resize', m.resetDisclaimerSize);
		},
		stopSurveyDisclaimerSize: function(){
			$(window).off('load resize', m.resetDisclaimerSize);
		},
		resetDisclaimerSize: function()
		{
			var ePrivacyDisclaimerHeight = m.ePrivacyDisclaimer.innerHeight(), animations = m.getDisclaimerAnimations().hide;
			for(i = 0; i < animations.length; i++)
			{
				var style = {};
				style[animations[i].style.name] = parseInt(animations[i].style.value,10) + ePrivacyDisclaimerHeight + 'px';
				animations[i].objects.css(style);
			}
		},
		functionalChanged: function(){
			var functional = $('#functionalBox'),
				targeting = $('#targetingBox');

			if(!functional.prop('checked')) { targeting.prop('checked', false); }
			var level = m.getVirtualLevel();
			functional.prop('checked', level >= T1.settings.eprivacy.levels[1]);
			m.fadeSettings(functional, targeting);
		},
		targetingChanged: function(){
			var functional = $('#functionalBox'),
				targeting = $('#targetingBox');

			if(targeting.prop('checked')) { functional.prop('checked', true); }
			var level = m.getVirtualLevel();
			targeting.prop('checked', level >= T1.settings.eprivacy.levels[2]);
			m.fadeSettings(functional, targeting);
		},
		fadeSettings: function(functional, targeting){
			functional.closest('li').fadeTo(400, functional.prop('checked') ? 1 : 0.5);
			targeting.closest('li').fadeTo(400, targeting.prop('checked') ? 1 : 0.5);
		},
		isLevelSet: function() {
			return T1.utilities.cookies.getCookie(c.EPRIVACY_COOKIE_NAME) ? true : false;
		},
		getCurrentLevel: function(implicit){
			if(m.enabled) {
				var cookieValue = T1.utilities.cookies.getCookie(c.EPRIVACY_COOKIE_NAME),
					defaultValue = (T1.settings.eprivacy.type === 'explicit' && !implicit) ? T1.settings.eprivacy.levels[0] : T1.settings.eprivacy.defaultLevel;
				return cookieValue ? cookieValue.replace(/#.*/g,'') : defaultValue;
			}
			return Number.MAX_VALUE;
		},
		getVirtualLevel: function(implicit){
			if($('#ePrivacy').size()) {
				var level1 = $('#functionalBox').prop('checked') ? 1 : 0;
				return T1.settings.eprivacy.levels[$('#targetingBox').prop('checked') ? 2 : level1];
			}
			return m.getCurrentLevel(implicit);
		},
		saveCurrentLevel: function(implicit){
			var level = m.getVirtualLevel(implicit);
			T1.utilities.cookies.setCookie(
				c.EPRIVACY_COOKIE_NAME,
				level + '#' + T1.settings.eprivacy.version,
				365);
			m.checkBrighttagPrivacy();
		},
		applyCurrentLevel: function(implicit){
			if($('#ePrivacy').size()) {
				var functional = $('#functionalBox'),
					targeting = $('#targetingBox'),
					level = m.getCurrentLevel(implicit);

				functional.prop('checked', level >= T1.settings.eprivacy.levels[1]);
				targeting.prop('checked', level >= T1.settings.eprivacy.levels[2]);
				m.fadeSettings(functional, targeting);
			}
		},
		validateLevel: function(level){
			return level <= m.getCurrentLevel();
		},
		loadComponent: function(event, data){
			m.figures = m.figures.add(data.figures || (data.root ? data.root.find('figure.' + m.CLASS_FIGURE) : null));
			if(!data.defer){
				var groups = m.groupComponents(m.figures),
					queries = [];
				for(var group in groups){
					var settings = groups[group][0].data();
					if(m.validateLevel(settings.level)){
						queries.push($.get(settings.url, m.loadGroup(groups[group], settings)));
					}
				}
				$.when.apply($, queries).done(function(){
					m.figures = $([]);
					if(data.callback) { data.callback(); }
				});
			}
		},
		loadGroup: function(group, settings) {
			return function(html) {
				for(var f = 0; f < group.length; f++)
				{
					var figure = group[f],
						component = m.registerComponent($(html), figure, settings.level),
						namespace = Object.resolve(settings.namespace, T1);
					figure.replaceWith(component);
					if(namespace && namespace.init) { namespace.init(component); }
				}
			};
		},
		unloadComponent: function(component){
			component.replaceWith(component.data('figure'));
		},
		reviewComponents: function(){
			// unload components
			$('.' + m.CLASS_FIGURE).filter(function(){
				return parseInt($(this).attr('data-eprivacy'),10) > m.getCurrentLevel();
			}).each(function(){
				m.unloadComponent($(this));
			});
			// load components
			PubSub.publishSync(T1.constants.FIGURE_LOAD);
		},
		registerComponent: function(component, figure, level) {
			return component.data('figure', figure).attr('data-eprivacy', level).addClass(m.CLASS_FIGURE).addClass(figure.attr('class'));
		},
		groupComponents: function(components) {
			var groups = {};
			components.each(function(){
				var $this = $(this);
				if(!groups[$this.data('url')]) groups[$this.data('url')] = [];
				groups[$this.data('url')].push($this);
			});
			return groups;
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		init: _private.init,
		getCurrentLevel: _private.getCurrentLevel,
		validateLevel: _private.validateLevel,
		registerComponent: _private.registerComponent,
		switchMobile: _private.switchMobile,
		switchDesktop: _private.switchDesktop
	};
}());