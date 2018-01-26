'use strict';

// Lists of possible types:
// https://github.com/benjamn/ast-types/blob/master/def/core.js
// https://github.com/benjamn/ast-types/blob/master/def/es6.js

const Prototypes = require('./prototypes');
const display_fns = require('./display').display_fns;

const ROOT = {

triage_table: [

    // 'Hello world'
    {nodetype: 'Literal', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // undefined
    {nodetype: 'Identifier', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // 1 + 2
    {nodetype: 'BinaryExpression', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.value_ro,},
    {nodetype: 'ExpressionStatement', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.value_ro,},

    // `Hello ${name}`
    {nodetype: 'TemplateLiteral', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // (x) => x + 2
    {nodetype: 'ArrowFunctionExpression', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.value,},

    // TODO what else is covered by this?
    // get sum() { return 1 + 2; }
    {nodetype: 'FunctionExpression', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.function_expression,},

    // TODO consider whether this will deal with array spread notation
    // [1, 2, 3]
    // {nodetype: 'ArrayExpression', instanceof: Prototypes.TableArray, typeof: 'ALL', fn: display_fns.table_array_rw,},
    {nodetype: 'ArrayExpression', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.array_rw,},

    // TODO consider whether this will deal with object spread notation
    // {hello: 'world'} or {__proto__: Prototypes.TableObject, ...}
    // {nodetype: 'ObjectExpression', instanceof: Prototypes.TableArray, typeof: 'ALL', fn: display_fns.table_object_rw,},
    {nodetype: 'ObjectExpression', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.object_rw,},

    // some_fn()
        // TODO need to enumerate the other built-in objects here too... eg Map, Set
    {nodetype: 'CallExpression', instanceof: Array, typeof: 'ALL', fn: display_fns.array_ro,},
    {nodetype: 'CallExpression', instanceof: 'ALL', typeof: 'object', fn: display_fns.object_ro,},
    // If above isn't capturing things some objects, see http://stackoverflow.com/a/22482737
    {nodetype: 'CallExpression', instanceof: 'ALL', typeof: 'function', fn: display_fns.object_ro,},
    {nodetype: 'CallExpression', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.value_ro,},

    /*
    // TODO add a 'callee' column to the above records?
    // new Array([...])
    'NewExpression': display_fns.newexpr_triage,
    {nodetype: 'NewExpression', instanceof: 'ALL', typeof: 'ALL', fn: display_fns.array_rw,}
    newexpr_triage: (value, value_nodepath, id) => {
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
    */
],

get triage() {
    const sheet = this;
    return function(nodetype, value) {
        for (let row of sheet.triage_table) {
            console.log(row);
            if (
                ((row.nodetype === 'ALL') || (nodetype === row.nodetype))
                && ((row.instanceof === 'ALL') || (value instanceof row.instanceof))
                && ((row.typeof === 'ALL') || (typeof value === row.typeof))
            ) return row.fn;
        }
        console.log("Not sure how to display this expression type: ", nodetype);
        return display_fns.dummy;
    }
},

}

module.exports = { triage: ROOT.triage };
