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

function leaf_classes(value) {
    return typeof value 
            + (typeof value === 'boolean' ? ' ' + String(value) : '')
            + (Error.prototype.isPrototypeOf(value) ? ' error' : '');
}

function get_formula_bar_text(is_formula, raw_text) {
    if (is_formula) {
        return '=' + raw_text;
    } else if (raw_text[0] === "`" && raw_text.slice(-1) === "`") {
        return raw_text.slice(1, -1);
    }
    return raw_text;
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
        const raw_text = CT.print_AST_to_code_string(value_nodepath);
        const is_formula = leaf_is_formula(value_nodepath.node);
        const value_cell = {
            location: [0, 1], 
            ref_string: id,
            repr: String(value),
            formula_bar_value: get_formula_bar_text(is_formula, raw_text),
            classes: 'occupied ' + leaf_classes(value) + (is_formula ? '' : ' editable'),
            cell_AST_changes_type: 'DEFAULT', 
            AST_props: {key: id},
        };
        return [value_cell];
    },

/* ARRAY */

    array_ro: (array, array_nodepath, id, AST) => {
    // TODO it may be nice if: when you click on this, it selects the whole array.
        const raw_text = CT.print_AST_to_code_string(array_nodepath.node);
        const is_formula = leaf_is_formula(array_nodepath.node);
        const formula_bar_value = get_formula_bar_text(is_formula, raw_text);
        return array.map((value, row_offset) => {
            return {
                location: [1 + row_offset, 0],
                repr: String(value),
                ref_string: id,
                formula_bar_value: formula_bar_value,
                classes: "read-only " + leaf_classes(value),
                cell_AST_changes_type: 'DEFAULT', 
                AST_props: {key: id},
            }
        });
    },

    array_rw: (array, array_nodepath, id, AST) => {

        const array_node = array_nodepath.node;

        const value_cells = array.map((value, row_offset) => {
            const element_node = array_node.elements[row_offset];
            const is_formula = leaf_is_formula(element_node);
            const raw_text = CT.print_AST_to_code_string(element_node);
            return ({
                location: [1 + row_offset, 0],
                repr: String(value),
                AST_props: {index: row_offset, key: id},
                ref_string: id,
                formula_bar_value: get_formula_bar_text(is_formula, raw_text),
                classes: leaf_classes(value) + (is_formula ? '' : ' editable'),
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
        const raw_text = CT.print_AST_to_code_string(object_nodepath);
        const formula_bar_text = get_formula_bar_text(true, raw_text);

        const cells = [];
        Object.entries(object).forEach(([key, value], row_offset) => {

            const key_cell = ({
                location: [1 + row_offset, 0],
                repr: String(key), 
                ref_string: id,
                formula_bar_value: formula_bar_text,
                classes: 'object key read-only',
                cell_AST_changes_type: 'DEFAULT',
                AST_props: {key: id},
            });

            const value_cell = ({
                location: [1 + row_offset, 1],
                repr: String(value), 
                ref_string: id,
                formula_bar_value: formula_bar_text,
                classes: 'object read-only ' + leaf_classes(value),
                cell_AST_changes_type: 'DEFAULT',
                AST_props: {key: id},
            });

            cells.push(key_cell, value_cell);
        });

        return [...cells];

    },

    object_rw: (object, object_nodepath, id, AST) => {

        const cells = [];

        Object.entries(object).forEach(([key, value], row_offset) => {
            const prop_node = object_nodepath.node.properties[row_offset];

            const key_node = prop_node.key;
            let raw_text = CT.print_AST_to_code_string(key_node);
            let formula_bar_text = get_formula_bar_text(false, raw_text);
            const key_cell = ({
                location: [1 + row_offset, 0],
                // TODO visually show the difference between keys surrounded by "" and those not?
                repr: String(key), 
                ref_string: id,
                formula_bar_value: formula_bar_text,
                classes: 'object key editable',
                AST_props: {key: id, item_key: key},
                // TODO computed keys?
                cell_AST_changes_type: 'OBJECT_LITERAL_KEY_CELL',
            });

            let value_node;
            if (prop_node.type === 'getter') {
                value_node = pair_node.value.body.body[0].argument;
            } else {
                value_node = prop_node.value;
            };
            const is_formula = leaf_is_formula(value_node);
            raw_text = CT.print_AST_to_code_string(value_node);
            formula_bar_text = get_formula_bar_text(is_formula, raw_text);
            const value_cell = ({
                location: [1 + row_offset, 1],
                // TODO show function bodies (currently show as blank)
                // Maybe we need a 'show as leaf' function
                // to get the right styling etc
                repr: String(value), 
                ref_string: id,
                formula_bar_value: formula_bar_text, 
                classes: 'object value ' + leaf_classes(value) + (is_formula ? '' : ' editable'),
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
    table_rw: (arr, obj_nodepath, id, AST) => {
        // Table structured as object of arrays: {heading: [values], ...}.
        // By the time it gets to here, the data is an array,
        // but the nodepath is still an object literal.
        // TODO

        const raw_text = CT.print_AST_to_code_string(obj_nodepath);
        const formula_bar_text = get_formula_bar_text(true, raw_text);

        // TOOD make filtering __proto__ a dedicated function
        const headings = obj_nodepath.get("properties").value
                        .filter(k => !(k.key.name === "__proto__"))
                        .map(k => k.key.value);

        // Headers
        const header_cells = headings.map(
            (heading, col_offset) => ({
                // TODO
                location: [1, col_offset], 
                repr: String(heading),
                classes: 'heading',
                formula_bar_value: heading,
                AST_props: {key: id, heading: heading},
                cell_AST_changes_type: 'OOA_LITERAL_COLUMN_CELL',
            })
        )
        
        // Add column
        // TODO get working for 'no headings' case
        const add_column_cell = {
            location: [1, headings.length],
            repr: '',
            classes: 'add_col',
            formula_bar_value: '',
            cell_AST_changes_type: 'OOA_LITERAL_ADD_COLUMN_CELL',
            AST_props: {key: id},
        };
        
        // Records
        const col_nodes = {};
        for (let prop_node of obj_nodepath.get("properties").value) {
            let key = CT.get_object_key_from_node(prop_node.key);
            col_nodes[key] = prop_node.value;
        }
        // TODO flip this around - first go by col (key), then by row
        // that way we can have different behaviour for array literals
        // versus results of function calls / generators
        const record_cells = [];
        for (let offset_r = 0; offset_r < arr.length; offset_r++) {
            headings.map((heading, offset_c) => {
                let elem_node = col_nodes[heading].elements[offset_r];
                let is_formula = leaf_is_formula(elem_node);
                let raw_text = CT.print_AST_to_code_string(elem_node);
                let formula_bar_text = get_formula_bar_text(is_formula, raw_text);
                let value = arr[offset_r][heading];
                record_cells.push(
                    ({
                        location: [2 + offset_r, offset_c],
                        repr: value,
                        formula_bar_value: formula_bar_text,
                        cell_AST_changes_type: 'OOA_LITERAL_VALUE_CELL',
                        AST_props: {key: id, item_key: heading, index: offset_r},
                        classes: 'object value ' + leaf_classes(value) 
                                    + (is_formula ? '' : ' editable'),
                    })
                )
            }
        )}
        
        // Append cell
        const append_record_cells = headings.map((heading, offset_c) => ({
            location: [2 + arr.length, offset_c],
            repr: '',
            classes: 'append',
            formula_bar_value: "",
            cell_AST_changes_type: 'OOA_LITERAL_APPEND_CELL',
            AST_props: {key: id, item_key: heading},
        }))

        return [...header_cells, add_column_cell, ...record_cells, ...append_record_cells];

    },

}

module.exports = { display_fns, EMPTY_CELL };
