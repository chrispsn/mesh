const ASTmod = require(__dirname + '/code_transformers.js');
const formula_bar = document.getElementById('formula-bar');
const {replace_text} = require(__dirname + '/code_transformers.js');

function get_cell_id_from_location (location) {
    return location.map(i => i.toString()).join('-');
}

function get_cell(cells, location) {
    const cell_id = get_cell_id_from_location(location);
    if (cells.hasOwnProperty(cell_id)) {
        return cells[cell_id];
    } else {
        return Object.assign({}, EMPTY_CELL, {location: location});
    }
}

const default_reducers = {

    select: (state, action) => {
        const this_cell = get_cell(state.cells, action.location);
        return Object.assign({}, state, {
            formula_bar: Object.assign({}, state.formula_bar, 
                {value: this_cell.formula_bar_value}),
            code_editor: Object.assign({}, state.code_editor,
                {selection: this_cell.code_location}),
            selected_cell_loc: action.location
        });
    },

    edit: (state) => {
        if (state.mode !== 'EDIT') {
            return Object.assign({}, state, {
                formula_bar: Object.assign({}, state.formula_bar, {focused: true}), 
                mode: 'EDIT'
            });
        } else {
            return state;
        }
    },

    commit_edit: (state) => {
        // TODO Check that the commit is valid first?
        const this_cell = get_cell(state.cells, state.selected_cell_loc);

        const text_to_insert = Mesh.HTML_elements.formula_bar.value;
        const old_code = state.code_editor.value;
        const new_code = replace_text(old_code, this_cell.code_location, text_to_insert)

        return Object.assign({}, state, {
            formula_bar: Object.assign({}, state.formula_bar, {focused: false}),
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE'
        });
    },

    discard_edit: (state) => {
        return Object.assign({}, state, {
            formula_bar: Object.assign({}, state.formula_bar,
                                        {focused: false, mode: 'READY'})
        });
    },

    delete_value: (state) => {
        const this_cell = get_cell(state.cells, state.selected_cell_loc);
        const old_code = state.code_editor.value;
        const new_code = replace_text(old_code, this_cell.code_location, 'null');

        return Object.assign({}, state, {
            formula_bar: Object.assign({}, state.formula_bar, {focused: false}),
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE'
        });

    }

}

const EMPTY_CELL = { 
    formula_bar_value: "", 
    // TODO does it need only some of the reducers?
    reducers: Object.assign({}, default_reducers, {
        commit_edit: (state) => {
            const variable_name = formula_bar.value;
            const old_AST = new ASTmod.AST(state.code_editor.value);
            const new_AST = old_AST
                            .create_const_variable(variable_name)
                            .add_attachment(variable_name, state.selectedCell)
            const new_code = new_AST.to_string;

            return Object.assign({}, state, {
                code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                formula_bar: {selected: false},
                mode: 'NEED_TO_CALCULATE'
            });
        }
    }
)}

module.exports = {
    default_reducers: default_reducers,
    EMPTY_CELL: EMPTY_CELL,
    get_cell: get_cell,
    get_cell_id_from_location: get_cell_id_from_location,
}
