'use strict';

// On the choice of parser:
// https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
// Alternative to Recast: https://github.com/facebook/pfff

// Useful:
// astexplorer.net

/* PRIVATE (setup) */

const Recast = require('recast');
const B = Recast.types.builders;

const {LINE_SEPARATOR} = require('./settings');
const RECAST_SETTINGS = { lineTerminator: LINE_SEPARATOR }

// TODO write tests
function get_object_key_from_node(obj_key_node) {
    switch (obj_key_node.type) {
        case 'Literal':
            return obj_key_node.value;
        case 'Identifier':
            return obj_key_node.name;
    }
}

/* PUBLIC API */

module.exports = {
    
parse_code_string_to_AST: function(code_string) {
    return Recast.parse(code_string, RECAST_SETTINGS);
},

print_AST_to_code_string: function(AST) {
    return Recast.print(AST, RECAST_SETTINGS).code;
},

get_root_mesh_obj_node: function(AST) {
    let nodepath_to_return;
    Recast.visit(AST, {
        visitVariableDeclarator: function(path) {
            // TODO put some variable decln type check here?
            if (path.node.id.name == 'DATA') {
                nodepath_to_return = path;
                return false;
            }
            this.traverse(path);
        }
    });
    return nodepath_to_return.get('init');
},

get_mesh_data_value_nodepath: function(mesh_data_node) {
    return mesh_data_node.get('elements', 2, "body");
},

/* GENERAL */

// TODO write tests
delete_container: function(value_path) {
    value_path.replace(B.literal(null));
},

/* ARRAY */

insert_array_element: function(arr_path, element_num, inserted_text) {
    const elements_path = arr_path.get('elements');
    const inserted_node = B.identifier(inserted_text);
    if (elements_path.node.elements.length === 0) {
        elements_path.push(inserted_node);
    } else {
        elements_path.insertAt(element_num, inserted_node);
    }
},

append_array_element: function(arr_path, inserted_text) {
    const elements_path = arr_path.get('elements');
    const inserted_node = B.identifier(inserted_text);
    elements_path.push(inserted_node);
},

remove_array_element: function(arr_path, element_num) {
    const element_path = arr_path.get('elements', element_num);
    element_path.prune();
},

/* OBJECT */

get_object_item: function(obj_path, key) {
    const props_path = obj_path.get('properties');

    for (let i=0; i < props_path.value.length; i++) {
        let prop_path = props_path.get(i);
        let key_node = prop_path.node.key;
        if (get_object_key_from_node(key_node) === key) {
            return prop_path;
        }
    }
    return false;
},

get_object_item_index: function(obj_path, key) {
    const props_path = obj_path.get('properties');

    for (let i=0; i < props_path.value.length; i++) {
        let prop_path = props_path.get(i);
        let key_node = prop_path.node.key;
        if (get_object_key_from_node(key_node) === key) {
            return i;
        }
    }
    return false;
},

replace_object_item_key: function(obj_item_path, new_key_text) {
    // TODO throw error if duplicate key?
    obj_item_path.get('key').replace(B.identifier(new_key_text));
},

insert_object_item: function(obj_path, key_text, value_text, index) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    const new_prop_node = B.property('init', 
                            B.identifier(key_text), 
                            // TODO using this instead of literal is probably a massive hack
                            B.identifier(value_text));
    if (index === undefined || props_path.node.properties.length === 0) {
        props_path.push(new_prop_node);
    } else {
        props_path.insertAt(index, new_prop_node);
    }
},

insert_object_getter: function(obj_path, key_text, body_text, index) {
    // TODO throw error if duplicate key?
    // TODO make these self-memoising?
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#Smart_self-overwriting_lazy_getters
    const props_path = obj_path.get('properties');
    const function_body = B.blockStatement([
    // https://github.com/benjamn/ast-types/blob/master/def/core.js#L108
        // TODO insert the 'const this = sheet;' thing
        B.returnStatement(B.identifier(body_text))
    ]);
    const function_expression = B.functionExpression(null, [], function_body);
    const new_prop_node = B.property('get', 
                            B.identifier(key_text), 
                            function_expression);
    if (index === undefined || props_path.node.properties.length === 0) {
        props_path.push(new_prop_node);
    } else {
        props_path.insertAt(index, new_prop_node);
    }
},

