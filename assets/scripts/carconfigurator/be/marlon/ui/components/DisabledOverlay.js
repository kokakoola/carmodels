/** @jsx React.DOM */
(function() {
	/**
     * Contains logic for rendering the disabled overlay
     */
	var ui = be.marlon.ui,
		_utils = be.marlon.utils;
	// Create the overlay class
	ui.DisabledOverlay = React.createClass(
		{displayName: 'DisabledOverlay',
			_timeOut:null,
			/**
			 * Shows the overlay 
			 */
			show:function()
			{
				var instance = this;
				this.setState({visible:true}, 
					function()
					{
						clearTimeout(instance._timeOut);
						instance._timeOut = setTimeout(instance.showLoader, 2000);
					}
				);
			},
			
			/**
			 * Method which shows the loader 
			 */
			showLoader:function()
			{
				this.setState({showLoader:true}); 
			},
			
			/**
			 * Hides the overlay 
			 */
			hide:function()
			{
				clearTimeout(this._timeOut);
				this.setState({visible:false, showLoader:false});
			},
						
			/**
			 * Method which returns the initial state of the spin 
			 */
			getInitialState:function()
			{
				return {
					visible:true,
					showLoader:false
				};
			},
			
			/**
			 * Method which handles the update event 
			 */
			componentDidUpdate:function()
			{
				var descr = "description",
					content = "content";
				content = this.refs[content];
				descr = this.refs[descr];
				if(descr)
				{
					var $descr = $(descr.getDOMNode());
					$descr.css("marginTop",
						Math.round($(content.getDOMNode()).height() * 0.5 - $descr.height() * 0.5) - 2
					);
				}
			},
			
			/**
			 * The react render function for this class 
			 */
			render:function()
			{
				var w = "0px",
					h = "0px",
					$doc,
					loader = null,
					PreLoader = ui.PreLoader,
					style = {
						display:(this.state.visible?"block":"none")
					};
				
				if(this.state.visible)
				{
					$doc = $(document);
					w = $doc.width();
					h = $doc.height();
					style.width = w + "px";
					style.height = h + "px";
					
					if(this.state.showLoader)
					{
						// Save top value
						var $window = $(window),
							st = $window.scrollTop(),
							left = Math.round(w * 0.5 - 250),
							top = Math.round($window.height() * 0.5 - 70 + st),
							boxStyle = {
								left:left,
								top:top
							};
							
						loader = (
							React.DOM.div( {className:"cc-content", ref:"content", style:boxStyle}, 
								PreLoader( {size:_utils.LARGE, visible:true}),
								React.DOM.div( {className:"cc-description", ref:"description"}, _utils.Dictionary.getLabel('disabledLoaderLabel'))
							)
						);
					}
				}
				
				return(
					React.DOM.div( {className:"cc-disabled-overlay"}, 
						loader,
						React.DOM.div( {className:"cc-overlay", style:style})
					)
				);
			}
		}
	);
})();
