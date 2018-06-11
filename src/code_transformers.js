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

// TODO should be an object or map
function getObjPropNodeNameProp(nodeType) {
    return (nodeType === 'Literal') ? 'value' : 'name';
};

// TODO write tests
function get_object_key_from_node(obj_key_node) {
    return obj_key_node[getObjPropNodeNameProp(obj_key_node.type)];
};

function parse_code_string_to_AST(code_string) {
    return Recast.parse(code_string, RECAST_SETTINGS);
};

function print_AST_to_code_string(AST) {
    return Recast.print(AST, RECAST_SETTINGS).code;
};

function getCellsNodePath(AST) {
    let nodepath_to_return;
    Recast.visit(AST, {
        visitVariableDeclarator: function(path) {
            // TODO put some variable decln type check here?
            if (path.node.id.name == '_CELLS') {
                nodepath_to_return = path;
                return false;
            }
            this.traverse(path);
        }
    });
    return nodepath_to_return.get('init');
};


function getCellNodePaths(meshCellsNodePath) {
    // TODO Eventually should allow both Identifiers and Literals
    // using getObjPropNodeNameProp
    const nodePaths = {};
    const propsPath = meshCellsNodePath.get('properties');
    for (let i=0; i < propsPath.value.length; i++) {
        let propPath = propsPath.get(i);
        let cellName = get_object_key_from_node(propPath.node.key)
        let cellProps = propPath.get("value", "properties");
        // TODO below is massive hack - should look at keys instead of assuming v is first
        let cellValueNodePath = cellProps.get(0, "value");
        if (cellValueNodePath.node.type === "FunctionExpression") {
            cellValueNodePath = cellValueNodePath.get("body", "body", 0, "argument")
        }
        nodePaths[cellName] = {
            property: propPath,
            value: cellValueNodePath,
            // TODO should this also contain display nodepaths?
        };
    };
    return nodePaths;
};

/* GENERAL */

// TODO write tests
function delete_container(value_path) {
    value_path.replace(B.literal(null));
};

/* ARRAY */

function insert_array_element(arr_path, element_num, inserted_text) {
    const elements_path = arr_path.get('elements');
    const inserted_node = B.identifier(inserted_text);
    if (elements_path.node.elements.length === 0) {
        elements_path.push(inserted_node);
    } else {
        elements_path.insertAt(element_num, inserted_node);
    }
};

function append_array_element(arr_path, inserted_text) {
    const elements_path = arr_path.get('elements');
    const inserted_node = B.identifier(inserted_text);
    elements_path.push(inserted_node);
};

function replace_array_element(arr_path, element_num, inserted_text) {
    const elements_path = arr_path.get('elements');
    elements_path.get(element_num).replace(B.identifier(inserted_text));
};

function remove_array_element(arr_path, element_num) {
    const element_path = arr_path.get('elements', element_num);
    element_path.prune();
};

/* OBJECT */

function get_object_item(obj_path, key) {
    const props_path = obj_path.get('properties');

    for (let i=0; i < props_path.value.length; i++) {
        let prop_path = props_path.get(i);
        let key_node = prop_path.node.key;
        if (get_object_key_from_node(key_node) === key) {
            return prop_path;
        }
    }
    return undefined;
};

function get_object_item_index(obj_path, key) {
    const props_path = obj_path.get('properties');

    for (let i=0; i < props_path.value.length; i++) {
        let prop_path = props_path.get(i);
        let key_node = prop_path.node.key;
        if (get_object_key_from_node(key_node) === key) {
            return i;
        }
    }
    return false;
};

// TODO: be smart about how the 'key' is created (id vs string literal)
function replace_object_item_key(obj_item_path, new_key_text) {
    // TODO throw error if duplicate key?
    obj_item_path.get('key').replace(B.identifier(new_key_text));
};

function replace_object_item_value(obj_item_path, new_value_text) {
    obj_item_path.get('value').replace(B.identifier(new_value_text));
};

function insert_object_item(obj_path, key_text, value_text, index) {
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
};

function insert_object_getter(obj_path, key_text, body_text, index) {
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
};

function replace_object_getter_return_val(obj_getter_prop_path, new_return_value_text) {
    const val = obj_getter_prop_path.get('value', 'body', 'body', 0, 'argument');
    val.replace(B.identifier(new_return_value_text));
};

function remove_object_item(obj_path, key) {
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
};

/* ARRAY OF ARRAYS */

function AOA_append_record(AOA_path, elements) {
    const elements_path = AOA_path.get('elements');
    const new_arr = B.arrayExpression([...elements.map(x => B.identifier(x))]);
    elements_path.push(new_arr);
};

function AOA_get_record_given_key(AOA_path, index, key) {
    const elements_path = AOA_path.get('elements');
    let element_path_to_return;
    for (let i = 0; i < elements_path.value.length; i++) {
        const element_path = elements_path.get(i);
        if (element_path.get('elements', index).node.value === key) {
            return element_path;
        }
    }
};

