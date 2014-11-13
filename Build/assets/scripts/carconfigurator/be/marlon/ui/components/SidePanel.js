/** @jsx React.DOM */
(function() {
	/**
     * Contains logic for rendering the side panel
     */
	var ui = be.marlon.ui;
	ui.SidePanel = React.createClass(
		{displayName: 'SidePanel',
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var key = -1,
					instance = this,
					data = this.props.data,
					sph = data.map(
					function(item)
					{
						key ++;
						return SidePanelHeader( {collapsable:data.length > 1, key:key, title:item.title, content:item.content, collapsed:item.collapsed, heightUpdate:instance.props.heightUpdate});
					}
				);
				
				return (
					React.DOM.aside( {className:"cc-primary cc-col cc-col-3"}, 
					    this.props.preElements,
						React.DOM.form( {className:"cc-box", action:"", method:""}, 
							sph
						),
						this.props.postElements
					)
				);
			}
		}
	);
	
	var SidePanelHeader = React.createClass(
		{displayName: 'SidePanelHeader',
			/**
			 * Handles clicking on the panel header 
			 */
			toggleHandler:function(e)
			{
				this.setState({collapsed:!this.state.collapsed}, this.toggleStateComplete);
			},
			
			/**
			 * Handles the event when the state has been changed successfully 
			 */
			toggleStateComplete:function()
			{
				if(this.props.heightUpdate)this.props.heightUpdate();
			},
			
			/**
			 * Handles the event when the panel is about to be mounted 
			 */
			componentWillMount:function()
			{
				if(this.props.collapsed === true)
				{
					this.setState({collapsed:true});
				}
			},
			
			/**
			 * Method which returns the default state
			 */
			getInitialState: function() 
			{
				return {collapsed:false};
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var cont,
					cn = "cc-collapsable" + (this.state.collapsed?'':' cc-collapsable-open'),
					iconPlus = this.props.collapsable?React.DOM.i( {className:"cc-icon " + (this.state.collapsed?'icon-plus':'icon-minus')}):null;
				
				return(
					React.DOM.fieldset( {className:cn}, 
						React.DOM.header( {onClick:this.props.collapsable?this.toggleHandler:null}, 
							React.DOM.h3(null, 
								iconPlus,
								this.props.title
							)
						),
						React.DOM.div( {className:"cc-contents"}, 
							this.props.content
						)
					)
				);
			}
		}
	);
})();
