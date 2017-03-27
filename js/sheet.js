'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const Grid = require(__dirname + '/grid_component.js').Grid;
const CodeTransformers = require(__dirname + '/code_transformers.js');
const DisplayFunctions = require(__dirname + '/display_functions.js');
const SyntaxDisplayMap = require(__dirname + '/syntax_display_map.js');

class Sheet {
    // Public-facing API for virtual grid.
    
    constructor(DOM_element, store) {
        this.DOM_element = DOM_element;
        this.store = store;
        this.cell_batch = [];
    }

    send_cell_batch() {
        const max_row = Math.max(...(this.cell_batch.map(cell => cell.location[0])))
        const max_col = Math.max(...(this.cell_batch.map(cell => cell.location[1])))
        this.store.dispatch({type: 'EXTEND_GRID', location: [max_row, max_col]});
        this.store.dispatch({type: 'ADD_CELLS', cells: this.cell_batch});
    };
     
    add_cells(cells_to_batch) {
        this.cell_batch.push(...cells_to_batch);
    }

    get vgrid () {
        return this.store.getState().vgrid;
    }
     
    render() {
        ReactDOM.render(
            React.createElement(Grid, {vgrid: this.vgrid}),
            this.DOM_element
        )
    }
     
    attach(ref_string, value, location, custom_display_func) {
        // TODO fix this terrible signature so ref_string is not needed?
        
        const current_AST = new CodeTransformers.AST(Mesh.code_editor.getValue());
        const declaration_node = current_AST.get_first_declaration_of_name(ref_string);

        if (custom_display_func) {
            custom_display_func(value, ref_string, this, location, declaration_node);
        }

        else {
            if (declaration_node) {
                const expression_type = declaration_node.init.type;
                if (SyntaxDisplayMap.hasOwnProperty(expression_type)) {
                    const display_fn = SyntaxDisplayMap[expression_type];
                    display_fn(value, ref_string, this, location, declaration_node);
                } else {
                    console.log("Not sure how to display this expression type: ", expression_type);
                    DisplayFunctions.write_dummy('TODO', ref_string, this, location, declaration_node)
                }
            } else {
                // TODO implement FunctionDeclaration (and anything else?)
                DisplayFunctions.write_dummy('TODO', ref_string, this, location, declaration_node)
            }
        }
       
    }
     
};

module.exports = Sheet;
