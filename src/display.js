const CT = require('./code_transformers');
const {rewrite_input} = require('./data_entry');

const default_cell_props = {
    repr: '', 
    ref_string: null, 
    formula_bar_value: '',
    classes: '', 

    select: function (state, action) {
        return Object.assign({}, state, {
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
        // Also, these 'row + offset, col + offset' logics are basically the same
        // as what the main reducer is doing...
        const old_code = state.code_editor.value;
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_nodepath = CT.get_declaration_node_init(AST, 'MODULE');

        const key = this.ref_string;
        const index = CT.get_object_item_index(obj_nodepath, key);
        CT.remove_object_item(obj_nodepath, key);
        const inserted_code = rewrite_input(action.commit_value);
        if (action.commit_value[0] === "=") {
            CT.insert_object_getter(obj_nodepath, key, inserted_code, index);
        } else {
            CT.insert_object_item(obj_nodepath, key, inserted_code, index);
        }

        const new_code = CT.print_AST_to_code_string(AST);

        // TODO Merge with select code somehow? (Feels like select should just be a 'refresh ready')
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
        // TODO
        console.log("No 'delete value' action defined.")
        return Object.assign({}, state, {
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE'
        });
    },

    delete_element: function (state) {
        // TODO
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
        const id = action.commit_value;
        const old_code = state.code_editor.value;
        const AST = CT.parse_code_string_to_AST(old_code);

        const module_obj_node = CT.get_declaration_node_init(AST, 'MODULE');
        CT.insert_object_item(module_obj_node, id, "null");

        const attachments_arr_node = CT.get_declaration_node_init(AST, 'MESH_ATTACHMENTS');
        const new_attachment = `{module_id: \"MODULE\", id: \"${id}\", value: MODULE.${id}, grid_loc: [${state.selected_cell_loc}]},`
        CT.append_array_element(attachments_arr_node, new_attachment);

        const new_code = CT.print_AST_to_code_string(AST);

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

// TODO I don't like how we effectively run ASTs twice:
// once at the display step, to get the value node for the new code,
// and once when doing code transformations off the back of UI interaction.
// It's not crazy to assume that the AST won't change between when cells are created
// and when cells are interacted with; in that case we could pass in the old AST
// and use it to build the 'delete' (etc) functions.
// *Maybe* you'd need to be careful with buttons that change the AST? (eg loading in new JSON)
// but maybe the loader function would force a refresh of the grid at that time, to rebuild it.
// I'll leave this for another day.

const display_fns = {
    
    dummy: (value, value_nodepath, id) => {
        // For use where you don't know what to use for the formula bar value
        // and code location values yet.
        return [create_cell({
            location: [0, 1],
            ref_string: id,
            repr: 'TODO',
            formula_bar_value: "TODO",
        })];
    },

    value: (value, value_nodepath, id) => {
        const value_cell = create_cell({
            location: [0, 1], 
            ref_string: id,
            repr: String(value),
            formula_bar_value: CT.print_AST_to_code_string(value_nodepath),
            classes: 'occupied editable ' + typeof value + (typeof value === 'boolean' ? ' ' + String(value) : ''),
        });
        return [value_cell];
    },

    value_ro: (value, value_nodepath, id) => {
        const value_cell = create_cell({
            location: [0, 1], 
            ref_string: id,
            repr: String(value),
            formula_bar_value: CT.print_AST_to_code_string(value_nodepath),
            classes: 'occupied read-only ' + typeof value + (typeof value === 'boolean' ? ' ' + String(value) : ''),
        });
        return [value_cell];
    },

    function_expression: (value, value_nodepath, id) => {
        const formula_bar_text = CT.print_AST_to_code_string(value_nodepath);
        const value_cell = create_cell({
            location: [0, 1], 
            ref_string: id,
            repr: String(value),
            formula_bar_value: "=" + formula_bar_text,
            classes: 'occupied read-only ' + typeof value + (typeof value === 'boolean' ? ' ' + String(value) : ''),
        });
        return [value_cell];
    },

/* ARRAY */

    array_ro: (array, array_nodepath, id) => {
    // TODO it may be nice if: when you click on this, it selects the whole array.
        return array.map((value, row_offset) => create_cell({
            location: [1 + row_offset, 0],
            repr: String(value),
            ref_string: id,
            formula_bar_value: CT.print_AST_to_code_string(array_nodepath.node),
            classes: "read-only",
        }));
    },

    array_rw: (array, array_nodepath, id) => {

        const array_node = array_nodepath.node;

        const value_cells = array.map((value, row_offset) => {
            const element_node = array_node.elements[row_offset];
            return create_cell({
                location: [1 + row_offset, 0],
                repr: String(value),
                ref_string: id,
                formula_bar_value: CT.print_AST_to_code_string(element_node),
                classes: 'editable',
                commit_edit: (state, action) => {
                    const old_code = state.code_editor.value;
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const arr_nodepath = item_nodepath.get('value');
                    CT.remove_array_element(arr_nodepath, row_offset);
                    CT.insert_array_element(arr_nodepath, row_offset, action.commit_value);
                    const new_code = CT.print_AST_to_code_string(AST);
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
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const arr_nodepath = item_nodepath.get('value');
                    CT.insert_array_element(arr_nodepath, row_offset, "null");
                    const new_code = CT.print_AST_to_code_string(AST);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_element: (state, action) => {
                    const old_code = state.code_editor.value;
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const arr_nodepath = item_nodepath.get('value');
                    CT.remove_array_element(arr_nodepath, row_offset);
                    const new_code = CT.print_AST_to_code_string(AST);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_container: (state) => {
                    const old_code = state.code_editor.value;
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const arr_nodepath = item_nodepath.get('value');
                    CT.delete_container(arr_nodepath);
                    const new_code = CT.print_AST_to_code_string(AST);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
            });
        })

        const append_cell = create_cell({
            location: [1 + array.length, 0],
            repr: '',
            ref_string: id,
            classes: 'append',
            formula_bar_value: '',
            commit_edit: (state, action) => {
                const old_code = state.code_editor.value;
                const AST = CT.parse_code_string_to_AST(old_code);
                const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                const item_nodepath = CT.get_object_item(module_nodepath, id);
                const arr_nodepath = item_nodepath.get('value');
                // TODO allow for formula cells
                CT.append_array_element(arr_nodepath, action.commit_value);
                const new_code = CT.print_AST_to_code_string(AST);
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
                const AST = CT.parse_code_string_to_AST(old_code);
                const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                const item_nodepath = CT.get_object_item(module_nodepath, id);
                const arr_nodepath = item_nodepath.get('value');
                CT.insert_array_element(arr_nodepath, array.length, "null");
                const new_code = CT.print_AST_to_code_string(AST);
                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE'
                });
            },
            delete_container: function (state) {
                const old_code = state.code_editor.value;
                const AST = CT.parse_code_string_to_AST(old_code);
                const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                const item_nodepath = CT.get_object_item(module_nodepath, id);
                const arr_nodepath = item_nodepath.get('value');
                CT.delete_container(arr_nodepath);
                const new_code = CT.print_AST_to_code_string(AST);
                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE'
                });
            },
        })
        
        return [...value_cells, append_cell];
    },

/* OBJECT */

    // TODO needs work - maybe look at how array_ro works
    object_ro: (object, object_nodepath, id) => {

        // TODO fact that we need to add the = here suggests
        // doing it in a function that is not supposed to know about it containing a formula,
        // is the wrong approach
        const formula_bar_text = "=" + CT.print_AST_to_code_string(object_nodepath);

        const cells = [];
        Object.entries(object).forEach(([key, value], row_offset) => {

            const key_cell = create_cell({
                location: [1 + row_offset, 0],
                repr: String(key), 
                ref_string: id,
                formula_bar_value: formula_bar_text,
                classes: 'object key read-only',
            });

            const value_cell = create_cell({
                location: [1 + row_offset, 1],
                repr: String(value), 
                ref_string: id,
                formula_bar_value: formula_bar_text,
                classes: 'object value read-only',
            });

            cells.push(key_cell, value_cell);
        });

        return [...cells];

    },

    object_rw: (object, object_nodepath, id) => {

        const cells = [];

        Object.entries(object).forEach(([key, value], row_offset) => {
            const pair_node = object_nodepath.node.properties[row_offset];

            const key_node = pair_node.key;
            const key_cell = create_cell({
                location: [1 + row_offset, 0],
                // TODO visually show the difference between keys surrounded by "" and those not?
                repr: String(key), 
                ref_string: id,
                formula_bar_value: CT.print_AST_to_code_string(key_node),
                classes: 'object key editable',
                // TODO computed keys?
                commit_edit: (state, action) => {
                    const new_id = action.commit_value;
                    const old_code = state.code_editor.value;
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_obj_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_obj_nodepath, id);
                    const obj_nodepath = item_nodepath.get('value');
                    const obj_item_nodepath = CT.get_object_item(obj_nodepath, key);
                    CT.replace_object_item_key(obj_item_nodepath, new_id);
                    const new_code = CT.print_AST_to_code_string(AST);
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
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const obj_nodepath = item_nodepath.get('value');
                    CT.insert_object_item(obj_nodepath, 'new_key', 'null');
                    const new_code = CT.print_AST_to_code_string(AST);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_element: (state, action) => {
                    const old_code = state.code_editor.value;
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const obj_nodepath = item_nodepath.get('value');
                    CT.remove_object_item(obj_nodepath, key);
                    const new_code = CT.print_AST_to_code_string(AST);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_container: function (state) {
                    const old_code = state.code_editor.value;
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const obj_nodepath = item_nodepath.get('value');
                    CT.delete_container(obj_nodepath);
                    const new_code = CT.print_AST_to_code_string(AST);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
            });

            let value_node = pair_node.value;
            let is_formula = false;
            if (pair_node.kind === 'get') {
                value_node = value_node.body.body[0].argument;
                is_formula = true;
            }
            console.log(is_formula);
            const value_cell = create_cell({
                location: [1 + row_offset, 1],
                // TODO show function bodies (currently show as blank)
                // Maybe we need a 'show as leaf' function
                repr: String(value), 
                ref_string: id,
                formula_bar_value: (is_formula ? '=' : '') + CT.print_AST_to_code_string(value_node),
                classes: 'object value' + (is_formula ? '' : ' editable'),
                commit_edit: (state, action) => {
                    const old_code = state.code_editor.value;
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_obj_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_obj_nodepath, id);
                    const obj_nodepath = item_nodepath.get('value');

                   // Should be able to merge with the code for commits to the module object
                    const index = CT.get_object_item_index(obj_nodepath, key);
                    CT.remove_object_item(obj_nodepath, key);
                    const inserted_code = rewrite_input(action.commit_value);
                    if (action.commit_value[0] === "=") {
                        CT.insert_object_getter(obj_nodepath, key, inserted_code, index);
                    } else {
                        CT.insert_object_item(obj_nodepath, key, inserted_code, index);
                    }

                    const new_code = CT.print_AST_to_code_string(AST);
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
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const obj_nodepath = item_nodepath.get('value');
                    CT.insert_object_item(obj_nodepath, "new_key", "null");
                    const new_code = CT.print_AST_to_code_string(AST);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_element: (state, action) => {
                    const old_code = state.code_editor.value;
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const obj_nodepath = item_nodepath.get('value');
                    CT.remove_object_item(obj_nodepath, key);
                    const new_code = CT.print_AST_to_code_string(AST);
 
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
                delete_container: function (state) {
                    const old_code = state.code_editor.value;
                    const AST = CT.parse_code_string_to_AST(old_code);
                    const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                    const item_nodepath = CT.get_object_item(module_nodepath, id);
                    const obj_nodepath = item_nodepath.get('value');
                    CT.delete_container(obj_nodepath);
                    const new_code = CT.print_AST_to_code_string(AST);
                    return Object.assign({}, state, {
                        code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                        mode: 'NEED_TO_CALCULATE'
                    });
                },
            });

            cells.push(key_cell, value_cell);
        });

        const append_cell = create_cell({
            location: [1 + cells.length / 2, 0],
            repr: '',
            ref_string: id,
            classes: 'add_key',
            formula_bar_value: '',
            commit_edit: (state, action) => {
                const old_code = state.code_editor.value;
                const AST = CT.parse_code_string_to_AST(old_code);
                const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                const item_nodepath = CT.get_object_item(module_nodepath, id);
                const obj_nodepath = item_nodepath.get('value');
                CT.insert_object_item(obj_nodepath, action.commit_value, "null");
                const new_code = CT.print_AST_to_code_string(AST);
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
                const AST = CT.parse_code_string_to_AST(old_code);
                const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                const item_nodepath = CT.get_object_item(module_nodepath, id);
                const obj_nodepath = item_nodepath.get('value');
                CT.insert_object_item(obj_nodepath, "new_key", "null");
                const new_code = CT.print_AST_to_code_string(AST);
                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE'
                });
            },
            delete_container: function (state) {
                const old_code = state.code_editor.value;
                const AST = CT.parse_code_string_to_AST(old_code);
                const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');
                const item_nodepath = CT.get_object_item(module_nodepath, id);
                const obj_nodepath = item_nodepath.get('value');
                CT.delete_container(obj_nodepath);
                const new_code = CT.print_AST_to_code_string(AST);
                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE'
                });
            },
        })

        return [...cells, append_cell];
    },

/* OTHER TYPES */

    records_ro: (records, ref_string, grid_loc, value_node) => {
        // Array (TODO change to a map?) of objects.
        // TODO allow user to specify headers, and therefore also order

        let [row_index, col_index] = grid_loc;

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
                        })
                    )
                }
            )
            records_to_add = records_to_add.reduce( (a, b) => a.concat(b) );
            return [...headers_to_add, ...records_to_add];
        }

        return [];
    },

    OOA: (obj, ref_string, grid_loc, value_node, headings) => {
        // Object of arrays (aka struct of arrays).
        // Allow user to specify an order of headings;
        // otherwise, is taken from Object.keys(obj).
        // Assumes all arrays are of the same length.
        // TODO should actually output another fn that has the headings baked in

        let [row_index, col_index] = grid_loc;

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
                })
            )

            // Add key cell
            const extra_cells = [];

            // Append cell
            const new_field_cell = create_cell({
                location: [row_index, col_index + keys.length],
                repr: '',
                ref_string: ref_string,
                classes: 'add_key',
                formula_bar_value: '',
                commit_edit: (state, action) => {
                    const old_code = state.code_editor.value;
                    const new_code = CT.OOA_add_field(old_code, ref_string, action.commit_value);
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

            const obj_node_props = value_node.properties;
            const record_cells = [];
            // TODO flip this around - first go by col (key), then by row
            for (let offset_r = 0; offset_r < record_count; offset_r++) {
                keys.map((key, offset_c) => {
                    let key_elements = get_key_elements(obj_node_props, key);
                    record_cells.push(
                        create_cell({
                            location: [row_index + offset_r, col_index + offset_c],
                            // TODO
                            repr: obj[key][offset_r],
                            formula_bar_value: "TODO",
                        })
                    )
                }
            )}
            
            // TODO append record cells
            // TODO append field cells
            // TODO attach delete actions (datum, field, record, entire ooa?)

            return [...header_cells, ...record_cells, ...extra_cells];

        } else {
            return [];
        }
    },
}

module.exports = {
    create_cell,
    EMPTY_CELL,
    display_fns,
};
