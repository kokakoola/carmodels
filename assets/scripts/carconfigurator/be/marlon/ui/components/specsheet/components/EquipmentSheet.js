/** @jsx React.DOM */
(function() {
    
    /**
     * Renders the specification sheet
     */
    var ui = be.marlon.ui;
    // Instantiate the bottomcontainer class
    ui.EquipmentSheet = React.createClass(
        {displayName: 'EquipmentSheet',
            mixins:[be.marlon.utils.Mixins.Height, be.marlon.utils.Mixins.Mount],
            
            // ###########################
            // Private methods
            // ###########################
            
            /**
             * Method used to create all the rows for the specification sheet 
             */
            createRows:function()
            {
                var utils = be.marlon.utils,
                    dic = utils.Dictionary,
                    items = [],
                    config = this.props.config,
                    controller = this.props.controller,
                    i,
                    iL,
                    data = this.state.data;
                                
                    for(var key in data)
                    {
                        items.push(RowGroup( {key:data[key].id, title:data[key].name, rows:data[key].rows, id:data[key].id, subCats:data[key].subCats, updateHeight:this.updateHeight}));
                    }

                return items;
            },
                        
                            
            // ###########################
            // Public methods
            // ###########################
                        
                        
            // ###########################
            // Required react methods
            // ###########################
            
            /**
             * Method called right after the element has rendered 
             */
            componentDidMount:function(rootNode)
            {
                this.props.componentDidMount(this);
            },
            
            /**
             * Method which is handles the event when the component did update 
             */
            componentDidUpdate:function()
            {
            	this.updateHeight();
            },
            
            /**
             * Default the props 
             */
            getInitialState:function()
            {
                return {
                };
            },
            
            /**
             * The react render function for this class 
             */
            render:function()
            {
                var rows;
                if(this.state.data)
                {
                    // Create the rows for the specsheet
                    rows = this.createRows();
                }
                
                // Create the return value
                return(
                    React.DOM.div( {className:"cc-abs-item"}, 
                        React.DOM.table(null, 
                            rows
                        )
                    )
                );
            }
        }
    );
    
    /**
     * A row item
     */
    var RowGroup = React.createClass({displayName: 'RowGroup',
        render: function()
        {
            var categoryId = this.props.id,
                title = this.props.title,
                data = this.props.rows,
                subCats = this.props.subCats,
                rows = [],
                headerClass = 'cc-trigger header-' + categoryId,
                clickHandler = this.clickHandler;

            for(var i = 0; i < data.length; i++)
            {
                rows.push(RowItem( {key:i, name:data[i].name, categoryId:categoryId} ));
            }

            if(subCats)
            {
                for(var j = 0; j < subCats.length; j++)
                {
                    rows.push(RowItem( {key:i + "" + j, name:subCats[j].name, categoryId:categoryId} ));

                    var subCatRows = subCats[j].rows;
                    for(var k = 0; k < subCatRows.length; k++)
                    {
                        rows.push(RowItem( {key:i + "" + j + "" + k, className:"cc-indent", name:subCatRows[k].name, categoryId:categoryId, indent:true} ));
                    }                    
                }
            }

            return (
                React.DOM.tbody(null, 
                    React.DOM.tr( {onClick: function(e) { clickHandler(categoryId); },  className:headerClass}, 
                        React.DOM.th( {className:"cc-col-icon"}, React.DOM.i( {className:"cc-icon icon-chevron-down"})),
                        React.DOM.th(null, title)
                    ),
                    rows
                )
            );
        },

        // Toggle open or closed state of row group
        clickHandler: function(id) {
            $('tr.row-' + id).toggle();
            $('tr.header-' + id)
                .find('i')
                .toggleClass('icon-chevron-up')
                .toggleClass('icon-chevron-down');
           	this.props.updateHeight();
        }
    });

    /**
     * A row item
     */
    var RowItem = React.createClass(
        {displayName: 'RowItem',
            removeHandler:function(e)
            {
                // Call the remove handler
                this.props.removeHandler(this);
            },
            
            render:function()
            {
                var id = this.props.id, 
                    title = this.props.name,
                    cssClass = 'row-' + this.props.categoryId;

                // Deeper levels
                if(this.props.indent)
                {
                    cssClass += ' cc-indent';
                }
                
                return(
                    React.DOM.tr( {style:{ display: 'none' }, className:cssClass}, 
                        React.DOM.td(null),
                        React.DOM.td(null, React.DOM.div( {className:"cc-title" + (this.props.className?' ' + this.props.className:'')}, title))
                    )
                );
            }
        }
    );
}());