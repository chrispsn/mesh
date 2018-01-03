'use strict';

const {get_cell, get_selected_cell} = require('./selectors');
const {EMPTY_CELL} = require('./display');

const INITIAL_STATE = {
    mode: 'NEED_TO_CALCULATE',
    cells: {
        '[0, 0]': Object.assign({}, EMPTY_CELL, {location: [0, 0]})
    },
    selected_cell_loc: [0, 0],
    code_editor: { value: '', selection: undefined, show: true },
    loaded_filepath: null,
    formula_bar_value: '',
}

// TODO is there a more brief alternative to Object.assign?

const state_changes = {

    'RESET_STATE': (state, action) => Object.assign({}, state, INITIAL_STATE),

    /* CODE PANE */

    'SELECT_CODE': (state, action) => Object.assign({}, state, {mode: 'EDITING_CODE'}),

    'TOGGLE_CODE_PANE_SHOW': (state, action) => Object.assign({}, state, {
        code_editor: Object.assign({}, state.code_editor, 
            {show: !state.code_editor.show}),
    }),

    'LOAD_CODE': (state, action) => Object.assign({}, state, {
        code_editor: Object.assign({}, state.code_editor, 
            {value: action.code}),
        mode: 'NEED_TO_CALCULATE',
    }),

    'LOAD_CODE_FROM_PANE': (state, action) => Object.assign({}, state, {
        mode: 'LOAD_CODE_FROM_PANE', 
    }),

    /* CALCULATION */

    'CALCULATE': (state, action) => Object.assign({}, state, { mode: 'NEED_TO_CALCULATE', }),

    'ADD_CELLS_TO_SHEET': (state, action) => {
        const new_cells = {};
        for (let cell of action.cells) {
            const cell_id = JSON.stringify(cell.location);
            new_cells[cell_id] = cell;
        }
        return Object.assign({}, state, { mode: 'PRE_READY', cells: new_cells })
    },
    
    'RETURN_TO_READY': (state, action) => {
        return Object.assign({}, state, { mode: 'READY', });
    },

    /* CELL BEHAVIOUR */

    'SELECT_CELL': (state, action) => {
        return Object.assign({}, state, {selected_cell_loc: action.location});
    },

    'MOVE_CELL_SELECTION': (state, action) => {
        const [old_row_idx, old_col_idx] = state.selected_cell_loc;
        const [offset_r, offset_c] = action.offset;
        const new_location = [
            Math.max(0, old_row_idx + offset_r),
            Math.max(0, old_col_idx + offset_c),
        ];
        return Object.assign({}, state, {selected_cell_loc: new_location});
    },

    'EDIT_CELL': (state, action) => Object.assign({}, state, {mode: 'EDIT'}),

    'EDIT_CELL_REPLACE': (state, action) => {
        let new_props;
        if (state.mode === 'EDIT') {
            new_props = {};
        } else {
            new_props = { mode: 'EDIT', formula_bar_value: '', }
        }
        return Object.assign({}, state, new_props);
    },

    'COMMIT_CELL_EDIT': (state, action) => get_selected_cell(state).commit_edit(state, action),
    'DISCARD_CELL_EDIT': (state, action) => get_selected_cell(state).discard_edit(state),
    'DELETE_VALUE':  (state, action) => get_selected_cell(state).delete_value(state),
    'INSERT_ELEMENT': (state, action) => get_selected_cell(state).insert_element(state),
    'DELETE_ELEMENT': (state, action) => get_selected_cell(state).delete_element(state),
    'DELETE_CONTAINER': (state, action) => get_selected_cell(state).delete_container(state),

    /* OTHER */

    'SET_FILEPATH': (state, action) => Object.assign({}, state, {loaded_filepath: action.filepath}),

}

const app = function (state = INITIAL_STATE, action) {
    const reducer = state_changes[action.type];
    if (reducer !== undefined) {
        return reducer(state, action);
    } else {
        console.error("NO ACTION FOUND FOR:", action)
        return state;
    }
}

module.exports = { app }
