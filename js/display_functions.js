// TODO I would like to change 'sheet' to 'vgrid',
// but right now they sometimes rely on the vgrid extender.
// Maybe the extender can be refactored out?
// Makes sense - the logic for what goes where shouldn't need to worry about extensions
//
// TODO can we avoid passing in the whole AST node and just pass in the locs
// (and child locs)? No need to know anything about an AST. But maybe this way is easier...

const default_reducers = require(__dirname + '/default_cell_logic.js');
const code_transformers = require(__dirname + '/code_transformers.js');
const {get_text, replace_text, append_to_array, AST} = code_transformers;

function get_ref_string_cell(ref_string, sheet, location, declaration_AST_node) {
    return {
        location: [...location], 
        cell_props: {
            repr: ref_string,
            ref_string: ref_string,
            formula_bar_value: ref_string,
            classes: 'identifier',
            code_location: declaration_AST_node.id.loc,
            reducers: default_reducers
        }
    };
}

function write_dummy(value, ref_string, sheet, location, declaration_AST_node) {
    // For use where you don't know what to use for the formula bar value
    // and code location values yet.

    let [row_index, col_index] = location;

    const cell_props = {
        repr: String(value),
        ref_string: ref_string,
        formula_bar_value: "TODO",
        code_location: undefined,
        reducers: default_reducers
    }
    
    sheet.add_cells([{
        location: [row_index, col_index + 1],
        cell_props: cell_props
    }]);
}

function write_value(value, ref_string, sheet, location, declaration_AST_node) {

    const ref_string_cell = get_ref_string_cell(ref_string, sheet, location, declaration_AST_node);

    const code_text = Mesh.store.getState().code_editor.value;

    const cell_props = {
        repr: String(value),
        ref_string: ref_string,
        formula_bar_value: get_text(code_text, declaration_AST_node.init.loc),
        code_location: declaration_AST_node.init.loc,
        classes: 'literal',
        reducers: default_reducers
    }

    let [row_index, col_index] = location;

    const value_cell = {
        location: [row_index, col_index + 1], 
        cell_props: cell_props
    }
    
    sheet.add_cells([ref_string_cell, value_cell]);
}

function write_array_ro(array, ref_string, sheet, location, declaration_AST_node) {
    // TODO it may be nice if, when you click on this, it selects the whole array.

    const ref_string_cell = get_ref_string_cell(ref_string, sheet, location, declaration_AST_node);

    let [row_index, col_index] = location;

    row_index++;

    const code_text = Mesh.store.getState().code_editor.value;

    const new_cells = array.map( (val, row_offset) => ({
        location: [row_index + row_offset, col_index],
        cell_props: {
            repr: String(val),
            ref_string: ref_string,
            formula_bar_value: get_text(code_text, declaration_AST_node.init.loc),
            code_location: declaration_AST_node.init.loc,
            reducers: default_reducers
        }
    }))

    sheet.add_cells([ref_string_cell, ...new_cells]);
}

function write_array_rw(array, ref_string, sheet, location, declaration_AST_node) {

    const ref_string_cell = get_ref_string_cell(ref_string, sheet, location, declaration_AST_node);

    let [row_index, col_index] = location;

    row_index++;

    const code_text = Mesh.store.getState().code_editor.value;

    const value_cells = array.map( (val, row_offset) => {
        const element_loc = declaration_AST_node.init.elements[row_offset].loc;
        return {
            location: [row_index + row_offset, col_index],
            cell_props: {
                repr: String(val),
                ref_string: ref_string,
                formula_bar_value: get_text(code_text, element_loc),
                code_location: element_loc,
                reducers: default_reducers
            }
        }
    })

    // Append cell
    const append_location = {
        start: {
            line: declaration_AST_node.init.loc.end.line,
            column: declaration_AST_node.init.loc.end.column - 1
        },
        end: declaration_AST_node.init.loc.end
    };

    const commit_edit = (state) => {
        // TODO Check that the commit is valid first?
        const text_to_insert = Mesh.HTML_elements.formula_bar.value;
        const new_code = code_transformers.append_to_array(
                            code_text, declaration_AST_node.init.loc.end,
                            array.length, text_to_insert);
        return Object.assign({}, state, {
            mode: 'NEED_TO_CALCULATE', 
            formula_bar: Object.assign({}, state.formula_bar, {focused: false}),
            code_editor: Object.assign({}, state.code_editor, {value: new_code})
        });
    }

    const append_cell = {
        location: [row_index + value_cells.length, col_index],
        cell_props: {
            repr: '<append here>',
            ref_string: ref_string,
            classes: 'append',
            formula_bar_value: '',
            code_location: append_location,
            reducers: Object.assign({}, default_reducers, 
                        {commit_edit: commit_edit})
        }
    }
    
    sheet.add_cells([ref_string_cell, ...value_cells, append_cell]);
}

