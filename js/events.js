// https://developer.mozilla.org/en-US/docs/Web/Events

// Key values: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
// Keydown: https://developer.mozilla.org/en-US/docs/Web/Events/keydown
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Exampleselected_cell

// Regex:
// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test

// TODO how to stop a given event running through lots of the events?
// (see via a console.log)
// probably fixed via a carefully placed event.stopPropagation();.

// # HELPERS

function process_keydown_event (store, bindings, event) {
    const state = store.getState();
    const mode = state.mode;
    for (let binding of bindings) {
        if (binding.keypattern.test(event.key)
            && mode === binding.mode
            && ((binding.modifiers === undefined) || binding.modifiers(event))
        ) {
            if (binding.hasOwnProperty('preventDefault') && binding.preventDefault) {
                event.preventDefault()
            }
            store.dispatch(binding.action);
            return;
        }
    }
}


// # GRID

const grid_keydown_events = [
    // TODO what else should trigger this?
    {mode: 'READY', keypattern: /^[\w-"'\(\[{\/]$/, modifiers: (e) => (!e.ctrlKey), action: { type: 'EDIT_CELL_REPLACE' }},

    {mode: 'READY', keypattern: /^F2$/, action: { type: 'EDIT_CELL' }},

    {mode: 'READY', keypattern: /^ArrowLeft$/, action: { type: 'MOVE_CELL_SELECTION', direction: 'LEFT' }},
    {mode: 'READY', keypattern: /^j$/, modifiers: (e) => (e.ctrlKey), action: { type: 'MOVE_CELL_SELECTION', direction: 'DOWN' }},
    {mode: 'READY', keypattern: /^h$/, modifiers: (e) => (e.ctrlKey), action: { type: 'MOVE_CELL_SELECTION', direction: 'LEFT' }},
    {mode: 'READY', keypattern: /^k$/, modifiers: (e) => (e.ctrlKey), action: { type: 'MOVE_CELL_SELECTION', direction: 'UP' }},
    {mode: 'READY', keypattern: /^l$/, modifiers: (e) => (e.ctrlKey), action: { type: 'MOVE_CELL_SELECTION', direction: 'RIGHT' }},
    {mode: 'READY', keypattern: /^ArrowUp$/, action: { type: 'MOVE_CELL_SELECTION', direction: 'UP' }},
    {mode: 'READY', keypattern: /^ArrowDown$/, action: { type: 'MOVE_CELL_SELECTION', direction: 'DOWN' }},
    {mode: 'READY', keypattern: /^ArrowRight$/, action: { type: 'MOVE_CELL_SELECTION', direction: 'RIGHT' }},

    {mode: 'READY', keypattern: /^Tab$/, modifiers: (e) => (!e.shiftKey), preventDefault: true, action: { type: 'MOVE_CELL_SELECTION', direction: 'RIGHT' }},
    {mode: 'READY', keypattern: /^Tab$/, modifiers: (e) => (e.shiftKey), preventDefault: true, action: { type: 'MOVE_CELL_SELECTION', direction: 'LEFT' }},
    
    {mode: 'READY', keypattern: /^Enter$/, modifiers: (e) => (!e.shiftKey), action: { type: 'MOVE_CELL_SELECTION', direction: 'DOWN' }},
    {mode: 'READY', keypattern: /^Enter$/, modifiers: (e) => (e.shiftKey), action: { type: 'MOVE_CELL_SELECTION', direction: 'UP' }},
    
    // TODO If on the name: delete the declaration entirely
    {mode: 'READY', keypattern: /^Delete$/, action: { type: 'DELETE_VALUE' }},

];

const grid_click_events = [
    { mode: 'READY', action: { type: 'SELECT_CELL' } },
    { mode: 'EDIT', action: { type: 'INSERT_REFERENCE_FROM_CELL' } },
    { mode: 'EDITING_CODE', action: { type: 'UNSELECT_CODE' } },
];

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
        process_keydown_event(store, grid_keydown_events, event);
    });
}

const window_keydown_events = [
    {mode: 'READY', keypattern: /^S$/, modifiers: (e) => (e.ctrlKey), action: { type: 'SAVE_FILE_AS' }},
    {mode: 'READY', keypattern: /^s$/, modifiers: (e) => (e.ctrlKey), action: { type: 'SAVE_FILE' }},
    {mode: 'READY', keypattern: /^o$/, modifiers: (e) => (e.ctrlKey), action: { type: 'SPAWN_LOAD_DIALOG' }},
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
    {mode: 'EDIT', keypattern: /^Enter$/, action: { type: 'COMMIT_CELL_EDIT', direction: 'DOWN' }},
    {mode: 'EDIT', keypattern: /^Tab$/, preventDefault: true, action: { type: 'COMMIT_CELL_EDIT', direction: 'RIGHT' }},
    {mode: 'EDIT', keypattern: /^Escape$/, action: { type: 'DISCARD_CELL_EDIT' }},
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
            // TODO compress into single event?
            // Reset state isn't working properly anyway given prev sheet cells stil appear
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
