/** @jsx React.DOM */
(function() {
	
	/**
     * Contains logic for rendering a vertical passive list item
     */
	var ui = be.marlon.ui,
		bt = be.marlon.Brighttag,
		_utils = be.marlon.utils;
	/**
	 * The list item base where both the regular and advanced list items are based upon 
	 */
	ui.VListItemBase = 
	{	
		mixins:[_utils.Mixins.Mount],
		_open:false,
		_baseHeight:0,
		_contentLabel:null,
		_contentIcon:null,
		
		/**
		 * Method which handles the click event when the features should be opened and shown 
		 */
		renderContent:function(e)
		{
			if(e)e.stopPropagation();
			if(this.state.renderContent)
			{
				this.stateOpenCompleted();
				return;
			}
			this.setState({renderContent:true}, this.contentRenderComplete);

			// Track click on show features link
            bt.track({
                componentname: 'carconfig',
                action: 'cc_action',
                value: 'show-pack-features'
            });
		},
		
		/**
		 * Method called when the state has been updated 
		 */
		contentRenderComplete:function()
		{
			if(this.state.contentMounted)this.state.contentMounted();
			else this.stateOpenCompleted();
		},
		
		/**
		 * Method which closes this component 
		 */
		closeContent:function()
		{
			if(!this._open)return;
			this._open = false;
			var $mask = $(this.getDOMNode()).find('.cc-vmask');
			$mask.animate({height:0}, {duration:400, queue:false, complete:this.animateOutComplete});
		},
		
		/**
		 * Method which opens this component 
		 */
		openContent:function(dispatchEvent)
		{
			var $mask = $(this.getDOMNode()).find('.cc-vmask');
			// Set the top first so the container implementing this VList can update the height correctly
			$mask.css('height','100%');
			$mask.show();
			var h = $mask.outerHeight();
			// Update the height of the parent container
			if(dispatchEvent)this.props.heightUpdateHandler(this, h + this._baseHeight);
			// Animate in the container
			$mask.height(0);
			$mask.animate({height:h}, {duration:400, queue:false});
			this._open = true;
			if(this.state.closeText !== "")
			{
				this._contentLabel.html(this.state.closeText);
				this._contentIcon.addClass('icon-chevron-up');
				this._contentIcon.removeClass('icon-chevron-down');
			}
		},
		
		/**
		 * Method called when the state has been completed updating 
		 */
		stateOpenCompleted:function()
		{
			var $mask = $(this.getDOMNode()).find('.cc-vmask');
			$mask.stop();
			// Set the position of the container
			if(!this._open)
			{
				this.openContent(true);
			}
			else if(this.state.closeable)
			{
				this.closeContent();
				this.props.heightUpdateHandler(this, this._baseHeight);
				this._contentLabel.html(this.state.openText);
				this._contentIcon.removeClass('icon-chevron-up');
				this._contentIcon.addClass('icon-chevron-down');
			}
		},
		
		/**
		 * Method which updates the height of the list item 
		 */
		heightUpdateHandler:function()
		{
			var $mask = $(this.getDOMNode()).find('.cc-vmask');
			$mask.stop();
			// Adjust the height of the list to
			var preH = $mask.outerHeight();
			$mask.css('height', '100%');
			var goH = $mask.outerHeight();
			
			// Call the parent height updated event
			this.props.heightUpdateHandler(this, goH + this._baseHeight);
			
			// Animate to that height
			$mask.height(preH);
			$mask.animate({height:goH}, {duration:400, queue:false});
		},
		
		/**
		 * Method which is called when the list has been animated out completely 
		 */
		animateOutComplete:function()
		{
			$(this.getDOMNode()).find('.cc-vmask').hide();
		},
		
		/**
		 * Handles clicking on the list item 
		 */
		clickHandler:function(e)
		{
			e.stopPropagation();
			this.props.clickHandler(this);
		},
		
		/**
		 * Method which initializes the state of the content label and icon 
		 */
		initContentState:function()
		{
			var $this = $(this.getDOMNode());
			this._contentLabel = $this.find('.cc-ctlabel');
			this._contentIcon = $this.find('.cc-cticon');
			if(this._open && this.state.closeText !== "")
			{
				this._contentLabel.html(this.state.closeText);
				this._contentIcon.addClass('icon-chevron-up');
				this._contentIcon.removeClass('icon-chevron-down');
			}
			else
			{
				this._contentLabel.html(this.state.openText);
				this._contentIcon.removeClass('icon-chevron-up');
				this._contentIcon.addClass('icon-chevron-down');
			}
		},
		
		/**
		 * Returns the default state of the grade 
		 */
		getInitialState:function()
		{
			return {
				selectable:true, // Determines if the list item has a checkbox and can be selected or just acts as a container for content
				selected:false, 
				renderContent:false, 
				content:null, 
				closeable:true,
				openText:"", 
				closeText:"",
				contentMounted:null // Content mounted event callback
			};
		},
		
		/**
		 * Method which handles the mounting of a VListItemBase 
		 */
		componentDidMount:function()
		{
			var h,
				$this = $(this.getDOMNode());
			if(this.state.renderContent)
			{
				var $mask = $this.find('.cc-vmask');
				var resetHeight = $mask.outerHeight();
				$mask.height(0);
				h = $this.outerHeight();
				//console.log("Already rendered content, resetting height to: ", resetHeight);
				$mask.height(resetHeight);
			}
			else
			{
				h = $(this.getDOMNode()).outerHeight();
			}
			this.initContentState();
			this._baseHeight = h;
		},
		
		/**
		 * Method which handles the update of a VListItemBase 
		 */
		componentDidUpdate:function()
		{
			this.initContentState();
		},
		
		/**
		 * React render method 
		 */
		render:function()
		{
			var content = this.state.renderContent?this.state.content:null,
				dic = _utils.Dictionary,
				price = this.props.price,
				promotions = this.props.promotions,
				pricing = null,
				promoIndexes = null,
				delprice = null,
				enabled = this.state.content?this.props.enabled:false,
				base;
				
			// Create the price section
			if(price && price.ListPrice !== 0)
			{
				// Check the promotions
			    if(promotions.length > 0)
			    {
			    	promoIndexes = promotions.map(
			    		function(item)
			    		{
			    			return React.DOM.span( {key:item.Index, className:"cc-number"}, item.Index);
			    		}
			    	);
			    }
			    // Create the delprice
			    if(price.ListPriceWithDiscount !== price.ListPrice) delprice = React.DOM.del( {className:"cc-price"}, _utils.formatPrice(price.ListPrice, true));
		    	// Create the pricing container
		    	pricing = (
		    		React.DOM.div( {className:"cc-pricing" + (delprice?" cc-promo-price":"")}, 
						React.DOM.span( {className:"cc-price"}, 
							promoIndexes,
							" " + _utils.formatPrice(price.ListPriceWithDiscount, true) + " "
						),
						delprice
					)
		    	);
			}
			
			var clickHandler = enabled?this.clickHandler:null,
				TouchClicker = _utils.TouchClicker;
			// Determine the vizualisation of the list item
			if(this.state.selectable)
			{
				var downButton = null;
				if(this.state.content)
				{
					downButton = (
						React.DOM.a( {className:"cc-toggle cc-toggle-features", onClick:this.renderContent}, 
							React.DOM.i( {className:"cc-cticon icon-chevron-down"}),
							React.DOM.span( {className:"cc-ctlabel"})
						)
					);
				}
				base = (
					React.DOM.div( {className:"cc-row clearfix" + (enabled?"":" cc-disabled")}, 
					
						TouchClicker( {content:
								React.DOM.div( {className:"cc-title"}, 
									React.DOM.label( {className:"cc-checkbox-label"}, 
										React.DOM.span( {className:"cc-checkbox" + (this.state.selected?' cc-checked':'') + (enabled?'':' cc-disabled')}),
										this.props.name
									)
								),
							 
							clickHandler:clickHandler}),
						
						downButton,
						pricing
					)
				);
			}
			else
			{
				base = (
					React.DOM.div( {className:"cc-row clearfix" + (enabled?"":" cc-disabled")}, 
                        React.DOM.div( {className:"cc-title clearfix"}, 
                            React.DOM.a( {className:"cc-toggle cc-toggle-features clearfix", onClick:(enabled?this.renderContent:null)}, React.DOM.i( {className:"icon-chevron-down"}),this.props.name)
                        )
                    )
				);
			}
						
			return(
				React.DOM.li( {className:"cc-listitem clearfix"}, 
					base,
					content
				)
			);
		}
	};
		

})();
