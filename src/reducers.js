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

// Note: cells object uses string IDs as cell keys,
// but each cell stores its location in an array.

// (action.type) => (state, action) => state
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
    // TODO remove LOAD_CODE_FROM_PANE somehow
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

    // TODO do we even need RETURN_FROM_READY?
    'RETURN_TO_READY': (state, action) => {
        const selected_cell = get_selected_cell(state);
        return Object.assign({}, state, {
            mode: 'READY',
            formula_bar_value: selected_cell.formula_bar_value,
            code_editor: Object.assign({}, state.code_editor, {selection: selected_cell.code_location}),
        });
    },

    // ==========================
    //  \/ PER-CELL BEHAVIOUR \/
    // ==========================

    'SELECT_CELL': (state, action) => {
        const new_selected_cell = get_cell(state.cells, action.location);
        return new_selected_cell.select(state, action)
    },

    'MOVE_CELL_SELECTION': (state, action) => {
        const [old_row_idx, old_col_idx] = state.selected_cell_loc;
        const [offset_r, offset_c] = action.offset;
        const new_location = [
            Math.max(0, old_row_idx + offset_r),
            Math.max(0, old_col_idx + offset_c),
        ];

        const new_selected_cell = get_cell(state.cells, new_location);
        return new_selected_cell.select(state, 
            Object.assign({}, action, {location: new_location})
        );
    },

    'EDIT_CELL': (state, action) => get_selected_cell(state).edit(state),
    'EDIT_CELL_REPLACE': (state, action) => get_selected_cell(state).edit_replace(state),
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

if (typeof Mesh !== 'undefined') {
    const MESH_ATTACHMENTS = [
        {id: 'INITIAL_STATE', value: INITIAL_STATE, loc: [0, 0]},
        {id: 'state_changes', value: state_changes, loc: [0, 3]},
    ];
    Mesh.attach(MESH_ATTACHMENTS);
}
