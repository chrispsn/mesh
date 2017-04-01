const React = require('react');
const ReactDOM = require('react-dom');

class Cell extends React.Component {
    
    componentDidMount() {
        this.ensureVisible();
    }

    componentDidUpdate() {
        this.ensureVisible();
    }

    ensureVisible() {
        if (this.props.cell_info.selected) {
            // http://stackoverflow.com/a/30497101
            // https://facebook.github.io/react/docs/react-dom.html#finddomnode
            ReactDOM.findDOMNode(this).scrollIntoView(false);
        }
    }

    render() {
            
        const cell_info = this.props.cell_info;
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

class Row extends React.Component {
   
    render() {
        
        const row_index = this.props.row_index;
        const createCell = (cell_info, col_index) => {
            const location = [row_index, col_index];
            const repr = cell_info ? cell_info.repr : '';

            // TODO this could be a good place to do the 'check if a filled cell; else, fill with blank'
            return React.createElement(
                Cell, 
                {cell_info: cell_info, key: location + repr, location: location, repr: repr}
            )
        }
            
        const cells = this.props.vgrid_row.map(createCell);

        return React.createElement("tr", {}, cells);
        
   }
   
};

class Grid extends React.Component {
    
    render() {
               
        const vgrid = this.props.vgrid;

        // TODO do we even need to abstract out rows and columns here?
        // just do it in the grid
        const rows = vgrid.map( 
            (vgrid_row, row_index) => React.createElement(
                Row, 
                {vgrid_row: vgrid_row, key: row_index, row_index: row_index} 
            )
        );

        const TBody = React.createElement("tbody", null, rows)
        const Grid = React.createElement("table", {className: 'grid'}, TBody);
        return Grid;
        
   }
   
};

module.exports = Grid;
