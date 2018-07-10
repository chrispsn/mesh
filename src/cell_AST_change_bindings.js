const CT = require('./code_transformers');
const rewrite_input = require('./data_entry').rewrite_input;
const get_selected_cell = require('./selectors').get_selected_cell;

// This is only needed for the abomination known as checking behaviour below - 
// either make the testing code in code_transformers.test.js part of the main file,
// or figure out a better way of checking this using the formula bar input
const Recast = require('recast');

function transform_formula_bar_input(raw_input, isTable) {
    // Change property in-place
    if (raw_input[0] === "=") {
        // TODO maybe do a check here to see if it *really* needs to be a formula? ie just a literal
        // Could do via AST transform, just quickly
        const remainder = raw_input.slice(1);
        const nodepath_type = (function() {
            let nodepath;
            const AST = CT.parse_code_string_to_AST(remainder) 
            Recast.visit(AST, {
                visitExpression: function (path) { nodepath = path; return false; }
            });
            return nodepath;
        })();
        if (isTable) {
            return "function(row, i) {return " + remainder + "}";
        } else {
            return "function() {return " + remainder + "}";
        };
    } else {
        return rewrite_input(raw_input);
    }
};

const DEFAULT = {
    COMMIT_FORMULA_BAR_EDIT: function (meshCellsNode, state, action) {
        // TODO Check that the commit is valid first?
        const key = get_selected_cell(state).AST_props.key;
        const cell_props_nodepath = CT.get_object_item(meshCellsNode, key);
        const cell_value_nodepath = CT.get_object_item(cell_props_nodepath.get("value"), "v");
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.replace_object_item_value(cell_value_nodepath, inserted_code);
        return action.offset;
    },
    DELETE_VALUE: function (meshCellsNode, state, action) {
        alert("No 'delete value' action defined.")
        return [0, 0];
    },
    DELETE_ELEMENT: function(meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const cell_props_nodepath = CT.get_object_item(meshCellsNode, key);
        cell_props_nodepath.prune();
        return [0, 0];
    },
    DELETE_CONTAINER: function(meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const cell_props_nodepath = CT.get_object_item(meshCellsNode, key);
        cell_props_nodepath.prune();
        return [0, 0];
    },
    CREATE_TABLE: function(meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const cell_props_nodepath = CT.get_object_item(meshCellsNode, key).get("value");
        CT.Table_Create(cell_props_nodepath);
        return [0, 0];
    },
};

// TODO does it need only some of the reducers?

const EMPTY = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function (meshCellsNode, state, action) {
        CT.insert_object_item(meshCellsNode,
            "\"" + action.commit_value + "\"",
            "{v: null, l: [" + state.selected_cell_loc + "]}"
        );
        return action.offset;
    },
    DELETE_ELEMENT: function (meshCellsNode, state, action) {
        alert("No 'delete element' action defined.")
        return [0, 0];
    }
};

const KEY = {
    __proto__: DEFAULT,
    // TODO add 'change symbol' functionality
};

const ARRAY_LITERAL_DATA_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function(meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const index = get_selected_cell(state).AST_props.index;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.replace_array_element(array_nodepath, index, inserted_code);
        return action.offset;
    },
    INSERT_ELEMENT: function(meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const index = get_selected_cell(state).AST_props.index;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        CT.insert_array_element(array_nodepath, index, "null");
        return action.offset;
    },
    DELETE_ELEMENT: function(meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const index = get_selected_cell(state).AST_props.index;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        CT.remove_array_element(array_nodepath, index);
        return action.offset;
    },
};

const ARRAY_LITERAL_APPEND_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function(meshCellsNode, state, action) {
        // TODO allow for formula cells
        const key = get_selected_cell(state).AST_props.key;
        const index = get_selected_cell(state).AST_props.index;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.append_array_element(array_nodepath, inserted_code);
        return action.offset;
    },
    INSERT_ELEMENT: function(meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const index = get_selected_cell(state).AST_props.index;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        CT.insert_array_element(array_nodepath, index, "null");
        return action.offset;
    },
    // TODO fix below
    DELETE_CONTAINER: function (meshCellsNode, state) {
        const key = get_selected_cell(state).AST_props.key;
        const nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        CT.delete_container(nodepath);
        return [0, 0];
    },
};

const OBJECT_LITERAL_KEY_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const item_key = get_selected_cell(state).AST_props.item_key;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        const obj_item_nodepath = CT.get_object_item(obj_nodepath, item_key);
        const inserted_code = action.commit_value;
        // TODO where does new_id come from?
        CT.replace_object_item_key(obj_item_nodepath, inserted_code);
        return action.offset;
    },
    INSERT_ELEMENT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const item_key = get_selected_cell(state).AST_props.item_key;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        CT.insert_object_getter(obj_nodepath, "new_key", "null");
        return action.offset;
    },
    DELETE_ELEMENT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const item_key = get_selected_cell(state).AST_props.item_key;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        CT.remove_object_item(obj_nodepath, item_key);
        return action.offset;
    },
};

/*
test 'insert element" and also 'insert element on record append cell'
*/

