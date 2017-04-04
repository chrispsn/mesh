const React = require('react');
const ReactDOM = require('react-dom');
const {EMPTY_CELL, get_cell_id_from_location} = require(__dirname + '/default_cell_logic.js');

class Cell extends React.Component {
    
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
            
        const cell_info = this.props;
        const properties = {
            className: cell_info ? cell_info.classes : '',
            id: JSON.stringify(this.props.location)
        }

        if (cell_info && cell_info.selected) {
            properties.className = properties.className + ' selected';
        }
        return React.createElement("td", properties, this.props.repr);
        
    };
    
}

class Grid extends React.Component {
    
    render() {
               
        const state = this.props.state;
        const cells = state.cells;
        const [selected_row_idx, selected_col_idx] = state.selected_cell_loc;
        
        const [cell_row_idxs, cell_col_idxs] = [0, 1].map(
                idx => Array(...Object.values(cells).map(c => c.location[idx])))
        const max_row_idx = Math.max(selected_row_idx, ...cell_row_idxs);
        const max_col_idx = Math.max(selected_col_idx, ...cell_col_idxs);
        //
        // TODO replace this with a single call to make a blank row, repeated max_col times?
        const [row_indices, col_indices] = [max_row_idx, max_col_idx].map(
            max_idx => Array(max_idx + 1).fill(0).map((_, idx) => idx)
        );

        const rows = row_indices.map(row_idx => {
            const row_cells = col_indices.map(col_idx => {
                const location = [row_idx, col_idx];
                const cell_id = get_cell_id_from_location(location);
                const cell = cells[cell_id] ? cells[cell_id] : EMPTY_CELL;
                return React.createElement(
                    Cell, 
                    Object.assign({}, cell, {
                        key: cell_id + '|' + cell.repr, 
                        location: location,
                        selected: (row_idx === selected_row_idx && col_idx === selected_col_idx)
                    })
                )
            });
            return React.createElement('tr', {key: row_idx.toString()}, row_cells)
        });

        const TBody = React.createElement("tbody", null, rows)
        const Grid = React.createElement("table", {className: 'grid'}, TBody);
        return Grid;
        
   }
   
};

module.exports = Grid;
