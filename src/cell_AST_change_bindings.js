const CT = require('./code_transformers');
const {rewrite_input} = require('./data_entry');
const {get_selected_cell} = require('./selectors');

function new_state_after_AST_transforms(old_state, AST, selection_offset) {
};

const cell_AST_change_bindings = {

DEFAULT: {
    COMMIT_FORMULA_BAR_EDIT: function (mesh_obj_node, state, action) {
        // TODO Check that the commit is valid first?
        const key = get_selected_cell(state).AST_props.key;
        const index = CT.get_object_item_index(mesh_obj_node, key);

        // Remove old property
        CT.remove_object_item(mesh_obj_node, key);

        // Add new property in same place
        const inserted_code = rewrite_input(action.commit_value);
        const first_char = action.commit_value[0];
        const insert_fn = (first_char === "=") 
            ? CT.insert_object_getter 
            : CT.insert_object_item;
        insert_fn(mesh_obj_node, key, inserted_code, index);

        return action.offset;
    },

    delete_value: function (mesh_obj_node, state, action) {
        alert("No 'delete value' action defined.")
        return [0, 0];
    },

    delete_element: function (mesh_obj_node, state, action) {
        alert("No 'delete element' action defined.")
        return [0, 0];
    }
},

// TODO does it need only some of the reducers?
EMPTY: {
    __proto__: this.DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function (mesh_obj_node, state, action) {
        const id = action.commit_value;
        CT.insert_object_item(mesh_obj_node, id, "null");
        const attachments_nodepath = CT.get_object_item(mesh_obj_node, '__mesh_grid__').get('value');
        const attachment_props = `{loc: [${state.selected_cell_loc}]}`
        CT.insert_object_item(attachments_nodepath, id, attachment_props);
        return action.offset;
    },
},

KEY: {
    __proto__: this.DEFAULT,
    // TODO add 'change symbol' functionality
    DELETE_ELEMENT: function(mesh_obj_node, state, action) {
        const id = get_selected_cell(state).ref_string;
        const item_nodepath = CT.get_object_item(mesh_obj_node, id);
        item_nodepath.prune();
        const attachments_nodepath = CT.get_object_item(mesh_obj_node, '__mesh_grid__').get('value');
        CT.remove_object_item(attachments_nodepath, id);
        return [0, 0];
    },
},

ARRAY_LITERAL_DATA_CELL: {
    __proto__: this.DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: function(mesh_obj_node, state, action) {
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.remove_array_element(array_nodepath, index);
        CT.insert_array_element(array_nodepath, index, action.commit_value);
        return action.offset;
    },
    INSERT_ELEMENT: function(mesh_obj_node, state, action) {
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.insert_array_element(array_nodepath, index, "null");
        return action.offset;
    },
    DELETE_ELEMENT: function(mesh_obj_node, state, action) {
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.remove_array_element(array_nodepath, index);
        return action.offset;
    },
    // TODO fix below
    DELETE_CONTAINER: function(mesh_obj_node, state, action) {
        const {key} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.delete_container(array_nodepath);
        return action.offset;
    },
},

ARRAY_LITERAL_APPEND_CELL: {
    __proto__: this.DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        // TODO allow for formula cells
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.append_array_element(array_nodepath, action.commit_value);
        return action.offset;
    },
    INSERT_ELEMENT: (mesh_obj_node, state, action) => {
        const {key, index} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.insert_array_element(array_nodepath, index, "null");
        return action.offset;
    },
    // TODO fix below
    DELETE_CONTAINER: function (mesh_obj_node, state) {
        const {key} = get_selected_cell(state).AST_props;
        const array_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.delete_container(array_nodepath);
        return [0, 0];
    },
},

OBJECT_LITERAL_KEY_CELL: {
    __proto__: this.DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        const obj_item_nodepath = CT.get_object_item(obj_nodepath, item_key);
        // TODO where does new_id come from?
        CT.replace_object_item_key(obj_item_nodepath, action.commit_value);
        return action.offset;
    },
    INSERT_ELEMENT: (mesh_obj_node, state, action) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.insert_object_item(obj_nodepath, 'new_key', 'null');
        return action.offset;
    },
    DELETE_ELEMENT: (mesh_obj_node, state, action) => {
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.remove_object_item(obj_nodepath, item_key);
        return action.offset;
    },
    DELETE_CONTAINER: function (mesh_obj_node, state) {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.delete_container(obj_nodepath);
        return [0, 0];
    },
},

OBJECT_LITERAL_VALUE_CELL: {
    __proto__: this.DEFAULT,
    // TODO maintain item order in code
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        // Should be able to merge with the code for commits to the module object
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        const index = CT.get_object_item_index(obj_nodepath, key);
        CT.remove_object_item(obj_nodepath, item_key);
        const inserted_code = rewrite_input(action.commit_value);
        if (action.commit_value[0] === "=") {
            CT.insert_object_getter(obj_nodepath, item_key, inserted_code, index);
        } else {
            CT.insert_object_item(obj_nodepath, item_key, inserted_code, index);
        }
        return action.offset;
    },
    INSERT_ELEMENT: (mesh_obj_node, state, action) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.insert_object_item(obj_nodepath, "new_key", "null");
        return action.offset;
    },
    DELETE_ELEMENT: (mesh_obj_node, state, action) => {
        const {key, item_key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.remove_object_item(obj_nodepath, item_key);
        return action.offset;
    },
    DELETE_CONTAINER: (mesh_obj_node, state) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.delete_container(obj_nodepath);
        return [0, 0];
    },
},

OBJECT_LITERAL_APPEND_CELL: {
    __proto__: this.DEFAULT,
    COMMIT_FORMULA_BAR_EDIT: (mesh_obj_node, state, action) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.insert_object_item(obj_nodepath, action.commit_value, "null");
        return action.offset;
    },
    INSERT_ELEMENT: (mesh_obj_node, state, action) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.insert_object_item(obj_nodepath, "new_key", "null");
        return action.offset;
    },
    DELETE_CONTAINER: (mesh_obj_node, state) => {
        const {key} = get_selected_cell(state).AST_props;
        const obj_nodepath = CT.get_object_item(mesh_obj_node, key).get('value');
        CT.delete_container(obj_nodepath);
        return [0, 0];
    },
},

}

module.exports = { cell_AST_change_bindings };
