'use strict';

// https://developer.mozilla.org/en-US/docs/Web/Events

// Key values: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
// Keydown: https://developer.mozilla.org/en-US/docs/Web/Events/keydown
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Exampleselected_cell

// Regex:
// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test

// TODO how to stop a given event running through lots of the events? (see via a console.log)
// Probably fixed via a carefully placed event.stopPropagation();.

// TODO I think this needs to be merged with local_file_io and maybe local settings too...
// too many commonalities

const LocalFileIO = require('./local_file_io');

// # HELPERS

function process_keydown_event (store, bindings, event) {
    const state = store.getState();
    const mode = state.mode;
    for (let binding of bindings) {
        if (binding.keypattern.test(event.key)
            && ((mode === binding.mode) || (binding.mode === 'ALL'))
            && ((binding.modifiers === undefined) || binding.modifiers(event))
        ) {
            if (binding.hasOwnProperty('preventDefault') && binding.preventDefault) {
                event.preventDefault()
            }
            console.log(binding);
            store.dispatch(binding.action(state));
            return;
        }
    }
}


// # GRID

const grid_keydown_events = [
    // TODO what else should trigger this? + etc?
    {mode: 'READY', keypattern: /^[\w-"'\(\[{\/=]$/, modifiers: (e) => (!e.ctrlKey), action: () => ({ type: 'EDIT_CELL_REPLACE' })},

    {mode: 'READY', keypattern: /^F2$/, action: () => ({ type: 'EDIT_CELL' })},

    {mode: 'READY', keypattern: /^ArrowLeft$/, action: () => ({ type: 'MOVE_CELL_SELECTION', offset: [0, -1] })},
    {mode: 'READY', keypattern: /^ArrowUp$/, action: () => ({ type: 'MOVE_CELL_SELECTION', offset: [-1, 0] })},
    {mode: 'READY', keypattern: /^ArrowDown$/, action: () => ({ type: 'MOVE_CELL_SELECTION', offset: [1, 0] })},
    {mode: 'READY', keypattern: /^ArrowRight$/, action: () => ({ type: 'MOVE_CELL_SELECTION', offset: [0, 1] })},

    {mode: 'READY', keypattern: /^Tab$/, modifiers: (e) => (!e.shiftKey), preventDefault: true, action: () => ({ type: 'MOVE_CELL_SELECTION', offset: [0, 1] })},
    {mode: 'READY', keypattern: /^Tab$/, modifiers: (e) => (e.shiftKey), preventDefault: true, action: () => ({ type: 'MOVE_CELL_SELECTION', offset: [0, -1] })},

    {mode: 'READY', keypattern: /^Enter$/, modifiers: (e) => (!e.shiftKey), action: () => ({ type: 'MOVE_CELL_SELECTION', offset: [1, 0] })},
    {mode: 'READY', keypattern: /^Enter$/, modifiers: (e) => (e.shiftKey), action: () => ({ type: 'MOVE_CELL_SELECTION', offset: [-1, 0] })},
    
    // TODO If on the name: delete the declaration entirely
    {mode: 'READY', keypattern: /^Delete$/, action: () => ({ type: 'EDIT_AST', AST_edit_type: 'DELETE_VALUE', offset: [0, 0] })},

    // Add and remove elements (eg slots in an array)
    {mode: 'READY', keypattern: /^\+$/, modifiers: (e) => (e.ctrlKey), preventDefault: true, action: function () { return { type: 'EDIT_AST', AST_edit_type: 'INSERT_ELEMENT', offset: [0, 0] }}},
    {mode: 'READY', keypattern: /^-$/, modifiers: (e) => (e.ctrlKey), preventDefault: true, action: function () { return { type: 'EDIT_AST', AST_edit_type: 'DELETE_ELEMENT', offset: [0, 0]}}},
    {mode: 'READY', keypattern: /^_$/, modifiers: (e) => (e.ctrlKey), preventDefault: true, action: function() { return { type: 'EDIT_AST', AST_edit_type: 'DELETE_CONTAINER', offset: [0, 0] }}},
    {mode: 'READY', keypattern: /^t$/, modifiers: (e) => (e.ctrlKey && e.altKey), preventDefault: true, action: function () { return { type: 'EDIT_AST', AST_edit_type: 'CREATE_TABLE', offset: [0, 0] }}},
];

const grid_click_events = [
    { mode: 'READY', action: { type: 'SELECT_CELL' } },
    // TODO would be nice to make this a generic 'LOAD_CODE'
    // and just load with an argument of the code text in the store
    // Problem is you actually want the text in the *code editor object*, not the state,
    // because the state hasn't been updated yet.
    // So you need to give the event a binding to the code editor object.
    { mode: 'EDITING_CODE', action: { type: 'LOAD_CODE_FROM_PANE' } },
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

    grid_element.addEventListener('dblclick', (event) => {
        const clicked_location = get_clicked_cell_location(event);
        if (clicked_location === null) { return }

        const state = store.getState();
        if (state.mode === 'READY') {
            const action = Object.assign({}, {type: 'EDIT_CELL', location: clicked_location});
            store.dispatch(action);
            return;
        }
    });

    grid_element.addEventListener('keydown', (event) => {
        process_keydown_event(store, grid_keydown_events, event);
    });
}

function save_file_as(state) {
    let dest_filepath = LocalFileIO.get_saveas_filepath();
    if (dest_filepath !== undefined) {
        if (dest_filepath.slice(-3) !== '.js') {
            dest_filepath = dest_filepath + '.js';
        }
        LocalFileIO.writeFile(dest_filepath, state.code_editor.value);
        alert(`File saved: ${dest_filepath}`);
        return {type: 'SET_FILEPATH', filepath: dest_filepath};
    } else {
        return { type: 'RETURN_TO_READY' };
    }
}

const window_keydown_events = [
    {mode: 'READY', keypattern: /^S$/, modifiers: (e) => (e.ctrlKey), action: (state) => {
        return save_file_as(state);
    }},
    {mode: 'READY', keypattern: /^s$/, modifiers: (e) => (e.ctrlKey), action: (state) => {
        if (state.filepath === null) {
            return save_file_as(state);
        } else {
            LocalFileIO.writeFile(state.filepath, state.code_editor.value);
            alert(`File saved: ${state.filepath}`)
            return { type: 'RETURN_TO_READY' };
        }
    }},
    {mode: 'READY', keypattern: /^o$/, modifiers: (e) => (e.ctrlKey), action: () => {
        document.getElementById('open-file-manager').click();
    }},
    {mode: 'ALL', keypattern: /^F11$/, modifiers: (e) => (e.altKey), action: () => ({ type: 'TOGGLE_CODE_PANE_SHOW' })},

    // Prevent certain Electron defaults
   {mode: 'ALL', keypattern: /^w/,  preventDefault: true, modifiers: (e) => (e.ctrlKey), action: () => undefined},
]

// TODO move these to window KB events
// Catch window closes

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

const formula_bar = document.getElementById("formula-bar");
const formula_bar_keydown_events = [
    // TOOD how can a user insert a line into the formula bar 
    // without triggering commit? Same way as in Excel?
    {mode: 'EDIT', keypattern: /^Enter$/, modifiers: (e) => (e.shiftKey), preventDefault: false, action: () => ({ type: '',})},
    {mode: 'EDIT', keypattern: /^Enter$/, modifiers: (e) => (!e.shiftKey), preventDefault: true, 
        action: () => ({ type: 'EDIT_AST', AST_edit_type: 'COMMIT_FORMULA_BAR_EDIT', commit_value: formula_bar.value, offset: [1, 0] })},
    {mode: 'EDIT', keypattern: /^Tab$/, modifiers: (e) => (!e.shiftKey), preventDefault: true, 
        action: () => ({ type: 'EDIT_AST', AST_edit_type: 'COMMIT_FORMULA_BAR_EDIT', commit_value: formula_bar.value, offset: [0, 1] })},
    // {mode: 'EDIT', keypattern: /^Enter$/, modifiers: (e) => (e.shiftKey), preventDefault: true, 
    //    action: () => ({ type: 'EDIT_AST', AST_edit_type: 'COMMIT_FORMULA_BAR_EDIT', commit_value: formula_bar.value, offset: [-1, 0] })},
    {mode: 'EDIT', keypattern: /^Tab$/, modifiers: (e) => (e.shiftKey), preventDefault: true, 
        action: () => ({ type: 'EDIT_AST', AST_edit_type: 'COMMIT_FORMULA_BAR_EDIT', commit_value: formula_bar.value, offset: [0, -1] })},
    {mode: 'EDIT', keypattern: /^Escape$/, action: () => ({ type: 'DISCARD_CELL_EDIT' })},
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
            const contents = LocalFileIO.readFileSync(path, 'utf8');
            store.dispatch({type: 'RESET_STATE'});
            store.dispatch({type: 'SET_FILEPATH', filepath: path});
            store.dispatch({type: 'LOAD_CODE', code: contents});
        } else {
            // TODO do we not want to just restore the filename already loaded?
            store.dispatch({type: 'RETURN_TO_READY'});
        }
    });
}

module.exports = {
    bind_window_events,
    bind_grid_events,
    bind_formula_bar_events,
    bind_code_editor_events,
    bind_load_file_events,
}
