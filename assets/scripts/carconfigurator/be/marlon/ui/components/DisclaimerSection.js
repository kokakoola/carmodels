/** @jsx React.DOM */
(function() {
	/**
     * Contains logic for rendering the disclaimer section
     */
	var ui = be.marlon.ui;
	// Create the ChangeModel button class
	ui.DisclaimerSection = React.createClass(
		{displayName: 'DisclaimerSection',
			/**
			 * Function which returns the default properties 
			 */
			getDefaultProps:function()
			{
				return {
					className:""
				};
			},
			
			/**
			 * Method which checks if the disclaimer should update or not 
			 */
			shouldComponentUpdate:function(nextProps, nextState)
			{
				var update = true;
				if(be.marlon.utils.checkArrays(nextProps.data, this.props.data))
				{
					update = false;
				}
				return update;
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var dic = be.marlon.utils.Dictionary,
					// Create an array of promotion elements
					disclaimers = this.props.data.map(
						function(item)
						{
							return Disclaimer( {key:item.id, data:item});
						}
					);
				
				return(
					React.DOM.div( {className:"cc-disclaimers " + (this.props.className)}, 
			            React.DOM.h2(null, dic.getLabel('disclaimers')),
			            disclaimers
			        )
				);
			}
		}
	);
	
	var Disclaimer = React.createClass(
		{displayName: 'Disclaimer',	
			/**
			 * The react render function 
			 */
			render:function()
			{
				var data = this.props.data,
					timeSpan = null,
					index = null;
					
				if(data.from && data.until)
				{
					timeSpan = React.DOM.p(null, data.from + " - " + data.until);
				}
				if(data.index)
				{
					index = React.DOM.span( {className:"cc-number cc-icon"}, data.index);
				}
				return(
					React.DOM.div( {className:"cc-disclaimer", id:data.id}, 
		                React.DOM.div( {className:"cc-summary"}, 
		                    React.DOM.h3(null, index,data.name),
		                    timeSpan,
		                    React.DOM.div( {dangerouslySetInnerHTML:{__html:data.description}})
		                )
		            )
		        );
			}
		}
	);
})();
