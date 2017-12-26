'use strict';

// Lists of possible types:
// https://github.com/benjamn/ast-types/blob/master/def/core.js
// https://github.com/benjamn/ast-types/blob/master/def/es6.js

const display_fns = require('./display').display_fns;

module.exports = {

    // 'Hello world'
    'Literal': display_fns.value,

    // undefined
    'Identifier': display_fns.value,

    // 1 + 2
    'BinaryExpression': display_fns.value,

    // `Hello ${name}`
    'TemplateLiteral': display_fns.value,

    // TODO what else is covered by this?
    // get sum() { return 1 + 2; }
    'FunctionExpression': display_fns.function_expression,

    // (x) => x + 2
    'ArrowFunctionExpression': display_fns.value,

    // TODO consider whether this will deal with array spread notation
    // [1, 2, 3]
    'ArrayExpression': display_fns.array_rw,

    // TODO consider whether this will deal with object spread notation
    // TODO differentiate between read-only and read-write
    // {hello: 'world'}
    'ObjectExpression': display_fns.object_rw,

    'Unknown': display_fns.dummy,

    // # These ones are more complex.

    // some_fn()
    'CallExpression': (value, value_nodepath, id) => {
        let display_fn = display_fns.value_ro;
        // TODO need to enumerate the other built-in objects here too... eg Map, Set
        if (value instanceof Array) {
            display_fn = display_fns.array_ro;
        } else if (typeof value === 'object') {
        // If the above isn't capturing things that should be objects, see:
        // http://stackoverflow.com/a/22482737
            display_fn = display_fns.object_ro;
        } else if (typeof value === 'function') {
            display_fn = display_fns.function_expression;
        }
        return display_fn(value, value_nodepath, id);
    },

    // new Array([...])
    'NewExpression': (value, value_nodepath, id) => {
        const new_callee_display_fns = {
            'Map': display_fns.map,
        }
        const callee_name = value_nodepath.callee.name;
        let display_fn = display_fns.value_ro; 
        if (new_callee_display_fns.hasOwnProperty(callee_name)) {
            display_fn = new_callee_display_fns[callee_name];
        }
        return display_fn(value, value_nodepath, id);
    },

}
