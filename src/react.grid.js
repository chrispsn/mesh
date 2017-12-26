'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const {EMPTY_CELL} = require('./display');

class Cell extends React.PureComponent {
    
    componentDidMount() {
        this.ensureVisible();
    }

    componentDidUpdate() {
        this.ensureVisible();
    }

    ensureVisible() {
        if (this.props.selected) {
            // http://stackoverflow.com/a/30497101
            // https://facebook.github.io/react/docs/react-dom.html#finddomnode
            ReactDOM.findDOMNode(this).scrollIntoView(false);
        }
    }

    render() {
        let props = this.props;
        const repr = props.repr;
        props = {
            className: props.classes + (props.selected ? ' selected' : ''),
            id: props.id,
        }
        return React.createElement("td", props, this.props.repr);
    };
    
}

class Grid extends React.PureComponent {
    
    render() {
               
        const {cells, selected_cell_loc} = this.props;
        const [selected_row_idx, selected_col_idx] = selected_cell_loc;
        const cells_array = [...Object.values(cells)];
        
        const cell_row_idxs = [...cells_array.map(c => c.location[0])];
        const cell_col_idxs = [...cells_array.map(c => c.location[1])];
        const max_row_idx = Math.max(10, selected_row_idx, ...cell_row_idxs);
        const max_col_idx = Math.max(10, selected_col_idx, ...cell_col_idxs);
        
        const rows = [];
        for (let row_idx = 0; row_idx <= max_row_idx; row_idx++) {
            let row_cells = [];
            for (let col_idx = 0; col_idx <= max_col_idx; col_idx++) {
                const id = JSON.stringify([row_idx, col_idx]);
                const cell = cells[id] ? cells[id] : EMPTY_CELL;
                row_cells.push(React.createElement(
                    Cell, 
                    Object.assign({}, cell, {
                        key: id + '|' + cell.repr, 
                        id: id,
                        // TODO Seems a pain to do this for every cell instead of
                        // just the selected one
                        selected: (row_idx === selected_row_idx && col_idx === selected_col_idx)
                    })
                ))
            };
            rows.push(React.createElement('tr', {key: row_idx.toString()}, row_cells));
        }

        const TBody = React.createElement("tbody", null, rows)
        // tabindex="0" allows the grid to be focused: http://stackoverflow.com/a/3149416
        return React.createElement("table", {id: 'grid', tabIndex: 0}, TBody);

   }
   
};

module.exports = Grid;
