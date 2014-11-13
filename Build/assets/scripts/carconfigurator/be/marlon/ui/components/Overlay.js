/** @jsx React.DOM */
(function() {
	/**
     * Contains logic for rendering the overlays (conflict items, server error, configuration changed)
     */
	var ui = be.marlon.ui;
	// Create the overlay class
	ui.Overlay = React.createClass(
		{displayName: 'Overlay',
			_list:null,
			_selected:null,
			
			/**
			 * Method which handles selecting an item from the list
			 * @param data:Object the data associated with the clicked upon item
			 */
			itemSelectHandler:function(data)
			{
				this._list.select(data.ID);
				this._selected = data;
			},
			
			/**
			 * Method which handles clicking on the close button or overlay 
			 */
			closeClickHandler:function(e)
			{
				this.setState({visible:false});
			},
			
			/**
			 * Method whcih returns the default state
			 */
			getInitialState:function() 
			{
    			return {visible:false};
  			},
  			
  			/**
  			 * Method called when the component will be mounted 
  			 */
  			componentWillMount:function()
  			{
  				this._list = new ui.List(false);
  			},
  			
  			/**
  			 * Method called when the component is about to receive new props 
  			 */
  			componentWillReceiveProps:function()
  			{
  				this._selected = null;
  				this.setState({visible:true});
  				this._list.select(null);
  			},
  			
  			/**
			 * Method called when the component did update 
			 */
			componentDidUpdate:function()
			{
				var ref = "overlay";
				$(this.refs[ref].getDOMNode()).height($(document).height());
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var dic = be.marlon.utils.Dictionary,
					instance = this,
					close = null,
					footer = null,
					contents = null;
					
				// Create the close button if the panel is closeable
				if(this.props.closeable)
				{
					close = React.DOM.a( {className:"cc-icon-close icon-remove", onClick:this.closeClickHandler});
				}
				
				// Render the footer if both callbacks are present
				if(this.props.cancelHandler && this.props.acceptHandler)
				{
					footer = (
						React.DOM.footer( {className:"cc-actions clearfix"}, 
				            React.DOM.a( {className:"btn btn-grey cc-btn cc-btn-cancel", onClick:this.props.cancelHandler}, dic.getLabel("cancel")),
				            React.DOM.a( {className:"btn btn-red cc-btn cc-btn-confirm", onClick:this.props.acceptHandler}, dic.getLabel("ok"))
				        )
					);
				}
				
				// Determine what contents should be shown
				if(this.props.description)
				{
					contents = React.DOM.div( {dangerouslySetInnerHTML:{__html:this.props.description}});
				}
				// Render the include items
				else if(this.props.data)
				{
					var items = this.props.data[2][0];
					items = items.map(
						function(item)
						{
							return (
								listItem( {key:item.ID, data:item, clickHandler:instance.itemSelectHandler})
							);
						}
					);
					this._list.setData(items);
					
					contents = (
						React.DOM.ul(null, 
							items
						)
					);
				}
				else if(this.props.contents)
				{
					contents = this.props.contents;
				}
				
				return(
					React.DOM.div( {style:{display:(this.state.visible?'block':'none')}}, 
						React.DOM.div( {className:"cc-dialog"}, 
					        React.DOM.header( {className:"cc-contents"}, 
								this.props.title,
								close
					        ),
					        React.DOM.div( {className:"cc-contents"}, 
					            contents
					        ),
							footer
					    ),
					    React.DOM.div( {className:"cc-overlay", ref:"overlay", onClick:this.props.closeable?this.closeClickHandler:null})
					)
				);
			}
		}
	);
	
	var listItem = React.createClass(
		{displayName: 'listItem',
			mixins:[be.marlon.utils.Mixins.Mount],
			
			/**
			 * Method which handles clicking on the list item 
			 */
			clickHandler:function(e)
			{
				this.props.clickHandler(this.props.data);
			},
			
			/**
			 * Method whcih returns the default state
			 */
			getInitialState:function() 
			{
    			return {selected:false};
  			},
  			
			/**
			 * Method which renders the list item 
			 */
			render:function()
			{
				var data = this.props.data;
				
				return(
					React.DOM.li( {className:"cc-listitem clearfix", onClick:this.clickHandler}, 
						React.DOM.div( {className:"cc-row clearfix"}, 
							React.DOM.div( {className:"cc-title"}, 
	                            React.DOM.label( {className:"cc-checkbox-label"}, React.DOM.span( {className:"cc-checkbox" + (this.state.selected?" cc-checked":"")}),data.Name)
	                        )
						)
					)
				);
			}
		}
	);
})();
