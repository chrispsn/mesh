const ASTmod = require(__dirname + '/code_transformers.js');
const formula_bar = document.getElementById('formula-bar');
const {replace_text} = ASTmod;

function get_cell(cells, location) {
    const cell_id = JSON.stringify(location);
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
                mode: 'EDIT'
            });
        } else {
            return state;
        }
    },

    edit_replace: (state) => {
        if (state.mode !== 'EDIT') {
            return Object.assign({}, state, {
                mode: 'EDIT',
                formula_bar: Object.assign({}, state.formula_bar, {value: ''}),
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
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE',
        });
    },

    discard_edit: (state) => {
        return Object.assign({}, state, {mode: 'READY'});
    },

    delete_value: (state) => {
        const this_cell = get_cell(state.cells, state.selected_cell_loc);
        const old_code = state.code_editor.value;
        const new_code = replace_text(old_code, this_cell.code_location, 'null');

        return Object.assign({}, state, {
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE'
        });

    }

}

const EMPTY_CELL = { 
    // What if... this was a class? Would that add anything?
    formula_bar_value: "", 
    // TODO does it need only some of the reducers?
    reducers: Object.assign({}, default_reducers, {
        commit_edit: (state, action) => {
            const variable_name = formula_bar.value;
            const old_AST = new ASTmod.AST(state.code_editor.value);
            const new_AST = old_AST
                            .create_const_variable(variable_name)
                            .add_attachment(variable_name, state.selected_cell_loc)
            const new_code = new_AST.to_string;

            const new_selection_offset = [0, 0];
            switch (action.direction) {
                case 'RIGHT': new_selection_offset[1] = 1; break;
                case 'DOWN': new_selection_offset[0] = 1; break;
            }

            return Object.assign({}, state, {
                formula_bar: Object.assign({}, state.formula_bar, {selected: false}),
                code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                mode: 'NEED_TO_CALCULATE',
                selected_cell_loc: [
                    state.selected_cell_loc[0] + new_selection_offset[0],
                    state.selected_cell_loc[1] + new_selection_offset[1]
                ]
            });
        }
    }
)}

module.exports = {
    default_reducers: default_reducers,
    EMPTY_CELL: EMPTY_CELL,
    get_cell: get_cell,
}
