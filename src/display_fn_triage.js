'use strict';

// Lists of possible types:
// https://github.com/benjamn/ast-types/blob/master/def/core.js
// https://github.com/benjamn/ast-types/blob/master/def/es6.js

const D = require('./display').display_fns;

const ALL = Symbol();

const triage_table = [

    {nodetype: 'ObjectExpression', prototype: ALL, typeof: ALL, isTable: true, fn: D.table_rw},
    {nodetype: ALL, prototype: ALL, typeof: 'Array', istable: true, fn: D.table_ro},

    // removed 'rw' for now - need to figure out whether object and array literals should stay
    // consider *not* allowing them (just read-only) because of difficulties
    // in dealing with spread notation
    // TODO consider whether this will deal with array spread notation
    // [1, 2, 3]
    {nodetype: 'ArrayExpression', prototype: ALL, typeof: ALL, fn: D.array_ro,},

    // TODO consider whether this will deal with object spread notation
    // {hello: 'world'}
    {nodetype: 'ObjectExpression', prototype: ALL, typeof: ALL, fn: D.object_ro,},

    // some_fn()
    // TODO need to enumerate the other built-in objects here too... eg Map, Set
    {nodetype: 'CallExpression', prototype: Array.prototype, typeof: ALL, fn: D.array_ro,},
    {nodetype: 'CallExpression', prototype: ALL, typeof: 'object', fn: D.object_ro,},
    // If above isn't capturing things some objects, see http://stackoverflow.com/a/22482737

    // TODO what are MemberExpressions? Provide example in comments
    // TODO need to enumerate the other built-in objects here too... eg Map, Set
    {nodetype: 'MemberExpression', prototype: Array.prototype, typeof: ALL, fn: D.array_ro,},
    {nodetype: 'MemberExpression', prototype: ALL, typeof: 'object', fn: D.object_ro,},
    // If above isn't capturing things some objects, see http://stackoverflow.com/a/22482737

    {nodetype: 'NewExpression', prototype: ALL, typeof: 'object', fn: D.object_ro,},
    /*
    // TODO add a 'callee' column to the above records?
    // new Array([...])
    {nodetype: 'NewExpression', isPrototypeOf: ALL, typeof: ALL, fn: D.array_rw,}
    
    // 'Hello world'
    {nodetype: 'Literal', prototype: ALL, typeof: ALL, fn: D.value,},
    // -123
    {nodetype: 'UnaryExpression', prototype: ALL, typeof: ALL, fn: D.value,},
    // undefined
    {nodetype: 'Identifier', prototype: ALL, typeof: ALL, fn: D.value,},
    // 1 + 2
    {nodetype: 'BinaryExpression', prototype: ALL, typeof: ALL, fn: D.value,},
    {nodetype: 'ExpressionStatement', prototype: ALL, typeof: ALL, fn: D.value,},
    // `Hello ${name}`
    {nodetype: 'TemplateLiteral', prototype: ALL, typeof: ALL, fn: D.value,},
    // (x) => x + 2
    {nodetype: 'ArrowFunctionExpression', prototype: ALL, typeof: ALL, fn: D.value,},
    // TODO what else is covered by this?
    // get sum() { return 1 + 2; }
    {nodetype: 'FunctionExpression', prototype: ALL, typeof: ALL, fn: D.value,},
    // others
    {nodetype: 'MemberExpression', prototype: ALL, typeof: 'function', fn: D.value,},
    {nodetype: 'CallExpression', prototype: ALL, typeof: 'function', fn: D.value,},
    {nodetype: 'MemberExpression', prototype: ALL, typeof: ALL, fn: D.value,},
    {nodetype: 'CallExpression', prototype: ALL, typeof: ALL, fn: D.value,},

    newexpr_triage: (value, value_nodepath, id) => {
        const new_callee_D = { 'Map': D.map, }
        const callee_name = value_nodepath.callee.name;
        let display_fn = D.value_ro; 
        if (new_callee_D.hasOwnProperty(callee_name)) {
            display_fn = new_callee_D[callee_name];
        }
    },
    */

];

function triage(nodetype, value, isTable) {
    for (let row of triage_table) {
        if (
            ((row.nodetype === ALL) || (nodetype === row.nodetype))
            && ((row.prototype === ALL) || (row.prototype.isPrototypeOf(value)))
            && ((row.typeof === ALL) || (typeof value === row.typeof))
            && (row.isTable === true)
        ) {return row.fn;}
    }
    return D.value;
};

module.exports = { triage };
