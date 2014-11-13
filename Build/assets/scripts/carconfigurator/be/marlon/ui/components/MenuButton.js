/** @jsx React.DOM */
(function() {
	/**
     * Contains logic for rendering the change model button
     */
	var ui = be.marlon.ui;
	// Create the ChangeModel button class
	ui.MenuButton = React.createClass(
		{displayName: 'MenuButton',
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
    			return {showChangeModelBox:false};
  			},
  			
  			/**
		 	* Default the props 
			 */
			getDefaultProps:function()
			{
				return {
					icon:null
				};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				return(
					React.DOM.div( {className:"cc-action clearfix" + (this.props.hidden?' cc-sm-slave':'')}, 
						React.DOM.a( {className:"current-parent btn btn-small cc-btn cc-btn-popup " + this.props.style, onClick:this.buttonClickHandler}, 
							this.props.label,
							this.props.icon
						),
						React.DOM.section( {className:"cc-popup clearfix", style:{display:(this.state.showChangeModelBox?'block':'none')}}, 
	                        React.DOM.div( {className:"cc-contents clearfix"}, 
	                        	React.DOM.ul(null, 
	                            	this.props.elements
	                            ),
	                            React.DOM.a( {className:"cc-icon-close icon-remove", title:"Close", onClick:this.buttonClickHandler})
	                        )
	                    )
					)
				);
			}
		}
	);
})();
