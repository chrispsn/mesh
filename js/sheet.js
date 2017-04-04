'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const Grid = require(__dirname + '/grid_component.js');
const CodeTransformers = require(__dirname + '/code_transformers.js');
const DisplayFunctions = require(__dirname + '/display_functions.js');
const SyntaxDisplayMap = require(__dirname + '/syntax_display_map.js');

class Sheet {
    // Public-facing API for virtual grid.
    // TODO consider whether we even need this. Is it useful for the end user?
    
    constructor(DOM_element, store) {
        this.DOM_element = DOM_element;
        this.store = store;
        this.cell_batch = [];
    }

    send_cell_batch() {
        this.store.dispatch({type: 'ADD_CELLS', cells: this.cell_batch});
    };
     
    add_cells(cells_to_batch) {
        this.cell_batch.push(...cells_to_batch);
    }

    render() {
        ReactDOM.render(
            React.createElement(Grid, {state: this.store.getState()}),
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
