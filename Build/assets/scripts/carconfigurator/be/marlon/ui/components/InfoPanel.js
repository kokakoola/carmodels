/** @jsx React.DOM */
(function() {
	/**
     * Navigation component, renders the navigation
     */
	var ui = be.marlon.ui;
	/**
	 * The infopanel instance 
	 */
	ui.InfoPanel = React.createClass(
		{displayName: 'InfoPanel',
			mixins:[be.marlon.utils.Mixins.Mount],
			_infoItems:[],
			_scroller:be.marlon.utils.hasTouch?new be.marlon.Scroller():null,
			_container:null,
			
			/**
			 * Method which takes care of the positioning of the items 
			 */
			positionItems:function()
			{
				var i = 0,
					iL = this._infoItems.length,
					item,
					w = $(this.getDOMNode()).width();
				for(; i < iL; i++)
				{
					item = this._infoItems[i];
					$(item.getDOMNode()).css('left', i * w);
				}
			},
			
			/**
			 * Method which navigates the items
			 * @param step:Number 
			 * @param animate:Boolean
			 */
			navigate:function(step, animate)
			{
				if(this._infoItems.length === 0)return;
				
				var	$item = $(this._infoItems[step].getDOMNode()),
					$cont = $(this._container.getDOMNode());
				
				if(animate)
				{
					$cont.animate({left:-Number($item.css('left').replace('px', ''))}, {duration:250, queue:false});
				}
				else
				{
					$cont.css('left', "-" + $item.css('left'));
				}
				var h = $item.outerHeight();
				$cont.parent().css('height', h);
				// Call the callback method
				this.props.heightUpdated(h);
			},			
			
			/**
			 * Handles clicking on the previous button 
			 */
			prevClickHandler:function(e)
			{
				if(e)e.stopPropagation();
				if(this.state.step > 0)
				{
					this.setState({step:this.state.step - 1}, this.stateUpdated);
				}
				else
				{
					this.stateUpdated();
				}
			},
			
			/**
			 * Handles clicking on the next button 
			 */
			nextClickHandler:function(e)
			{
				if(e)e.stopPropagation();
				if(this.state.step < this._infoItems.length - 1)
				{
					this.setState({step:this.state.step + 1}, this.stateUpdated);
				}
				else
				{
					this.stateUpdated();
				}
			},
			
			/**
			 * Handles clicking on a paging element 
			 */
			pageClickHandler:function(e)
			{	
				this.setState({step:$(e.target).data('id')}, this.stateUpdated);
			},
			
			/**
			 * Method called when the navigation actioned state update has been done 
			 */
			stateUpdated:function()
			{
				// Show the first item available
				this.navigate(this.state.step, true);
			},
			
			/**
			 * Handles clicking on the close button 
			 */
			closeClickHandler:function(e)
			{
				e.stopPropagation();
				// Notify the parent
				this.props.closeHandler(e);
			},
			
			/**
			 * Handles the event when the info item is mounted 
			 */
			infoItemMountHandler:function(item)
			{
				this._infoItems.push(item);
			},
			
			/**
			 * Handles when the info item is unmounting 
			 */
			infoItemUnmountHandler:function(item)
			{
				var i = 0,
    			iL = this._infoItems.length;
	    		for(; i < iL; i++)
	    		{
	    			if(this._infoItems[i] == item)
	    			{
	    				this._infoItems.splice(i,1);
	    				break;
	    			}
	    		}
			},
			
			/**
			 * Handles mounting of the container 
			 */
			containerMountHandler:function(item)
			{
				// Reference the container
				this._container = item;
				// Initialize the scroller if it exists
				if(this._scroller)
				{
					var $item = $(item.getDOMNode());
					this._scroller.init($($item.parent()), $item, {
						prev:this.prevClickHandler,
						next:this.nextClickHandler,
						reset:this.stateUpdated
					});
				}
			},
			
			/**
			 * Method which is called after the component has rendered 
			 */
			componentDidUpdate:function(prevProps, prevState, rootNode)
			{
				if(!be.marlon.utils.checkArrays(prevState.data, this.state.data))
				{
					// Position all the info elements
					this.positionItems();
					// Show the first item available
					this.navigate(this.state.step);
				}
			},
			
			/**
			 * Returns the default state of the info panel 
			 */
			getInitialState:function(e)
			{
				return {hidden:true, step:0, data:[]};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var dic = be.marlon.utils.Dictionary,
					style = {
						display:this.state.hidden?'none':'block'
					},
					data = this.state.data,
					instance = this,
					footer;	
				
				var items = data.map(
					function(item)
					{
						return InfoPanelItem(
							{
								key:item.ID,
								title:instance.state.title,
								asset:be.marlon.utils.getCARDBAsset(item.Assets),
								name:item.Name,
								description:item.Description,
								componentDidMount:instance.infoItemMountHandler,
								componentWillUnmount:instance.infoItemUnmountHandler
							}
						);
					}
				);
				
				if(data.length > 1)
				{
					// Create the amount of pages available
					var pages = [],
						i = 0,
						iL = data.length;
					for(; i < iL; i++)
					{
						pages.push(React.DOM.a( {key:i, 'data-id':i, onClick:this.pageClickHandler, className:(i === this.state.step)?'selected':''}));
					}
					// Creat the footer component
					footer = (
						React.DOM.footer( {className:"cc-panel-footer"}, 
				            React.DOM.div( {className:"cc-paging"}, 
				                React.DOM.div( {className:"cc-pages"}, 
									pages
				                ),
				
				                React.DOM.div( {className:"cc-page-nav"}, 
				                    React.DOM.a( {className:"cc-prev", onClick:this.prevClickHandler, style:{display:this.state.step > 0?"block":"none"}}, React.DOM.i( {className:"icon-angle-left"})),
				                    React.DOM.a( {className:"cc-next", onClick:this.nextClickHandler, style:{display:this.state.step < (data.length - 1)?"block":"none"}}, React.DOM.i( {className:"icon-angle-right"}))
				                )
				            )
				        )
					);
				}
				
				// Reference the container
				var cont = Container(
					{
						items:items,
						componentDidMount:instance.containerMountHandler
					}
				);
				
				return (
					React.DOM.section( {className:"cc-abs-item cc-box-features", style:style}, 
						React.DOM.div( {className:"cc-contents"}, 
							React.DOM.a( {className:"cc-icon-close", onClick:this.closeClickHandler}, "x"),
							React.DOM.div( {className:"cc-infoitem-container"}, 
								cont
							),
							footer
						)
					)
				);
			}
		}
	);
	
	/**
	 * Create the container class 
	 */
	var Container = React.createClass(
		{displayName: 'Container',
			mixins:[be.marlon.utils.Mixins.Mount],
			render:function()
			{
				return (
					React.DOM.div( {className:"cc-abs-item"}, 
						this.props.items
					)
				);
			}
		}
	);
	
	/**
	 * Create the info panel item 
	 */
	var InfoPanelItem = React.createClass(
		{displayName: 'InfoPanelItem',
			mixins:[be.marlon.utils.Mixins.Mount],
			render:function()
			{
				return (
					React.DOM.article( {className:"cc-feature cc-cols clearfix cc-abs-item"}, 
						React.DOM.div( {className:"cc-col cc-col-5 cc-img-container"}, 
							React.DOM.img( {src:this.props.asset.replace("{SIZE}", "195")})
						),
						React.DOM.div( {className:"cc-col cc-col-7"}, 
							React.DOM.span( {className:"cc-title"}, this.props.title),
							React.DOM.h1(null, this.props.name),
							React.DOM.div( {dangerouslySetInnerHTML:{__html:this.props.description}})
						)
					)
				);
			}
		}
	);
})();
