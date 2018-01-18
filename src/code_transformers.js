'use strict';

// On the choice of parser:
// https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
// Alternative to Recast: https://github.com/facebook/pfff

// Useful:
// astexplorer.net

/* PRIVATE (setup) */

const Recast = require('recast');
const Builders = Recast.types.builders;

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
            nodepath_to_return = path;
            return false;
        }
    });
    return nodepath_to_return.get('init');
},

insert_array_element: function(arr_path, element_num, inserted_text) {
    const elements_path = arr_path.get('elements');
    const inserted_node = Builders.identifier(inserted_text);
    if (elements_path.node.elements.length === 0) {
        elements_path.push(inserted_node);
    } else {
        elements_path.insertAt(element_num, inserted_node);
    }
},

append_array_element: function(arr_path, inserted_text) {
    const elements_path = arr_path.get('elements');
    const inserted_node = Builders.identifier(inserted_text);
    elements_path.push(inserted_node);
},

remove_array_element: function(arr_path, element_num) {
    const element_path = arr_path.get('elements', element_num);
    element_path.prune();
},

// TODO write tests
delete_container: function(value_path) {
    value_path.replace(Builders.literal(null));
},

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
    obj_item_path.get('key').replace(Builders.identifier(new_key_text));
},

insert_object_item: function(obj_path, key_text, value_text, index) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    const new_prop_node = Builders.property('init', 
                            Builders.identifier(key_text), 
                            // TODO using this instead of literal is probably a massive hack
                            Builders.identifier(value_text));
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
    const function_body = Builders.blockStatement([
    // https://github.com/benjamn/ast-types/blob/master/def/core.js#L108
        Builders.returnStatement( Builders.identifier(body_text))
    ]);
    const function_expression = Builders.functionExpression(null, [], function_body);
    const new_prop_node = Builders.property('get', 
                            Builders.identifier(key_text), 
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

remove_record_given_key: function(arr_path, element_key_name, key) {
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

OOA_append_datum: function(obj_path, key_name, datum_text) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    let field_id;
    let arr_elements;
    let inserted_node;
    for (let prop of props_path.value) {
        // TODO factor this out into a separate function?
        field_id = get_object_key_from_node(prop.key);
        if (field_id === key_name) {
            inserted_node = Builders.identifier(datum_text);
        } else {
            inserted_node = Builders.identifier('null');
        }
        arr_elements = prop.value.elements;
        arr_elements.push(inserted_node);
    }
},

OOA_remove_record: function(obj_path, record_idx) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    let arr_elements;
    for (let prop of props_path.value) {
        arr_elements = prop.value.elements;
        arr_elements.splice(record_idx, 1);
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
    const array_node = Builders.arrayExpression(
                        Array(field_length).fill(Builders.literal(null))
    );
    const new_prop = Builders.property('init', Builders.identifier(key_name), array_node)
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
// DATUM
// Clear datum
// Rewrite datum
// RECORD
// Insert record (single datum known) at location

/*
append_record: function(code, id_name, field_name, field_value) {
    // Get to the relevant records
    // Get the field titles
    // Construct a record with all fields set to null
    // Set the field with named field_name to field_value
    // Insert the record in the records (path.get("elements").push(new_node))
    // Return the code
    // BUT: what if it's empty? How will we know which headings to use?
    // if we leave it so it just turns into an empty array, is that OK?
    // Probably is - code that consumes the array as 'for each r in records' won't get affected.
    // What about from a UI perspective - will the headings disappear?
    // Not if we use a special display_fn wrapper.
    // But it does mean we can't rely on other elements in the array when writing this.
    // We could rely on information about the records given by the *display_fn*
    // without wrapping it in a special class or whatever within the code itself?
    // So the question is then: how can this fn see info about the display_fn.
    // And the answer is, perhaps: the display_fn creates the necessary functions
    // when attaching stuff to each cell, encoding info re: headings etc at the same time.
    let AST = Recast.parse(code, RECAST_SETTINGS);
    AST = Recast.visit(AST, {
        visitVariableDeclarator: function (path) {
            if (path.node.id.name == id_name) {
                const arr_path = path.get('init');
                const elements_path = arr_path.get('elements');
                for (let [index, e] of elements_path.node.elements.entries()) {
                    for (let prop of e.properties) {
                        if (prop.key.type === 'Identifier') {
                            if (prop.key.name === element_key_name && prop.value.value === key) {
                                arr_path.get('elements', index).prune();
                            }
                        } else if (prop.key.type === 'Literal') {
                            if (prop.key.value === element_key_name && prop.value.value === key) {
                                arr_path.get('elements', index).prune();
                            }
                        }
                    }
                }
                return false;
            }
            this.traverse(path);
        }
    });
    return Recast.print(AST, RECAST_SETTINGS).code;
}
*/
};
