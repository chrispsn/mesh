// # Connections to objects / HTML elements

const formula_bar = document.getElementById('formula-bar');
const code_editor = CodeEditor.code_editor;

// # State constants

const ASTmod = require(__dirname + '/code_transformers.js');
const default_reducers = require(__dirname + '/default_cell_logic.js')

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

            const new_formula_bar = {selected: false}

            const new_code_editor = Object.assign({}, state.code_editor, 
                                    {value: new_code});

            return Object.assign({}, state, {
                code_editor: new_code_editor,
                formula_bar: new_formula_bar,
                mode: 'NEED_TO_CALCULATE'
            });
        }
    }
)}

const INITIAL_VGRID = [[ Object.assign({}, EMPTY_CELL, {selected: true}) ]];
const INITIAL_FORMULA_BAR = { focused: false, value: '' };
const INITIAL_CODE_EDITOR = { focused: false, value: '', selection: undefined };

const INITIAL_APP = {
    mode: 'READY',
    vgrid: INITIAL_VGRID,
    // TODO change this to selected_cell_loc or similar
    selectedCell: [0, 0],
    formula_bar: INITIAL_FORMULA_BAR,
    code_editor: INITIAL_CODE_EDITOR,
    loaded_filepath: null
}

// # Helper functions

function get_cell(vgrid, location) {
    const [row, col] = location;
    return vgrid[row][col];
}

function ASTmod_loc_to_codemirror_loc (ASTmod_loc) {
    const {line, column} = ASTmod_loc;
    return {line: line - 1, ch: column};
};

