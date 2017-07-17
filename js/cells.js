const {replace_text} = require(__dirname + '/code_transformers.js');

const default_cell_props = {repr: '', 
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
        const old_code = state.code_editor.value;
        const new_code = replace_text(old_code, this.code_location, action.commit_value)
            console.log(new_code);

        return Object.assign({}, state, {
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE',
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
        const new_code = replace_text(old_code, this.code_location, 'null');

        return Object.assign({}, state, {
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE'
        });
    },

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
        const new_AST = state.AST
                        .create_const_variable(variable_name)
                        .add_attachment(variable_name, state.selected_cell_loc)
        const new_code = new_AST.to_string;

        const new_selection_offset = [0, 0];
        switch (action.direction) {
            case 'RIGHT': new_selection_offset[1] = 1; break;
            case 'DOWN': new_selection_offset[0] = 1; break;
        }

        return Object.assign({}, state, {
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE',
            selected_cell_loc: [
                state.selected_cell_loc[0] + new_selection_offset[0],
                state.selected_cell_loc[1] + new_selection_offset[1]
            ]
        });
    }
}))

module.exports = {
    create_cell,
    EMPTY_CELL,
}