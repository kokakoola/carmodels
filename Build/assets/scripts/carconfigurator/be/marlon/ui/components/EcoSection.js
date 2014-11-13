/** @jsx React.DOM */
(function() {
	/**
     * Contains logic for rendering the eco section
     */
	var ui = be.marlon.ui;
	ui.EcoSection = React.createClass(
		{displayName: 'EcoSection',
			/**
			 * Method which fetches the correct image from the this.props.images array 
			 */
			getImage:function(code)
			{
				if(!this.props.images)return "";
				var sProp;
				for(sProp in this.props.images)
				{
					if(sProp == code)
					{
						return this.props.images[sProp];
					}
				}
				return "";
			},
			
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
				var data = this.props.data,
					dic = be.marlon.utils.Dictionary,
					image = null,
					tContent = [],
					images = this.props.images,
					table = null;
					
				if(data && data.length > 0)
	    		{
	    			// Create the items
	    			var i = 0,
	    				iL = data.length,
	    				sValue;
					// Build image
					for(;i<iL;i++)
					{
						if(data[i].InternalCode=="ENERGY-EFFICIENCY-CLASS")
						{
							sValue=data[i].Value.toLowerCase().replace("+","Plus");
							//ele = _cont.append('img', {src:'/images/ecolabel_1x_' + sValue.replace("+","plus") + '.png', alt:"Pkw Label " + sValue});
							image = React.DOM.img( {src:this.getImage(sValue), alt:"Pkw Label " + sValue});
							break;
						}
					}
					// Build table
					i = 0;
					for(;i<iL;i++)
					{
						if(data[i].InternalCode!="ENERGY-EFFICIENCY-CLASS")
						{
							tContent.push(
								React.DOM.tr( {key:i}, 
									React.DOM.td(null, data[i].Name),
									React.DOM.td( {className:"right"}, data[i].Value)
								)
							);
						}
					}
					table = (
						React.DOM.table(null, 
							React.DOM.tbody(null, 
								tContent
							)
						)
					);
	    		}
	    		
				return(
					React.DOM.div( {className:"cc-eco-section"}, 
			            React.DOM.h2(null, dic.getLabel('ecoTitle')),
			            React.DOM.div( {className:"cc-summary"}, 
				            React.DOM.div(null, 
				            	dic.getLabel('ecoDescription')
				            ),
				            image,
				            table,
				            React.DOM.div( {dangerouslySetInnerHTML:{__html:dic.getLabel('ecoDisclaimer')}})
				        )
			        )
				);
			}
		}
	);
})();
