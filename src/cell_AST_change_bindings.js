const CT = require('./code_transformers');
const {rewrite_input} = require('./data_entry');
const {get_selected_cell} = require('./selectors');

// This is only needed for the abomination known as checking behaviour below - 
// either make the testing code in code_transformers.test.js part of the main file,
// or figure out a better way of checking this using the formula bar input
const Recast = require('recast');

function transform_formula_bar_input(raw_input) {
    // Change property in-place
    if (raw_input[0] === "=") {
        // TODO maybe do a check here to see if it *really* needs to be a formula? ie just a literal
        // Could do via AST transform, just quickly
        const remainder = raw_input.slice(1);
        const nodepath_type = (() => {
            let nodepath;
            const AST = CT.parse_code_string_to_AST(remainder) 
            Recast.visit(AST, {
                visitExpression: function (path) { nodepath = path; return false; }
            });
            return nodepath;
        })();
        if (nodepath_type === 'Literal') {
            return rewrite_input(remainder);
        } else {
            return "function() {return " + remainder + "}";
        }
    } else {
        return rewrite_input(raw_input);
    }
};

const DEFAULT = {
    COMMIT_FORMULA_BAR_EDIT: function (mesh_obj_node, state, action) {
        // TODO Check that the commit is valid first?
        const key = get_selected_cell(state).AST_props.key;
        const cell_props_nodepath = CT.get_object_item(mesh_obj_node, key);
        const cell_value_nodepath = CT.get_object_item(cell_props_nodepath.get("value"), "v");
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.replace_object_item_value(cell_value_nodepath, inserted_code);
        return action.offset;
    },
    DELETE_VALUE: function (mesh_obj_node, state, action) {
        alert("No 'delete value' action defined.")
        return [0, 0];
    },
    DELETE_ELEMENT: function(mesh_obj_node, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const cell_props_nodepath = CT.get_object_item(mesh_obj_node, key);
        cell_props_nodepath.prune();
        return [0, 0];
    },
    DELETE_CONTAINER: function(mesh_obj_node, state, action) {
        const key = get_selected_cell(state).AST_props.key;
        const cell_props_nodepath = CT.get_object_item(mesh_obj_node, key);
        cell_props_nodepath.prune();
        return [0, 0];
    },
};

// TODO does it need only some of the reducers?

const EMPTY = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function (mesh_obj_node, state, action) {
        CT.insert_object_item(mesh_obj_node,
            `"${action.commit_value}"`,
            `{v: null, l: [${state.selected_cell_loc}], f: null, s: null, n: null, t: null}`,
        )
        return action.offset;
    },
    DELETE_ELEMENT: function (mesh_obj_node, state, action) {
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
    COMMIT_FORMULA_BAR_EDIT: function(mesh_obj_node, state, action) {
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.replace_array_element(array_nodepath, index, inserted_code);
        return action.offset;
    },
    INSERT_ELEMENT: function(mesh_obj_node, state, action) {
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.insert_array_element(array_nodepath, index, "null");
        return action.offset;
    },
    DELETE_ELEMENT: function(mesh_obj_node, state, action) {
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.remove_array_element(array_nodepath, index);
        return action.offset;
    },
};

const ARRAY_LITERAL_APPEND_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        // TODO allow for formula cells
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.append_array_element(array_nodepath, inserted_code);
        return action.offset;
    },
    INSERT_ELEMENT: (mesh_obj_node, state, action) => {
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.insert_array_element(array_nodepath, index, "null");
        return action.offset;
    },
    // TODO fix below
    DELETE_CONTAINER: function (mesh_obj_node, state) {
        const {key} = get_selected_cell(state).AST_props;
        const nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.delete_container(nodepath);
        return [0, 0];
    },
};

const OBJECT_LITERAL_KEY_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        const obj_item_nodepath = CT.get_object_item(obj_nodepath, item_key);
        const inserted_code = action.commit_value;
        // TODO where does new_id come from?
        CT.replace_object_item_key(obj_item_nodepath, inserted_code);
        return action.offset;
    },
    INSERT_ELEMENT: (mesh_obj_node, state, action) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.insert_object_getter(obj_nodepath, "new_key", "null");
        return action.offset;
    },
    DELETE_ELEMENT: (mesh_obj_node, state, action) => {
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
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
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        // Should be able to merge with the code for commits to the module object
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        const obj_prop_node = CT.get_object_item(obj_nodepath, item_key);
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.replace_object_getter_return_val(obj_prop_node, inserted_code);
        return action.offset;
    },
    INSERT_ELEMENT: (mesh_obj_node, state, action) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.insert_object_getter(obj_nodepath, "new_key", "null");
        return action.offset;
    },
    DELETE_ELEMENT: (mesh_obj_node, state, action) => {
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.remove_object_item(obj_nodepath, item_key);
        return action.offset;
    },
};

