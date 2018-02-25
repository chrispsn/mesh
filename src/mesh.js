'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const Redux = require('redux');
const CodeMirror = require('codemirror/lib/codemirror');
require('codemirror/addon/selection/active-line');
require('codemirror/mode/javascript/javascript');

const Events = require('./events');
const Reducers = require('./reducers');
const {LINE_SEPARATOR} = require('./settings');
const Selectors = require('./selectors');

// Redux setup

const store = Redux.createStore(Reducers.app);

// React components 

const Grid = require('./react.grid');
const StatusBar = require('./react.status_bar');

// HTML elements

// Need to render now to get a reference to the grid
ReactDOM.render(
    React.createElement(Grid, store.getState()),
    document.getElementById('grid-container')
)
const HTML_elements = {
    formula_bar: document.getElementById('formula-bar'),
    grid_container: document.getElementById('grid-container'),
    grid: document.getElementById('grid'),
    code_editor: document.getElementById('code-editor'),
    status_bar: document.getElementById('status-bar'),
    filepicker: document.getElementById('open-file-manager'),
}

// Code editor (CodeMirror)

const codemirror_settings = {
    value: '',
    mode: "javascript",
    theme: "neo", // light theme
    // theme: "lesser-dark", // dark theme
    styleActiveLine: true,
    lineWrapping: true,
    lineNumbers: true,
    lineSeparator: LINE_SEPARATOR,
}

const code_editor = CodeMirror(HTML_elements.code_editor, codemirror_settings);

// Event bindings

Events.bind_window_events(store, window);
Events.bind_formula_bar_events(store, HTML_elements.formula_bar);
Events.bind_grid_events(store, HTML_elements.grid);
Events.bind_code_editor_events(store, code_editor);
Events.bind_load_file_events(store, HTML_elements.filepicker);

// App side-effects

store.subscribe( function calculate () {
    const mode = store.getState().mode;
    if (mode === 'NEED_TO_CALCULATE') { store.dispatch({type: 'CALCULATE'}) };
});

store.subscribe( function log_state () {
    console.log("State: ", store.getState());
});

store.subscribe( function update_page () {

    const state = store.getState();
        
    // Status bar
    // TODO should it *always* render?
    ReactDOM.render(React.createElement(StatusBar, state), HTML_elements.status_bar);

    // Grid
    if (state.mode === 'READY') {
        // TODO maybe we should return to having focus tracked in the app state?
        HTML_elements.grid.focus();
        ReactDOM.render(React.createElement(Grid, state), HTML_elements.grid_container);
    }
    
    // Formula bar
    if (state.mode === 'EDIT') {
        HTML_elements.formula_bar.focus();
    } else if (state.mode === 'EDIT_REPLACE') {
        HTML_elements.formula_bar.value = '';
        store.dispatch({ type: 'EDIT_CELL' });
    } else if (state.mode === 'READY') {
        const selected_cell = Selectors.get_selected_cell(state);
        HTML_elements.formula_bar.value = selected_cell.formula_bar_value;
    }

    // Code editor
    // can't we just make the events file know about the code editor?
    // (ie load the code directly into the event props from the HTML element
    // instead of loading it in via a subscription)
    if (state.mode === 'LOAD_CODE_FROM_PANE') {
        store.dispatch({ type: 'LOAD_CODE', code: code_editor.getValue() });
    } else {
    // TODO setting this every time is probably slow - consider React-ising
    // or else doing only when a commit happens or something
        code_editor.setValue(state.code_editor.value);
        HTML_elements.code_editor.style.display = state.code_editor.show ? 'block' : 'none';
    }

});
store.dispatch({ type: 'RESET_STATE' });
