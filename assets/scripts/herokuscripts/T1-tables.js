/*
$(document).ready(function()
	{ 
		$("#myTable").tablesorter(); 
	} 
);
*/
var T1 = T1 || {};

/**
 * tables wrapper
 */
T1.tables = ( function () {
	'use strict';

	// _private var for facade pattern (return public vars/functions)
	var _private = {
		/**
		 * initializes tables when lib loaded
		 * @returns {tables initiated object}
		 */
		init: function () {
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, _private.sortable);
			_private.sortable();
			return null;
		},
		'sortable': function(){
			var sortableTables = $(".sortable-table");
			for (var i = 0; i< sortableTables.length; i++) {
				
				var index = 0,
					sortableObject = {
						headers: {},
						sortList: []
					}, 
					table = $(sortableTables[i]),
					th = table.find("th");
				
				for (var thIndex = 0; thIndex < th.length; thIndex++) {
					
					var thElement = th[thIndex],
						$this = $(thElement),
						sortableHeaders = $this.data('sortable-headers'),
						sortableSort = $this.data('sortable-sort');

					if(sortableHeaders) {
						sortableObject.headers[index] = sortableHeaders;
					}
					switch(sortableSort) {
						case 'asc': sortableObject.sortList.push([index, 0]); break;
						case 'desc': sortableObject.sortList.push([index, 1]); break;
						default: break;
					}
					index++;
				}
				table.tablesorter(sortableObject); 
			}
		}
	};
	return {
		init: _private.init
	};
}());
