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
        console.log("HIT CALLEXPRESSION");
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof
        // TODO will need to enumerate the various kinds of objects here too...
        // TODO objects (problem is that lots of things are objects...)
        // if (value === Object(value) && !(value instanceof Function)) {
        // See also: http://stackoverflow.com/a/22482737
        if (value instanceof Array) {
            return display_fns.array_ro(value, value_nodepath, id);
        } else if (typeof value === 'object') {
            return display_fns.object_ro(value, value_nodepath, id);
        } else if (typeof value === 'function') {
            return display_fns.function_expression(value, value_nodepath, id);
        } else {
            return display_fns.value_ro(value, value_nodepath, id);
        }
    },

    // new Array([...])
    'NewExpression': (value, value_nodepath, id) => {

        const new_callee_display_fns = {
            'Map': display_fns.map,
        }
        
        const callee_name = value_node.callee.name;
        if (new_callee_display_fns.hasOwnProperty(callee_name)) {
            const display_fn = new_callee_display_fns[callee_name];
            return display_fn(value, value_nodepath, id);
        } else {
            return display_fns.value(value, value_nodepath, id);
        }
    },

}