const OBJECT_LITERAL_VALUE_CELL = {
    __proto__: DEFAULT,
    // TODO maintain item order in code
    COMMIT_FORMULA_BAR_EDIT: function (meshCellsNode, state, action) {
        // Should be able to merge with the code for commits to the module object
        const key = get_selected_cell(state).AST_props.key;
        const item_key = get_selected_cell(state).AST_props.item_key;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        const obj_prop_node = CT.get_object_item(obj_nodepath, item_key);
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.replace_object_getter_return_val(obj_prop_node, inserted_code);
        return action.offset;
    },
    INSERT_ELEMENT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        CT.insert_object_getter(obj_nodepath, "new_key", "null");
        return action.offset;
    },
    DELETE_ELEMENT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const item_key = get_selected_cell(state).AST_props.item_key;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        CT.remove_object_item(obj_nodepath, item_key);
        return action.offset;
    },
};

const OBJECT_LITERAL_APPEND_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        const inserted_code = action.commit_value;
        CT.insert_object_getter(obj_nodepath, inserted_code, "null");
        return action.offset;
    },
    INSERT_ELEMENT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(meshCellsNode, 0, key));
        CT.insert_object_getter(obj_nodepath, "new_key", "null");
        return action.offset;
    },
};

const TABLE_RW_HEADING_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function (meshCellsNode, state, action) {
        // TODO complete
        return action.offset;
    },
    INSERT_ELEMENT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const colIndex = get_selected_cell(state).AST_props.colIndex;
        const fnCallNodepath = CT.getCellNodePath(meshCellsNode, key).value;
        const table_nodepath = CT.FunctionCall_GetArgument(fnCallNodepath, 0);
        CT.Table_AddColumn(table_nodepath, action.commit_value, colIndex);
        return action.offset;
    },
    DELETE_ELEMENT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const heading = get_selected_cell(state).AST_props.heading;
        const fnCallNodepath = CT.getCellNodePath(meshCellsNode, key).value;
        const table_nodepath = CT.FunctionCall_GetArgument(fnCallNodepath, 0);
        CT.Table_DeleteColumn(table_nodepath, heading);
        return [0, 0];
    },
};

const TABLE_RW_ADD_COLUMN_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const fnCallNodepath = CT.getCellNodePath(meshCellsNode, key).value;
        const table_nodepath = CT.FunctionCall_GetArgument(fnCallNodepath, 0);
        CT.Table_AddColumn(table_nodepath, action.commit_value);
        return action.offset;
    },
    // TODO
    // INSERT_ELEMENT: function (meshCellsNode, state, action) {

};

const TABLE_RW_VALUE_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const colHeading = get_selected_cell(state).AST_props.colHeading;
        const rowIndex = get_selected_cell(state).AST_props.rowIndex;
        const fnCallNodepath = CT.getCellNodePath(meshCellsNode, key).value;
        const table_nodepath = CT.FunctionCall_GetArgument(fnCallNodepath, 0);
        const inserted_code = transform_formula_bar_input(action.commit_value, true);
        CT.Table_ChangeValueCell(table_nodepath, colHeading, rowIndex, inserted_code)
        return action.offset;
    },
    DELETE_VALUE: function(meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const colHeading = get_selected_cell(state).AST_props.colHeading;
        const rowIndex = get_selected_cell(state).AST_props.rowIndex;
        const fnCallNodepath = CT.getCellNodePath(meshCellsNode, key).value;
        const table_nodepath = CT.FunctionCall_GetArgument(fnCallNodepath, 0);
        CT.Table_ChangeValueCell(table_nodepath, colHeading, rowIndex, "undefined");
        return action.offset;
    },
    DELETE_ELEMENT: function(meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const colHeading = get_selected_cell(state).AST_props.colHeading;
        const rowIndex = get_selected_cell(state).AST_props.rowIndex;
        const fnCallNodepath = CT.getCellNodePath(meshCellsNode, key).value;
        const table_nodepath = CT.FunctionCall_GetArgument(fnCallNodepath, 0);
        CT.Table_DeleteRow(table_nodepath, rowIndex);
        return [0, 0];
    },
    // TODO
    // INSERT_ELEMENT: function (meshCellsNode, state, action) {
};

const TABLE_RW_APPEND_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function (meshCellsNode, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const colHeading = get_selected_cell(state).AST_props.colHeading;
        const rowIndex = get_selected_cell(state).AST_props.rowIndex;
        const fnCallNodepath = CT.getCellNodePath(meshCellsNode, key).value;
        const table_nodepath = CT.FunctionCall_GetArgument(fnCallNodepath, 0);
        const inserted_code = transform_formula_bar_input(action.commit_value, true);
        CT.Table_AddRow(table_nodepath, colHeading, rowIndex, inserted_code);
        return action.offset;
    },
};

module.exports = {
    DEFAULT: DEFAULT,
    EMPTY: EMPTY,
    KEY: KEY,
    ARRAY_LITERAL_DATA_CELL: ARRAY_LITERAL_DATA_CELL,
    ARRAY_LITERAL_APPEND_CELL: ARRAY_LITERAL_APPEND_CELL,
    OBJECT_LITERAL_KEY_CELL: OBJECT_LITERAL_KEY_CELL,
    OBJECT_LITERAL_VALUE_CELL: OBJECT_LITERAL_VALUE_CELL,
    OBJECT_LITERAL_APPEND_CELL: OBJECT_LITERAL_APPEND_CELL,
    TABLE_RW_HEADING_CELL: TABLE_RW_HEADING_CELL,
    TABLE_RW_ADD_COLUMN_CELL: TABLE_RW_ADD_COLUMN_CELL,
    TABLE_RW_VALUE_CELL: TABLE_RW_VALUE_CELL,
    TABLE_RW_APPEND_CELL: TABLE_RW_APPEND_CELL
};
