/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a horizontal list
     * Instantiation is done by using this object as a mixin
     */
	var ui = be.marlon.ui;
	ui.HListBase = {
		// Variable for internal use
		_itemList:null,
		_pageList:null,
		_$container:null,
		_currentPage:0,
		_totalPages:0,
		_scroller:null,
		_selected:false,
		_startSearch:false,
		_containerPos:0,
		
		// ###########################
		// Private methods
		// ###########################
		
		/**
		 * Handles clicking on the navigation previous button 
		 */
		prevClickHandler:function(e)
		{
		    if (e === undefined) {
		        PubSub.publish('cc_salesman_hlistswipe', $('a.cc-prev')[0]);
		    }
			if(e)e.stopPropagation();
			this._currentPage --;
			if(this._currentPage < 0)this._currentPage = 0;
			this.navigate();
		},
		
		/**
		 * Handles clicking on the navigation next button 
		 */
		nextClickHandler:function(e)
		{
		    if (e === undefined) {
				PubSub.publish('cc_salesman_hlistswipe', $('a.cc-next')[0]);
		    }
			if(e)e.stopPropagation();
			this._currentPage ++;
			if(this._currentPage >= this._totalPages)this._currentPage = this._totalPages - 1;
			this.navigate();
		},
		
		/**
		 * Method which handles the navigating between the pages 
		 */
		navigate:function()
		{
			if(!this._pageList || this._startSearch)return;
			// Select the current page
			this._pageList.select(this._currentPage);
			// Animate the container
			this._$container.animate({left:-(this._currentPage * this.state.width)}, {duration:250, queue:false});
			// Logic for hiding/showing the next/prev buttons
			var prev = "btnPrev",
				next = "btnNext";
			prev = $(this.refs[prev].getDOMNode());
			next = $(this.refs[next].getDOMNode());
			if(this._currentPage > 0)prev.show();
			else prev.hide();
			if(this._currentPage < (this._pageList.getData().length - 1))next.show();
			else next.hide();
		},
		
		/**
		 * Handles clicking on a page 
		 * @param e:EventObject
		 */
		pageClickHandler:function(e)
		{
			e.stopPropagation();
			this._currentPage = $(e.target).data('index'); 
			this.navigate();
		},
		
		/**
		 * Method which handles the input of the search field
		 */
		searchUpdateHandler:function(s)
		{
			//console.log("search update: ", s);
			this.doSearch(s, false);
		},
		
		/**
		 * Method which actually handles the logic for the searching 
		 */
		doSearch:function(s, reset)
		{
			if(!this._pageList)return;
			var search = "search";
			if(!this.refs[search])return;
			
			var init = false;
			if(s.length > 0)
			{
				// Hide the navigation
				if(!this._startSearch)
				{
					init = true;
					this._containerPos = this._$container.css('left');
					this._$container.css('left', '0');
					this.hideNavigation(!reset);
					this._startSearch = true;
				}
			}
			else
			{
				// Show the navigation again
				if(this._startSearch)
				{
					this._$container.css('left', this._containerPos);
					this._containerPos = 0;
					this.showNavigation(!reset);
					this._startSearch = false;
				}
			}
			
			var arr = this._itemList.getData(),
				o,
				$o,
				iL = arr.length,
				matches = [],
				i = 0;
			for(; i < iL; i++)
			{
				o = arr[i];
				$o = $(o.getDOMNode());
				$o.stop();
				if(init)$o.hide();
				if(o.props.name.toLowerCase().indexOf(s.toLowerCase()) !== -1)
				{
					if(reset)$o.show();
					else $o.fadeIn(500);
					matches.push(o.props.name);
				}
				else
				{
					if(!init)$o.fadeOut(300);
				}
			}
			
			// Determine the visibility of the "no result" message
			var noResult = "noresult";
			noResult = this.refs[noResult];
			if(matches.length === 0)noResult.fadeIn(300);
			else noResult.fadeOut(300);
			
			if(reset)
			{
				this.refs[search].setState({value:""});
			}
		},
		
		hideNavigation:function(animate)
		{
			// Logic for hiding the next/prev buttons
			var prev = "btnPrev",
				next = "btnNext",
				pages = "pages";
			prev = $(this.refs[prev].getDOMNode());
			next = $(this.refs[next].getDOMNode());
			pages = $(this.refs[pages].getDOMNode());
			prev.stop();
			next.stop();
			pages.stop();
			if(animate)
			{
				prev.fadeOut(300);
				next.fadeOut(300);
				pages.fadeOut(300);	
			}
			else
			{
				prev.hide();
				next.hide();
				pages.hide();	
			}
		},
		
		showNavigation:function(animate)
		{
			// Logic for showing the next/prev buttons
			var prev = "btnPrev",
				next = "btnNext",
				pages = "pages";
			prev = $(this.refs[prev].getDOMNode());
			next = $(this.refs[next].getDOMNode());
			pages = $(this.refs[pages].getDOMNode());
			prev.stop();
			next.stop();
			pages.stop();
			if(animate)
			{
				pages.fadeIn(300);
				if(this._currentPage > 0)prev.fadeIn(300);
				if(this._currentPage < (this._pageList.getData().length - 1))next.fadeIn(300);
			}
			else
			{
				pages.show();
				if(this._currentPage > 0)prev.show();
				if(this._currentPage < (this._pageList.getData().length - 1))next.show();
			}
		},
		
		// ###########################
		// Public methods
		// ###########################
		
				
		// ###########################
		// Required react methods
		// ###########################
		
		/**
		 * Method called when the component is about to be updated 
		 */
		componentWillUpdate:function(nextProps, nextState)
		{
			// Check if the nextState array differs
			if(!be.marlon.utils.checkArrays(nextState.data, this.state.data, "props", "key"))
			{
				this.doSearch("", true);
			}
		},
		
		/**
		 * Method called after the HList got updated 
		 */
		componentDidUpdate:function(prevProps, prevState)
		{
			// Position all the elements
			var i = 0,
				arr = this._itemList.getData(),
				w = 0,
				iL = arr.length;
			
			var $this = $(this.getDOMNode());
			this._$container = $this.find('.cc-hlist-container');
			if(iL === 0)return;
			
			for(; i < iL; i++)
			{
				w += $(arr[i].getDOMNode()).outerWidth(true);
			}
			
			$this.find(".cc-" + (this.props.isList === false?'':'list-') + "page-container").width(w);
			// Navigate to the active step
			this.navigate(); 
			// Select the current item
			if(this._selected)
			{
				this._itemList.select(this._selected);
			}
			this._$container.height(this._$container.outerHeight());
			
			// Initialize the scroller if it exists
			if(this._scroller && (!prevState || (prevState.data.length !== this.state.data.length)))
			{
				if(this._pageList)
				{
					var $item = this._$container;
					this._scroller.init($($item.parent()), $item, {
						prev:this.prevClickHandler,
						next:this.nextClickHandler,
						reset:this.navigate
					});
				}
				else
				{
					this._scroller.disable();
				}
			}
		},
		
		/**
		 * Method called when the HList did mount 
		 */
		componentDidMount:function()
		{
			this.componentDidUpdate();
		},
		
		/**
		 * Method called when the component will mount
		 */
		componentWillMount:function()
		{
			this._itemList = new ui.List(typeof this._selected === "object");
			this._currentPage = 0;
			if(be.marlon.utils.hasTouch)this._scroller = new be.marlon.Scroller();
		},
		
		/**
		 * The react render function for this class 
		 */
		render:function()
		{
			var footer,
				instance = this,
				utils = be.marlon.utils,
				search = null;
			
			// Set the item list
			var items = this.state.data,
				itemsPerPage = this.state.itemsPerPage;
			this._itemList.setData(items);
			
			// Paging is done if there are more than 5 items
			if(items.length > itemsPerPage)
			{
				if(!this._pageList)this._pageList = new ui.List();
				this._totalPages = Math.ceil(items.length / itemsPerPage);
				// Calculate the number of pages and navigation between them
				var	pages = [],
					i = 0;
				for(; i < this._totalPages; i++)
				{
					pages.push(
						Page( {key:i, clickHandler:this.pageClickHandler})
					);
				}
				this._pageList.setData(pages);
				// Create the search
				if(utils.enableListSearch && this.state.hasSearch)
				{
					search = Search( {updateHandler:_.debounce(this.searchUpdateHandler, 200), ref:"search"});
				}
				// Set the footer
				footer = (
					React.DOM.footer( {className:"cc-panel-footer"}, 
						React.DOM.div( {className:"cc-paging"}, 
							React.DOM.div( {className:"cc-wrapper"}, 
								React.DOM.div( {className:"cc-pages", ref:"pages"}, 
									pages
								),
								search
							)
						),
						React.DOM.div( {className:"cc-page-nav"}, 
							React.DOM.a( {className:"cc-prev" + (utils.smSlave?' cc-sm-slave':''), ref:"btnPrev", onClick:this.prevClickHandler}, 
								React.DOM.i( {className:"icon-angle-left"})
							),
							React.DOM.a( {className:"cc-next" + (utils.smSlave?' cc-sm-slave':''), ref:"btnNext", onClick:this.nextClickHandler}, 
								React.DOM.i( {className:"icon-angle-right"})
							)
						)
					)
				);
			}
			else
			{
				this._pageList = null;
				this._currentPage = 0;
			}
			
			return(
				React.DOM.section( {className:this.state.sectionClassName}, 
					React.DOM.div( {className:this.state.divClassName?this.state.divClassName:""}, 
						React.DOM.div( {className:"cc-list-page-wrapper clearfix cc-hlist-container"}, 
							search?NoResult( {ref:"noresult"}):null,
							React.DOM.div( {className:"cc-" + (this.props.isList === false?'':'list-') + "page-container"}, 
								this.state.container?this.state.container:this.state.data
							)
						)
					),
					footer,
					this.state.bottom?this.state.bottom:null
				)
			);
		}
	};
	
	var NoResult = React.createClass(
		{displayName: 'NoResult',
			_visible:false,
			
			fadeIn:function(duration)
			{
				if(this._visible)return;
				this._visible = true;
				var $this = $(this.getDOMNode());
				$this.stop();
				$this.fadeIn(duration);
			},
			
			fadeOut:function(duration)
			{
				if(!this._visible)return;
				this._visible = false;
				var $this = $(this.getDOMNode());
				$this.stop();
				$this.fadeOut(duration);
			},
			
			/**
			 * Method called when the HList did mount 
			 */
			componentDidMount:function()
			{
				var $this = $(this.getDOMNode()),
					w1 = $this.find('.icon-car1').width(),
					w2 = $this.find('.cc-description').width();
				$this.find(".cc-wrapper").width(Math.max(w1, w2));
				$this.hide();
			},
			
			/**
			 * React render method 
			 */
			render:function()
			{
				return(
					React.DOM.div( {className:"no-results"}, 
						React.DOM.div( {className:"cc-wrapper"}, 
							React.DOM.i( {className:"icon-car1"}),
							React.DOM.div( {className:"cc-description"}, be.marlon.utils.Dictionary.getLabel('noMatchFound'))
						)
					)
				);
			}
		}
	);
	
	var Search = React.createClass(
		{displayName: 'Search',
			/**
			 * Method which handles clicking on the button 
			 */
			buttonClickHandler:function(e)
			{
				e.preventDefault();
				this.props.updateHandler("");
				this.setState({value:""});
			},
			
			/**
			 * Method which handles the searching 
			 */
			searchUpdateHandler:function(e)
			{
				this.props.updateHandler(e.target.value);
				this.setState({value:e.target.value});
			},
			
			/**
			 * Returns the initial state of the component 
			 */
			getInitialState: function() 
			{
				return {value:""};
			},
			
			/**
			 * React render method 
			 */
			render:function()
			{
				return(
					React.DOM.form( {className:"cc-search"}, 
	                    React.DOM.input( {type:"text", className:"cc-search-text", ref:"input", onChange:this.searchUpdateHandler, value:this.state.value}),
	                    React.DOM.button( {className:"cc-btn cc-btn-search", onClick:this.buttonClickHandler}, React.DOM.i( {className:(this.state.value.length > 0)?"icon-remove":"icon-search"}))
	                )
				);
			}
		}
	);
	
	var Page = React.createClass(
		{displayName: 'Page',
			// Define the mixins
			mixins:[be.marlon.utils.Mixins.Mount],
						
			/**
			 * Returns the default state of the grade 
			 */
			getInitialState:function()
			{
				return {selected:false};
			},
			
			/**
			 * React render method 
			 */
			render:function()
			{
				var index = this.props.key;
				return(
					React.DOM.a( {className:(this.state.selected)?'selected':'', 'data-index':index, onClick:this.state.selected?null:this.props.clickHandler})
				);
			}
		}
	);
}());