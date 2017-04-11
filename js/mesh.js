// Imports
// http://stackoverflow.com/a/19600250

const Redux = require('redux');

const CodeEditor = require(__dirname + '/js/code_editor.js');
const Sheet = require(__dirname + '/js/sheet.js');
const StatusBar = require(__dirname + '/js/status_bar.js');
const Events = require(__dirname + '/js/events.js');
const LocalFileIO = require(__dirname + '/js/local_file_io.js');
const Reducers = require(__dirname + '/js/reducers.js');

// HTML elements

const HTML_elements = {
    grid: document.getElementById('grid'),
    formula_bar: document.getElementById('formula-bar'),
    status_bar: document.getElementById('status-bar'),
    filepicker: document.getElementById('open-file-manager')
}

// JS objects
// TODO hide behind a JS objects parent object to simplify exports / usage?

const store = Redux.createStore(Reducers.app);
const status_bar = new StatusBar(HTML_elements.status_bar, store) 
const sheet = new Sheet(HTML_elements.grid, store);

// Event bindings

Events.bind_code_editor_events(store, CodeEditor);
Events.bind_formula_bar_events(store, HTML_elements.formula_bar);
Events.bind_grid_events(store, HTML_elements.grid);
Events.bind_window_events(store, window);
Events.bind_load_file_events(store, HTML_elements.filepicker);

window.onerror = function (msg, url, lineNo, colNo, error) {
    console.log(`${error.message} | url ${url}, line ${lineNo}, column ${colNo}`)
    // TODO move cursor?
}

// App side-effects

store.subscribe( () => {
    // TODO consider
    // http://stackoverflow.com/questions/25601865/how-to-run-user-provided-javascript-without-security-issues-like-jsfiddle-jsbi
    // http://stackoverflow.com/questions/8004001/how-does-jsfiddle-allow-and-execute-user-defined-javascript-without-being-danger

    let state = store.getState();
    if (state.mode === 'NEED_TO_CALCULATE') {
        // TODO add error checking for calc
        store.dispatch({ type: 'CALCULATING' });
        store.dispatch({ type: 'CALCULATE_AST' });
        eval(state.code_editor.value);
        sheet.send_cell_batch();
        store.dispatch({ type: 'RETURN_TO_READY' });
    }

    // UI component updates
    if (state.render) {
        state = store.getState();
        
        // Document
        if (state.loaded_filepath) {
            const filename = LocalFileIO.get_basename_from_path(state.loaded_filepath);
            document.title = `Mesh - ${filename}`;
        }
        
        // File loading
        if (state.mode === 'SPAWN_LOAD_DIALOG') {
            document.getElementById('open-file-manager').click();
        }

        // Sheet
        sheet.render();

        // Status bar
        status_bar.render(state);

        // Grid
        if (state.mode === 'READY') {
            // TODO maybe we should return to having focus tracked in the app state?
            HTML_elements.grid.focus();
        }
        
        // Formula bar
        // TODO consider making this a React element
        HTML_elements.formula_bar.value = state.formula_bar.value;
        if (state.mode === 'EDIT') {
            HTML_elements.formula_bar.focus();
        }

        // Code editor
        // TODO move this fn somewhere?
        function ASTmod_loc_to_codemirror_loc (ASTmod_loc) {
            const {line, column} = ASTmod_loc;
            return {line: line - 1, ch: column};
        };

        CodeEditor.setValue(state.code_editor.value);
        const selection = state.code_editor.selection;
        if (selection !== undefined) {
            CodeEditor.setSelection(
                ASTmod_loc_to_codemirror_loc(selection.start),
                ASTmod_loc_to_codemirror_loc(selection.end)
            );
        }
    }
} )

// Showtime

store.dispatch({ type: 'RESET_STATE' });
const WELCOME_MESSAGE = require(__dirname + '/js/settings.js').WELCOME_MESSAGE;
CodeEditor.setValue(WELCOME_MESSAGE);

// Exports

module.exports = Mesh = {
    store: store,
	Sheet: Sheet,
    HTML_elements: HTML_elements,
    status_bar: status_bar,
    code_editor: CodeEditor,
    load_CSV: LocalFileIO.load_CSV
}
