// # Connections to objects / HTML elements

const formula_bar = document.getElementById('formula-bar');
const code_editor = CodeEditor;

// # State constants

const {
    EMPTY_CELL,
    get_cell_id_from_location,
    get_cell,
} = require(__dirname + '/default_cell_logic.js')

const INITIAL_CELLS = [ Object.assign({}, EMPTY_CELL, {location: [0, 0]}) ];
const INITIAL_FORMULA_BAR = { focused: false, value: '' };
const INITIAL_CODE_EDITOR = { focused: false, value: '', selection: undefined };

const INITIAL_APP = {
    mode: 'READY',
    cells: INITIAL_CELLS,
    selected_cell_loc: [0, 0],
    formula_bar: INITIAL_FORMULA_BAR,
    code_editor: INITIAL_CODE_EDITOR,
    loaded_filepath: null
}

// # Helper functions

function insert_into_textarea(textarea, text_to_insert) {
    // Modified version of:
    // http://stackoverflow.com/a/34278578
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const after  = text.substring(end, text.length)
    textarea.value = (before + text_to_insert + after)
    textarea.selectionStart = textarea.selectionEnd = start + text_to_insert.length
}

// # Reducer

const app = function (state = INITIAL_APP, action) {

    const selected_cell = get_cell(state.cells, state.selected_cell_loc);

    switch (action.type) {

        case 'RESET_STATE':
            return Object.assign({}, state, INITIAL_APP);

        case 'LOAD_FILE': {
            const path = action.path;
            const filename = LocalFileIO.get_basename_from_path(path);

            const contents = LocalFileIO.readFileSync(path, 'utf8');
            const new_state = Object.assign({}, state, {
                code_editor: Object.assign({}, state.code_editor, {value: contents}),
                loaded_filepath: path,
                mode: 'NEED_TO_CALCULATE'
            });

            // TODO Move this into the main state and update with the subscriber
            document.title = `Mesh - ${filename}`;

            return new_state;
        }

        case 'SAVE_FILE': {
            const content = state.code_editor.getValue();
            if (state.loaded_filepath !== null) {
                LocalFileIO.writeFile(state.loaded_filepath, content);
                alert(`File saved: ${state.loaded_filepath}`)
                return state;
            } else {
                // TODO duplicate of SAVE_FILE_AS - can this be moved out?
                let dest_filepath = LocalFileIO.get_saveas_filepath();
                if (dest_filepath !== undefined) {
                    if (dest_filepath.slice(-3) !== '.js') {
                        dest_filepath = dest_filepath + '.js';
                    }
                    LocalFileIO.writeFile(dest_filepath, content);
                    alert(`File saved: ${dest_filepath}`);
                    document.title = `Mesh - ${dest_filepath}`;
                    return Object.assign({}, state, { loaded_filepath: dest_filepath });
                } else {
                    return state;
                }
            }
        }

        case 'SAVE_FILE_AS': {
            const content = code_editor.getValue();
            let dest_filepath = LocalFileIO.get_saveas_filepath();
            if (dest_filepath !== undefined) {
                if (dest_filepath.slice(-3) !== '.js') {
                    dest_filepath = dest_filepath + '.js';
                }
                LocalFileIO.writeFile(dest_filepath, content);
                alert(`File saved: ${dest_filepath}`);
                document.title = `Mesh - ${dest_filepath}`;
                return Object.assign({}, state, { loaded_filepath: dest_filepath });
            } else {
                return state;
            }
        }

        case 'UPDATE_FORMULA_BAR': {
            const new_formula_bar = Object.assign({}, state.formula_bar, {
                    value: selected_cell.formula_bar_value});
            return Object.assign({}, state, {formula_bar: new_formula_bar});
        }

        case 'SELECT_CODE': {
            return Object.assign({}, state, {mode: 'EDITING_CODE'});
        }

        case 'UNSELECT_CODE': {
            const new_code = code_editor.getValue();
            const new_code_editor = Object.assign({}, state.code_editor, {value: new_code})
            const new_state = Object.assign({}, state, {
                code_editor: new_code_editor,
                mode: 'NEED_TO_CALCULATE'
            })
            return new_state;
        }

        case 'ADD_CELLS': {
            const new_cells = Object.assign({}, state.cells);
            for (let cell of action.cells) {
                const cell_id = get_cell_id_from_location(cell.location);
                new_cells[cell_id] = Object.assign({}, cell);
            }
            return Object.assign({}, state, {cells: new_cells});
        }

        case 'INSERT_REFERENCE_FROM_CELL': {
            // TODO improve this - for example, clicking on one cell then another
            // should replace the first ref with the second
            const ref_cell = get_cell(state.cells, action.location)
            const ref_string = ref_cell.ref_string;

            insert_into_textarea(formula_bar, ref_string);

            return state;
        }

        case 'CALCULATING': return Object.assign({}, state, {mode: 'CALCULATING'})

        case 'RETURN_TO_READY': return Object.assign({}, state, {mode: 'READY'});

        // ==========================
        //  \/ PER-CELL BEHAVIOUR \/
        // ==========================

        case 'SELECT_CELL': {
            // When you have a specific cell in mind.
            let new_state = Object.assign({}, state, {selected_cell_loc: action.location});
            const new_selected_cell = get_cell(state.cells, action.location)
            new_state = new_selected_cell.reducers.select(new_state);
            return new_state;
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
                        return state.selectedCell;
                }
            })();

            const new_selected_cell = get_cell(state.cells, new_location);
            new_state = Object.assign({}, state, {selected_cell_loc: new_location});
            new_state = new_selected_cell.reducers.select(new_state);
            return new_state;
        }

        case 'EDIT_CELL': return selected_cell.reducers.edit(state);
        case 'COMMIT_CELL_EDIT': return selected_cell.reducers.commit_edit(state);
        case 'DISCARD_CELL_EDIT': return selected_cell.reducers.discard_edit(state);
        case 'DELETE_VALUE': return selected_cell.reducers.delete_value(state)
        // TODO delete variable declaration?
        // TODO delete attachment?
        // TODO delete container?

        default:
            return state;
    }

}

module.exports = {
    app: app,
}
