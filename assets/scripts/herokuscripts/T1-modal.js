var T1 = T1 || {};

/**
 *
 *  requires:
 *  pubsub.js in /lib/
 *
 */
T1.modal = ( function() {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		triggers: $(".modal-launcher"),
		modals: $(".modal-container"),
		/* *
		 * initializes the triggers and behaviour
		 * @return {void} void
		 * */
		init: function(){
			//close the open modal if there's any
			_private.hideOpenModals();
			//loop the content to add a close button
			_private.modals.each(_private.addCloseButton);
			//define the general behaviour
			_private.triggers.click(function(e){
				e.preventDefault();
				_private.hideOpenModals();
				var modal       = _private.getContent($(this));
				var position    = _private.getPosition(modal);
				//put it to the calculated position
				modal.css({
					"top":position.y+"px",
					"left":position.x+"px"
				}).fadeIn("slow");
			});
			//catch global clicks to define the behaviour
			PubSub.subscribe(T1.constants.ON_DOC_CLICK, function(event, data){
				if(!$(data.target).hasClass("modal-launcher") && $(data.target).parents(".modal-container").length === 0) _private.hideOpenModals();
			});
		},
		/* *
		 * finds the middle of the viewport
		 * @return {object} object
		 * */
		getPosition: function(modal){
			var wWidth  = $(window ).width();
			var wHeight = $(window ).height();
			var mWidth  = modal.outerWidth();
			var mHeight = modal.outerHeight();

			var x = (wWidth - mWidth)/2;
			var y = (wHeight-mHeight)/2;
			return {"x":x, "y":y};
		},
		/* *
		 * finds the hidden content to show
		 * @return {HTML} html content
		 * */
		getContent: function(el){
			var content = $(".modal-container", el.closest("article"));
			return content;
		},
		/* *
		 * hides any open modal
		 * @return {void} void
		 * */
		hideOpenModals: function(){
			var modals = $('.modal-container');
			//if any video is loaded in the modal window: stop execution
			if(modals.filter(':visible').find('.video-js').length > 0) PubSub.publish(T1.constants.VIDEO_STOP, {});
			//hide modals
			modals.hide();
		},
		/* *
		 * adds cose button to the modal content
		 * @return {void} void
		 * */
		addCloseButton: function(i, e){
			var m = _private,
				closeBt = $("<a/>").addClass("closelink").attr("href", "#").css({
				"position": "absolute",
				"bottom":"-40px",
				"right":"3px"
			}).html("Close ").append($("<i/>").addClass("icon-remove"));

			closeBt.click(function(e){
				e.preventDefault();
				m.hideOpenModals();
			});

			$(".feature-cbv", this).append(closeBt);
		},
		/* *
		 * close the modal
		 * @return {void} void
		 * */
		close: function(el){
			el.hide();
		}
	};

	/*returns the public methods of the component*/
	var _public = {
		"init"      :_private.init
	};
	return _public;
})();