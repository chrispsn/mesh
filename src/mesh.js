const React = require('react');
const ReactDOM = require('react-dom');
const Redux = require('redux');
const CodeMirror = require('codemirror/lib/codemirror');
require('codemirror/addon/selection/active-line');
require('codemirror/mode/javascript/javascript');

const Events = require('./events');
const Reducers = require('./reducers');
const Display = require('./display');
const CT = require('./code_transformers');
const Settings = require('./settings');
const nodetype_to_display_fn = require('./nodetype_to_display_fn');

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

const code_editor = CodeMirror(HTML_elements.code_editor, {
        value: '',
        mode: "javascript",
        theme: "neo",
        styleActiveLine: true,
        lineWrapping: true,
        lineNumbers: true,
        lineSeparator: Settings.LINE_SEPARATOR
    }
)

// Event bindings

Events.bind_window_events(store, window);
Events.bind_formula_bar_events(store, HTML_elements.formula_bar);
Events.bind_grid_events(store, HTML_elements.grid);
Events.bind_code_editor_events(store, code_editor);
Events.bind_load_file_events(store, HTML_elements.filepicker);

// Mesh interaction functions

function attach(attachments) {
    // Display functions return arrays of cells.
    // We collect the cells from multiple `attach` calls and send them as one batch for rendering.
    const state = store.getState();
    const old_code = state.code_editor.value;
    const AST = new CT.parse_code_string_to_AST(old_code);
    for (let attach_info of attachments) {
        const {module_id, id, value, grid_loc} = attach_info;

        let key_cell = Display.create_cell({
            location: grid_loc,
            repr: id,
            ref_string: id,
            formula_bar_value: id,
            classes: 'occupied identifier',
            delete_element: (state, action) => {
                const old_code = state.code_editor.value;
                const AST = CT.parse_code_string_to_AST(old_code);
                const module_nodepath = CT.get_declaration_node_init(AST, 'MODULE');

                // Remove module item
                const item_nodepath = CT.get_object_item(module_nodepath, id);
                item_nodepath.prune();
                
                // Remove Mesh attachment
                const attachments_nodepath = CT.get_declaration_node_init(AST, 'MESH_ATTACHMENTS');
                CT.remove_record_given_key(attachments_nodepath, 'id', id);

                const new_code = CT.print_AST_to_code_string(AST);
                return Object.assign({}, state, {
                    code_editor: Object.assign({}, state.code_editor, {value: new_code}),
                    mode: 'NEED_TO_CALCULATE'
                });
            }
        });

        let {display_fn} = attach_info;
        const module_obj_path = CT.get_declaration_node_init(AST, module_id);
        const item_nodepath = CT.get_object_item(module_obj_path, id);
        let value_nodepath = item_nodepath.get('value');

        // Look through getters to the underlying return value.
        let expression_type = value_nodepath.node.type;
        if (item_nodepath.node.kind === 'get') {
            value_nodepath = value_nodepath.get('body', 'body', 0, 'argument');
            expression_type = 'CallExpression';
        };

        // Not sure on exactly which parameters are best here, and which order makes most sense.
        // 1. Value is needed because the AST doesn't know what (eg) a fn call evaluates to.
        // 2. Value nodepath is needed to work out what to display in the formula bar.
        // 3. ID is needed so the cells' fns can access their module item to work on it;
        // technically recoverable from value_nodepath.parent, but feels more efficient to pass now.
        // As ID is not *required*, have listed last so it's easier to delete later if desired.
        let value_cells;
        if (display_fn) {
            value_cells = display_fn(value, value_nodepath, id);
        } else {
            // TODO should we go back to having this (or at least the syntax display stuff)
            // as a switch? Would allow default case to be dummy?
            // TODO technically these display_fn assignments are overwriting - not good?
            if (nodetype_to_display_fn.hasOwnProperty(expression_type)) {
                display_fn = nodetype_to_display_fn[expression_type];
            } else {
                console.log("Not sure how to display this expression type: ", expression_type);
                display_fn = nodetype_to_display_fn['Unknown'];
            }
            value_cells = display_fn(value, value_nodepath, id);
        }
        
        // Value cells come through with locations as offsets to the name cell,
        // so we need to update them.
        // Consider moving back into the display fns as a parameter if this step is slow.
        for (let cell of value_cells) {
            cell.location = [cell.location[0] + grid_loc[0], cell.location[1] + grid_loc[1]];
        }

        // Also needs to take into account the selected cell
        // (and preserving the existing value after recalc if possible)
        cells.push(key_cell, ...value_cells);
    }
}

// App side-effects

let cells;

store.subscribe( function calculate () {
    const state = store.getState();
    if (state.mode === 'NEED_TO_CALCULATE') {
        console.log("Calculating...");
        // TODO right now this dumps the user back to the code editing pane,
        // but it should depend on where the commit came from (code pane or formula bar)
        try {
            // The cells array is emptied but will fill via the eval below
            cells = [];
            eval(state.code_editor.value);
            store.dispatch({ type: 'ADD_CELLS_TO_SHEET', cells: cells });
            store.dispatch({ type: 'RETURN_TO_READY' });
        } catch (e) {
            alert(e);
            console.error(e);
            store.dispatch({ type: 'SELECT_CODE' })
        }
    }
});

store.subscribe( function log_state () {
    console.log("State: ", store.getState());
});

store.subscribe( function update_page () {
    const state = store.getState();
    HTML_elements.formula_bar.value = state.formula_bar_value;
        
    // Status bar should always render (??)
    ReactDOM.render(React.createElement(StatusBar, state), HTML_elements.status_bar);

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
    // TODO setting this every time is probably slow - consider React-ising
    if (state.mode === 'LOAD_CODE_FROM_PANE') {
        store.dispatch({ type: 'LOAD_CODE', code: code_editor.getValue() });
    } else {
        code_editor.setValue(state.code_editor.value);
        const selection = state.code_editor.selection;
        if (selection) {
            const {start, end} = selection;
            code_editor.setSelection(
                {line: start.line - 1, ch: start.column},
                {line: end.line - 1, ch: end.column},
            );
        }
        if (state.code_editor.show) {
            HTML_elements.code_editor.style.display = 'block';
        } else {
            HTML_elements.code_editor.style.display = 'none';
        }
    }
});

// Exports
module.exports = Mesh = {
    store,
    attach,
    HTML_elements,
}

// Showtime
// TODO add back require module check, etc? make a per-platform setting?
const BLANK_FILE = [
    "'use strict';", 
    "",
    "var MODULE = {",
    "};",
    "",
    "// Put your Mesh.attach code in these brackets",
    "// if you want to also run this file without Mesh",
    "if (typeof Mesh !== 'undefined') {",
    "    const MESH_ATTACHMENTS = [",
    "    ];",
    "    Mesh.attach(MESH_ATTACHMENTS);",
    "};"
].join(Settings.LINE_SEPARATOR);
store.dispatch({ type: 'LOAD_CODE', code: BLANK_FILE });

