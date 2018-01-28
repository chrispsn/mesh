'use strict';

const CT = require('./code_transformers');

// TODO Do we really need an explicit 'empty' cell?
// Surely the React component can adjust for that
const EMPTY_CELL = {
    repr: '', 
    ref_string: null, 
    formula_bar_value: '',
    classes: '', 
    cell_AST_changes_type: 'EMPTY',
}

function leaf_is_formula(node) {
    return !['Literal', 'TemplateLiteral', 'UnaryExpression'].includes(node.type);
}

const display_fns = {

    dummy: (value, value_nodepath, id, AST) => {
        // For use where you don't know what to use for the formula bar value
        // and code location values yet.
        return [{
            location: [0, 1],
            ref_string: id,
            repr: 'TODO',
            formula_bar_value: "TODO",
            classes: '',
            cell_AST_changes_type: 'DEFAULT', 
            AST_props: {key: id},
        }];
    },

    value: (value, value_nodepath, id, AST) => {
        const formula_bar_text = CT.print_AST_to_code_string(value_nodepath);
        const is_formula = leaf_is_formula(value_nodepath.node);
        const value_cell = {
            location: [0, 1], 
            ref_string: id,
            repr: String(value),
            formula_bar_value: (is_formula ? '=' : '') + formula_bar_text,
            classes: 'occupied ' + typeof value 
                + (typeof value === 'boolean' ? ' ' + String(value) : '')
                + (is_formula ? '' : ' editable'),
            cell_AST_changes_type: 'DEFAULT', 
            AST_props: {key: id},
        };
        return [value_cell];
    },

/* ARRAY */

    array_ro: (array, array_nodepath, id, AST) => {
    // TODO it may be nice if: when you click on this, it selects the whole array.
        return array.map((value, row_offset) => ({
            location: [1 + row_offset, 0],
            repr: String(value),
            ref_string: id,
            formula_bar_value: "=" + CT.print_AST_to_code_string(array_nodepath.node),
            classes: "read-only",
            cell_AST_changes_type: 'DEFAULT', 
            AST_props: {key: id},
        }));
    },

    array_rw: (array, array_nodepath, id, AST) => {

        const array_node = array_nodepath.node;

        const value_cells = array.map((value, row_offset) => {
            const element_node = array_node.elements[row_offset];
            const is_formula = leaf_is_formula(element_node);
            return ({
                location: [1 + row_offset, 0],
                repr: String(value),
                AST_props: {index: row_offset, key: id},
                ref_string: id,
                formula_bar_value: (is_formula ? '=' : '') + CT.print_AST_to_code_string(element_node),
                classes: is_formula ? '' : 'editable',
                cell_AST_changes_type: 'ARRAY_LITERAL_DATA_CELL',
            });
        })

        const append_cell = ({
            location: [1 + array.length, 0],
            repr: '',
            AST_props: {index: 1 + array.length, key: id},
            ref_string: id,
            classes: 'append',
            formula_bar_value: '',
            cell_AST_changes_type: 'ARRAY_LITERAL_APPEND_CELL',
        })
        
        return [...value_cells, append_cell];
    },

/* OBJECT */

    // TODO needs work - maybe look at how array_ro works
    object_ro: (object, object_nodepath, id, AST) => {

        // TODO fact that we need to add the = here suggests
        // doing it in a function that is not supposed to know about it containing a formula,
        // is the wrong approach
        const formula_bar_text = "=" + CT.print_AST_to_code_string(object_nodepath);

        const cells = [];
        Object.entries(object).forEach(([key, value], row_offset) => {

            const key_cell = ({
                location: [1 + row_offset, 0],
                repr: String(key), 
                ref_string: id,
                formula_bar_value: formula_bar_text,
                classes: 'object key read-only',
                cell_AST_changes_type: 'DEFAULT',
            });

            const value_cell = ({
                location: [1 + row_offset, 1],
                repr: String(value), 
                ref_string: id,
                formula_bar_value: formula_bar_text,
                classes: 'object value read-only',
                cell_AST_changes_type: 'DEFAULT',
            });

            cells.push(key_cell, value_cell);
        });

        return [...cells];

    },

    object_rw: (object, object_nodepath, id, AST) => {

        const cells = [];

        Object.entries(object).forEach(([key, value], row_offset) => {
            const pair_node = object_nodepath.node.properties[row_offset];

            const key_node = pair_node.key;
            const key_cell = ({
                location: [1 + row_offset, 0],
                // TODO visually show the difference between keys surrounded by "" and those not?
                repr: String(key), 
                ref_string: id,
                formula_bar_value: CT.print_AST_to_code_string(key_node),
                classes: 'object key editable',
                AST_props: {key: id, item_key: key},
                // TODO computed keys?
                cell_AST_changes_type: 'OBJECT_LITERAL_KEY_CELL',
            });

            let value_node = pair_node.value.body.body[0].argument;
            const is_formula = leaf_is_formula(value_node);
            const value_cell = ({
                location: [1 + row_offset, 1],
                // TODO show function bodies (currently show as blank)
                // Maybe we need a 'show as leaf' function
                repr: String(value), 
                ref_string: id,
                formula_bar_value: (is_formula ? '=' : '') + CT.print_AST_to_code_string(value_node),
                classes: 'object value' + (is_formula ? '' : ' editable'),
                AST_props: {key: id, item_key: key},
                cell_AST_changes_type: 'OBJECT_LITERAL_VALUE_CELL',
            });

            cells.push(key_cell, value_cell);
        });

        const append_cell = ({
            location: [1 + cells.length / 2, 0],
            repr: '',
            ref_string: id,
            classes: 'add_key',
            formula_bar_value: '',
            AST_props: {key: id},
            cell_AST_changes_type: 'OBJECT_LITERAL_APPEND_CELL',
        })

        return [...cells, append_cell];
    },

// TODO Pretty much everything below this line is completely broken right now

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
                (key, col_offset) => ({
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
                        (val, col_offset) => ({
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
    table_object_rw: (arr, obj_nodepath, id, AST) => {
        // Table structured as object of arrays: {heading: [values], ...}

        let [row_index, col_index] = [1, 0];

        const headings = Object.keys(obj);

        // Write the data structure
        if (keys.length > 0) {
            
            // Headers
            const header_cells = keys.map(
                (key, col_offset) => ({
                    location: [row_index, col_index + col_offset], 
                    repr: String(key),
                    classes: 'heading',
                    formula_bar_value: "TODO",
                })
            )

            // Add key cell
            const extra_cells = [];

            // Append cell
            const new_field_cell = ({
                location: [row_index, col_index + keys.length],
                repr: '',
                ref_string: ref_string,
                classes: 'add_key',
                formula_bar_value: '',
                commit_edit: (state, action) => {
                    const old_code = state.code_editor.value;
                    CT.OOA_add_field(old_code, ref_string, action.commit_value);
                    return new_state_after_AST_transforms(state, AST, action.offset);
                },
            })
            extra_cells.push(new_field_cell)
            
            // Records
            const record_count = obj[headings[0]].length;
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
                        ({
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

    table_object_rw: (value, value_nodepath, id) => {
        // TODO
    },

}

module.exports = { display_fns, EMPTY_CELL };