remove_object_item: function(obj_path, key) {
    // TODO throw error if missing key?
    const props_path = obj_path.get('properties');
    if (props_path.value.length > 0) {
        for (let i=0; i < props_path.value.length; i++) {
            let prop_path = props_path.get(i);
            let key_node = prop_path.node.key;
            if (key === get_object_key_from_node(key_node, key)) {
                prop_path.prune();
            }
        }
    }
},

/* ARRAY OF ARRAYS */

AOA_append_record: function(AOA_path, elements) {
    const elements_path = AOA_path.get('elements');
    const new_arr = B.arrayExpression([...elements.map(x => B.identifier(x))]);
    elements_path.push(new_arr);
},

AOA_get_record_given_key: function(AOA_path, index, key) {
    const elements_path = AOA_path.get('elements');
    let element_path_to_return;
    for (let i = 0; i < elements_path.value.length; i++) {
        const element_path = elements_path.get(i);
        if (element_path.get('elements', index).node.value === key) {
            return element_path;
        }
    }
},

/* ARRAY OF OBJECTS */
// If no records present in the array, we don't have heading info.

// TODO
// DATUM
// Clear datum
// Rewrite datum
// RECORD
// Insert record (single datum known) at location

AOO_append_record: function(AOO_path, kv_pairs) {
// Append object with headings filled based on first record;
// add value for known data and leave the other values null
    const elements_path = AOO_path.get('elements');
    const props = elements_path.get(0, 'properties').map(
        entry => {
            const key = get_object_key_from_node(entry.get('key').value);
            return B.property(
                'init',
                B.literal(key),
                (key in kv_pairs ? B.literal(kv_pairs[key]) : B.literal(null)
            )
        )}
    )
    elements_path.push(B.objectExpression(props));
},

AOO_remove_record_given_key: function(arr_path, element_key_name, key) {
    const elements_path = arr_path.get('elements');
    for (let [index, e] of elements_path.node.elements.entries()) {
        for (let prop of e.properties) {
            let prop_key = get_object_key_from_node(prop.key);
            if (prop_key === element_key_name && prop.value.value === key) {
                arr_path.get('elements', index).prune();
            }
        }
    }
},

/* OBJECT OF ARRAYS */

OOA_append_datum: function(obj_path, key_name, datum_text) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    let field_id;
    let arr_elements;
    let inserted_node;
    for (let prop of props_path.value) {
        // TODO factor this out into a separate function?
        if (prop.value.type === 'ArrayExpression') {
            field_id = get_object_key_from_node(prop.key);
            if (field_id === key_name) {
                inserted_node = B.identifier(datum_text);
            } else {
                inserted_node = B.identifier('null');
            }
            arr_elements = prop.value.elements;
            arr_elements.push(inserted_node);
        };
    }
},

OOA_remove_record: function(obj_path, record_idx) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    let arr_elements;
    for (let prop of props_path.value) {
        if (prop.value.type === 'ArrayExpression') {
            arr_elements = prop.value.elements;
            arr_elements.splice(record_idx, 1);
        }
    }
},

OOA_add_field: function(obj_path, key_name) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    // Figure out how many elements need to be in the array
    let field_length = 0;
    if (props_path.value.length > 0) {
        field_length = props_path.value[0].value.elements.length;
    }
    // Create array node of required length
    const array_node = B.arrayExpression(
                        Array(field_length).fill(B.literal(null))
    );
    const new_prop = B.property('init', B.identifier(key_name), array_node)
    props_path.push(new_prop);
},

OOA_remove_field: function(obj_path, key_name) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    let key;
    let id_type;
    let field_id;
    let idx = 0;
    for (let prop of props_path.value) {
        field_id = get_object_key_from_node(prop.key);
        if (field_id === key_name) {
            props_path.value.splice(idx, 1);
        }
        idx++;
    }
},

};
