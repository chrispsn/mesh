// TODO can we avoid passing in the whole AST node and just pass in the locs (and child locs)? No need to know anything about an AST. But maybe this way is easier...
// TODO can we avoid getting the code pane contents directly from this file? (Pass it in, or something even better?)
// TODO fix inconsistency in function arg order between Mesh.attach and these

const CM = require('./code_transformers');

const default_cell_props = {
    repr: '', 
    ref_string: null, 
    formula_bar_value: '',
    classes: '', 
    code_location: null,

    select: function (state, action) {
        return Object.assign({}, state, {
            code_editor: Object.assign({}, state.code_editor, {selection: this.code_location}),
            selected_cell_loc: action.location,
            formula_bar_value: this.formula_bar_value,
        });
    },

    edit: function (state) {
        if (state.mode === 'EDIT') {
            return state;
        } else {
            return Object.assign({}, state, { mode: 'EDIT' });
        }
    },

    edit_replace: function (state) {
        if (state.mode === 'EDIT') {
            return state;
        } else {
            return Object.assign({}, state, {
                mode: 'EDIT',
                formula_bar_value: '',
            });
        }
    },

    commit_edit: function (state, action) {
        // TODO Check that the commit is valid first?
        // Merge with select code somehow? (Feels like select should just be a 'refresh ready')
        // Also, these 'row + offset, col + offset' logics are basically the same
        // as what the main reducer is doing...
        const old_code = state.code_editor.value;
        const new_code = CM.replace_text(old_code, this.code_location, action.commit_value);

        const [old_row, old_col] = state.selected_cell_loc;

        return Object.assign({}, state, {
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE',
            selected_cell_loc: [
                old_row + action.offset[0], 
                old_col + action.offset[1]
            ],
        });
    },

    discard_edit: function (state) {
        return Object.assign({}, state, {
            mode: 'READY',
            formula_bar_value: this.formula_bar_value,
        });
    },

    delete_value: function (state) {
        const old_code = state.code_editor.value;
        const new_code = CM.replace_text(old_code, this.code_location, 'null');

        return Object.assign({}, state, {
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE'
        });
    },

    delete_element: function (state) {
        console.log("No 'delete element' action defined.")
        return state;
    }

}

function create_cell (cell_props) {
    if (arguments.length === 0) {
        return Object.assign({}, default_cell_props);
    } else {
        return Object.assign({}, default_cell_props, arguments[0]);
    }
}

const EMPTY_CELL = Object.assign(create_cell({

    // TODO does it need only some of the reducers?
    commit_edit: function (state, action) {
        const variable_name = action.commit_value;
        const old_code = state.code_editor.value;
        let new_code;
        new_code = CM.create_const_variable(old_code, variable_name);
        new_code = CM.add_attachment(new_code, variable_name, state.selected_cell_loc);

        return Object.assign({}, state, {
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE',
            selected_cell_loc: [
                state.selected_cell_loc[0] + action.offset[0],
                state.selected_cell_loc[1] + action.offset[1],
            ]
        });
    }
}))

// TODO make this a display function like any other again - not just a helper?
function create_ref_string_cell(ref_string, location, declaration_AST_node) {
    return create_cell({
        location: location,
        repr: ref_string,
        ref_string: ref_string,
        formula_bar_value: ref_string,
        classes: 'occupied identifier',
        code_location: declaration_AST_node.id.loc,
        // TODO problem with this is: need to also remove the attachment
        delete_element: (state, action) => {
            const old_code = state.code_editor.value;
            let new_code = CM.remove_declaration(old_code, ref_string);
            new_code = CM.remove_record_given_key(new_code, "MESH_ATTACHMENTS", "id", ref_string);
            return Object.assign({}, state, {
                code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                mode: 'NEED_TO_CALCULATE'
            });
        }
    });
}

const display_fns = {
    
    dummy: (value, ref_string, location, declaration_AST_node) => {
        // For use where you don't know what to use for the formula bar value
        // and code location values yet.
        return [create_cell({
            location: [location[0], location[1] + 1],
            repr: 'TODO',
            ref_string: ref_string,
            formula_bar_value: "TODO",
            code_location: undefined,
        })];
    },

    value: (value, ref_string, location, declaration_AST_node) => {
        const code_text = Mesh.store.getState().code_editor.value;
        const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);
        const value_cell = create_cell({
            location: [location[0], location[1] + 1], 
            repr: String(value),
            ref_string: ref_string,
            formula_bar_value: CM.get_text(code_text, declaration_AST_node.init.loc),
            code_location: declaration_AST_node.init.loc,
            classes: 'occupied editable ' + typeof value + (typeof value === 'boolean' ? ' ' + String(value) : ''),
        });
        return [ref_string_cell, value_cell];
    },

    value_ro: (value, ref_string, location, declaration_AST_node) => {
        const code_text = Mesh.store.getState().code_editor.value;
        const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);
        const value_cell = create_cell({
            location: [location[0], location[1] + 1], 
            repr: String(value),
            ref_string: ref_string,
            formula_bar_value: CM.get_text(code_text, declaration_AST_node.init.loc),
            code_location: declaration_AST_node.init.loc,
            classes: 'occupied read-only ' + typeof value + (typeof value === 'boolean' ? ' ' + String(value) : ''),
        });
        return [ref_string_cell, value_cell];
    },

