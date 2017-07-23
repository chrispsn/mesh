'use strict';

const CodeTransformers = require('./code_transformers');
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
    AST: null,
    formula_bar_value: '',
}

// # Helper functions

function save_file_as(state, content) {
    let dest_filepath = LocalFileIO.get_saveas_filepath();
    if (dest_filepath !== undefined) {
        if (dest_filepath.slice(-3) !== '.js') {
            dest_filepath = dest_filepath + '.js';
        }
        LocalFileIO.writeFile(dest_filepath, state.code_editor.value);
        alert(`File saved: ${dest_filepath}`);
        document.title = `Mesh - ${dest_filepath}`;
        return Object.assign({}, state, { loaded_filepath: dest_filepath });
    } else {
        return state;
    }
}

// # Reducer

const app = function (state = INITIAL_APP, action) {

    switch (action.type) {

        case 'RESET_STATE': return Object.assign({}, state, INITIAL_APP);

        // =========
        //  \/ IO \/
        // =========
        
        case 'SPAWN_LOAD_DIALOG': {
            return Object.assign({}, state, {mode: 'SPAWN_LOAD_DIALOG'});
        }

        case 'LOAD_FILE': {
            const path = action.path;
            const contents = LocalFileIO.readFileSync(path, 'utf8');
            return Object.assign({}, INITIAL_APP, {
                code_editor: Object.assign({}, state.code_editor, {value: contents}),
                loaded_filepath: path,
                mode: 'NEED_TO_CALCULATE',
            });
        }

        case 'SAVE_FILE': {
            if (state.loaded_filepath !== null) {
                LocalFileIO.writeFile(state.loaded_filepath, state.code_editor.value);
                alert(`File saved: ${state.loaded_filepath}`)
                return state;
            } else {
                return save_file_as(state);
            }
        }

        case 'SAVE_FILE_AS': return save_file_as(state);

        // ================
        //  \/ CODE PANE \/
        // ================

        case 'SELECT_CODE': return Object.assign({}, state, {mode: 'EDITING_CODE'});

        case 'UNSELECT_CODE': {
            const new_code = code_editor.getValue();
            const new_code_editor = Object.assign({}, state.code_editor, {value: new_code})
            return Object.assign({}, state, {
                code_editor: new_code_editor,
                mode: 'NEED_TO_CALCULATE'
            })
        }

        case 'TOGGLE_CODE_PANE_SHOW': {
            return Object.assign({}, state, {
                code_editor: Object.assign({}, state.code_editor, {show: !state.code_editor.show}),
            })
        }
        
        // ============
        //  \/ SHEET \/
        // ============
        
        case 'INSERT_REFERENCE_FROM_CELL': {
            // TODO improve this - for example, clicking on one cell then another
            // should replace the first ref with the second
            // TODO also this is entirely side-effects - move?
            const ref_cell = get_cell(state.cells, action.location)
            const ref_string = ref_cell.ref_string;

            // Modified version of:
            // http://stackoverflow.com/a/34278578
            const start = formula_bar.selectionStart
            const end = formula_bar.selectionEnd
            const text = formula_bar.value
            const before = text.substring(0, start)
            const after  = text.substring(end, text.length)
            formula_bar.value = (before + ref_string + after)
            formula_bar.selectionStart = formula_bar.selectionEnd = start + ref_string.length

            return state;
        }

        // ==========================
        //  \/ CALCULATION STATES \/
        // ==========================
        
        // NEED_TO_CALCULATE is used only by a subscriber function
        // so that it knows to kick-off calculation.

        case 'UPDATE_AST': {
            const new_AST = new CodeTransformers.AST(state.code_editor.value)
            return Object.assign({}, state, {
                AST: new_AST,
                mode: 'CALCULATING',
                cells: {},
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
            return Object.assign({}, state, { cells: new_cells });
        }

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
        // TODO delete attachment?
        // TODO delete container?

        default:
            return state;
    }

}

module.exports = {
    app: app,
}
