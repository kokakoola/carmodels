(function($) {
	'use strict';
//	$.fn.T1Loader = {};
	/**
	 *
	 */
	$.fn.showT1Loader = function(){
		var $this = $(this),
			$loader = $this.find('.t1-loader'),
			$loaderImg = null,
			template = '<div class="t1-loader"><img src="/images/t1-loader.gif" /></div>';

		if($loader.length === 0) {
			$this.prepend(template);
			$loader = $this.find('.t1-loader');
		}
		$loader.height($this.height());
		$loader.show();
		$loaderImg = $loader.find('img');
		$loaderImg.css('margin-top', (($loader.height() / 2) - ($loaderImg.height() / 2)) + 'px');
	};

	/**
	 *
	 */
	$.fn.hideT1Loader = function(){
		var $this = $(this),
			$loader = $this.find('.t1-loader');

		if($loader.length > 0) {
			$loader.hide();
		}
	};

	/**
	 *
	 */
	$.fn.destroyT1Loader = function(){
		var $this = $(this),
			$loader = $this.find('.t1-loader');

		if($loader.length > 0) {
			$loader.remove();
		}
	};
})(jQuery);