const OBJECT_LITERAL_APPEND_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        const inserted_code = action.commit_value;
        CT.insert_object_getter(obj_nodepath, inserted_code, "null");
        return action.offset;
    },
    INSERT_ELEMENT: (mesh_obj_node, state, action) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.insert_object_getter(obj_nodepath, "new_key", "null");
        return action.offset;
    },
};

const OOA_LITERAL_VALUE_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        // Should be able to merge with the code for commits to the module object
        const {key, item_key, index} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        const table_prop_node = CT.get_object_item(obj_nodepath, item_key);
        const array_nodepath = table_prop_node.get("value");
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.replace_array_element(array_nodepath, index, inserted_code);
        return action.offset;
    },
    // TODO
    // INSERT_ELEMENT: (mesh_obj_node, state, action) => {
    DELETE_ELEMENT: (mesh_obj_node, state, action) => {
        const {key, index} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.OOA_remove_record(obj_nodepath, index);
        return action.offset;
    },
};

const OOA_LITERAL_COLUMN_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        const {key, heading} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        const table_prop_node = CT.get_object_item(obj_nodepath, heading);
        CT.replace_object_item_key(table_prop_node, action.commit_value);
        return action.offset;
    },
    INSERT_ELEMENT: function(mesh_obj_node, state, action) {
        const {key, index} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.OOA_add_field(obj_nodepath, "\"TODO\"");
        return action.offset;
    },
    DELETE_ELEMENT: (mesh_obj_node, state, action) => {
        const {key, heading} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.OOA_remove_field(obj_nodepath, heading);
        return action.offset;
    },
};

const OOA_LITERAL_APPEND_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        // Should be able to merge with the code for commits to the module object
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        const inserted_code = transform_formula_bar_input(action.commit_value);
        CT.OOA_append_datum(obj_nodepath, item_key, inserted_code);
        return action.offset;
    },
    INSERT_ELEMENT: (mesh_obj_node, state, action) => {
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        CT.OOA_append_datum(obj_nodepath, item_key, "null");
        return action.offset;
    },
};

const OOA_LITERAL_ADD_COLUMN_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        // Should be able to merge with the code for commits to the module object
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        // TODO make handle random strings (ie put the requisite quotes around them)
        const inserted_code = action.commit_value;
        CT.OOA_add_field(obj_nodepath, inserted_code);
        return action.offset;
    },
    // TODO
    // INSERT_ELEMENT: (mesh_obj_node, state, action) => {
};

const TABLE_RW_HEADING_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        // Should be able to merge with the code for commits to the module object
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        // TODO make handle random strings (ie put the requisite quotes around them)
        const inserted_code = action.commit_value;
        CT.OOA_add_field(obj_nodepath, inserted_code);
        return action.offset;
    },
    // TODO
    // INSERT_ELEMENT: (mesh_obj_node, state, action) => {
};

const TABLE_RW_VALUE_CELL = {
    __proto__: DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        // Should be able to merge with the code for commits to the module object
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_mesh_data_value_nodepath(
                                CT.AOA_get_record_given_key(mesh_obj_node, 0, key));
        // TODO make handle random strings (ie put the requisite quotes around them)
        const inserted_code = action.commit_value;
        CT.OOA_add_field(obj_nodepath, inserted_code);
        return action.offset;
    },
    // TODO
    // INSERT_ELEMENT: (mesh_obj_node, state, action) => {
};

const cell_AST_change_bindings = {
    DEFAULT,
    EMPTY,
    KEY,
    ARRAY_LITERAL_DATA_CELL,
    ARRAY_LITERAL_APPEND_CELL,
    OBJECT_LITERAL_KEY_CELL,
    OBJECT_LITERAL_VALUE_CELL,
    OBJECT_LITERAL_APPEND_CELL,
    OOA_LITERAL_VALUE_CELL,
    OOA_LITERAL_COLUMN_CELL,
    OOA_LITERAL_APPEND_CELL,
    OOA_LITERAL_ADD_COLUMN_CELL,
    TABLE_RW_HEADING_CELL,
    TABLE_RW_VALUE_CELL,
}


module.exports = { cell_AST_change_bindings };