function sync_state(state) {
    // TODO move all the sync_state calls into something that's called 
    // after the state updates:
    // http://redux.js.org/docs/advanced/Middleware.html
    // But note this may not work during the weird formula bar editing period?
    
    // TODO move sheet.render calls into this?
    
    // Grid
    const selected_cell = get_cell(state.vgrid, state.selectedCell)
    Mesh.Sheet.render();

    // Status bar
    Mesh.status_bar.render(state);

    // Formula bar
    formula_bar.value = state.formula_bar.value;
    if (state.formula_bar.focused) {
        formula_bar.focus();
    } else {
        formula_bar.blur();
    }

    // Code editor
    code_editor.setValue(state.code_editor.value);
    const selection = state.code_editor.selection;
    if (selection !== undefined) {
        code_editor.setSelection(
            ASTmod_loc_to_codemirror_loc(selection.start),
            ASTmod_loc_to_codemirror_loc(selection.end)
        );
    }
}

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

    const selected_cell = get_cell(state.vgrid, state.selectedCell);

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

            // Move this into the main state and update with sync_state
            document.title = `Mesh - ${filename}`;

            sync_state(new_state);
            return new_state;
        }

        case 'SAVE_FILE': {
            if (state.loaded_filepath !== null) {
                const content = code_editor.getValue();
                LocalFileIO.writeFile(state.loaded_filepath, content);
                alert(`File saved: ${state.loaded_filepath}`)
                return state;
            } else {
                // TODO duplicate of SAVE_FILE_AS - can this be moved out?
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

        case 'CLEAR_VGRID_DATA': {
            // TODO optimise
            // TODO Have a think about whether this is necessary.
            //      Because when you think about it,
            //      anything calling this will be rebuilding the grid
            //      via ADD_CELLS calls anyway...
            //      so probs could just replace with the initial VGrid state
            
            const [sel_row, sel_col] = state.selectedCell;

            const new_vgrid = []
            for (let row of state.vgrid) {
                let new_row = [];
                for (let cell of row) {
                    new_row.push(EMPTY_CELL)
                }
                new_vgrid.push(new_row);
            }

            return Object.assign({}, state, {
                vgrid: new_vgrid
            })
        }

        case 'UPDATE_FORMULA_BAR': {
            const new_formula_bar = Object.assign({}, state.formula_bar, {
                    value: selected_cell.formula_bar_value});
            const new_state = Object.assign({}, state, {formula_bar: new_formula_bar});
            sync_state(new_state);
            return new_state;
        }

        case 'SELECT_CODE': {
            const new_state = Object.assign({}, state, {mode: 'EDITING_CODE'});
            sync_state(new_state);
            return new_state;
        }

        case 'UNSELECT_CODE': {
            // TODO needs to do a full rebuild of the sheet, surely
            // ie clear the vgrid (not all settings, eg preserve highlight)
            // and recalculate
            const new_code = code_editor.getValue();
            const new_code_editor = Object.assign({}, state.code_editor, {value: new_code})
            const new_state = Object.assign({}, state, {
                code_editor: new_code_editor,
                mode: 'NEED_TO_CALCULATE'
            })
            sync_state(new_state);
            return new_state;
        }

        case 'EXTEND_GRID': {
            // TODO feels like this is ripe for optimisation
            const [current_row_index, current_col_index] = action.location;
            const old_max_row_index = state.vgrid.length - 1;
            const old_max_col_index = state.vgrid[0].length - 1;
            if (current_row_index === old_max_row_index &&
                current_col_index === old_max_col_index) {
                return state;
            }

            const new_row_indices = Array(1 + Math.max(
                                            old_max_row_index, 
                                            current_row_index)).fill(0);
            const new_col_indices = Array(1 + Math.max(
                                            old_max_col_index,
                                            current_col_index)).fill(0);
            const extended_vgrid = new_row_indices.map( (_, row_index) => {
                return new_col_indices.map( (_, col_index) => {
                    if ((row_index > old_max_row_index) ||
                        (col_index > old_max_col_index)) {
                        return EMPTY_CELL;
                    } else {
                        let selected_cell = state.vgrid[row_index][col_index];
                        return selected_cell;
                    }
                })
            })
            
            // Restore selection, if possible
            const [sel_row, sel_col] = state.selectedCell;
            if (sel_row <= (extended_vgrid.length - 1)
                && sel_col <= (extended_vgrid[0].length - 1)
            ) {
                extended_vgrid[sel_row][sel_col] = Object.assign( 
                    {}, 
                    extended_vgrid[sel_row][sel_col],
                    {selected: true}
                )
            }
            
            return Object.assign({}, state, {vgrid: extended_vgrid});
        }

        case 'ADD_CELLS': {
            const new_vgrid = [...state.vgrid];
            for (let {location, cell_props} of action.cells) {
                const [row, col] = location;
                new_vgrid[row][col] = Object.assign({}, cell_props);
            }
            return Object.assign({}, state, {vgrid: new_vgrid});
        }

        case 'INSERT_REFERENCE_FROM_CELL': {
            // TODO improve this - for example, clicking on one cell then another
            // should replace the first ref with the second
            const ref_cell = get_cell(state.vgrid, action.location)
            const ref_string = ref_cell.ref_string;

            insert_into_textarea(formula_bar, ref_string);

            return state;
        }

        case 'CALCULATING': {
            const new_state = Object.assign({}, state, {mode: 'CALCULATING'});
            sync_state(new_state);
            return new_state;
        }

        case 'RETURN_TO_READY': {
            const new_state = Object.assign({}, state, {mode: 'READY'});
            sync_state(new_state);
            return new_state;
        }

        // ==========================
        //  \/ PER-CELL BEHAVIOUR \/
        // ==========================

        case 'SELECT_CELL': {
            // When you have a specific cell in mind.
            const new_selected_cell = get_cell(state.vgrid, action.location)
            let new_state = selected_cell.reducers.deselect(state);
            // TODO fix this crappy hack - should be based on something else?
            new_state = Object.assign({}, new_state, {selectedCell: action.location});
            new_state = new_selected_cell.reducers.select(new_state);
            sync_state(new_state);
            return new_state;
        }

        case 'MOVE_CELL_SELECTION': {
            // When you're moving the cell selection in a direction.
            
            // Get the new selection coords
            const [old_row, old_col] = state.selectedCell;
            const last_row_index = state.vgrid.length - 1;
            const last_col_index = state.vgrid[0].length - 1;
            const new_location = (function () {
                switch(action.direction) {
                    case 'UP':
                        return [Math.max(old_row-1, 0), old_col];
                    case 'LEFT':
                        return [old_row, Math.max(old_col-1, 0)];
                    case 'DOWN':
                        return [Math.min(old_row+1, last_row_index), old_col];
                    case 'RIGHT':
                        return [old_row, Math.min(old_col+1, last_col_index)];
                    default:
                        return state.selectedCell;
                }
            })();

            // Get the new state
            let new_state = selected_cell.reducers.deselect(state);
            const new_selected_cell = get_cell(state.vgrid, new_location);
            // TODO fix this crappy hack
            new_state = Object.assign({}, new_state, {selectedCell: new_location});
            new_state = new_selected_cell.reducers.select(new_state);
            sync_state(new_state);
            return new_state;
        }

        case 'EDIT_CELL': {
            const new_state = selected_cell.reducers.edit(state);
            sync_state(new_state);
            return new_state;
        }

        case 'COMMIT_CELL_EDIT': {
            const new_state = selected_cell.reducers.commit_edit(state);
            sync_state(new_state);
            return new_state;
        }

        case 'DISCARD_CELL_EDIT': {
            const new_state = selected_cell.reducers.discard_edit(state)
            sync_state(new_state);
            return new_state;
        }

        case 'DELETE_VALUE': {
            const new_state = selected_cell.reducers.delete_value(state)
            sync_state(new_state);
            return new_state;
        }

        // TODO delete variable declaration?
        // TODO delete attachment?
        // TODO delete container?

        default:
            return state;
    }

}

module.exports = {
    app: app
}