/* ARRAY OF OBJECTS */
// If no records present in the array, we don't have heading info.

// TODO
// DATUM
// Clear datum
// Rewrite datum
// RECORD
// Insert record (single datum known) at location

function AOO_append_record(AOO_path, kv_pairs) {
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
};

function AOO_remove_record_given_key(arr_path, element_key_name, key) {
    const elements_path = arr_path.get('elements');
    for (let [index, e] of elements_path.node.elements.entries()) {
        for (let prop of e.properties) {
            let prop_key = get_object_key_from_node(prop.key);
            if (prop_key === element_key_name && prop.value.value === key) {
                arr_path.get('elements', index).prune();
            }
        }
    }
};

/* OBJECT OF ARRAYS */

// Datum: element in a column array
// Record: element in same position across column arrays
// Field: whole column

// TODO extend to 'insert' instead of just append?
function OOA_append_datum(obj_path, key_name, datum_text) {
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
};

function OOA_remove_record(obj_path, record_idx) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    let arr_elements;
    for (let prop of props_path.value) {
        if (prop.value.type === 'ArrayExpression') {
            arr_elements = prop.value.elements;
            arr_elements.splice(record_idx, 1);
        }
    }
};

// TODO this is really 'append' right now - need to extend?
function OOA_add_field(obj_path, key_name) {
    // TODO throw error if duplicate key?
    const props_path = obj_path.get('properties');
    // Figure out how many elements need to be in the array
    let non_proto_fields = props_path.value
                        // TODO Make this __proto__ filter a generic function
                        .filter(n => get_object_key_from_node(n.key) !== "__proto__");
    let field_length = (non_proto_fields.length > 0) 
                        ? non_proto_fields[0].value.elements.length
                        : 0;
    // Create array node of required length
    const array_node = B.arrayExpression(
                        Array(field_length).fill(B.literal(null))
    );
    const new_prop = B.property('init', B.identifier(key_name), array_node)
    props_path.push(new_prop);
};

function OOA_remove_field(obj_path, key_name) {
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
};

/* TABLE */

function Table_ChangeValueCell(tablePath, colHeading, index, new_value) {
    const colPath = get_object_item(tablePath, colHeading);
    const valuesPath = get_object_item(colPath.get("value"), "values");
    replace_array_element(valuesPath.get("value"), index, new_value);
    // TODO if values is a function call, fail?
};

function Table_AddColumn(tablePath, heading, colIndex) {
    // TODO should this not have heading as a parameter, and auto-generate it to be unique?
    const tablePropsPath = tablePath.get("properties");
    const lengths = [];
    for (let i = 0; i < tablePropsPath.value.length; i++) {
        let propValuePath = tablePropsPath.get(i, "value");
        if (get_object_item(propValuePath, "values") !== undefined) {
            let valuesPath = get_object_item(propValuePath, "values");
            let valuesNode = valuesPath.get("value").node;
            if (valuesNode.type === "ArrayExpression") {
                lengths.push(valuesNode.elements.length);
            };
        };
    };
    const length = (lengths.length > 0) ? Math.max(...lengths) : 0;
    const valuesProp = B.property('init', 
                        B.literal('values'),
                        // TODO should it fill with holes instead?
                        // TODO should the default value is a function that returns null or undefined?
                        B.arrayExpression((new Array(length)).fill(B.identifier('undefined')))
    );
    const defaultProp = B.property('init', B.literal('default'), B.literal(null));
    const newObject = B.objectExpression([defaultProp, valuesProp]);
    const newProp = B.property('init', B.literal(heading), newObject);

    if (colIndex === undefined) colIndex = tablePropsPath.value.length;
    tablePropsPath.value.splice(colIndex, 0, newProp);
}

/*
Table_ChangeDefaultFormulaCell: function() {},
Table_Add: function() {}, // add tests for this?? Maybe not needed if just do to an empty object
Table_AddRow: function() {},
Table_DeleteRow: function() {},
Table_AppendRow: function() {}, // not sure - consider yes though, as allows entry with a specific value
Table_AppendColumn: function() {}, // not sure - consider yes though, as allows entry with a specific value

Table_DeleteColumn: function() {},
Table_EditLength: function() {},
Table_DeleteLength: function() {}, // not sure
*/

/* PUBLIC API */

module.exports = {
    get_object_key_from_node,
    parse_code_string_to_AST,
    print_AST_to_code_string,
    getCellsNodePath,
    getCellNodePaths,
    delete_container,

    insert_array_element,
    append_array_element,
    replace_array_element,
    remove_array_element,

    get_object_item,
    get_object_item_index,
    replace_object_item_key,
    replace_object_item_value,
    insert_object_item,
    insert_object_getter,
    replace_object_getter_return_val,
    remove_object_item,

    AOA_append_record,
    AOA_get_record_given_key,

    AOO_append_record,
    AOO_remove_record_given_key,

    OOA_append_datum,
    OOA_remove_record,
    OOA_add_field,
    OOA_remove_field,

    Table_ChangeValueCell,
    Table_AddColumn,

};
