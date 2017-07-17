// Imports
// http://stackoverflow.com/a/19600250

const React = require('react');
const ReactDOM = require('react-dom');
const Redux = require('redux');

const Events = require(__dirname + '/js/events.js');
const LocalFileIO = require(__dirname + '/js/local_file_io.js');
const Reducers = require(__dirname + '/js/reducers.js');
const DisplayFunctions = require(__dirname + '/js/display_functions.js');
const SyntaxDisplayMap = require(__dirname + '/js/syntax_display_map.js');

// Redux setup

const store = Redux.createStore(Reducers.app);

// React components 

const Grid = require(__dirname + '/js/react_components/grid.js');
const StatusBar = require(__dirname + '/js/react_components/status_bar.js');

// HTML elements

ReactDOM.render(React.createElement(Grid, store.getState()),
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

const create_code_mirror = require('codemirror/lib/codemirror');
require('codemirror/addon/selection/active-line.js');
require('codemirror/mode/javascript/javascript');

const {LINE_SEPARATOR} = require(__dirname + "/js/settings.js");

const code_editor = create_code_mirror(HTML_elements.code_editor, {
        value: '',
        mode: "javascript",
        theme: "neo",
        styleActiveLine: true,
        lineWrapping: true,
        lineNumbers: true,
        lineSeparator: LINE_SEPARATOR
    }
)

// Event bindings

Events.bind_window_events(store, window);
Events.bind_formula_bar_events(store, HTML_elements.formula_bar);
Events.bind_grid_events(store, HTML_elements.grid);
Events.bind_code_editor_events(store, code_editor);
Events.bind_load_file_events(store, HTML_elements.filepicker);

/*
window.onerror = function (msg, url, lineNo, colNo, error) {
    console.log(`${error.message} | url ${url}, line ${lineNo}, column ${colNo}`)
    // TODO move cursor?
}
*/

// Mesh interaction functions

function attach(ref_string, value, location, custom_display_func) {
    // Display functions return arrays of cells.
    // We collect the cells from multiple `attach` calls and send them as one batch for rendering.

    const current_AST = store.getState().AST;
    const declaration_node = current_AST.get_first_declaration_of_name(ref_string);

    let new_cells;

    if (custom_display_func) {
        new_cells = custom_display_func(value, ref_string, location, declaration_node);
    }

    else {
        // TODO should we go back to having this (or at least the syntax display stuff)
        // as a switch? Would allow default case to be dummy?
        if (declaration_node) {
            const expression_type = declaration_node.init.type;
            let display_fn;
            if (SyntaxDisplayMap.hasOwnProperty(expression_type)) {
                display_fn = SyntaxDisplayMap[expression_type];
            } else {
                console.log("Not sure how to display this expression type: ", expression_type);
                display_fn = SyntaxDisplayMap['Unknown'];
            }
            new_cells = display_fn(value, ref_string, location, declaration_node);
        } else {
            // TODO implement FunctionDeclaration (and anything else?)
            new_cells = DisplayFunctions.write_dummy('TODO', ref_string, location, declaration_node)
        }
    }

    // Also needs to take into account the selected cell
    // (and preserving the existing value after recalc if possible)
    cells.push(...new_cells);
    
}

function bulk_attach(ref_string_value_pairs, starting_location) {
    let [x, y] = starting_location;
    for (let [ref_string, value] of ref_string_value_pairs) {
        attach(ref_string, value, [x, y]);
        x++;
    }
    return x;
}

// App side-effects

let cells;

store.subscribe( function calculate () {
    // TODO consider
    // http://stackoverflow.com/questions/25601865/how-to-run-user-provided-javascript-without-security-issues-like-jsfiddle-jsbi
    // http://stackoverflow.com/questions/8004001/how-does-jsfiddle-allow-and-execute-user-defined-javascript-without-being-danger

    const state = store.getState();
    if (state.mode === 'NEED_TO_CALCULATE') {
        store.dispatch({ type: 'PREP_FOR_EVAL' });
        // TODO add error checking for calc
        // - at AST stage?
        // - at eval stage?
        // - both?
        cells = [];
        // The cells array is emptied and will fill via the eval below
        eval(state.code_editor.value);
        store.dispatch({ type: 'ADD_CELLS_TO_SHEET', cells: cells });
        store.dispatch({ type: 'RETURN_TO_READY' });
    }
});

store.subscribe( function log_state () {
    console.log(store.getState());
});

store.subscribe( function run_side_effects () {
    const state = store.getState();
    HTML_elements.formula_bar.value = state.formula_bar_value;
        
    // Status bar should always render (??)
    ReactDOM.render(React.createElement(StatusBar, state), HTML_elements.status_bar);

    // Document
    if (state.loaded_filepath) {
        const filename = LocalFileIO.get_basename_from_path(state.loaded_filepath);
        document.title = `Mesh - ${filename}`;
    }
    
    // File loading
    if (state.mode === 'SPAWN_LOAD_DIALOG') {
        document.getElementById('open-file-manager').click();
    }

    // Rendering and focus control
    if (state.mode === 'READY') {
        // TODO maybe we should return to having focus tracked in the app state?
        HTML_elements.grid.focus();
        ReactDOM.render(React.createElement(Grid, state), HTML_elements.grid_container);
        HTML_elements.formula_bar.value = state.formula_bar_value;
    }
    
    // Formula bar
    if (state.mode === 'EDIT') {
        HTML_elements.formula_bar.focus();
    }

    // Code editor
    // TODO move this fn somewhere?
    function ASTmod_loc_to_codemirror_loc (ASTmod_loc) {
        const {line, column} = ASTmod_loc;
        return {line: line - 1, ch: column};
    };

    code_editor.setValue(state.code_editor.value);
    const selection = state.code_editor.selection;
    if (selection) {
        code_editor.setSelection(
            ASTmod_loc_to_codemirror_loc(selection.start),
            ASTmod_loc_to_codemirror_loc(selection.end)
        );
    }
    if (state.code_editor.show) {
        HTML_elements.code_editor.style.display = 'block';
    } else {
        console.log(
            "Hiding..."
        )
        HTML_elements.code_editor.style.display = 'none';
    }
});


// Exports

// TODO how much of this do we need? Aim to get of explicit store refs for example
module.exports = Mesh = {
    store,
    attach,
    bulk_attach,
    HTML_elements,
    load_CSV: LocalFileIO.load_CSV
}

// Showtime

store.dispatch({ type: 'LOAD_FILE', path: __dirname + '/examples/blank.js' });
// TODO should not be able to save the blank file
const WELCOME_MESSAGE = require(__dirname + '/js/settings.js').WELCOME_MESSAGE;
code_editor.setValue(WELCOME_MESSAGE);