/** @jsx React.DOM */
/**
 * Toyota HTML5 Utility file which defines all the mixins used for the different react components
 */
(function() {
	// Define the mixins object
	be.marlon.utils.Mixins = {};
	var mix = be.marlon.utils.Mixins;
	
	// A mixin component which dispatches the componentDidMount and componentWillUnmount events
	mix.Mount = {
		/**
		 * When the component has mounted 
		 */
		componentDidMount:function()
		{
			if(this.props.componentDidMount)this.props.componentDidMount(this);
		},
		
		/**
		 * When the component unmounts 
		 */
		componentWillUnmount:function()
		{
			if(this.props.componentWillUnmount)this.props.componentWillUnmount(this);
		}
	};
	
	// A mixin component which keeps track of the height of the control
	mix.Height = {
		totalHeight:0,
		
		/**
		 * Method which forces the update height 
		 */
		updateHeight:function(h)
		{
			if(h)this.totalHeight = h;
			else this.componentDidMount();
			if(this.props.updateHeight)this.props.updateHeight();
		},
		
		/**
		 * Method called when the component did update 
		 */
		componentDidUpdate:function()
		{
			this.componentDidMount();
		},
		/**
		 * Method called when the component did mount 
		 */
		componentDidMount:function()
		{
			this.totalHeight = $(this.getDOMNode()).outerHeight();
		}
	};
	
	// The component used to render the Bodytypes and submodels
	mix.VisualItem = {
		mixins:[mix.Mount],
		/**
		 * Handles clicking on the bodytype 
		 */
		clickHandler:function(e)
		{
			this.props.clickHandler(e, this);
		},
		
		/**
		 * Returns the default state of the React component 
		 */
		getInitialState:function(e)
		{
			return {selected:false};
		},
		
		/**
		 * The react render function for this class 
		 */
		render:function()
		{
			// Map the specs to list items
			var instance = this,
				specs = this.props.specs?this.props.specs.map(
				function (item) 
				{
					return(
						React.DOM.li( {key:item.ID}, item.Name,": ", instance.getEcoData(item))
					);
		    	}
		    ):null;
		    
		    if(specs)
		    {
		    	specs = (
		    		React.DOM.ul( {className:"cc-specs"}, 
						specs
					)
				);
		    }
		    
		    // Create the price
		    var pricing,
		    	promoIndexes,
		    	delprice;
		    if(this.props.price !== "")
		    {
			    // Check the promotions
			    if(this.props.promotions.length > 0)
			    {
			    	promoIndexes = this.props.promotions.map(
			    		function(item)
			    		{
			    			return React.DOM.span( {key:item.Index, className:"cc-number"}, item.Index);
			    		}
			    	);
			    }
			    // Create the delprice
			    if(this.props.dprice !== "") delprice = React.DOM.del( {className:"cc-price"}, this.props.dprice);
		    	// Create the pricing container
		    	pricing = (
		    		React.DOM.div( {className:"cc-pricing" + (this.props.dprice !== ""?" cc-promo-price":"")}, 
						React.DOM.span( {className:"cc-price"}, 
							promoIndexes,
							" " + this.props.price + " "
						),
						delprice
					)
		    	);
		    } 
		    
			// Return the submodel object
			return (
				React.DOM.article( {className:"cc-col cc-col-6" + (this.props.hybrid?' cc-hybrid':''), onClick:this.clickHandler}, 
					React.DOM.div( {className:"cc-inner" + (this.state.selected?" cc-selected":"")}, 
						React.DOM.header(null, 
							React.DOM.h1(null, 
								React.DOM.span( {className:"cc-checkbox " + (this.state.selected?" cc-checked":"")}),
								React.DOM.span( {className:"cc-title"}, this.props.title)
							)
						),
						React.DOM.div( {className:"cc-thumb"}, 
							React.DOM.img( {alt:"", src:this.props.asset})
						),
						pricing,
						specs
					)
				)
			);
		}
	};
})();
