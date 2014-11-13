/** @jsx React.DOM */
(function() {
    
    var _colIDs = [null,null,null];
    
    var _highlight = false;
    
    var _openColID = null;
    
    var _utils = null,
        _dictionary = null,
        _settings = null;
    
    function shouldHighlight(data) {
        // If only one column is present, always false
        if (_colIDs[1] === null && _colIDs[2] === null) {
            return false;
        }
        // Highlight is toggle off, just return false
        if (!_highlight) {
            return false;
        }
        // Look for differences in availability (only for shown cols!)
        var v = null,
            diff = false;
        $.each(_colIDs, function(i, cID) {
            // If data[cID] is not set, force it to unavailable as default
            if (data[cID] === undefined) { data[cID] = "unavailable"; } 
            // If first item, dont check
            if (v === null) { v = data[cID]; }
            // Check if it differs from first item
            else if (data[cID] && v !== data[cID]) { diff = true; }
        });
        return diff;
    }
    
    // Makes sure the availability returns 'unavailable' by default
    function getAvailability(index, data) {
        var v = "unavailable";
        if (data && _colIDs && _colIDs[index]) {
            var a = data[_colIDs[index]];
            if (a !== undefined) v = a;
        }
        return v;
    }
    
    /**
     * Contains logic for rendering a comparepane component
     */
    var ui = be.marlon.ui;
    // Instantiate the Exterior class
    ui.ComparePane = React.createClass(
        {displayName: 'ComparePane',
            mixins:[be.marlon.utils.Mixins.Mount],
            _height:0,
            _$this:null,
            _visible:false,
            
            // ###########################
            // Public methods
            // ###########################
            
            /**
             * Shows the compare pane 
             */
            show:function()
            {
            	this._visible = true;
            	//this.setState({visible:true});
            	var $this = this._$this;
            	$this.show();
            	$this.animate({height:this._height}, {duration:400, queue:false, complete:this.animateInComplete});
            	if(this.props.heightUpdate)this.props.heightUpdate(this._height);
            },
            
            /**
             * Hides the compare pane 
             */
            hide:function()
            {
            	this._visible = false;
            	//this.setState({visible:false});
            	var $this = this._$this;
            	$this.animate({height:0}, {duration:400, queue:false, complete:this.animateOutComplete});
            	if(this.props.heightUpdate)this.props.heightUpdate(0);
            },
            
            // ###########################
            // Private methods
            // ###########################
            
            /**
             * Handles the completion of the animate in animation 
             */
            animateInComplete:function()
            {
            	this._$this.height('100%');
            },
            
            /**
             * Handles the completion of the animate out animation 
             */
            animateOutComplete:function()
            {
            	this._$this.hide();
            },
            
            getColDataFor:function(colID)
            {
                return $.grep(this.state.data.cols, function(c) { return c.ID == colID; })[0];
            },
            
            handleHighlight:function()
            {
                _highlight = !_highlight;
                this.forceUpdate();
            },
            
            getColSelectionData : function()
            {
                var cols = [];
                $.each(this.state.data.cols, function(i, c) {
                    if ($.grep(_colIDs, function(cID) { return cID == c.ID; }).length === 0) { cols.push(c); }
                });
                return cols;
            },
            
            handleClose : function()
            {
                /* TODO > Call close callback */
               this.hide();
            },
            
            handleShowColumn : function(ID)
            {
                this.setState({ activeCol : ID });
            },
            
            handleColSelection : function(colIndex, ID)
            {
                _colIDs[colIndex] = ID;
                this.setState({ activeCol : null });
            },
            
            /**
             * Handles the event when a category block's height got updated 
             */
            categoryHeightUpdated:function()
            {
            	// Save the height globally so it does not need to be calculated each time
            	this._height = this._$this.outerHeight();
            	if(this.props.heightUpdate)this.props.heightUpdate(this._height);
            },
            
            // ###########################
            // Required react methods
            // ###########################
            
            componentWillMount:function()
            {
                if(!_utils) _utils = be.marlon.utils;
                if(!_dictionary) _dictionary = _utils.Dictionary;
                if(!_settings) _settings = this.props.settings;
            },
            
            /**
             * Method called when the component did mount 
             */
            componentDidMount:function()
            {
            	this._$this = $(this.getDOMNode());
            },
            
            /**
             * Method called right before the comparepane is updated 
             */
            componentWillUpdate:function(nextProps, nextState)
            {
                // Only populate colIDs if state.data.cols has changed!
                var utils = be.marlon.utils;
                if (!utils.checkArrays(nextState.data.cols, this.state.data.cols)) {
            	   $.each(nextState.data.cols, function(i, c) { if (i < 3) { _colIDs[i] = c.ID; }});
                }
            },
            
            /**
             * Method which checks if the comparePane should update when receiving new data 
             */
            shouldComponentUpdate :function(nextProps, nextState)
            {
            	var utils = be.marlon.utils;
                if (nextState.activeCol !== this.state.activeCol) {
                    // If activeCol has changed -> update
                    return true;
                } else if (nextState.data.rows.length > 0) {
                    // Only update if arrays are different
            		return !utils.checkArrays(nextState.data.rows, this.state.data.rows);
            	} else {
            	    // Update by default of the above does not apply
            	    return true;
            	}
            },
            
            /**
             * Method called when the component did update 
             */
            componentDidUpdate:function()
            {
            	// For height calculations, the comparepane needs to be visible
            	this._$this.css({display:'block', height:'100%'});
            	// Save the height globally so it does not need to be calculated each time
            	this._height = this._$this.outerHeight();
            	// If the comparepane was hidden, keep it so
            	if(!this._visible)this._$this.css({display:'none', height:'0'});
            },
            
            /**
             * Returns the initial state of the comparepane 
             */
            getInitialState:function() {
                return ({activeCol:null, data:{cols:[],rows:[]}});
            },
            
            /**
             * React method which renders this component 
             */
            render:function() {
                var instance = this;
                // Method references
                var handleHighlight = this.handleHighlight,
                    handleClose = this.handleClose,
                    handleShowColumn = this.handleShowColumn,
                    handleColSelection = this.handleColSelection;
                
                // Fetch data
                var colDropDownData = this.getColSelectionData(),
                    coldata0 = this.getColDataFor(_colIDs[0]),
                    coldata1 = this.getColDataFor(_colIDs[1]),
                    coldata2 = this.getColDataFor(_colIDs[2]);
                // Object containing column-list and callback methods
                var colDataObj = this.state.data.cols.length > 3 ?
                    {
                        listdata:this.getColSelectionData(),
                        opencallback:handleShowColumn,
                        selectcallback:handleColSelection,
                        activeCol:this.state.activeCol
                    } : null;
                
                return(
                    React.DOM.section( {className:"cc-compare"}, 
                        React.DOM.div( {className:"container cc-container"}, 
                            React.DOM.div( {className:"cc-cols clearfix"}, 
                                React.DOM.div( {className:"cc-col-12"}, 
                                    React.DOM.div( {className:"cc-contents"}, 
                                        
                                        React.DOM.header( {className:"clearfix"}, 
                                            React.DOM.h1(null, _dictionary.getLabel(this.props.title)),
                                            React.DOM.span( {onClick:handleHighlight, className:"cc-highlight-checkbox"}, 
                                                React.DOM.span( {className:"cc-checkbox cc-checkbox-small" + (_highlight ? " cc-checked" : "")}),
                                                _dictionary.getLabel("compareHighlight")
                                            ),
                                            React.DOM.a( {onClick:handleClose, className:"icon-remove cc-icon-close"})
                                        ),                                 
                                        React.DOM.table(null, 
                                            React.DOM.thead(null, 
                                                React.DOM.tr(null, 
                                                    React.DOM.td(null, 
                                                        React.DOM.div( {className:"cc-legend"}, 
                                                            React.DOM.span( {className:"cc-icon cc-icon-standard"}, 
                                                                React.DOM.i(null),
                                                                React.DOM.span(null, _dictionary.getLabel("compareLegendStandard"))
                                                            ),
                                                            React.DOM.span( {className:"cc-icon cc-icon-unavailable"}, 
                                                                React.DOM.i(null),
                                                                React.DOM.span(null, _dictionary.getLabel("compareLegendNotAvailable"))
                                                            ),
                                                            React.DOM.span( {className:"cc-icon cc-icon-optional"}, 
                                                                React.DOM.i(null),
                                                                React.DOM.span(null, _dictionary.getLabel("compareLegendOptional"))
                                                            )
                                                        )
                                                    ),
                                                    coldata0 ? ColumnSelector( {index:0, selection:coldata0, data:colDataObj} ) : null, 
                                                    coldata1 ? ColumnSelector( {index:1, selection:coldata1, data:colDataObj} ) : null, 
                                                    coldata2 ? ColumnSelector( {index:2, selection:coldata2, data:colDataObj} ) : null 
                                                )
                                            ),
                                            this.state.data.rows.map(function (cat) {
                                                return (
                                                    CategoryBlock( {key:cat.ID, data:cat, heightUpdate:instance.categoryHeightUpdated})
                                                );
                                            })
                                        )
                                        
                                    )
                                )
                            )                        
                        )
                    )
                );
            }
        }
    );
    
    /* Renders a column header cell with closeable dropdownlist */
    var ColumnSelector = React.createClass({displayName: 'ColumnSelector',
        
        openDDLHandler : function(e) {
            if (this.props.data)
                this.props.data.opencallback(this.props.selection.ID);
        },
        closeDDLHandler : function(e) {
            if (this.props.data)
                this.props.data.opencallback(null);
        },
        selectHandler : function(ID) {
            this.props.data.selectcallback(this.props.index, ID);
        },
        render : function() {
            if (this.props.data !== null)
            {
                // Method references
                var openDDLHandler = (this.props.selection.ID === this.props.data.activeCol) ? this.closeDDLHandler : this.openDDLHandler,
                    closeDDLHandler = this.closeDDLHandler,
                    selectHandler = this.selectHandler;
                // Define styles
                var openStyle = { display : (this.props.selection.ID === this.props.data.activeCol ? "block" : "none") };
                return (
                    React.DOM.td( {className:"cc-fixed-col"}, 
                        React.DOM.div( {className:"cc-action"}, 
                            React.DOM.a( {onClick:openDDLHandler, className:"cc-btn-dropdown"}, this.props.selection.Name),
                            React.DOM.section( {className:"cc-dropdown clearfix", style:openStyle}, 
                                React.DOM.div( {className:"cc-contents clearfix"}, 
                                    React.DOM.ul(null, 
                                        this.props.data.listdata.map(function (item) {
                                            return (
                                                React.DOM.li( {onClick: function(e) { selectHandler(item.ID); },  key:item.ID}, 
                                                    React.DOM.a(null, item.Name)
                                                )
                                            );
                                        })
                                    ),
                                    React.DOM.a( {onClick:closeDDLHandler, className:"icon-remove cc-icon-close", title:"Close"})
                                )
                            )
                        )
                    )
                );
            }
            else
            {
                return (
                    React.DOM.td( {className:"cc-fixed-col"}, 
                        React.DOM.div( {className:"cc-action"}, 
                            React.DOM.a(null, this.props.selection.Name)
                        )
                    )
                );
            }
        }
    });
    
    /* Renders a collapsable block of rows with header */
    var CategoryBlock = React.createClass({displayName: 'CategoryBlock',
        
        handleHeaderClick : function(e) {
            this.setState({ open : !this.state.open }, this.stateChangeComplete);
        },
        stateChangeComplete:function()
        {
        	this.props.heightUpdate();
        },
        getInitialState: function() {
            return { open : false };
        },
        render : function() {
            // OpenClose flag
            var openCSS = "cc-compare-" + (this.state.open ? "open" : "closed");
            // References
            var handleHeaderClick = this.handleHeaderClick;
            // I had issues rendering the subcat title and rows in 1 mapping function
            // So subcat title and rows are matched to the same level and rendered as equals (see <SubCatRow/> )
            var SubCatExpl = [];
            $.each(this.props.data.SubCats, function(i, sc) {
                SubCatExpl.push(sc);
                $.each(sc.Rows, function(j, scr) {
                    SubCatExpl.push(scr);
                });
            });
            
            return (
                React.DOM.tbody( {className:"cc-compare-header " + openCSS}, 
                    React.DOM.tr( {onClick:handleHeaderClick}, 
                        React.DOM.th(null, 
                            React.DOM.a( {className:"cc-toggle"}, 
                                React.DOM.i( {className:"icon-chevron-" + (this.state.open ? "down" : "up")}),
                                this.props.data.Name
                            )
                        ),
                         _colIDs[0] ? React.DOM.th(null) : null, 
                         _colIDs[1] ? React.DOM.th(null) : null, 
                         _colIDs[2] ? React.DOM.th(null) : null 
                    ),
                     this.state.open ?
                        this.props.data.Rows.map(function (row) {
                            return ( DataRow( {key:row.ID, data:row} ) );
                        })
                    : null, 
                    
                     this.state.open ?
                        SubCatExpl.map(function (sc) {
                            return ( SubCatRow( {key:sc.ID, data:sc} ) );
                        })
                    : null 
                    
                )
            );
        }
    });
    
    /* Renders a data row (name + 3 cells) */
    var DataRow = React.createClass({displayName: 'DataRow',
        render : function() {
            return (
                React.DOM.tr( {className:shouldHighlight(this.props.data.Availability) ? "cc-highlight" : null}, 
                    React.DOM.td(null, 
                        React.DOM.span( {className:"cc-title"}, this.props.data.Name)
                    ),
                    _colIDs[0] ? DataCell( {availability:getAvailability(0, this.props.data.Availability), price:getAvailability(0, this.props.data.OptionalPrice)} ) : null, 
                    _colIDs[1] ? DataCell( {availability:getAvailability(1, this.props.data.Availability), price:getAvailability(1, this.props.data.OptionalPrice)} ) : null, 
                    _colIDs[2] ? DataCell( {availability:getAvailability(2, this.props.data.Availability), price:getAvailability(2, this.props.data.OptionalPrice)} ) : null 
                )
            );
        }
    });
    
    /* Renders a datacell (icon or price) */
    var DataCell = React.createClass({displayName: 'DataCell',
        render : function() {
            var iconElement = React.DOM.i(null);
            if (this.props.availability === "optional") {
                if (this.props.price && this.props.price > 0 && _settings.showprice == "true") {
                    var utils = be.marlon.utils;
                    iconElement = utils.formatPrice(this.props.price, true);
                }
            }
            return (
                React.DOM.td( {className:"cc-fixed-col"}, 
                    React.DOM.span( {className:"cc-icon cc-icon-" + this.props.availability}, 
                        iconElement
                    )
                )
            );
        }
    });
    
    /* Renders a either a subcategory-header or a subcategory-data-row */
    var SubCatRow = React.createClass({displayName: 'SubCatRow',
        render : function() {
            // SubCategory data-row
            if (this.props.data.Availability !== undefined) {
                return (
                    React.DOM.tr( {className:shouldHighlight(this.props.data.Availability) ? "cc-indent cc-highlight" : "cc-indent"}, 
                        React.DOM.td(null, 
                            React.DOM.span( {className:"cc-title"}, this.props.data.Name)
                        ),
                        _colIDs[0] ? DataCell( {availability:getAvailability(0, this.props.data.Availability)} ) : null, 
                        _colIDs[1] ? DataCell( {availability:getAvailability(1, this.props.data.Availability)} ) : null, 
                        _colIDs[2] ? DataCell( {availability:getAvailability(2, this.props.data.Availability)} ) : null 
                    )
                );
            // SubCategory title-row
            } else {
                return (
                   React.DOM.tr(null, 
                       React.DOM.th(null, 
                           React.DOM.span( {className:"cc-title"}, this.props.data.Name)
                       ),
                       _colIDs[0] ? React.DOM.th(null) : null, 
                       _colIDs[1] ? React.DOM.th(null) : null, 
                       _colIDs[2] ? React.DOM.th(null) : null 
                   )
               );
           }
       }
   });
    
}());