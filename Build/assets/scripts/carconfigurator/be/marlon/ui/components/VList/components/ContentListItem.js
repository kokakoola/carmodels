/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a vertical content list item
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	/**
	 * This creates the content list item, used in the Aygo wheel selection 
	 */
	ui.ContentListItem = React.createClass(
		{displayName: 'ContentListItem',
			// Define the mixins
			mixins:[ui.VListItemBase],
			_hList:null,

			/**
			 * Method which handles the mounting of the hList 
			 */
			listMountHandler:function(item)
			{
				this._hList = item;
				this._hList.select(this.props.selected);
			},
			
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
				if(equipment.length > 0)
				{
					list = (
						React.DOM.div( {className:"cc-vmask"}, 
							HList( 
								{componentDidMount:this.listMountHandler, 
								infoTitle:props.infoTitle, 
								items:equipment, 
								inline:true, 
								clickable:true, 
								clickHandler:this.props.contentItemSelectHandler, 
								heightUpdateHandler:this.heightUpdateHandler,
								className:this.props.contentClassName})
						)
					);
				}
				
				this.setState({
					selectable:false,
					content:list,
					closeable:false
				}); 
			},
			
			/**
			 * Method called after the VList got updated 
			 */
			componentDidUpdate:function()
			{
				// Select the items
				if(this._hList)this._hList.select(this.props.selected);
			},
			
			/**
			 * Method called before the render occurs 
			 */
			componentWillMount:function()
			{	
				// Set the open flag
				this._open = this.props.open?true:false;
				this.setState({renderContent:this.props.open?true:false});
				
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
