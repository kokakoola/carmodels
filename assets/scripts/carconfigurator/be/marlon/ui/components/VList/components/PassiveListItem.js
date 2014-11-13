/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a vertical passive list item
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	/**
	 * This creates the regular list item, used for the majority of the packs 
	 */
	ui.PassiveListItem = React.createClass(
		{displayName: 'PassiveListItem',
			// Define the mixins
			mixins:[ui.VListItemBase],
			
			/**
			 * Method which sets the state on the BasListItem mixin 
			 */
			updateProps:function(props)
			{
				var equipment = props.equipment,
					dic = _utils.Dictionary,
					
					instance = this,
					HList = ui.HList,
					list = null;
					
				// Map the equipment to the objects used to populate the HList
				equipment = equipment.map(
					function(item)
					{
						return {
							asset:be.marlon.utils.getCARDBAsset(item.Assets),
							name:item.Name,
							description:item.Description,
							//description:"Lorem ipsum dolor sit amed",
							price:item.PriceInfo,
							promotions:item.Promotions,
							ID:item.ID
						};
					}
				);
				if(equipment.length > 0)
				{
					list = (
						React.DOM.div( {className:"cc-vmask"}, 
							HList( {webtrendtag:"view-feature-details", infoTitle:props.infoTitle, items:equipment, inline:true, clickable:false, heightUpdateHandler:this.heightUpdateHandler})
						)
					);
				}
				
				this.setState({
					openText:dic.getLabel('packFeatures').replace("{#}", equipment.length),
					closeText:dic.getLabel('packHide'),
					content:list
				}); 
			},
			
			/**
			 * Method called before the render occurs 
			 */
			componentWillMount:function()
			{
				this.updateProps(this.props);
			},
			
			/**
			 * Method called when the component is about to receive new props 
			 */
			componentWillReceiveProps:function(nextProps, nextState)
			{
				this.updateProps(nextProps);
			}
		}
	);
})();
