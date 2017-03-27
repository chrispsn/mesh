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
    status_bar: document.getElementById('status-bar')
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
Events.bind_keydown_events(store, window);

window.onerror = function (msg, url, lineNo, colNo, error) {
    console.log(`${error.message} | url ${url}, line ${lineNo}, column ${colNo}`)
    // TODO move cursor?
}

// Calculation

function calculate_if_required () {
    // TODO consider
    // http://stackoverflow.com/questions/25601865/how-to-run-user-provided-javascript-without-security-issues-like-jsfiddle-jsbi
    // http://stackoverflow.com/questions/8004001/how-does-jsfiddle-allow-and-execute-user-defined-javascript-without-being-danger
    const state = store.getState();
    if (state.mode === 'NEED_TO_CALCULATE') {
        store.dispatch({ type: 'CALCULATING' });
        // TODO add error checking for calc
        eval(state.code_editor.value);
        sheet.send_cell_batch();
        store.dispatch({ type: 'RETURN_TO_READY' });
        store.dispatch({ type: 'UPDATE_FORMULA_BAR' });
    }

    // UI component updates
    // TODO fact these are being hit every time is a good incentive
    // to minimise the number of actions taken
    sheet.render();
    status_bar.render(state);
    // Formula bar
    // TODO consider making this a React element
    HTML_elements.formula_bar.value = store.getState().formula_bar.value;
    if (state.formula_bar.focused) {
        HTML_elements.formula_bar.focus();
    } else {
        HTML_elements.formula_bar.blur();
    }

}
store.subscribe(calculate_if_required);

// Showtime

store.dispatch({ type: 'RESET_STATE' });

// Exports

module.exports = Mesh = {
    store: store,
	Sheet: Sheet,
    HTML_elements: HTML_elements,
    status_bar: status_bar,
    code_editor: CodeEditor,
    load_CSV: LocalFileIO.load_CSV
}
