const DisplayFunctions = require(__dirname + '/display_functions.js');

// May also eventually be useful:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof

// This code lists the types of possible types:
// https://github.com/benjamn/ast-types/blob/master/def/core.js 
const expression_type_display_fns = {

    // # These ones are simple.

    // 'Hello world'
    'Literal': DisplayFunctions.write_value,

    // undefined
    'Identifier': DisplayFunctions.write_value,

    // 1 + 2
    'BinaryExpression': DisplayFunctions.write_value,

    // (x) => x + 2
    'ArrowFunctionExpression': DisplayFunctions.write_value,

    // TODO consider whether this will deal with array spread notation
    // [1, 2, 3]
    'ArrayExpression': DisplayFunctions.write_array_rw,

    // TODO consider whether this will deal with object spread notation
    // TODO differentiate between read-only and read-write
    // {hello: 'world'}
    'ObjectExpression': DisplayFunctions.write_object,

    'Unknown': DisplayFunctions.write_dummy,

    // # These ones are more complex.

    // some_fn()
    'CallExpression': call_expression_mapper,

    // new Map([...])
    'NewExpression': new_expression_mapper,

}

const constructor_display_fns = [
    [Map, DisplayFunctions.write_map],
    [Array, DisplayFunctions.write_array_ro],
];

function call_expression_mapper (value, ref_string, location, declaration_node) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof

    // TODO will need to enumerate the various kinds of objects here too...
    // TODO objects (problem is that lots of things are objects...)
    // if (value === Object(value) && !(value instanceof Function)) {
    // See also: http://stackoverflow.com/a/22482737

    for (let [constructor, display_fn] of constructor_display_fns) {
        if (value instanceof constructor) {
            return display_fn(value, ref_string, location, declaration_node);
        }
    }
    return DisplayFunctions.write_value(value, ref_string, location, declaration_node);
}

const new_callee_display_fns = {
    'Map': DisplayFunctions.write_map,
}

function new_expression_mapper (value, ref_string, location, declaration_node) {
    const callee_name = declaration_node.init.callee.name;
    if (new_callee_display_fns.hasOwnProperty(callee_name)) {
        const display_fn = new_callee_display_fns[callee_name];
        return display_fn(value, ref_string, location, declaration_node);
    } else {
        return DisplayFunctions.write_value(value, ref_string, location, declaration_node);
    }
}

module.exports = expression_type_display_fns;
