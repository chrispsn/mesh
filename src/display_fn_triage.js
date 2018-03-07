'use strict';

// Lists of possible types:
// https://github.com/benjamn/ast-types/blob/master/def/core.js
// https://github.com/benjamn/ast-types/blob/master/def/es6.js

const Prototypes = require('./prototypes');
const display_fns = require('./display').display_fns;

const ROOT = {

triage_table: [

    // 'Hello world'
    {nodetype: 'Literal', prototype: 'ALL', typeof: 'ALL', fn: display_fns.value,},
    
    // -123
    {nodetype: 'UnaryExpression', prototype: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // undefined
    {nodetype: 'Identifier', prototype: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // 1 + 2
    {nodetype: 'BinaryExpression', prototype: 'ALL', typeof: 'ALL', fn: display_fns.value,},
    {nodetype: 'ExpressionStatement', prototype: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // `Hello ${name}`
    {nodetype: 'TemplateLiteral', prototype: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // (x) => x + 2
    {nodetype: 'ArrowFunctionExpression', prototype: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // TODO what else is covered by this?
    // get sum() { return 1 + 2; }
    {nodetype: 'FunctionExpression', prototype: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // TODO consider whether this will deal with array spread notation
    // [1, 2, 3]
    {nodetype: 'ArrayExpression', prototype: Prototypes.TableArray, typeof: 'ALL', fn: display_fns.table_array_rw,},
    {nodetype: 'ArrayExpression', prototype: 'ALL', typeof: 'ALL', fn: display_fns.array_rw,},

    // TODO consider whether this will deal with object spread notation
    // {hello: 'world'} or {__proto__: Prototypes.TableObject, ...}
    {nodetype: 'ObjectExpression', prototype: Prototypes.TableArray, typeof: 'ALL', fn: display_fns.table_object_rw,},
    {nodetype: 'ObjectExpression', prototype: 'ALL', typeof: 'ALL', fn: display_fns.object_rw,},

    // some_fn()
        // TODO need to enumerate the other built-in objects here too... eg Map, Set
    {nodetype: 'CallExpression', prototype: Array.prototype, typeof: 'ALL', fn: display_fns.array_ro,},
    {nodetype: 'CallExpression', prototype: 'ALL', typeof: 'object', fn: display_fns.object_ro,},
    // If above isn't capturing things some objects, see http://stackoverflow.com/a/22482737
    {nodetype: 'CallExpression', prototype: 'ALL', typeof: 'function', fn: display_fns.object_ro,},
    {nodetype: 'CallExpression', prototype: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    {nodetype: 'NewExpression', prototype: 'ALL', typeof: 'object', fn: display_fns.object_ro,},
    /*
    // TODO add a 'callee' column to the above records?
    // new Array([...])
    {nodetype: 'NewExpression', isPrototypeOf: 'ALL', typeof: 'ALL', fn: display_fns.array_rw,}
    newexpr_triage: (value, value_nodepath, id) => {
        const new_callee_display_fns = { 'Map': display_fns.map, }
        const callee_name = value_nodepath.callee.name;
        let display_fn = display_fns.value_ro; 
        if (new_callee_display_fns.hasOwnProperty(callee_name)) {
            display_fn = new_callee_display_fns[callee_name];
        }
    },
    */
],

get triage() {
    const sheet = this;
    return function(nodetype, value) {
        for (let row of sheet.triage_table) {
            if (
                ((row.nodetype === 'ALL') || (nodetype === row.nodetype))
                && ((row.prototype === 'ALL') || (row.prototype.isPrototypeOf(value)))
                && ((row.typeof === 'ALL') || (typeof value === row.typeof))
            ) return row.fn;
        }
        console.log("Not sure how to display this expression type: ", nodetype);
        return display_fns.dummy;
    }
},

}

module.exports = { triage: ROOT.triage };
