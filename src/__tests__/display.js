"use strict";

const D = require('../display').display_fns;

// Testing helpers
const Recast = require('recast');
const CT = require('../code_transformers');

function get_expr_nodepath(code_string) {
    let nodepath;
    const AST = CT.parse_code_string_to_AST(code_string) 
    Recast.visit(AST, {
        visitExpression: function (path) {
            nodepath = path;
            return false;
        }
    });
    return nodepath;
}

describe('table_rw', () => {
    it("doesn't completely blow up", () => {
        const code = `({heading: {default: null, values: [1, 2, 3]}})`;
        const AST_node = get_expr_nodepath(code);
        const value = [{heading: 1}, {heading: 2}, {heading: 3}];
        const cells = D.table_rw(value, AST_node, "dummy");
        expect(cells.length).toBe(4);
    });
});