/* ARRAY */

    array_ro: (array, ref_string, location, declaration_AST_node) => {
    // TODO it may be nice if, when you click on this, it selects the whole array.

        const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);
        
        let [row_index, col_index] = location;
        row_index++;
        const code_text = Mesh.store.getState().code_editor.value;
        const formula_bar_text = CM.get_text(code_text, declaration_AST_node.init.loc);
        const new_cells = array.map( (val, row_offset) => create_cell({
            location: [row_index + row_offset, col_index],
            repr: String(val),
            ref_string: ref_string,
            formula_bar_value: formula_bar_text,
            code_location: declaration_AST_node.init.loc,
            classes: "read-only",
        }))

        return [ref_string_cell, ...new_cells];
    },

    array_rw: (array, ref_string, location, declaration_AST_node) => {

        const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);

        let [row_index, col_index] = location;

        row_index++;

        const code_text = Mesh.store.getState().code_editor.value;

        const value_cells = array.map( (val, row_offset) => {
            const element_loc = declaration_AST_node.init.elements[row_offset].loc;
            return create_cell({
                location: [row_index + row_offset, col_index],
                repr: String(val),
                ref_string: ref_string,
                formula_bar_value: CM.get_text(code_text, element_loc),
                code_location: element_loc,
                classes: 'editable',
                insert_element: (state, action) => {
                    const old_code = state.code_editor.value;
                    const new_code = CM.insert_array_element(old_code, ref_string, row_offset, "null");
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_element: (state, action) => {
                    const old_code = state.code_editor.value;
                    const new_code = CM.remove_array_element(old_code, ref_string, row_offset);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_container: function (state) {
                    const old_code = state.code_editor.value;
                    const new_code = CM.replace_text(old_code, declaration_AST_node.init.loc, 'null');

                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
            });
        })

        // Append cell
        const append_location = {
            start: {
                line: declaration_AST_node.init.loc.end.line,
                column: declaration_AST_node.init.loc.end.column - 1
            }
        };
        append_location.end = append_location.start;

        const append_cell = create_cell({
            location: [row_index + value_cells.length, col_index],
            repr: '',
            ref_string: ref_string,
            classes: 'append',
            formula_bar_value: '',
            code_location: append_location,
            commit_edit: (state, action) => {
                const old_code = state.code_editor.value;
                const new_code = CM.insert_array_element(old_code, ref_string, array.length, action.commit_value);
                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE',
                    selected_cell_loc: [
                        state.selected_cell_loc[0] + action.offset[0], 
                        state.selected_cell_loc[1] + action.offset[1],
                    ],
                });
            },
            insert_element: (state, action) => {
                const old_code = state.code_editor.value;
                const new_code = CM.insert_array_element(old_code, ref_string, array.length, "null");
                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE'
                });
            },
            delete_container: function (state) {
                const old_code = state.code_editor.value;
                const new_code = CM.replace_text(old_code, declaration_AST_node.init.loc, 'null');

                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE'
                });
            },
        })
        
        return [ref_string_cell, ...value_cells, append_cell];
    },