function write_map(map, ref_string, sheet, location, declaration_AST_node) {

    const ref_string_cell = get_ref_string_cell(ref_string, sheet, location, declaration_AST_node);

    let [row_index, col_index] = location;

    row_index++;

    const cells = [];

    Array.from(map.entries()).map((entry, index) => {
        let [key, value] = entry;
        const key_cell = {
            location: [row_index + index, col_index],
            cell_props: {
                repr: String(key), 
                ref_string: ref_string,
                classes: 'map',
                formula_bar_value: "TODO",
                code_location: undefined,
                reducers: default_reducers
            }
        }
        const value_cell = {
            location: [row_index + index, col_index + 1],
            cell_props: {
                repr: String(value), 
                ref_string: ref_string,
                classes: 'map',
                formula_bar_value: "TODO",
                code_location: undefined,
                reducers: default_reducers
            }
        };
        cells.push(key_cell, value_cell);
    });

    sheet.add_cells([ref_string_cell, ...cells]);

}

const Entries_shim = require('object.entries')
if (!Object.entries) {
    Entries_shim.shim();
}

function write_object(object, ref_string, sheet, location, declaration_AST_node) {

    const ref_string_cell = get_ref_string_cell(ref_string, sheet, location, declaration_AST_node);

    let [row_index, col_index] = location;
    const starting_row_index = location[0];

    row_index++;

    const cells = [];

    const code_text = Mesh.store.getState().code_editor.value;

    for (let [key, value] of Object.entries(object)) {
        const pair_node = declaration_AST_node.init
                            .properties[row_index - starting_row_index - 1]

        const key_node = pair_node.key;
        const key_cell = {
            location: [row_index, col_index],
            cell_props: {
                repr: String(key), 
                ref_string: ref_string,
                classes: 'object',
                code_location: key_node.loc,
                formula_bar_value: get_text(code_text, key_node.loc),
                reducers: default_reducers
            }
        };

        const value_node = pair_node.value;
        const value_cell = {
            location: [row_index, col_index + 1],
            cell_props: {
                repr: String(value), 
                ref_string: ref_string,
                classes: 'object',
                code_location: value_node.loc,
                formula_bar_value: get_text(code_text, value_node.loc),
                reducers: default_reducers
            }
        };

        row_index++;
        cells.push(key_cell, value_cell);
    };

    sheet.add_cells([ref_string_cell, ...cells]);

}

function write_records(records, ref_string, sheet, location) {
    // Array of maps.
    // TODO allow user to specify headers, and therefore also order
    
    let [row_index, col_index] = location;

    // Write the ref_string
    const ref_string_cell = get_ref_string_cell(ref_string, sheet, location, declaration_AST_node);
    row_index++;

    // Write the data structure
    if (records.length > 0) {
        
        // TODO
        // This code can probably be simplified
        // Since it's the same logic for headers and records
        
        // Headers
        headers_to_add = [...records[0].keys()].map(
            (key, col_offset) => ({
                location: [row_index, col_index + col_offset], 
                cell_props: {
                    repr: String(key),
                    classes: 'heading',
                    formula_bar_value: "TODO",
                    code_location: undefined,
                    reducers: default_reducers
                }
            })
        )
        sheet.add_cells(headers_to_add);
        row_index++;

        // Records
        let cells_to_add = records.map(
            (record, row_offset) => {
                const current_row = row_index + row_offset;
                return [...record.values()].map(
                    (val, offset) => ({
                        location: [current_row, col_index + offset],
                        cell_props: {
                            repr: val,
                            formula_bar_value: "TODO",
                            code_location: undefined,
                            reducers: default_reducers
                        }
                    })
                )
            }
        )
        cells_to_add = cells_to_add.reduce( (a, b) => a.concat(b) );
        sheet.add_cells([ref_string_cell, ...cells_to_add]);
    }
}

module.exports = {
    write_dummy: write_dummy,
    write_value: write_value,
    write_array_ro: write_array_ro,
    write_array_rw: write_array_rw,
    write_map: write_map,
    write_object: write_object,
    write_records: write_records
}
