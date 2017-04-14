const CodeTransformers = require(__dirname + '/code_transformers.js');

// # Connections to objects / HTML elements
const formula_bar = document.getElementById('formula-bar');
// TODO should this be a require? Or a reference to the Mesh object?
const code_editor = CodeEditor;

// # State constants

const { get_cell } = require(__dirname + '/default_cell_logic.js')

const INITIAL_APP = {
    mode: 'NEED_TO_CALCULATE',
    cells: {},
    selected_cell_loc: [0, 0],
    formula_bar: { value: '' },
    code_editor: { value: '', selection: undefined },
    loaded_filepath: null,
    AST: null,
    render: true
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

    const selected_cell = get_cell(state.cells, state.selected_cell_loc);

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
        
        // ============
        //  \/ SHEET \/
        // ============

        case 'ADD_CELLS': {
            const new_cells = Object.assign({}, state.cells);
            for (let cell of action.cells) {
                const cell_id = JSON.stringify(cell.location);
                new_cells[cell_id] = cell;
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

        // ==========================
        //  \/ CALCULATION STATES \/
        // ==========================
        
        // NEED_TO_CALCULATE is used only by a subscriber function
        // so that it knows to kick-off calculation.

        case 'CALCULATING': {
            // Exists purely to change the state away from NEED_TO_CALCULATE
            // so that we don't get into an infinite calculation loop.
            return Object.assign({}, state, {
                mode: 'CALCULATING',
                render: false,
            });
        }

        case 'CALCULATE_AST': {
            const AST = new CodeTransformers.AST(state.code_editor.value);
            return Object.assign({}, state, {AST: AST})
        }

        case 'RETURN_TO_READY': {
            const new_formula_bar = Object.assign({}, state.formula_bar, {
                    value: selected_cell.formula_bar_value});
            return Object.assign({}, state, {
                formula_bar: new_formula_bar,
                mode: 'READY',
                render: true
            });
        }

        // ==========================
        //  \/ PER-CELL BEHAVIOUR \/
        // ==========================

        case 'SELECT_CELL': {
            // When you have a specific cell in mind.
            const new_selected_cell = get_cell(state.cells, action.location)
            return new_selected_cell.reducers.select(state, action);
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
            return new_selected_cell.reducers.select(state, 
                Object.assign({}, action, {location: new_location})
            );
        }

        case 'EDIT_CELL': return selected_cell.reducers.edit(state);
        case 'EDIT_CELL_REPLACE': return selected_cell.reducers.edit_replace(state);
        case 'COMMIT_CELL_EDIT': return selected_cell.reducers.commit_edit(state, action);
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
