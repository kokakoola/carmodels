var T1 = T1 || {};

T1.scrollTracking = (function(){
	'use strict';

	var _private = {
		trackElements: null,
		scrollRecalcInterval: 500,
		trackId: 0,
		currentViewPortElements: {},
		lastRecalcTop: 0,
		lastTop: 0,
		win: $(window),
		viewp: {
			height: $(window).height()
		},
		scrollDirection: 'down',

		/**
		 * Starts listening to the scroll events, binds add scroll-elements to the trackElements object
		 */
		init: function(){
			var m = _private,
				c = T1.constants;
			PubSub.subscribe(c.GLOBAL_SCROLL, m.trackScroll);
			PubSub.subscribe(c.GLOBAL_SWIPE, m.trackScroll);
			PubSub.subscribe(c.SCROLL_TRACK_ADD, m.addElements);
			PubSub.publish(c.SCROLL_TRACK_ADD,{elements:$('.topfeatures'), options:{direction:'down', threshold: 200, event: T1.constants.SKROLLR_REFRESH}});
			PubSub.publish(c.SCROLL_TRACK_ADD,{elements:$('#footfocus'), options:{direction:'down', threshold: 200, event: T1.constants.SKROLLR_REFRESH}});
			//PubSub.subscribe(c.SCROLL_TRACK_APPEAR, m.test);
		},

		test:function(ev, data){
			console.log('SCROLLED ' + data.element.prop('id') + ' ' + new Date().toTimeString());
		},

		/**
		 * Run this function on scroll event / calculate the viewport top & bottom / each scrollRecalcInterval recalc the top and bottom of the elements to track
		 * @param evName (string) event that called this function
		 */
		trackScroll: function(evName){
			var m = _private;
			if(! m.trackElements) return;
			//calculate the viewport
			m.viewp.top = m.win.scrollTop();
			m.viewp.bottom = m.viewp.top + m.viewp.height;
			//calculate the direction
			m.scrollDirection = (m.viewp.top > m.lastTop) ? 'down' : 'up';
			m.lastTop = m.viewp.top;
			//recalculate if needed
			if(Math.abs(m.lastRecalcTop-m.viewp.top) > m.scrollRecalcInterval){
				m.recalc();
				m.lastRecalcTop = m.viewp.top;
			}
			//check if any element is in the viewport
			m.checkElements();
		},

		/**
		 * checks all conditions on all elements, if they have reached the viewport, if the element reached the viewport than publish the event
		 */
		checkElements: function(){
			var m = _private,
				element = null,
				condition = null,
				tmpViewPortElements = {};
			for(var skey in m.trackElements){
				element = m.trackElements[skey];
				if(element){
					for(var iCondition=0; iCondition < element.conditions.length; iCondition++){
						condition = element.conditions[iCondition];
						if(typeof condition.threshold ==='string' && condition.threshold.indexOf('%')!==-1){
							condition.threshold = element.el.outerHeight() * (parseInt(condition.threshold.replace('%',''),10)/100);
						}
						if((element.offset.top - condition.threshold) < m.viewp.bottom && (element.offset.bottom + condition.threshold) > m.viewp.top){
							if(! m.currentViewPortElements[skey + condition.id]){
								/* APPEARS IN VIEWPORT, PUBLISH EVENTS */
								if(condition.direction.indexOf(m.scrollDirection)!=-1) PubSub.publish(condition.event, {element: element.el});
								if(condition.once){
									element.conditions.splice(iCondition, 1);
									if(element.conditions.length===0) delete m.trackElements[skey];
								}
							}
							tmpViewPortElements[skey + condition.id] = true;
						}
					}
				}
			}
			m.currentViewPortElements = tmpViewPortElements;
		},

		/**
		 * recalc the top/bottom of all elements to track
		 */
		recalc: function(){
			var m = _private;
			if(! m.trackElements) return;
			for(var sKey in m.trackElements){
				m.recalcElement(m.trackElements[sKey]);
			}
		},

		/**
		 * recalculates the top/bottom of 1 element to track
		 * @param element (object) {offset (offset of the element), el (element jquery node), options}
		 */
		recalcElement: function(element){
			element.offset = element.el.offset();
			element.offset.bottom = element.offset.top + element.el.outerHeight();
		},

		/**
		 * adds elements to track to the trackElements object (called with the SCROLL_TRACK_ADD event)
		 * @param evName (string) event which called this function
		 * @param data (object) {elements (elements where to add tracking to), options (object - {id, treshold, direction, once, event})}
		 * @returns {*} (elements)
		 */
		addElements: function(evName, data){
			var elements = data.elements,
				options = data.options;
			for(var i=0; i<elements.length; i++){
				_private.addElement(elements.eq(i), options);
			}
			return elements;
		},

		/**
		 * adds 1 element to the tracking
		 * @param element (jquery object) element to add to the scroll tracking
		 * @param options (object) {
		 * 		treshold (integer): px before/after the element arrives in the viewport,
		 * 		direction (string up/down/updown): only track the up or down direction,
		 * 		once: (boolean) only track this element once,
		 * 		event: (string) event that needs to be published if the element reaches the breakpoint
		 * }
		 */
		addElement: function(element, options){
			var m = _private,
				scrollId = element.prop('scrollTrackId');

			if(!m.trackElements) m.trackElements = {};
			if(!scrollId){
				scrollId = 'scroll' + m.trackId;
				element.prop('scrollTrackId', scrollId);
				m.trackId++;
			}
			if(!m.trackElements[scrollId]){
				m.trackElements[scrollId] = {offset: null, el: element, conditions: []};
			}
			if(! options) options = {};
			m.trackElements[scrollId].conditions.push({
				id: 'condition' + m.trackElements[scrollId].conditions.length,
				threshold: options.threshold || 0,
				direction: options.direction || 'updown',
				once: options.once || false,
				event: options.event || T1.constants.SCROLL_TRACK_APPEAR
			});
			m.recalcElement(m.trackElements[scrollId]);
		}
	};

	return {
		init: _private.init
	};

}());
