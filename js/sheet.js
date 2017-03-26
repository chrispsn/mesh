'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const Grid = require(__dirname + '/grid_component.js').Grid;
const CodeTransformers = require(__dirname + '/code_transformers.js');
const DisplayFunctions = require(__dirname + '/display_functions.js');

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
            
            // TODO what if it's not a declaration node?
            if (declaration_node) {
                switch (declaration_node.init.type) {
                    // This code lists the types of possible types:
                    // https://github.com/benjamn/ast-types/blob/master/def/core.js 

                    // TODO write_value isn't always for a literal, but the code assumes
                    // it is - consider this
                    case 'Literal':                 // 'Hello world'
                    case 'Identifier':              // undefined
                    case 'BinaryExpression':        // 1 + 2
                    case 'ArrowFunctionExpression': // (x) => x * 2
                    case 'FunctionExpression':      // const f = function (x) { return x * 2 }
                        DisplayFunctions.write_value(value, ref_string, this, location, declaration_node)
                        break;

                    case 'ArrayExpression':
                        // eg [1, 2, 3]
                        // TODO consider whether this will deal with array spread notation
                        DisplayFunctions.write_array_rw(value, ref_string, this, location, declaration_node)
                        break;

                    case 'ObjectExpression':
                        // eg {hello: 'world'}
                        // TODO consider whether this will deal with object spread notation
                        DisplayFunctions.write_object(value, ref_string, this, location, declaration_node)
                        // TODO differentiate between read-only and read-write
                        break;

                    case 'CallExpression':
                        // eg some_function();
                        
                        // TODO will need to enumerate the various kinds of objects here too...
                        // TODO objects (problem is that lots of things are objects...)
                        // if (value === Object(value) && !(value instanceof Function)) {
                        // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)
                        // See also: http://stackoverflow.com/a/22482737

                        if (value instanceof Map) {
                            DisplayFunctions.write_map(value, ref_string, this, location, declaration_node)
                        } else if (value instanceof Array) {
                            DisplayFunctions.write_array_ro(value, ref_string, this, location, declaration_node)
                        } else {
                            DisplayFunctions.write_value(value, ref_string, this, location, declaration_node)
                        };
                        break;

                    case 'NewExpression':
                        // eg new Map([ ... ]);
                        switch (declaration_node.init.callee.name) {
                            case 'Map':
                                DisplayFunctions.write_map(value, ref_string, this, location, declaration_node)
                                break;

                            // TODO what else could this be?
                            default: 
                                console.log(declaration_node.init.callee.name);
                                DisplayFunctions.write_value('DISPLAY NOT IMPLEMENTED YET', 
                                                        ref_string, this, location, declaration_node)
                        }
                        break;

                    default:
                        console.log("Unknown node type:")
                        console.log(declaration_node);
                        DisplayFunctions.write_dummy('DISPLAY NOT IMPLEMENTED YET', 
                                                        ref_string, this, location, declaration_node)
                        
                }

            } else {
                // TODO implement FunctionDeclaration
                DisplayFunctions.write_dummy('DISPLAY NOT IMPLEMENTED YET', 
                                                ref_string, this, location, declaration_node)
            }
            
        }
       
    }
     
};

module.exports = {
    Sheet: Sheet
}
