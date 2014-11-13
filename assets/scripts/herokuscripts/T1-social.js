var T1 = T1 || {};

/**
 * social interaction wrapper
 *
 * the main objective of this file is to handle on click behaviour for social share
 * and handle show and hide share box
 *
 */
T1.social = ( function () {
	'use strict';

	window.___gcfg = {lang: 'en-GB'};

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		shareButton: $(),
		isFadingIn: false,
		CLASS_SHARE_BUTTON: 'share-button',
		CLASS_LIKE_BUTTON: 'like-button',
		CLASS_NO_POPUP: 'no-popup',
		CLASS_SHARE_ARROW: 'sprite-share-arrow',
		CLASS_SHARE_ARROW_BOTTOM: 'sprite-share-arrow-inverted',
		CLASS_POSITION_BOTTOM: 'bottom',
		CLASS_EPRIVACY_FIGURE: 'eprivacy-component',
		tcmid: $('body').attr('data-tcmid'),
		/**
		 * initializes social lib
		 * @returns null
		 */
		init: function () {
			m.initShare($('.'+ m.CLASS_SHARE_BUTTON));
			m.initRating();
			m.initLikeButtons($('.'+ m.CLASS_LIKE_BUTTON));
			return null;
		},
		/**
		 * initializes social lib on demand
		 * @returns null
		 */
		initShare: function(targets){
			if(targets.size()){
				PubSub.unsubscribe(m.hideBox);
				PubSub.subscribe(T1.constants.ON_DOC_CLICK, m.hideBox);
				targets.find('> a').unbind('click', m.toggleBox).bind('click', m.toggleBox);
				targets.find('.share-options a').unbind('click', m.onOtherLinkClick).bind('click', m.onOtherLinkClick);
				m.shareButton = m.shareButton.add(targets);
			}
		},
		/**
		 * rate functions
		 */
		initRating: function() {
			var star = $('.icon-star').eq(0);
			if(T1.mypage) {
				var ratingTotal = T1.mypage.rating.ratingTotal,
					count = T1.mypage.rating.count,
					rating = count > 0 ? ratingTotal / count : 0;
				if(rating > 0) m.updateRating(star, rating);
			}
			$('.rate-button .share-options i').click(m.rate);
		},
		initSocialFB: function(targets) {
			var eventArgs = {service: 'facebook', targets: targets, cancel: false};
			PubSub.publishSync(T1.constants.SOCIAL_SHARE_INIT, eventArgs);

			if(!eventArgs.cancel) {
				m.initLikeButtons(targets);
				m.parseFB(targets);
			}
		},
		initLikeButtons: function(targets) {
			targets.click(function() {
				var button = $(this),
					iframe = button.find('.fb-like > span > iframe');
				if(iframe.size()) {
					button.attr('data-interval', setInterval(function() {
						var regex = new RegExp('height[:][s]*[^;\'"]*'),
							match = iframe.attr('style').toLowerCase().match(regex);
						if(match && match[0] && parseInt(match[0].match(/\d+/g)) > 300) {
							iframe.parent().css({height: parseInt(match[0].match(/\d+/g))}).addClass('full-height');
						}
						else {
							iframe.parent().css('height', '').removeClass('full-height');
						}
					},500));
				}
			});
		},
		parseFB: function(targets) {
			if(window.FB){
				targets.each(function(){
					var $this = $(this),
						$like = $this.find('.fb-like');
					window.FB.XFBML.parse(this);
					$like.find('span').css('width', $like.data('width'));
				});
			}
		},
		clearLikeSurvey: function() {
			m.shareButton.filter('.like-button').each(function() {
				var $this = $(this);
				clearInterval($this.attr('data-interval'));
				$this.attr('data-interval', null);
			});
		},
		rate: function(e) {
			var $this = $(this),
				request = $.ajax({
				type: 'POST',
				dataType: 'JSON',
				url: $this.parents('.rate-button').data('url'),
				data: {
					"tcmid": m.tcmid,
					"score": 5 - $this.index()
				}
			});
			request.done(m.ratingSuccess($this));
			request.fail(m.ratingError($this));
		},
		ratingSuccess: function($this) {
			return function(data) {
				if(data.success) {
					if(data.rating) { m.updateRating($this, data.rating.ratingTotal / data.rating.count); }
					m.ratingMessage($this, T1.labels.rateSubmitted, !data.success);
				} else {
					//m.ratingMessage($this, data.error.message ? data.error.message : data.error, true);
					m.ratingMessage($this, T1.labels.rateAlreadySubmitted, true);
				}
			};
		},
		ratingError: function($this) {
			return function(jqXHR, status, error) {
					m.ratingMessage($this, error || T1.labels.forms.errorSubmit, true);
				};
		},
		ratingMessage: function($this, message, error) {
			$this.parents('.share-options').html('<p class="response' + (error ? ' error ' : '') + '">' + message + '</p>');
		},
		updateRating: function($this, rating) {
			rating = Math.round(rating*2)/2;
			var stars = $this.parents('.rate-button').find('>a i.icon-star');
			stars.removeClass('highlighted half');
			stars.filter(':lt(' + Math.floor(rating) + ')').addClass('highlighted');
			if(rating % 1) { stars.filter(':eq(' + Math.floor(rating) + ')').addClass('highlighted half'); }
		},
		/**
		 * +++ All code that needs to be executed on mode change (DESKTOP -> MOBILE) +++
		 * Will be executed each time the mode changes (can be handy to hide/show some containers)
		 */
		switchMobile: function(){
			m.shareButton.addClass(m.CLASS_NO_POPUP);
			// eprivacy figures
			$('figure.' + m.CLASS_EPRIVACY_FIGURE).addClass(m.CLASS_NO_POPUP);
		},
		/**
		 * +++ All code that needs to be executed on mode change (MOBILE -> DESKTOP) +++
		 * Will be executed each time the mode changes (can be handy to hide/show some containers)
		 */
		switchDesktop: function(){
			m.shareButton.removeClass(m.CLASS_NO_POPUP);
			// eprivacy figures
			$('figure.' + m.CLASS_EPRIVACY_FIGURE).removeClass(m.CLASS_NO_POPUP);
		},
		/**
		 * Every time (not for mobile breakpoint nor inside navigation) a link is clicked, this function will overwrite the natural behaviour
		 * @param e		Event
		 */
		onOtherLinkClick: function(e) {
			// Clicked link href
			var $this = $(this),
				href= $this.attr('href');
			// Current page URL
			var currentURL = $this.attr('data-link') || $this.closest('section').attr('data-link') || window.location.href;
			// In case we have an overlay with carousel
			var overlay = $this.closest('.overlayerContent');
			if( overlay.length > 0 && overlay.find('.carousel').length > 0 ){
				currentURL = overlay.find('.carousel .item.active').data().dataNode.attr('href');
			}
			// URL encode
			if ($this.data('encode')) {
				currentURL = encodeURIComponent(currentURL);
			}
			href = href.replace(/\[URL\]/g, currentURL);
			var parent = $this.parents('.' + m.CLASS_SHARE_BUTTON);
			if (parent.hasClass(m.CLASS_NO_POPUP)) {
				// Use regular link behavior (opening in a new page because of _blank)
				$this.attr('href',href);
			} else {
				// Open popup window
				window.open(href, '_blank', 'location=yes,height=420,width=550');
				e.preventDefault();
			}

			// Raise shared event (statistics)
			PubSub.publish(T1.constants.SOCIAL_SHARED, {href: href, url: currentURL, node: $this});
		},
		hideBox: function(event, e){
			var $this = $(e.target);
			//hide only on if share-options not clicked
			if(!m.isFadingIn && $this.closest('.share-options').length === 0) {
				m.doHideBox();
				m.clearLikeSurvey();
			}
		},
		doHideBox: function() {
			var $shareBox 		 = m.shareButton.not('.no-popup').find('.share-box');
			var $shareBoxOverlay = $('#social-tools-gallery').find('.share-box');

			$shareBoxOverlay.fadeOut('fast');
			$shareBox.fadeOut('fast', function() {
				if ($(this).hasClass(m.CLASS_POSITION_BOTTOM)){
					$(this).removeClass(m.CLASS_POSITION_BOTTOM);
					var $shareArrow = $(this).find('.'+ m.CLASS_SHARE_ARROW_BOTTOM);
					$shareArrow.css('marginTop','-1px');
					$shareArrow.toggleClass(m.CLASS_SHARE_ARROW + ' ' + m.CLASS_SHARE_ARROW_BOTTOM);
				}
			});
		},
		toggleBox: function(e){
			var $this = $(this),
				$parent = $this.parent(),
				$container = $parent.closest('.container'),
				$shareBox = $parent.find('.share-box'),
				marginLeft = '',
				containerOffset = $container.offset(),
				boxOffset = $shareBox.offset(),
				optionsOffset = null,
				$shareArrow = null,
				$shareOptions = null;

			if($shareBox && !$shareBox.is(":visible") && !$parent.hasClass('no-popup')){
				// first hide opened boxes
				m.doHideBox();
				// Tablet and Desktop
				m.isFadingIn = true;
				$shareBox.fadeIn(function(){
					m.isFadingIn = false;
				});
				if(containerOffset && boxOffset){
					// this is the default margin (box centered in relation to share button)
					$shareOptions = $shareBox.find('.share-options');
					//set share arrow margin
					$shareArrow = $shareBox.find('.'+ m.CLASS_SHARE_ARROW);
					$shareArrow.css('margin-left', (($parent.innerWidth() / 2) - ($shareArrow.innerWidth() / 2)) + 'px');
					marginLeft = '-' + (
											($shareOptions.innerWidth() / 2) -
											(
												($shareArrow.innerWidth() / 2) +
												parseFloat($shareArrow.css('margin-left').replace('px', ''))
											)
										) + 'px';
					$shareOptions.css('margin-left', marginLeft);
					optionsOffset = $shareOptions.offset();
					// this is used when box is outside container on right side
					if((containerOffset.left + $container.width()) <
						(optionsOffset.left + $shareOptions.width())){
						$shareOptions.css('margin-left', '0px');
						optionsOffset = $shareOptions.offset();
						marginLeft = ((containerOffset.left + $container.width()) - (optionsOffset.left + $shareOptions.width())) + 'px';
						$shareOptions.css('margin-left', marginLeft);
					}
					//this is when its outside on left side
					else if (containerOffset.left > optionsOffset.left) {
						$shareOptions.css('margin-left', '0px');
						optionsOffset = $shareOptions.offset();
						marginLeft = (containerOffset.left - optionsOffset.left) + 'px';
						$shareOptions.css('margin-left', marginLeft);
					}
					// Vertical positioning
					var shareBoxOffset = $shareBox.offset(),
						w = $(window),
						navPrimary = $('#nav-primary'),
						navSecondary = $('#nav-secondary-level'),
						// Add primary navigation to upper limit (always present)
						topLimit = (w.scrollTop() + navPrimary.height());
						// Add secondary navigation to upper limit (only if present)
						topLimit = (navSecondary.length > 0) ? topLimit + navSecondary.height() : topLimit;
					if (shareBoxOffset.top < topLimit) {
						$shareBox.addClass(m.CLASS_POSITION_BOTTOM);
						$shareArrow.toggleClass(m.CLASS_SHARE_ARROW_BOTTOM + ' ' + m.CLASS_SHARE_ARROW);
						var boxHeight = $shareArrow.height() + $shareOptions.outerHeight();
						$shareArrow.css('marginTop', -(boxHeight - 2));
					}
				}
			}
			else if ($parent.hasClass('no-popup')){
				// Mobile
				if($shareBox.is(':visible')){
					$shareBox.slideUp('slow');
				} else {
					$shareBox.slideDown('slow');
				}
			}
			e.preventDefault();

		}
	};
	var m = _private;
	return {
		init: _private.init,
		switchMobile: _private.switchMobile,
		switchDesktop: _private.switchDesktop,
		share: { init: _private.initShare },
		like: { init: function(targets) { _private.initShare(targets); _private.initSocialFB(targets); } }
	};
}());