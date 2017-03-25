/*
 * These functions change the virtual state when certain cell-related actions are done.
 * Other logic handles syncing the virtual state with the actual state.
 * Not all functions need to be implemented by every kind of cell.
 */

const CodeTransformers = require(__dirname + '/code_transformers.js');
const {replace_text} = CodeTransformers;

module.exports = {

    select: (state) => {
        const [row, col] = state.selectedCell
        const this_cell = state.vgrid[row][col];
        const new_cell = Object.assign({}, this_cell, {selected: true});
        const new_vgrid = [...state.vgrid];
        new_vgrid[row][col] = new_cell;
        return Object.assign({}, state, {
            vgrid: new_vgrid,
            formula_bar: Object.assign({}, state.formula_bar, 
                {value: this_cell.formula_bar_value}),
            code_editor: Object.assign({}, state.code_editor,
                {selection: this_cell.code_location})
        });
    },

    deselect: (state) => {
        const [row, col] = state.selectedCell;
        const this_cell = state.vgrid[row][col];
        const new_cell = Object.assign({}, this_cell, {selected: false});
        const new_vgrid = [...state.vgrid];
        new_vgrid[row][col] = new_cell;
        return Object.assign({}, state, {vgrid: new_vgrid});
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
        // TODO replace with get_cell or similar
        const [row_idx, col_idx] = state.selectedCell;
        const this_cell = state.vgrid[row_idx][col_idx];

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
        const [row_idx, col_idx] = state.selectedCell;
        const this_cell = state.vgrid[row_idx][col_idx];

        const old_code = state.code_editor.value;
        const new_code = replace_text(old_code, this_cell.code_location, 'null');

        return Object.assign({}, state, {
            formula_bar: Object.assign({}, state.formula_bar, {focused: false}),
            code_editor: Object.assign({}, state.code_editor, {value: new_code}),
            mode: 'NEED_TO_CALCULATE'
        });
    }

}
