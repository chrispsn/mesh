// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
// Key values: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
//
// TODO Vim keybindings? goto being easy (coords), jkl;, etc
const keydown_fn_maker = function (store) {
    return (event) => {
    // https://developer.mozilla.org/en-US/docs/Web/Events/keydown
    // Event types: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
    event.stopPropagation();

    // TODO dealing with modifiers
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Exampleselected_cell
    const EXTRA_ROWS = 1;
    const EXTRA_COLS = 1;
    const state = store.getState();
    const mode = store.getState().mode;

    // Catch window closes
    if (event.key == 'w' && event.ctrlKey) {
        alert("YOU KILLED ME");
        // TODO actually prevent close
    }

    // TODO move the sheet.render stuff to a middleware that's triggered 
    // after every dispatch?

    if (mode === 'EDIT') {
        switch (event.key) {
            case 'Enter':
                // TOOD how can a user insert a line into the formula bar 
                // without triggering commit? Same way as in Excel?
                return function() {
                    store.dispatch({ type: 'COMMIT_CELL_EDIT' });
                    store.dispatch({ type: 'CLEAR_VGRID_DATA' });
                    Mesh.run_and_render_code();
                }();

            case 'Escape':
                store.dispatch({ type: 'DISCARD_CELL_EDIT' });
                return;

            default:
                return;
        }

    } else if (mode == 'READY') {
        if (event.ctrlKey) {

            // TODO check this is working
            if (event.shiftKey) {
                switch (event.key) {
                    case 's':
                        store.dispatch({ type: 'SAVE_FILE_AS' });
                        break;
                    default:
                        break;
                }
            } else {
                switch (event.key) {
                    case 'o':
                        document.getElementById('open-file-manager').click();
                        break;
                    case 's':
                        store.dispatch({ type: 'SAVE_FILE' });
                        break;
                    default:
                        break;
                }
            }


        } else {
            switch (event.key) {
                case 'k':
                case "ArrowUp":
                    store.dispatch({ type: 'MOVE_CELL_SELECTION', direction: 'UP' });
                    sheet.render()
                    break;
                case 'j':
                case "ArrowDown":
                case 'Enter':
                    store.dispatch({
                        type: 'EXTEND_GRID', 
                        location: [
                            state.selectedCell[0] + EXTRA_ROWS, 
                            state.selectedCell[1]
                        ]
                    })
                    store.dispatch({ type: 'MOVE_CELL_SELECTION', direction: 'DOWN' });
                    sheet.render()
                    break;
                case 'h':
                case "ArrowLeft":
                    store.dispatch({ type: 'MOVE_CELL_SELECTION', direction: 'LEFT' });
                    sheet.render()
                    break;
                case 'l':
                case "ArrowRight":
                    store.dispatch({ 
                        type: 'EXTEND_GRID', 
                        location: [
                            state.selectedCell[0], 
                            state.selectedCell[1] + EXTRA_COLS
                        ]
                    })
                    store.dispatch({ type: 'MOVE_CELL_SELECTION', direction: 'RIGHT' });
                    sheet.render()
                    break;
                case 'i':
                case "F2":
                    event.preventDefault();
                    store.dispatch({ type: 'EDIT_CELL' });
                    break;
                case 'F9':
                    Mesh.run_and_render_code();
                    break;
                case 'Delete':
                    // TODO If on the name: delete the declaration entirely
                    store.dispatch({ type: 'DELETE_VALUE' });
                    store.dispatch({ type: 'CLEAR_VGRID_DATA' });
                    Mesh.run_and_render_code();
                    break;
                // how to know when to insert? Maybe just typing in normal mode
                // is enough (ie remove VIM bindings and anything else that would stop this)
                // OR we just rely on F2?
                default:
                    return;
            }
        }

    }

}}

function get_clicked_cell_location (event) {
    const id = event.target.getAttribute('id');
    let return_value = null;
    try {
        return_value = JSON.parse(id);
    } catch (e) {
        if (e instanceof SyntaxError) {
            console.log("Couldn't read in the clicked element's ID as JSON.");
        } else {
            console.error(e)
        }
    }
    return return_value;
}

const bind_grid_events = function(store, grid_element) {
    grid_element.addEventListener('click',
        (event) => {
            const clicked_location = get_clicked_cell_location(event);
            if (clicked_location === null) { return }
            switch (store.getState().mode) {
                case 'READY':
                    store.dispatch({
                        type: 'SELECT_CELL', 
                        location: clicked_location
                    });
                    sheet.render();
                case 'EDIT':
                    store.dispatch({ 
                        type: 'INSERT_REFERENCE_FROM_CELL',
                        location: clicked_location
                    });
                case 'EDITING_CODE':
                    store.dispatch({ type: 'UNSELECT_CODE' });
                    Mesh.run_and_render_code();
                default:
                    break;
            }
        }
    );
}

const bind_code_editor_events = function(store, code_editor) {
    code_editor.on('focus', 
        () => store.dispatch({ type: 'SELECT_CODE' })
    );
}

const bind_formula_bar_events = function(store, formula_bar) {
    formula_bar.addEventListener('click',
        () => store.dispatch({ type: 'EDIT_CELL' })
    );
}

const bind_keydown_events = function(store, window) {
    // TODO consider just binding to grid, not whole window?
    // Would require breaking the keyboard logic up a bit.
    window.addEventListener('keydown', keydown_fn_maker(store));
}

// Load logic

function load_file_from_filepicker(event) {
    const file = event.target.files[0]; 
    if (file && file.path) {
        const path = file.path;
        Mesh.store.dispatch({type: 'RESET_STATE'});
        Mesh.store.dispatch({type: 'LOAD_FILE', path: path});
        Mesh.run_and_render_code();
    }
}

const filepicker = document.getElementById('open-file-manager');
filepicker.addEventListener('change', load_file_from_filepicker);

// Save logic

function writeFile() {
    Mesh.store.dispatch({type: 'SAVE_FILE'});
};

/*
const file_saver = document.getElementById('save-file')
file_saver.addEventListener('click', writeFile);
*/
module.exports = {
    bind_code_editor_events: bind_code_editor_events,
    bind_keydown_events: bind_keydown_events,
    bind_formula_bar_events: bind_formula_bar_events,
    bind_grid_events: bind_grid_events
}

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Syntax
// https://developer.mozilla.org/en-US/docs/Web/Events
