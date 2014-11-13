/** @jsx React.DOM */
(function() {
	/**
     * Contains logic for rendering the change model button
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	// Create the ChangeModel button class
	ui.ChangeModelButton = React.createClass(
		{
			displayName: 'ChangeModelButton',
			/**
			 * Method which handles clicking on the mytoyota button 
			 */
			myToyotaClickHandler:function(e)
			{
				be.marlon.Brighttag.track({
					action: 'cc_action',
					value: 'change-car-my-toyota'
				});
				e.preventDefault();
				PubSub.publish(_utils.GOTO_MY_TOYOTA);
			},
			
			/**
			 * Method which handles clicking on the restart button 
			 */
			restartClickHandler:function(e)
			{
				be.marlon.Brighttag.track({
					action: 'cc_action',
					value: 'change-car-restart-configuration'
				});
				e.preventDefault();
				this.props.navigate(_utils.FILTERSTEP);
			},
			
			/**
			 * Method which handles clicking on the change submodel button 
			 */
			changeSubModelClickHandler:function(e)
			{
				e.preventDefault();
				this.props.navigate(_utils.SUBMODELS);
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var MenuButton = ui.MenuButton,
					dic = _utils.Dictionary,
					elements = [
						React.DOM.li( {className:"current-parent cc-border-bot", key:'restartConfiguration'}, 
	                       	React.DOM.a( {className:"current-parent", onClick:this.restartClickHandler}, dic.getLabel('restartConfiguration'))
	                    ),
                        React.DOM.li( {key:'myToyota'}, 
                        	React.DOM.a( {onClick:this.myToyotaClickHandler}, dic.getLabel('myToyota'))
                        )
					];
				
				// If there are submodels available, render the button
				if(this.props.hasSubmodels)
				{
					elements.unshift(
						React.DOM.li( {key:'changeSubModel', className:"cc-border-bot"}, 
                        	React.DOM.a( {onClick:this.changeSubModelClickHandler}, dic.getLabel('changeSubModel'))
                        )
					);
				}
				
				return(
					MenuButton( {style:"btn-grey cc-btn-change", hidden:be.marlon.utils.smSlave || be.marlon.utils.smMaster, label:dic.getLabel('changeModel'), elements:elements, icon:React.DOM.i( {className:"cc-icon icon-repeat"})})
				);
			}
		}
	);
})();
