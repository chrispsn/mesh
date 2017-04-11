// https://developer.mozilla.org/en-US/docs/Web/Events

// Key values: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
// https://developer.mozilla.org/en-US/docs/Web/Events/keydown
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Exampleselected_cell

// # GRID

const grid_keydown_events = [
    {mode: 'READY', key: 'ArrowLeft', action: { type: 'MOVE_CELL_SELECTION', direction: 'LEFT' }},
    {mode: 'READY', key: 'h', action: { type: 'MOVE_CELL_SELECTION', direction: 'LEFT' }},

    {mode: 'READY', key: 'ArrowUp', action: { type: 'MOVE_CELL_SELECTION', direction: 'UP' }},
    {mode: 'READY', key: 'k', action: { type: 'MOVE_CELL_SELECTION', direction: 'UP' }},

    {mode: 'READY', key: 'j', action: { type: 'MOVE_CELL_SELECTION', direction: 'DOWN' }},
    {mode: 'READY', key: 'ArrowDown', action: { type: 'MOVE_CELL_SELECTION', direction: 'DOWN' }},
    {mode: 'READY', key: 'Enter', action: { type: 'MOVE_CELL_SELECTION', direction: 'DOWN' }},

    {mode: 'READY', key: 'l', action: { type: 'MOVE_CELL_SELECTION', direction: 'RIGHT' }},
    {mode: 'READY', key: 'ArrowRight', action: { type: 'MOVE_CELL_SELECTION', direction: 'RIGHT' }},
    
    // TODO If on the name: delete the declaration entirely
    {mode: 'READY', key: 'Delete', action: { type: 'DELETE_VALUE' }},

    {mode: 'READY', key: 'F2', action: { type: 'EDIT_CELL' }},
    {mode: 'READY', key: 'i', action: { type: 'EDIT_CELL' }},
];

const grid_click_events = [
    { mode: 'READY', action: { type: 'SELECT_CELL' } },
    { mode: 'EDIT', action: { type: 'INSERT_REFERENCE_FROM_CELL' } },
    { mode: 'EDITING_CODE', action: { type: 'UNSELECT_CODE' } },
];

function process_keydown_event (store, bindings, event) {
    const state = store.getState();
    const mode = state.mode;
    for (let binding of bindings) {
        if (event.key === binding.key
            && mode === binding.mode
            && ((binding.modifiers === undefined) || binding.modifiers(event))
        ) {
            store.dispatch(binding.action);
            return;
        }
    }
}

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
    grid_element.addEventListener('click', (event) => {
        const clicked_location = get_clicked_cell_location(event);
        if (clicked_location === null) { return }

        const state = store.getState();
        const mode = state.mode;
        for (let shortcut of grid_click_events) {
            if (mode === shortcut.mode) {
                const action = Object.assign({}, shortcut.action, {location: clicked_location})
                store.dispatch(action);
                return;
            }
        }
    });

    grid_element.addEventListener('keydown', (event) => {
        // TODO this will change if we switch to a more
        // Excel-like keyboard experience.
        // As for how to do that...
        // keys need to be a keyPATTERN rather than a hardcoded key:
        // https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test
        event.preventDefault(); // Stops i appearing in formula bar
        process_keydown_event(store, grid_keydown_events, event);
    });
}

const window_keydown_events = [
    {mode: 'READY', key: 'ArrowLeft', action: { type: 'MOVE_CELL_SELECTION', direction: 'LEFT' }},
    {mode: 'READY', key: 'S', modifiers: (e) => (e.ctrlKey), action: { type: 'SAVE_FILE_AS' }},
    {mode: 'READY', key: 's', modifiers: (e) => (e.ctrlKey), action: { type: 'SAVE_FILE' }},
    {mode: 'READY', key: 'o', modifiers: (e) => (e.ctrlKey), action: { type: 'SPAWN_LOAD_DIALOG' }},
]

// TODO move these to window KB events
// Catch window closes
/*
if (event.key == 'w' && event.ctrlKey) {
    event.preventDefault();
    return;
}
*/

const bind_window_events = function(store, window) {
    window.addEventListener('keydown', (event) => {
        process_keydown_event(store, window_keydown_events, event);
    });
}

// # Event listeners
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Syntax

// # CODE EDITOR

const bind_code_editor_events = function(store, code_editor) {
    code_editor.on('focus', 
        () => store.dispatch({ type: 'SELECT_CODE' })
    );
}

// # FORMULA BAR

const formula_bar_keydown_events = [
    // TOOD how can a user insert a line into the formula bar 
    // without triggering commit? Same way as in Excel?
    {mode: 'EDIT', key: 'Enter', action: { type: 'COMMIT_CELL_EDIT' }},
    {mode: 'EDIT', key: 'Escape', action: { type: 'DISCARD_CELL_EDIT' }},
];

const bind_formula_bar_events = function(store, formula_bar) {
    formula_bar.addEventListener('click',
        () => store.dispatch({ type: 'EDIT_CELL' })
    );
    formula_bar.addEventListener('keydown', (event) => {
        process_keydown_event(store, formula_bar_keydown_events, event);
    });
}

// # FILE LOAD API

const bind_load_file_events = function(store, filepicker) {
    filepicker.addEventListener('change', (event) => {
        const file = event.target.files[0]; 
        if (file && file.path) {
            const path = file.path;
            store.dispatch({type: 'RESET_STATE'});
            store.dispatch({type: 'LOAD_FILE', path: path});
        }
    });
}

module.exports = {
    bind_window_events: bind_window_events,
    bind_grid_events: bind_grid_events,
    bind_code_editor_events: bind_code_editor_events,
    bind_formula_bar_events: bind_formula_bar_events,
    bind_load_file_events: bind_load_file_events,
}

/* TODO add Mesh table bindings
if (typeof(sheet) !== "undefined" && sheet.attach) {
  sheet.attach("shortcuts", shortcuts, [1, 1])
}
*/
