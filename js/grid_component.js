const React = require('react');
const ReactDOM = require('react-dom');

class Cell extends React.Component {
    
    constructor() {
        super();
        this.state = {
            selected: false
        };
    }
    
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
            
        const properties = {
            className: this.props.cell_info ? this.props.cell_info.classes : '',
            id: JSON.stringify(this.props.location)
        }

        if (this.props.cell_info && this.props.cell_info.selected) {
            properties.selected = true;
            properties.className = properties.className + ' selected';
        }
        return React.createElement("td", properties, this.props.repr);
        
    };
    
}

class ColHeadings extends React.Component {
    
    render() {
        
        let col_headers = this.props.indices.map((
            (index) => React.createElement(
                ColHeader, {key: index}, index
            )
        ));
        
        return React.createElement("tr", null, col_headers);
        
    }
    
};

const ColHeader = (props) => React.createElement(
    "th", {className: 'col_header'}, String(props.children)
);

class Row extends React.Component {
   
    render() {
        
        const row_index = this.props.row_index;
        const createCell = (cell_info, col_index) => {
            const location = [row_index, col_index];
            const repr = cell_info ? cell_info.repr : '';

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

        const rows = vgrid.map( 
            (vgrid_row, row_index) => React.createElement(
                Row, 
                {vgrid_row: vgrid_row, key: row_index, row_index: row_index} 
            )
        );

        const col_indices_iterable = Array(vgrid[0].length).keys();
        const col_indices = Array.from(col_indices_iterable);
        const col_headings = React.createElement(ColHeadings, {indices: col_indices})
        
        const TBody = React.createElement("tbody", null, col_headings, rows)

        const Grid = React.createElement("table", {className: 'grid'}, TBody);
        
        return Grid;
        
   }
   
};

module.exports = {
    Grid: Grid
}
