'use strict';

const CT = require('./code_transformers');
const cell_AST_change_bindings = require('./cell_AST_change_bindings');
const get_selected_cell = require('./selectors').get_selected_cell;
const EMPTY_CELL = require('./display').EMPTY_CELL;
const LINE_SEPARATOR = require('./settings').LINE_SEPARATOR;
const BLANK_FILE = require('./settings').BLANK_FILE;
const assign = require('./settings').assign;


const INITIAL_STATE = {
    mode: 'READY',
    // TODO do I have to tell cells where they are? Alt: do I have to use locations as keys?
    // Alt 2: why can't the cells come through as a key-value map? Then really can skip
    // duplication of location... unless needed by React?
    cells: { '[0, 0]': assign({}, EMPTY_CELL, {location: [0, 0]}) },
    selected_cell_loc: [0, 0],
    // TODO load whether to show code editor at start from user settings?
    code_editor: { value: BLANK_FILE, prev_value: "", selection: undefined, show: false },
    filepath: null,
}


// TODO is there a more brief alternative to assign?
// TODO can we get rid of all the (state, action) signatures?
const state_changes = {

    'RESET_STATE': function(state, action) {return assign({}, state, INITIAL_STATE)},

    /* CODE PANE */

    'SELECT_CODE': function(state, action) {return assign({}, state, {mode: 'EDITING_CODE'})},

    'TOGGLE_CODE_PANE_SHOW': function(state, action) {
        const bool = !state.code_editor.show;
        const code_editor = assign({}, state.code_editor, {show: bool});
        return assign({}, state, {code_editor: code_editor});
    },

    'LOAD_CODE': function(state, action) {return assign({}, state, {
        code_editor: assign({}, state.code_editor, {
            // TODO this 'recording of past valid state' is a bit of a hack.
            // If the change we made in the code pane was not valid,
            // we still want to see the broken code
            // before it's committed in the pane, not go back to the last valid state.
            // Seems to also have bugs around moving the selected cell.
            value: action.code, prev_value: state.code_editor.value
        }),
        mode: 'CALCULATING',
    })},

    'LOAD_CODE_FROM_PANE': function(state, action) {return assign({}, state, {
        mode: 'LOAD_CODE_FROM_PANE', 
    })},

    /* CALCULATION */
    
    // Implicit: CALCULATING

    'UPDATE_GRID': function(state, action) {return assign({}, state, {
        mode: 'READY', cells: action.cells
    })},

    // TODO eliminate this?
    'RETURN_TO_READY': function(state, action) {return assign({}, state, {mode: 'READY'})},

    /* CELL BEHAVIOUR */

    'SELECT_CELL': function(state, action) {return assign({}, state, {
        selected_cell_loc: action.location
    })},

    'MOVE_CELL_SELECTION': function(state, action) {
        const old_idxs = state.selected_cell_loc;
        const offsets = action.offset;
        const new_location = [
            Math.max(0, old_idxs[0] + offsets[0]),
            Math.max(0, old_idxs[1] + offsets[1]),
        ];
        return assign({}, state, {selected_cell_loc: new_location});
    },

    'EDIT_CELL': function(state, action) {return assign({}, state, {mode: 'EDIT'})},

    'EDIT_CELL_REPLACE': function(state, action) {
        let new_props = (state.mode === 'EDIT') ? {} : {mode: 'EDIT_REPLACE'};
        return assign({}, state, new_props);
    },

    'DISCARD_CELL_EDIT': function(state, action) {return assign({}, state, {
        mode: 'READY',
        formula_bar_value: this.formula_bar_value,
    })},

    'EDIT_AST': function(state, action) {
        const old_code = state.code_editor.value;
        const AST = CT.parse_code_string_to_AST(old_code);
        const mesh_obj_node = CT.getCellsNodePath(AST);

        const fns_label = get_selected_cell(state).cell_AST_changes_type;
        const AST_change_fns = cell_AST_change_bindings[fns_label];
        const AST_change_fn = AST_change_fns[action.AST_edit_type] 

        // TODO pass in fn arguments etc, instead of whole action? (Probs need whole action)
        // TODO should this also pass in the selected cell,
        // instead of the whole state?
        const selection_offset = AST_change_fn(mesh_obj_node, state, action);

        const old_idxs = state.selected_cell_loc;
        const new_code = CT.print_AST_to_code_string(AST);
        return assign({}, state, {
            code_editor: assign({}, state.code_editor, {value: new_code, prev_value: old_code}),
            mode: 'CALCULATING',
            // TODO Merge with select code somehow? (Feels like select should just be a 'refresh ready')
            // TODO these 'row + offset, col + offset' logics are basically the same
            // as what the main reducer is doing...
            selected_cell_loc: [
                old_idxs[0] + selection_offset[0], 
                old_idxs[1] + selection_offset[1]
            ],
            prev_selected_cell_loc: [old_idxs[0], old_idxs[1]],
        });
    },

    /* OTHER */

    'SET_FILEPATH': function(state, action) {return assign({}, state, {filepath: action.filepath})},

}

const app = function (state, action) {
    if (state === undefined) state = INITIAL_STATE;
    const reducer = state_changes[action.type];
    if (reducer !== undefined) {
        return reducer(state, action);
    } else {
        console.error("NO ACTION FOUND FOR:", action);
        return state;
    }
}

module.exports = { app: app }
