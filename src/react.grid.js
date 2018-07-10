'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const createReactClass = require('create-react-class');

const EMPTY_CELL = require('./display').EMPTY_CELL;
const createArray = require('./settings').createArray;
const assign = require('./settings').assign;

const Cell = createReactClass({

    componentDidMount: function() {
        this.ensureVisible();
    },

    componentDidUpdate: function() {
        this.ensureVisible();
    },

    ensureVisible: function() {
        if (this.props.selected) {
            // http://stackoverflow.com/a/30497101
            // https://facebook.github.io/react/docs/react-dom.html#finddomnode
            ReactDOM.findDOMNode(this).scrollIntoView(false);
        }
    },

    render: function() {
        let props = this.props;
        props = {
            className: ((props.classes.length === 0 ? 'empty' : props.classes) 
                       + (props.selected ? ' selected' : '')),
            id: props.id,
        }
        return React.createElement("td", props, this.props.repr);
    }

});

const Grid = createReactClass({
    
    render: function() {
               
        const cells_obj = this.props.cells;
        const selected_idxs = this.props.selected_cell_loc;
        const cells_array = createArray(Object.keys(cells_obj).map(function(k) {return cells_obj[k]}));
        
        const MAX = function(agg, curr) {return Math.max(agg, curr)};
        const max_cell_row_idx = cells_array
                                    .map(function(c) {return c.location[0]})
                                    .reduce(MAX, 0);
        const max_cell_col_idx = cells_array
                                    .map(function(c) {return c.location[1]})
                                    .reduce(MAX, 0);

        const max_row_idx = Math.max(10, selected_idxs[0], max_cell_row_idx + 1);
        const max_col_idx = Math.max(10, selected_idxs[1], max_cell_col_idx + 1);
        
        const rows = [];
        for (let row_idx = 0; row_idx <= max_row_idx; row_idx++) {
            let row_cells = [];
            for (let col_idx = 0; col_idx <= max_col_idx; col_idx++) {
                const id = JSON.stringify([row_idx, col_idx]);
                const cell = cells_obj[id] ? cells_obj[id] : EMPTY_CELL;
                row_cells.push(React.createElement(
                    Cell, 
                    assign({}, cell, {
                        key: id + '|' + cell.repr, 
                        id: id,
                        // TODO Seems a pain to do this for every cell instead of
                        // just the selected one
                        selected: (row_idx === selected_idxs[0] && col_idx === selected_idxs[1])
                    })
                ))
            };
            rows.push(React.createElement('tr', {key: row_idx.toString()}, row_cells));
        }

        const TBody = React.createElement("tbody", null, rows)
        // tabindex="0" allows the grid to be focused: http://stackoverflow.com/a/3149416
        return React.createElement("table", {id: 'grid', tabIndex: 0}, TBody);

   }
   
});

module.exports = Grid;