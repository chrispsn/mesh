const {get_cell, get_selected_cell} = require('./selectors');
const {EMPTY_CELL} = require('./display');

const INITIAL_APP = {
    mode: 'NEED_TO_CALCULATE',
    cells: {
        '[0, 0]': Object.assign({}, EMPTY_CELL, {location: [0, 0]})
    },
    selected_cell_loc: [0, 0],
    code_editor: { value: '', selection: undefined, show: true },
    loaded_filepath: null,
    formula_bar_value: '',
}

// # Reducer

const app = function (state = INITIAL_APP, action) {

    switch (action.type) {

        case 'RESET_STATE': return Object.assign({}, state, INITIAL_APP);

        // =========
        //  \/ IO \/
        // =========
        
        case 'SET_FILEPATH': {
            return Object.assign({}, state, {loaded_filepath: action.filepath});
        }

        // ================
        //  \/ CODE PANE \/
        // ================

        case 'SELECT_CODE': {
            return Object.assign({}, state, {mode: 'EDITING_CODE'});
        }

        case 'TOGGLE_CODE_PANE_SHOW': {
            return Object.assign({}, state, {
                code_editor: Object.assign({}, state.code_editor, {show: !state.code_editor.show}),
            })
        }
        
        case 'LOAD_CODE': {
            return Object.assign({}, state, {
                code_editor: Object.assign({}, state.code_editor, {value: action.code}),
                mode: 'NEED_TO_CALCULATE',
            })
        }

        case 'LOAD_CODE_FROM_PANE': {
            return Object.assign({}, state, {
                mode: 'LOAD_CODE_FROM_PANE',
            })
        }

        // ==========================
        //  \/ CALCULATION STATES \/
        // ==========================
        
        case 'CALCULATE': {
            return Object.assign({}, state, {
                mode: 'NEED_TO_CALCULATE',
            });
        }

        // Note: cells object uses string IDs as cell keys,
        // but each cell stores its location in an array.
        
        case 'ADD_CELLS_TO_SHEET': {
            const new_cells = {};
            for (let cell of action.cells) {
                const cell_id = JSON.stringify(cell.location);
                new_cells[cell_id] = cell;
            }
            return Object.assign({}, state, { mode: 'PRE_READY', cells: new_cells });
        }

        // TODO do we even need this state?
        case 'RETURN_TO_READY': {
            const selected_cell = get_selected_cell(state);
            return Object.assign({}, state, {
                mode: 'READY',
                formula_bar_value: selected_cell.formula_bar_value,
                code_editor: Object.assign({}, state.code_editor, {selection: selected_cell.code_location}),      
            });
        }

        // ==========================
        //  \/ PER-CELL BEHAVIOUR \/
        // ==========================

        case 'SELECT_CELL': {
            // When you have a specific cell in mind.
            const new_selected_cell = get_cell(state.cells, action.location)
            return new_selected_cell.select(state, action);
        }

        case 'MOVE_CELL_SELECTION': {
            const [old_row_idx, old_col_idx] = state.selected_cell_loc;
            const new_location = (function () {
                switch(action.direction) {
                    case 'UP':
                        return [Math.max(old_row_idx-1, 0), old_col_idx];
                    case 'LEFT':
                        return [old_row_idx, Math.max(old_col_idx-1, 0)];
                    case 'DOWN':
                        return [old_row_idx+1, old_col_idx];
                    case 'RIGHT':
                        return [old_row_idx, old_col_idx+1];
                    default:
                        // TODO raise error
                }
            })();

            const new_selected_cell = get_cell(state.cells, new_location);
            return new_selected_cell.select(state, 
                Object.assign({}, action, {location: new_location})
            );
        }

        case 'EDIT_CELL': return get_selected_cell(state).edit(state);
        case 'EDIT_CELL_REPLACE': return get_selected_cell(state).edit_replace(state);
        case 'COMMIT_CELL_EDIT': return get_selected_cell(state).commit_edit(state, action);
        case 'DISCARD_CELL_EDIT': return get_selected_cell(state).discard_edit(state);
        case 'DELETE_VALUE': return get_selected_cell(state).delete_value(state);
        case 'INSERT_ELEMENT': return get_selected_cell(state).insert_element(state);
        case 'DELETE_ELEMENT': return get_selected_cell(state).delete_element(state);
        case 'DELETE_CONTAINER': return get_selected_cell(state).delete_container(state);

        default:
            console.error("NO ACTION FOUND FOR:", action)
            return state;
    }

}

module.exports = { app }
