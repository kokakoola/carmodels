var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *
 */
T1.topfeatures = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		CLASS_BUTTON_HYBRID: 'btn-hybrid-view',
		CLASS_MODE_HYBRID: 'secondary-content-active',
		/* *
		 * initializes the main container
		 * @return {void} void
		 * */
		initDesktop: function(){
			if ($('.topfeature').length > 0) {
				_private.setupHybrid();
			}
		},
		setupHybrid: function(){
			var
				out_ms = 600,
				in_ms = 400,
				anim = function($el,changeFn){
					$el.animate({
						opacity: 0
					}, out_ms, function(){
						changeFn($el);
						$el.animate({ opacity: 1 }, in_ms);
					});
				},
				toggle_attr_hybrid = function($el){
					var
						old_ = '',
						new_ = $el.attr('data-hybrid');
					
					if($el.is('header[data-hybrid]')) {
						old_ = $el.css('background-image');
						$el.attr('data-hybrid',old_);

						anim($el, function($el){
							$el.css('background-image',new_);
						});
					}
					else if($el.is('h2[data-hybrid]') || $el.is('.topfeature-description p')) {
						old_ = $el.text();
						$el.attr('data-hybrid',old_);

						anim($el, function($el){
							$el.text(new_);
						});
					}
					else if($el.is('.'+_private.CLASS_BUTTON_HYBRID)) {
						old_ = $el.text();
						$el.attr('data-hybrid',old_);

						$el.text(new_).toggleClass('btn-blue').toggleClass('btn-grey');
					}
				};
			$('.topfeature:has(header[data-hybrid],h2[data-hybrid])').each(function(){
				var
					$this = $(this),
					$bg_pic = $this.find('header[data-hybrid]'),
					$caption = $this.find('h2[data-hybrid]'),
					$desc = $this.find('.topfeature-description p'),
					hybridBtn = $this.find('.'+_private.CLASS_BUTTON_HYBRID),
					hndlr = function(e){
						e.preventDefault();

						//set hybrid state
						var el = $(e.target);
						el.attr('data-bt-state', (el.hasClass('btn-blue') ? 'hybrid' : 'nonhybrid'));

						var $btn = $(this);
						setTimeout(function(){
							toggle_attr_hybrid($btn);
						}, out_ms+in_ms);
						$this.toggleClass(_private.CLASS_MODE_HYBRID);
						toggle_attr_hybrid($bg_pic);
						toggle_attr_hybrid($caption);
						toggle_attr_hybrid($desc);
					};

				hndlr = _.throttle(hndlr,in_ms+out_ms);
				//hybridBtn.click(_private.setHybridState);
				hybridBtn.click(hndlr);
			});
		},

		setHybridState: function(e){
			e.preventDefault();
			var el = $(e.target);
			el.attr('data-bt-state', (el.hasClass('btn-blue') ? 'hybrid' : 'nonhybrid'));
		}
	};


	/*returns the public methods of the component*/
	return {
		"initDesktop" : _private.initDesktop
	};

}());