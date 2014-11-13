var T1 = T1 || {};

T1.comparer = (function() {
	'use strict';

	var _private = {
		ovlClass: 'compare-ovl',
		highlightClass: 'in-evidence',
		filteredClass: 'filtered',
		dynamicFilterClass: 'dynamically-filtered',
		loadingClass: 'loading',
		errorClass: 'error',
		filteredAreaSelectors: [
			'.details .detail:not(.template) .content >.row >.col-sm-2',
			'.right.filters.row .col-sm-2'
		],
		toastPositions: {
			top: {top: '10%'},
			bottom: {top: '80%'}
		},
		toastTimeout: 3000,

		extend: function(internal, container) {
			if(container && container.size()) {
				internal = $.extend(true, {}, _base,

					{container: container},
					m.protectBase(internal.extend),
					$.extend(true, {}, _virtual, m.protectBase(internal.override))
				);
			}
			return internal;
		},
		protectBase: function(obj) {
			if(obj) {
				for(var key in _base) { delete obj[key]; }
			}
			return obj;
		},
		clearTokens: function() {
			for(var t = 0; t < this.tokens.length; t++) {
				PubSub.unsubscribe(this.tokens[t]);
			}
			this.tokens = [];
		},
		thread: function(context, call) {
			setTimeout($.proxy(call, context), 0);
		},
		onOverlayerResize: function(event, data) {
			this.uniformizeToolsHeight();
			this.uniformizeDetailsHeight();
			this.uniformizeHeight(this.compareView.find('.expandable-objects'));
			setTimeout(
				$.proxy(m.refreshLock, this),
				300
			);
		},
		toast: function(message, container, css) {
			PubSub.publish(T1.constants.TOAST_CUSTOM, {
				customContainer: container,
				customText: message,
				timeout: m.toastTimeout,
				css: css
			});
		},
		toastAndClose: function(msg) {
			$.proxy(m.toast, this)(msg, this.compareView.parent());
			setTimeout(function() {
				PubSub.publishSync(c.HASH_REMOVE, '');
			}, m.toastTimeout);
		},
		handleObjectsSelection: function(e) {
			var box = $(e.currentTarget),
				area = box.closest('.checkboxes-area'),
				count = area.find('.checkbox-btn input[type="checkbox"]:checked').size();

			if(count > this.selectionScope.max) {
				var object = box.closest('ul, .col-sm-3').parent(),
					position = {top: object.position().top + (object.height() / 2)};

				$.proxy(m.toast, this)(T1.labels.comparator.selectMaxReached.replace(/{count}/g, this.selectionScope.max), area, position);
				box.prop('checked', !box.is(':checked'));
			}
		},
		mirrorSelection: function(source) {
			var mirrorBtns = this.container.add(this.compareView).find('.checkboxes-area').not(source).find('.checkbox-btn');

			source.find('.checkbox-btn input[type="checkbox"]').each(function(key, value) {
				var sourceBox = $(value),
					targetBox = mirrorBtns.find('input[type="checkbox"][data-filter-value="' + $(value).data('filter-value') + '"]');

				$.proxy(m.toggleCheckBoxBtn, this)(targetBox, sourceBox.prop('checked'));
			});
		},
		toggleCheckBoxBtn: function(box, checked) {
			var btn = box.closest('.checkbox-btn');

			box.prop('checked', checked);
			btn.toggleClass(btn.attr('data-on-class'), box.is(':checked'));
			btn.toggleClass(btn.attr('data-off-class'), !box.is(':checked'));
		},
		validateObjectsSelection: function(e) {
			if(e) { e.preventDefault(); }

			var area = this.compareView.find('.checkboxes-area'),
				count = area.find('.checkbox-btn input[type="checkbox"]:checked').size();

			if(count > this.selectionScope.max) {
				$.proxy(m.toast, this)(T1.labels.comparator.selectMaxReached.replace(/{count}/g, this.selectionScope.max), area);
				if(e) { e.stopImmediatePropagation(); }
			}
			else if(count < this.selectionScope.min) {
				$.proxy(m.toast, this)(T1.labels.comparator.selectMinReached.replace(/{count}/g, this.selectionScope.min), area);
				if(e) { e.stopImmediatePropagation(); }
			}
			else {
				$.proxy(m.setObjectsSelection, this)(area);
				$.proxy(m.mirrorSelection, this)(area);
				$.proxy(m.applyFilters, this)();
			}
		},
		compareBtnClick: function(e) {
			e.preventDefault();

			var area = this.getPageCheckboxesArea(),
				count = area.find('.checkbox-btn input[type="checkbox"]:checked').size(),
				position = m.toastPositions[$(e.currentTarget).data('toast-position')];

			if(count > this.selectionScope.max) {
				$.proxy(m.toast, this)(T1.labels.comparator.selectMaxReached.replace(/{count}/g, this.selectionScope.max), area, position);
			}
			else if(count < this.selectionScope.min) {
				$.proxy(m.toast, this)(T1.labels.comparator.selectMinReached.replace(/{count}/g, this.selectionScope.min), area, position);
			}
			else {
				PubSub.publish(c.HASH_CHANGE, '/publish/' + $(e.currentTarget).attr('href').replace(/#/g, ''));
			}
		},
		getObjectsMaxHeight: function(objects, options) {
			var maxHeight = 0;

			options = $.extend({
				innerCalculation: false,
				excludeSelector: null
			}, options);

			objects.each(function(){
				var $this = $(this),
					h = options.innerCalculation ? $this.innerHeight() : $this.height();

				if(options.excludeSelector) {
					$this.find(options.excludeSelector).each(function() {
						h -= options.innerCalculation ? $(this).innerHeight() : $(this).height();
					});
				}

				maxHeight = h > maxHeight ? h : maxHeight;
			});
			return maxHeight;
		},
		collapsiblePanelClick: function(e, options) {
			var target = $(e.currentTarget.parentNode),
				active = this.compareView.find('.active.detail');

			if(!target.find('.detail-group').is(':animated')) {
				options = $.extend({active: false}, options);

				if(!target.is(active)){ $.proxy(m.togglePanel, this)(active); }
				$.proxy(m.togglePanel, this)(target, options.active);
			}
		},
		togglePanel: function(panel, active) {
			var groups = panel.find('.detail-group'),
				context = this;

			groups.slideToggle({
				duration: 400,
				start: function() {
					if(!panel.hasClass('active')) {
						context.uniformizeDetailsHeight($(this));
					}
				},
				complete: function() {
					var group = $(this);
					if(active || group.is(':visible')) {
						group.show();
						panel.addClass('active');
					}
					else {
						panel.removeClass('active');
					}
				}
			});
		},
		slideToggleFilterPanel: function(close) {
			var btn = this.compareView.find('.btn-objects-filter'),
				pnl = this.compareView.find('.expandable-objects');

			if(!close || close && btn.hasClass('active')) {
				pnl.slideToggle({
					duration: 400,
					start: $.proxy(function() {
						$.proxy(m.lock, this)(!btn.hasClass('active'));
					}, this),
					complete: $.proxy(function() {
						btn.toggleClass('active');
						this.uniformizeHeight(pnl);
					}, this)
				});
			}
		},
		applyFilters: function() {
			if(this.data) {
				var filter = $.proxy(m.buildFilter, this)(),
					selector = $.proxy(m.getFilteredSelector, this)(filter),
					fullSelection = this.compareView.find(m.filteredAreaSelectors.join()),
					filteredSelection = this.compareView.find(selector),
					dynamicClasses = $.proxy(m.getDynamicFiltersKeys, this)();

				fullSelection.removeClass([dynamicClasses.join(' '), m.filteredClass, m.dynamicFilterClass, 'first', 'last'].join(' '));

				var dynamicSelection = $.proxy(m.getDynamicSelection, this)(fullSelection, filteredSelection, filter);
				filteredSelection.not(dynamicSelection).addClass(m.filteredClass);
				$.proxy(m.executeCustomFilters, this)(filter);

				$.proxy(m.setFirstLast, this)();
				$.proxy(m.highlight, this)(filter.highlight);
				this.uniformizeToolsHeight();
				this.uniformizeDetailsHeight();
			}
		},
		getDynamicSelection: function(fullSelection, filteredSelection, filter) {
			var dynamicSelection = [];

			if(!$.isEmptyObject(this.dynamicFilters)) {
				var selection = $.proxy(m.getIndexedSelection, this)();

				fullSelection.not(filteredSelection).each($.proxy(function(key, val) {
					var node = $(val);

					for(var name in this.dynamicFilters) {
						var filtered = false;
						for(var f = 0; f < this.dynamicFilters[name].length; f++) {
							filtered = filtered || $.proxy(this.dynamicFilters[name][f], node)({
								name: name,
								filter: filter,
								data: this.data,
								selection: selection
							});
						}

						if(filtered) {
							node.addClass([name, m.dynamicFilterClass].join(' '));
							dynamicSelection.push(val);
						}
					}
				}, this));
			}

			return dynamicSelection;
		},
		executeCustomFilters: function(filter) {
			for(var name in this.customFilters) {
				for(var s in this.customFilters[name]) {
					var targets = this.compareView.find(s);
					targets.removeClass([name, m.filteredClass, m.dynamicFilterClass].join(' '));

					for(var f = 0; f < this.customFilters[name][s].length; f++) {
						var call = $.proxy(m.applyCustomFilter, this)(filter, name, s, f);
						targets.each($.proxy(call, this));
					}
				}
			}
		},
		applyCustomFilter: function(filter, name, selector, index) {
			return function(key, val) {
				var node = $(val),
					filtered = $.proxy(this.customFilters[name][selector][index], node)({
						filter: filter,
						data: this.data
					});

				if(filtered) {
					node.addClass([name, m.dynamicFilterClass].join(' '));
				}
			};
		},
		setFirstLast: function() {
			var itemRows = this.compareView.find('.details .detail:not(.template) .content >.row'),
				filters = this.compareView.find('.right.filters.row .col-sm-2').not('.' + m.filteredClass);

			$.proxy(m.removeFirstLastClasses, this)(this.compareView.find(m.filteredAreaSelectors.join()));
			$.proxy(m.addFirstLastClasses, this)(filters);

			itemRows.each($.proxy(function(key, val) {
				$.proxy(m.addFirstLastClasses, this)($(val).children('.col-sm-2').not('.' + m.filteredClass));
			}, this));
		},
		removeFirstLastClasses: function(set) {
			set.removeClass(['first', 'last'].join(' '));
		},
		addFirstLastClasses: function(set) {
			set.first().addClass('first');
			set.filter(':eq(' + (this.selectionScope.max - 1) + ')').addClass('last');
		},
		dropdownFilterChanged: function(e) {
			var target = $(e.target);
			e.preventDefault();

			target.closest('.dropdown-menu').find('li a').removeClass('selected');
			target.closest('.dropdown').find('.dropdown-toggle >span').html(target.html());
			target.addClass('selected');

			m.thread(this, m.applyFilters);
		},
		resetObjectsFilter: function() {
			var boxes = this.compareView.find('.checkboxes-area .checkbox-btn input[type="checkbox"]');
			boxes.each(function() { m.toggleCheckBoxBtn($(this), false); });
			for(var i = 0; i < this.selection.length; i++) {
				m.toggleCheckBoxBtn(boxes.filter('[data-filter-value="' + this.selection[i] + '"]'), true);
			}
		},
		getFilteredSelector: function(filter) {
			var selector = [];

			for(var key in filter) {
				if(key !== 'highlight') {
					selector.push($.proxy(m.getLiteralFilter, this)(key, filter[key]));
				}
			}

			return selector.join(',');

		},
		getLiteralFilter: function(key, value) {
			if(key !== 'highlight') {
				var literalF = '',
					selector = [];

				// if array, same filter, logical AND
				// if not array, new filter, logical OR

				if(!(value instanceof Array)) {
					literalF += '[data-filter-' + key + '][data-filter-' + key + '!="' + value + '"]';
				}
				else {
					for(var f = 0; f < value.length; f++) {
						literalF += '[data-filter-' + key + '][data-filter-' + key + '!="' + value[f] + '"]';
					}
				}

				for(var s = 0; s < m.filteredAreaSelectors.length; s++) {
					selector.push(m.filteredAreaSelectors[s] + literalF);
				}

				return selector.join(',');
			}
		},
		getData: function() {
			var request = $.ajax({
				type: 'GET',
				dataType: 'JSON',
				url: this.container.data('url')
			});
			request.done($.proxy(m.onGetDataDone, this));
			request.fail($.proxy(m.onGetDataFail, this));
		},
		onGetDataDone: function(data) {
			$.proxy(m.resetData, this)(data);
			$.proxy(this.onDataLoad, this)(this.data);
			$.proxy(m.applyFilters, this)();
			$.proxy(this.initOverlayer, this)();
		},
		onGetDataFail: function(jqXHR, status, error) {
			this.compareView.addClass(m.errorClass);
			$.proxy(m.toastAndClose, this)(error || status);
		},
		resetData: function(data) {
			this.data = data || null;
			this.compareView.find('.details >*:not(.template)').remove();
			//this.compareView.find('.promo-disclaimer:not(.template)').remove();
		},
		lock: function(state) {
			$.proxy(m.refreshLock, this)().slideToggle(state);
		},
		refreshLock: function() {
			var lock = 	this.compareView.find('.lock'),
				viewHeight = this.compareView.height(),
				containerHeight = $('.overlayerContent').prop('scrollHeight') || 0;

			return lock.height(viewHeight > containerHeight ? viewHeight : containerHeight);
		},
		buildFilter: function() {
			var filter = {getUnsafeData: $.proxy(this.getUnsafeData, this)};
			filter.get = $.proxy(function(key) { return this.getUnsafeData(filter[key]); }, this);

			this.compareView.find('[data-filter-name][data-filter-value!=""]').each(function() {
				var node = $(this),
					isBox = node.prop('checked') !== undefined;

				if((isBox && node.prop('checked')) || node.hasClass('selected')) {
					if (filter[node.data('filter-name')]) {
						if(!(filter[node.data('filter-name')] instanceof Array)) {
							filter[node.data('filter-name')] = [filter[node.data('filter-name')]];
						}
						filter[node.data('filter-name')].push(node.data('filter-value'));
					}
					else {
						filter[node.data('filter-name')] = node.data('filter-value');
					}
				}
			});

			return filter;
		},
		resetFilters: function() {
			this.compareView.find('[data-filter-default]').each(function() {
				var node = $(this),
					isBox = node.prop('checked') !== undefined;

				if(isBox && !node.prop('checked')) {
					node.prop('checked', true);
				}
				else if(this.nodeName.toUpperCase() === 'A') {
					node.click();
				}
			});
		},
		setObjectsSelection: function(area) {
			var index = {};
			this.selection = [];

			area.find('.checkbox-btn input[type="checkbox"]:checked').each(
				$.proxy(function(key, value) {
					value = $(value).data('filter-value');
					if(!index[value]) {
						this.selection.push(value);
						index[value] = true;
					}
				}, this)
			);
		},
		getIndexedSelection: function() {
			var selection = {};
			for(var s = 0; s < this.selection.length; s++) {
				selection[this.selection[s]] = true;
			}
			return selection;
		},
		getDynamicFiltersKeys: function() {
			return $.proxy(m.getObjectKeys, this)(this.dynamicFilters);
		},
		getObjectKeys: function(object) {
			var keys = [];
			for(var key in object) { keys.push(key); }
			return keys;
		},
		removeObject: function(e) {
			var obj = $(e.currentTarget),
				count = this.selection.length;

			if(count <= this.selectionScope.min) {
				$.proxy(m.toast, this)(T1.labels.comparator.selectMinReached.replace(/{count}/g, this.selectionScope.min), obj.closest('.filters'));
			}
			else {
				var index = this.selection.indexOf(obj.data('value'));
				if(index > -1) {
					delete this.selection[index];
					$.proxy(m.resetObjectsFilter, this)();
					$.proxy(m.validateObjectsSelection, this)();
				}
			}
		},
		onHighlightChange: function() {
			var filter = $.proxy(m.buildFilter, this)();
			$.proxy(m.highlight, this)(filter.highlight);
		},
		resetBrowserCache: function() {
			this.container.find('.objects.checkboxes-area input[type="checkbox"]').each(function() {
				var $this = $(this);
				$this.prop('checked', $this.attr('checked') === 'checked');
			});
		},
		highlight: function(state) {
			this.compareView.find('.details .' + m.highlightClass).removeClass(m.highlightClass);

			if(state) {
				this.compareView.find('.detail .content >.row:not(.' + this.noHighLightClass + ')').each(function() {
					var row = $(this),
						val = null;

					row.find('.col-sm-2:not(.' + m.filteredClass + ')').each(function() {
						var cell = $(this),
							data =  cell.attr('data-value');

						val = (val === null) ? data : val;
						if(val != data) {
							row.addClass(m.highlightClass);
							return false;
						}
					});
				});
			}
		}
	};

	var _base = {
		noHighLightClass: 'not-in-evidence',
		container: null,
		compareView: null,
		tokens: [],
		selection: [],
		selectionScope: {
			min: 1,
			max: 3
		},
		dynamicFilters: {},
		customFilters: {},
		noDataValue: '-',
		data: null,

		init: function() {
			$.proxy(m.resetBrowserCache, this)();

			this.container.on('change', '.checkboxes-area .checkbox-btn input[type="checkbox"]', $.proxy(function(e) {
				var area = $(e.currentTarget).closest('.checkboxes-area');
				$.proxy(m.handleObjectsSelection, this)(e);
				$.proxy(m.setObjectsSelection, this)(area);
				$.proxy(m.mirrorSelection, this)(area);
			}, this));
			this.container.find('.compare-btn').on('click', $.proxy(m.compareBtnClick, this));
			$.proxy(m.setObjectsSelection, this)(this.container.find('.objects.checkboxes-area'));
			PubSub.subscribe(c.ON_WIN_RESIZE, $.proxy(this.onWindowResize, this));
			PubSub.subscribe(c.PAGEOVERLAYER_CLOSED, $.proxy(this.onOverlayerClosed, this));
			PubSub.subscribe(c.FINANCE_RATES_OFF, $.proxy(function() { $.proxy(this.uniformizeHeight, this)(); }, this));
			PubSub.subscribe(c.FINANCE_RATES_LOADED, $.proxy(function() { $.proxy(this.uniformizeHeight, this)(); }, this));
			this.initView();
		},
		initOverlayer: function() {
			m.thread(this, function() {
				T1.formInput.initOnDemand(this.compareView.find('.checkboxes-area'));
				this.compareView.find('.checkboxes-area .checkbox-btn input[type="checkbox"]').on('change', $.proxy(m.handleObjectsSelection, this));
				this.compareView.find('.detail >h4').on('click', $.proxy(m.collapsiblePanelClick, this));
				this.compareView.find('.btn-validate').on('click', $.proxy(m.validateObjectsSelection, this));
				this.compareView.find('.right.filters.row .icon-remove').on('click', $.proxy(m.removeObject, this));
				this.compareView.find('.filters input[data-filter-name="highlight"]').on('change', $.proxy(m.onHighlightChange, this));
				this.compareView.find('.filters input[data-filter-name!="highlight"]').on('change', $.proxy(m.applyFilters, this));
				this.compareView.find('.filters .dropdown [data-filter-name!="highlight"] a').on('click', $.proxy(m.dropdownFilterChanged, this));
				this.compareView.find('.btn-objects-filter, .lock, .actions').on('click', $.proxy(function(e) {
					e.preventDefault();
					$.proxy(m.slideToggleFilterPanel, this)();
					$.proxy(m.resetObjectsFilter, this)();
				}, this));
				this.compareView.removeClass(m.loadingClass);
				this.uniformizeToolsHeight();
				this.uniformizeDetailsHeight();
			});
		},
		compare: function(event, data) {
			var area = this.getPageCheckboxesArea(),
				count = area.find('.checkbox-btn input[type="checkbox"]:checked').size();

			if(count > this.selectionScope.max) {
				PubSub.publish(c.HASH_REMOVE, '');
				$.proxy(m.toast, this)(T1.labels.comparator.selectMaxReached.replace(/{count}/g, this.selectionScope.max), area);
			}
			else if(count < this.selectionScope.min) {
				PubSub.publish(c.HASH_REMOVE, '');
				$.proxy(m.toast, this)(T1.labels.comparator.selectMinReached.replace(/{count}/g, this.selectionScope.min), area);
			}
			else {
				PubSub.publish(c.PAGEOVERLAYER_OPEN, {url: decodeURIComponent(this.container.data('view-url')), ajax: true, sync: true, styleClass: m.ovlClass});
				var token = PubSub.subscribe(c.PAGEOVERLAYER_LOAD, $.proxy(function(event, data) {
					$.proxy(this.onOverlayerOpen, this)(event, data);
					PubSub.unsubscribe(token);
				}, this));
			}
		},
		resetView: function() {
			$.proxy(m.resetFilters, this)();
			$.proxy(m.slideToggleFilterPanel, this)(true);
			this.expandDetail(0);
			this.compareView.addClass(m.loadingClass);
			this.compareView.removeClass(m.errorClass);
		},
		expandDetail: function(index) {
			this.compareView.find('.details >.detail:not(.template):eq(' + index + ') >h4').trigger('click', {active: true});
		},
		getObjectsMaxHeight: function(objects, options) {
			return m.getObjectsMaxHeight(objects, options);
		},
		uniformizeHeight: function(root, options) {
			options = $.extend({
				innerCalculation: false,
				rootFilter: ':visible',
				childFilter: ':visible',
				rule: 'margin-top',
				offsetCalculation: true,
				adjust: 0
			}, options);

			var opt = {
				innerCalculation: options.innerCalculation,
				excludeSelector: '.responsive-exclude'
			};

			(root || this.container).find('.responsive-item' + (options.rootFilter || '')).each($.proxy(function(index, row){
				var children = $(row).children(options.childFilter),
					anchors = children.find('.responsive-anchor').removeAttr('style'),
					maxHeight = m.getObjectsMaxHeight(children, opt) + options.adjust;

				children.each(function(index, child) {
					var $child = $(child);

					$child.find('*').andSelf().filter('.responsive-anchor').
						css(options.rule, 0).
						css(options.rule, options.offsetCalculation ? (maxHeight - m.getObjectsMaxHeight($child, opt)) : maxHeight);
				});
			}, this));
		},
		uniformizeToolsHeight: function() {
			this.uniformizeObjectsFilterHeight();

			var leftColumn = this.compareView.find('.tools >.left').removeAttr('style'),
				minHeight = this.compareView.find('.tools >.right').height(),
				childrenHeight = 0;

			leftColumn.children().each(function() { childrenHeight += $(this).outerHeight(true); });
			leftColumn.css('min-height', minHeight);

			if(childrenHeight > minHeight) { leftColumn.addClass('auto'); }
			else { leftColumn.removeClass('auto'); }
		},
		uniformizeDetailsHeight: function(root) {
			this.uniformizeHeight(root || this.compareView.find('.details'), {rule:'min-height', offsetCalculation:false, innerCalculation: true, adjust: 1});
		},
		handleResponsiveImages: function(options) {
			var images = options.root ? options.root.find('.responsive-item img') : options.images;

			images.bind('load error', $.proxy(function(e) {
				options.handler($(e.currentTarget).closest('.responsive-item').parent());
			}, this));
		},
		addCategory: function(name, btValue) {
			var details = this.compareView.find('.details'),
				category = details.find('.detail.template').clone().removeClass('template'),
				title = category.find('>h4');

			title.attr({
				'data-bt-action': 'click_tab',
				'data-bt-value': btValue || name,
				'data-bt-track': ''
			});
			title.find('span').html(name);
			category.find('.detail-group').remove();

			details.append(category);
			category.toggleClass('active', details.find('.detail:not(.template)').size() === 1);
			return category;
		},
		addSubCategory: function(category, name) {
			var subCategory = this.compareView.find('.details .detail.template .detail-group').clone();

			if(name) { subCategory.find('>h5').html(name); }
			else { subCategory.find('>h5').remove(); }

			subCategory.find('.content >.row').remove();
			category.append(subCategory);
			return subCategory;
		},
		addItem: function(category, data) {
			var row = this.compareView.find('.details .detail.template .content >.row').clone();

			if(!category.hasClass('detail-group')) { category = this.addSubCategory(category); }

			row.addClass(data.className);
			row.find('>.col-sm-6').prepend(data.content);
			row.find('>.col-sm-2').remove();
			if(data.more) {
				var moreId = 'item-' + new Date().getTime();
				row.find('>.col-sm-6 .readMore').attr('data-tooltip-selector', '#' + moreId);
				row.find('.expansion-content').attr('id', moreId);
				row.find('.expansion-inner').html(data.more);
			}
			else {
				row.find('.col-sm-6 .readMore, .expansion-content').remove();
			}
			category.find('.content').append(row);
			return row;
		},
		addItemObjectValue: function(item, data) {
			var cell = this.compareView.find('.details .detail.template .content >.row >.col-sm-2').clone();

			if(!data.displayValue) {
				if($.type(data.value) === 'boolean') {
					cell.find(data.value ? '.icon-minus' : '.icon-radio-checked').remove();
				}
				else { cell.html(data.value); }
			}
			else {
				cell.html(data.displayValue);
			}

			if(data.extra) { cell.append(data.extra); }
			cell.addClass(data.className);

			if(data.filters) {
				for(var f = 0; f < data.filters.length; f++) {
					cell.attr('data-filter-' + data.filters[f].name, this.getSafeString(data.filters[f].value));
				}
			}

			cell.attr('data-value', this.getSafeString(data.value));
			item.append(cell);
			return cell;
		},
		getSafeString: function(s) {
			return encodeURIComponent(s);
		},
		getUnsafeData: function(s) {
			var out = decodeURIComponent(s);
			return s instanceof Array ? out.split(',') : out;
		},
		addDynamicFilter: function(key, callback) {
			this.dynamicFilters[key] = this.dynamicFilters[key] || [];
			this.dynamicFilters[key].push(callback);
		},
		addCustomFilter: function(key, selector, callback) {
			this.customFilters[key] = this.customFilters[key] || {};
			this.customFilters[key][selector] = this.customFilters[key][selector] || [];
			this.customFilters[key][selector].push(callback);
		},
		getExpansionContainer: function (code, arrow) {
			var container = this.compareView.find('.expansion-content.template').clone().attr('id', code).removeClass('template');
			if(arrow) { container.append($('<div/>').addClass('expansion-arrow')); }
			return container;
		},
		getPricesContainer: function(prices) {
			var promoPrice = prices.list ? $('<span/>').addClass('old price').html(globalize.format(prices.list, 'c')) : null,
				promoTag = promoPrice ? $('<i class="icon-tag"/>') : null,
				currentPrice = $('<span/>').addClass(promoPrice ? 'promo price' : 'price').html(globalize.format(prices.listWithDiscount, 'c')).append(promoTag);
			return currentPrice.add(promoPrice);
		},
		onOverlayerOpen: function(event, data) {
			this.compareView = data.el.find('.compare-view');
			if(this.compareView.size()) {
				if(this.selection.length < this.selectionScope.min) {
					this.compareView.addClass(m.errorClass);
					$.proxy(m.toastAndClose, this)(T1.labels.comparator.selectMinReached.replace(/{count}/g, this.selectionScope.min));
				}
				else if(this.selection.length > this.selectionScope.max) {
					this.compareView.addClass(m.errorClass);
					$.proxy(m.toastAndClose, this)(T1.labels.comparator.selectMaxReached.replace(/{count}/g, this.selectionScope.max));
				}
				else {
					$.proxy(m.mirrorSelection, this)(this.getPageCheckboxesArea());
					this.tokens.push(PubSub.subscribe(c.ON_WIN_RESIZE, $.proxy(m.onOverlayerResize, this)));

					if(!this.data) {
						$.proxy(m.getData, this)();
					}
					else {
						$.proxy(m.onGetDataDone, this)(this.data);
					}
				}
			}
		},
		onOverlayerClosed: function(event, data) {
			if(data.content.parent().is(this.container)) {
				$.proxy(m.clearTokens, this)();
				//this.resetView();
				this.uniformizeHeight(this.container);
			}
		},
		getBase: function(name) {
			return $.proxy(Object.resolve(name, _virtual), this);
		}
	};

	var _virtual = {
		initView: function() {
			this.uniformizeHeight(this.container);
			this.handleResponsiveImages({
				root: this.container.find('.objects'),
				handler: this.uniformizeHeight
			});
			PubSub.subscribe(this.getCompareEvent(), $.proxy(this.compare, this));
		},
		onDataLoad: function(data) {

		},
		getCompareEvent: function() {

		},
		onWindowResize: function(event, data) {
			this.uniformizeHeight(this.container);
		},
		getPageCheckboxesArea: function() {
			return this.container.find('.objects.checkboxes-area');
		},
		uniformizeObjectsFilterHeight: function() {
			this.uniformizeHeight(this.compareView.find('.tools'));
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		extend: _private.extend
	};
}());