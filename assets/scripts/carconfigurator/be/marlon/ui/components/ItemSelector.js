/** @jsx React.DOM */
(function() {
	/**
     * Contains logic for rendering the change combobox buttons
     */
	var ui = be.marlon.ui;
	/* Renders a column header cell with closeable dropdownlist */
	ui.ItemSelector = React.createClass(
		{displayName: 'ItemSelector',   
			mixins:[be.marlon.utils.Mixins.Mount],
		    /**
			 * Method which handles clickingon the document somewhere 
			 */
			docClickHandler:function(e)
			{
				this.buttonClickHandler(null);
			},
			
			/**
			 * Method which handles clicking on the change model button 
			 */
			buttonClickHandler:function(e)
			{
				if(e)e.preventDefault();
				if(!this.state.showChangeModelBox)
				{
					$(document).on('click', this.docClickHandler);
				}
				else
				{
					$(document).off('click', this.docClickHandler);
				}
				this.setState({showChangeModelBox:!this.state.showChangeModelBox});
			},
			
			/**
			 * Method whcih returns the default state
			 */
			getInitialState: function() 
			{
				return {showChangeModelBox:false, selected:null};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var instance = this,
					selected = "",
					elements = this.props.items.map(
					function(item)
					{
						if(item.id === instance.state.selected)selected = item.label;
						return React.DOM.li( {key:item.id}, React.DOM.a( {onClick:function(){instance.props.itemSelectHandler(item);}}, item.label));
					}
				);
				return(
					React.DOM.div( {className:"cc-action"}, 
						React.DOM.a( {className:"cc-btn-dropdown", onClick:this.buttonClickHandler}, selected?selected:"",React.DOM.i( {className:"cc-icon cc-icon-dropdown"})),
						React.DOM.section( {className:"cc-dropdown clearfix", style:{display:(this.state.showChangeModelBox?'block':'none')}}, 
	                        React.DOM.div( {className:"cc-contents clearfix"}, 
	                        	React.DOM.ul(null, 
	                            	elements
	                            ),
	                            React.DOM.a( {className:"cc-icon-close", title:"Close", onClick:this.buttonClickHandler}, "x")
	                        )
	                    )
					)
				);
			}
		});
})();
