// TODO can we avoid passing in the whole AST node and just pass in the locs
// (and child locs)? No need to know anything about an AST. But maybe this way is easier...
// TODO can we avoid getting the code pane contents directly from this file?
// (pass it in, or something even better?)
// TODO fix inconsistency in function arg order between Mesh.attach and these

const {create_cell} = require(__dirname + '/cells.js');
const {get_text, append_to_array} = require(__dirname + '/code_transformers.js');

// TODO make this a display function like any other again - not just a helper?
function create_ref_string_cell(ref_string, location, declaration_AST_node) {
    return create_cell({
        location: location,
        repr: ref_string,
        ref_string: ref_string,
        formula_bar_value: ref_string,
        classes: 'identifier',
        code_location: declaration_AST_node.id.loc,
    });
}

function write_dummy(value, ref_string, location, declaration_AST_node) {
    // For use where you don't know what to use for the formula bar value
    // and code location values yet.

    let [row_index, col_index] = location;

    return [create_cell({
        location: [row_index, col_index + 1],
        repr: 'TODO',
        ref_string: ref_string,
        formula_bar_value: "TODO",
        code_location: undefined,
    })];
}

function write_value(value, ref_string, location, declaration_AST_node) {

    const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);

    const code_text = Mesh.store.getState().code_editor.value;

    let [row_index, col_index] = location;

    const value_cell = create_cell({
        location: [row_index, col_index + 1], 
        repr: String(value),
        ref_string: ref_string,
        formula_bar_value: get_text(code_text, declaration_AST_node.init.loc),
        code_location: declaration_AST_node.init.loc,
        classes: 'literal',
    });
    
    return [ref_string_cell, value_cell];
}

function write_array_ro(array, ref_string, location, declaration_AST_node) {
    // TODO it may be nice if, when you click on this, it selects the whole array.

    const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);

    let [row_index, col_index] = location;

    row_index++;

    const code_text = Mesh.store.getState().code_editor.value;

    const new_cells = array.map( (val, row_offset) => create_cell({
        location: [row_index + row_offset, col_index],
        repr: String(val),
        ref_string: ref_string,
        formula_bar_value: get_text(code_text, declaration_AST_node.init.loc),
        code_location: declaration_AST_node.init.loc,
    }))

    return [ref_string_cell, ...new_cells];
}

function write_array_rw(array, ref_string, location, declaration_AST_node) {

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
            formula_bar_value: get_text(code_text, element_loc),
            code_location: element_loc,
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
        repr: '<append here>',
        ref_string: ref_string,
        classes: 'append',
        formula_bar_value: '',
        code_location: append_location,
        commit_edit: (state, action) => {
            const text_to_insert = action.commit_value;
            const new_code = append_to_array(
                                code_text, declaration_AST_node.init.loc.end,
                                array.length, text_to_insert);
            return Object.assign({}, state, {
                mode: 'NEED_TO_CALCULATE', 
                code_editor: Object.assign({}, state.code_editor, {value: new_code})
            });
        },
    })
    
    return [ref_string_cell, ...value_cells, append_cell];
}

function write_map(map, ref_string, location, declaration_AST_node) {

    const ref_string_cell = create_ref_string_cell(ref_string, location, declaration_AST_node);

    let [row_index, col_index] = location;

    row_index++;

    const cells = [];

    Array.from(map.entries()).map((entry, index) => {
        let [key, value] = entry;
        const key_cell = create_cell({
            repr: String(key), 
            ref_string: ref_string,
            location: [row_index + index, col_index],
            classes: 'map',
            formula_bar_value: "TODO",
            code_location: undefined,
        })
        const value_cell = create_cell({
            location: [row_index + index, col_index + 1],
            repr: String(value), 
            ref_string: ref_string,
            classes: 'map',
            formula_bar_value: "TODO",
            code_location: undefined,
        })
        cells.push(key_cell, value_cell);
    });

    return [ref_string_cell, ...cells];

}

const Entries_shim = require('object.entries')
if (!Object.entries) {
    Entries_shim.shim();
}

function write_object(object, ref_string, location, declaration_AST_node) {

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
            classes: 'object',
            code_location: key_node.loc,
            formula_bar_value: get_text(code_text, key_node.loc),
        });

        const value_node = pair_node.value;
        const value_cell = create_cell({
            location: [row_index, col_index + 1],
            repr: String(value), 
            ref_string: ref_string,
            classes: 'object',
            code_location: value_node.loc,
            formula_bar_value: get_text(code_text, value_node.loc),
        });

        row_index++;
        cells.push(key_cell, value_cell);
    };

    return [ref_string_cell, ...cells];

}

function write_records(records, ref_string, location, declaration_AST_node) {
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
