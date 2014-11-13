/** @jsx React.DOM */
(function() {

    /**
     * Renders the promoscreen
     */
    var ui = be.marlon.ui;
    
    var _utils,
        _dictionary;
    
    // Create the filtertool container
    function PromoScreen()
    {
        this.mixins = [be.marlon.utils.Mixins.Height, be.marlon.utils.Mixins.Mount];
        
        var _instance,
            _initialized = false;
            
        /**
         * Method which handles the updating of the height from within a promo article 
         */
        function updateHeight()
        {
        	_instance.updateHeight();
        }
        
        /**
         * Method called when the component is about to be mounted 
         */
        this.componentWillMount = function() {
            // Utils
            if(!_instance) _instance = this;
            if(!_utils) _utils = be.marlon.utils;
            if(!_dictionary) _dictionary = _utils.Dictionary;
        };
        
        this.render = function()
        {
           	// Return element
            return (
                React.DOM.section( {className:"cc-panel cc-panel-promotions cc-abs-item"}, 
                    React.DOM.div( {className:"container cc-container"}, 
                        React.DOM.h1(null, _dictionary.getLabel("promoTitle")),
                        PromoList(
							{promoData:this.props.promoData,
							updateHeight:updateHeight,
							promoCallback:this.props.promoCallback})
                    )
                )
            );
        };
    }
    
    // Create the list which will contain all promotions
    var PromoList = React.createClass(
    	{displayName: 'PromoList',
    		mixins:[ui.HListBase],
    		
    		/**
			 * Method which renders the parent state 
			 */
			renderParentState:function(props)
			{
				var items = props.promoData.map(
	            	function(item)
	            	{
	            		return PromoArticle( {key:item.Index, data:item, callback:props.promoCallback, heightUpdated:props.updateHeight});
	            	}
	            );
				
				this.setState(
					{
						sectionClassName:"cc-has-paging cc-promotions clearfix",
						divClassName:"cc-page-wrapper",
						width:730,
						data:items,
						itemsPerPage:1
					}
				);
			},
    		
    		/**
			 * Method called when the component is about to be mounted 
			 */
			componentWillMount:function()
			{
				this.renderParentState(this.props);
			},
			
			/**
			 * Method which handles the inbound receiving of new properties 
			 */
			componentWillReceiveProps:function(nextProps, nextState)
			{
				this.renderParentState(nextProps);
			}
    	}
    );
    
    // Instantiate the filtertool class
    ui.PromoScreen = React.createClass(
        new PromoScreen()
    );
    
    var PromoArticle = React.createClass({displayName: 'PromoArticle',
        mixins:[be.marlon.utils.Mixins.Mount],
        
        handleDisclaimerClick: function(e) {
            this.setState({showDisclaimer: !this.state.showDisclaimer}, this.stateUpdateComplete);
        },
        
        stateUpdateComplete:function()
        {
        	this.props.heightUpdated();
        },
        
        getInitialState: function() {
            return ({ showDisclaimer: false });
        },
        componentWillUpdate: function(nextProps, nextState)
        {
            if (nextProps.data.ID != this.props.data.ID) {
                nextState.showDisclaimer = false;
            }
        },
        handleConfigureThisPromo: function()
        {
            if (this.props.callback)
                this.props.callback(this.props.data);
        },
        render: function() {
            // This references
            var handleDisclaimerClick = this.handleDisclaimerClick,
                handleConfigureThisPromo = this.handleConfigureThisPromo;
            // Build description and item-list (insert icons into html-string)
            var desc = this.props.data.Description;
            desc = desc.replace(/<li>/g,"<li><div class='cc-checkbox cc-checkbox-small cc-checked'></div>");
            if (desc.indexOf("<p>") == -1) {
                desc = "<p>" + desc;
                desc = desc.replace(/<ul>/, "</p><ul>");
            }
            // Disclaimer-string
            var disclaimer = $.grep(this.props.data.Labels, function(lab){ return lab.Code == "DISCLAIMER"; });
            disclaimer = (disclaimer && disclaimer[0]) ? disclaimer[0].Value : "";
            // Date-string
            var datestring = _dictionary.getLabel("promoDate");
            var from = this.props.data.From;
            var to = this.props.data.Until;
            //datestring = datestring.replace("{from}", ((from.getDate()<10?"0":"") + from.getDate() + "/" + (from.getMonth() + 1) + "/" + from.getFullYear()));
            //datestring = datestring.replace("{to}", (to.getDate()<10?"0":"") + to.getDate() + "/" + (to.getMonth() + 1) + "/" + to.getFullYear());
            datestring = datestring.replace("{from}", from);
            datestring = datestring.replace("{to}", to);
            // Price-string
            var priceString = $.grep(this.props.data.Labels, function(lab){ return lab.Code == "HEADLINE"; });
            priceString = (priceString && priceString[0]) ? priceString[0].Value : "";
            // Check the promotion type
            switch(this.props.data.PromotionType)
            {
            	//_dictionary.getLabel("promoPrice")
            	case "PercentageDiscount":
            		priceString = priceString.replace("{price}", (this.props.data.Value * 100) + "%");
            	break;
            	case "FixedPriceDiscount":
            		priceString = priceString.replace("{price}", _utils.formatPrice(this.props.data.Value, true));
            	break;
            	default:
            		priceString = priceString.replace("{price}", "");
            	break;
            }
            // Image-url TODO <- fix these when data is available
            var hasImage = false;
            var imageUrl = "http://placehold.it/214x95";
            // Return element
            return (
                React.DOM.article( {className:"cc-page"}, 
                    React.DOM.header( {className:"clearfix"}, 
                        React.DOM.h2(null, 
                        	React.DOM.span( {key:this.props.data.Index, className:"cc-number"}, this.props.data.Index),
                            this.props.data.Name
                        ),
                        React.DOM.h3( {onClick:handleConfigureThisPromo}, 
                            _dictionary.getLabel("configureThisPromotion"),
                            React.DOM.i( {className:"cc-icon icon-chevron-right"})
                        )
                    ),
                    React.DOM.div( {className:"cc-cols"}, 
                        React.DOM.div( {className:"cc-col cc-col-8"}, 
                            React.DOM.h4(null, priceString),
                            React.DOM.div( {dangerouslySetInnerHTML:{__html: desc}} ),
                            React.DOM.div( {className:"cc-action"}, 
                                React.DOM.a( {onClick:handleDisclaimerClick, className:"cc-btn-popup"}, 
                                    datestring
                                ),
                                React.DOM.section( {className:"cc-popup clearfix", style:{display:this.state.showDisclaimer ? "block":"none"}}, 
                                    React.DOM.div( {className:"cc-contents clearfix"}, 
                                        React.DOM.div( {dangerouslySetInnerHTML:{__html: disclaimer}} ),
                                        React.DOM.a( {className:"cc-icon-close", title:"Close", onClick:handleDisclaimerClick}, "x")
                                    )
                                )
                            )
                        ),
                        hasImage ?
                        React.DOM.div( {className:"cc-col cc-col-4"}, 
                            React.DOM.img( {src:imageUrl, width:"214", height:"95", alt:"Placeholder image"} )
                        )
                        : null 
                    )
                )
            );
        }
    });
    
}());