/* OBJECT */

    // TODO needs work - maybe look at how array_ro works
    object_ro: (object, ref_string, location, declaration_AST_node) => {

        const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);

        let [row_index, col_index] = location;
        const starting_row_index = location[0];

        row_index++;

        const cells = [];

        const code_text = Mesh.store.getState().code_editor.value;

        const formula_bar_text = CM.get_text(code_text, declaration_AST_node.init.loc)

        for (let [key, value] of Object.entries(object)) {

            const key_cell = create_cell({
                location: [row_index, col_index],
                repr: String(key), 
                ref_string: ref_string,
                code_location: declaration_AST_node.init.loc,
                formula_bar_value: formula_bar_text,
                classes: 'object key read-only',
            });

            const value_cell = create_cell({
                location: [row_index, col_index + 1],
                repr: String(value), 
                ref_string: ref_string,
                code_location: declaration_AST_node.init.loc,
                formula_bar_value: formula_bar_text,
                classes: 'object value read-only',
            });

            row_index++;

            cells.push(key_cell, value_cell);
        };

        return [ref_string_cell, ...cells];

    },

    object_rw: (object, ref_string, location, declaration_AST_node) => {

        const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);

        let [row_index, col_index] = location;
        const starting_row_index = location[0];

        row_index++;

        const cells = [];

        const code_text = Mesh.store.getState().code_editor.value;

        for (let [key, value] of Object.entries(object)) {
            const pair_node = declaration_AST_node.init
                                .properties[row_index - starting_row_index - 1]

            const key_node = pair_node.key;
            const key_cell = create_cell({
                location: [row_index, col_index],
                repr: String(key), 
                ref_string: ref_string,
                code_location: key_node.loc,
                formula_bar_value: CM.get_text(code_text, key_node.loc),
                classes: 'object key editable',
                insert_element: (state, action) => {
                    const old_code = state.code_editor.value;
                    const new_code = CM.insert_object_item(old_code, ref_string, "new_key", null);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_element: (state, action) => {
                    const old_code = state.code_editor.value;
                    const new_code = CM.remove_object_item(old_code, ref_string, String(key));
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_container: function (state) {
                    const old_code = state.code_editor.value;
                    const new_code = CM.replace_text(old_code, declaration_AST_node.init.loc, 'null');

                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
            });

            const value_node = pair_node.value;
            const value_cell = create_cell({
                location: [row_index, col_index + 1],
                repr: String(value), 
                ref_string: ref_string,
                code_location: value_node.loc,
                formula_bar_value: CM.get_text(code_text, value_node.loc),
                classes: 'object value editable',
                insert_element: (state, action) => {
                    const old_code = state.code_editor.value;
                    const new_code = CM.insert_object_item(old_code, ref_string, "new_key", null);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_element: (state, action) => {
                    const old_code = state.code_editor.value;
                    const new_code = CM.remove_object_item(old_code, ref_string, String(key));
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_container: function (state) {
                    const old_code = state.code_editor.value;
                    const new_code = CM.replace_text(old_code, declaration_AST_node.init.loc, 'null');

                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
            });

            row_index++;

            cells.push(key_cell, value_cell);
        };

        // Append cell
        const append_location = {
            start: {
                line: declaration_AST_node.init.loc.end.line,
                column: declaration_AST_node.init.loc.end.column - 1
            }
        };
        append_location.end = append_location.start;

        const append_cell = create_cell({
            location: [row_index, col_index],
            repr: '',
            ref_string: ref_string,
            classes: 'add_key',
            formula_bar_value: '',
            code_location: append_location,
            commit_edit: (state, action) => {
                const old_code = state.code_editor.value;
                const new_code = CM.insert_object_item(old_code, ref_string, action.commit_value, "null");
                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE',
                    selected_cell_loc: [
                        state.selected_cell_loc[0] + action.offset[0], 
                        state.selected_cell_loc[1] + action.offset[1]
                    ]
                });
            },
            insert_element: (state, action) => {
                const old_code = state.code_editor.value;
                const new_code = CM.insert_object_item(old_code, ref_string, "new_key", "null");
                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE'
                });
            },
            delete_container: function (state) {
                const old_code = state.code_editor.value;
                const new_code = CM.replace_text(old_code, declaration_AST_node.init.loc, 'null');

                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE'
                });
            },
        })

        return [ref_string_cell, ...cells, append_cell];

    },

/* OTHER TYPES */

    records_ro: (records, ref_string, location, declaration_AST_node) => {
        // Array (TODO change to a map?) of objects.
        // TODO allow user to specify headers, and therefore also order

        let [row_index, col_index] = location;

        // Write the ref_string
        const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);
        row_index++;

        // Write the data structure
        if (records.length > 0) {
            
            // Headers
            headers_to_add = Object.keys(records[0]).map(
                (key, col_offset) => create_cell({
                    location: [row_index, col_index + col_offset], 
                    repr: String(key),
                    classes: 'heading',
                    formula_bar_value: "TODO",
                    code_location: undefined,
                })
            )
            row_index++;

            // Records
            let records_to_add = records.map(
                (record, row_offset) => {
                    const current_row_index = row_index + row_offset;
                    return Object.values(record).map(
                        (val, col_offset) => create_cell({
                            location: [current_row_index, col_index + col_offset],
                            repr: val,
                            formula_bar_value: "TODO",
                            code_location: undefined,
                        })
                    )
                }
            )
            records_to_add = records_to_add.reduce( (a, b) => a.concat(b) );
            return [ref_string_cell, ...headers_to_add, ...records_to_add];
        }

        return [ref_string_cell];
    },

    OOA: (obj, ref_string, location, declaration_AST_node, headings) => {
        // Object of arrays (aka struct of arrays).
        // Allow user to specify an order of headings;
        // otherwise, is taken from Object.keys(obj).
        // Assumes all arrays are of the same length.
        // TODO should actually output another fn that has the headings baked in

        let [row_index, col_index] = location;

        // Write the ref_string
        const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);
        row_index++;

        const keys = typeof headings !== 'undefined' ? headings : Object.keys(obj);
        const record_count = obj[keys[0]].length;

        // Write the data structure
        if (keys.length > 0) {
            
            // Headers
            const header_cells = keys.map(
                (key, col_offset) => create_cell({
                    location: [row_index, col_index + col_offset], 
                    repr: String(key),
                    classes: 'heading',
                    formula_bar_value: "TODO",
                    code_location: undefined,
                })
            )

            // Add key cell
            const extra_cells = [];

            // Append cell
            const new_field_cell_location = {
                start: {
                    line: declaration_AST_node.init.loc.end.line,
                    column: declaration_AST_node.init.loc.end.column - 1
                },
                get end() {return this.start},
            };

            const new_field_cell = create_cell({
                location: [row_index, col_index + keys.length],
                repr: '',
                ref_string: ref_string,
                classes: 'add_key',
                formula_bar_value: '',
                code_location: new_field_cell_location,
                commit_edit: (state, action) => {
                    const old_code = state.code_editor.value;
                    const new_code = CM.OOA_add_field(old_code, ref_string, action.commit_value);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE',
                        selected_cell_loc: [
                            state.selected_cell_loc[0] + action.offset[0], 
                            state.selected_cell_loc[1] + action.offset[1]
                        ]
                    });
                },
            })
            extra_cells.push(new_field_cell)
            
            // Records
            row_index++;

            function get_key_elements(obj_props, key) {
                for (let prop of obj_props) {
                    let field_id = (prop.key.type === 'Identifier') ? prop.key.name : prop.key.value;
                    if (field_id === key) {
                        return prop.value.elements;
                    }
                }
            }

            const obj_node_props = declaration_AST_node.init.properties;
            const record_cells = [];
            // TODO flip this around - first go by col (key), then by row
            for (let offset_r = 0; offset_r < record_count; offset_r++) {
                keys.map((key, offset_c) => {
                    let key_elements = get_key_elements(obj_node_props, key);
                    console.log(key_elements[offset_r]);
                    record_cells.push(
                        create_cell({
                            location: [row_index + offset_r, col_index + offset_c],
                            // TODO
                            code_location: key_elements[offset_r].loc,
                            repr: obj[key][offset_r],
                            formula_bar_value: "TODO",
                        })
                    )
                }
            )}
            
            // TODO append record cells
            // TODO append field cells
            // TODO attach delete actions (datum, field, record, entire ooa?)

            return [ref_string_cell, ...header_cells, ...record_cells, ...extra_cells];

        } else {
            return [ref_string_cell];
        }
    },
}

// Lists of possible types:
// https://github.com/benjamn/ast-types/blob/master/def/core.js
// https://github.com/benjamn/ast-types/blob/master/def/es6.js
const AST_node_to_display_fn = {

    // 'Hello world'
    'Literal': display_fns.value,

    // undefined
    'Identifier': display_fns.value,

    // 1 + 2
    'BinaryExpression': display_fns.value,

    // `Hello ${name}`
    'TemplateLiteral': display_fns.value_ro,

    // (x) => x + 2
    'ArrowFunctionExpression': display_fns.value,

    // TODO consider whether this will deal with array spread notation
    // [1, 2, 3]
    'ArrayExpression': display_fns.array_rw,

    // TODO consider whether this will deal with object spread notation
    // TODO differentiate between read-only and read-write
    // {hello: 'world'}
    'ObjectExpression': display_fns.object_rw,

    'Unknown': display_fns.dummy,

    // # These ones are more complex.

    // some_fn()
    'CallExpression': (value, ref_string, location, declaration_node) => {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof

        // TODO will need to enumerate the various kinds of objects here too...
        // TODO objects (problem is that lots of things are objects...)
        // if (value === Object(value) && !(value instanceof Function)) {
        // See also: http://stackoverflow.com/a/22482737

        const constructor_display_fns = [
            [Array, display_fns.array_ro],
            [Object, display_fns.object_ro],
        ];

        for (let [constructor, display_fn] of constructor_display_fns) {
            if (value instanceof constructor) {
                return display_fn(value, ref_string, location, declaration_node);
            }
        }
        return display_fns.value(value, ref_string, location, declaration_node);
    },

    // new Array([...])
    'NewExpression': (value, ref_string, location, declaration_node) => {

        const new_callee_display_fns = {
            'Map': display_fns.map,
        }
        
        const callee_name = declaration_node.init.callee.name;
        if (new_callee_display_fns.hasOwnProperty(callee_name)) {
            const display_fn = new_callee_display_fns[callee_name];
            return display_fn(value, ref_string, location, declaration_node);
        } else {
            return display_fns.value(value, ref_string, location, declaration_node);
        }
    },

}

module.exports = {
    create_cell,
    EMPTY_CELL,
    display_fns,
    AST_node_to_display_fn,
};
