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
    // cells incl header, body cells, new col, new row cells
    it("doesn't completely blow up", () => {
        const code = `({heading: {default: null, values: [1, 2, 3]}})`;
        const AST_node = get_expr_nodepath(code);
        const value = [{heading: 1}, {heading: 2}, {heading: 3}];
        const formatted_values = [{heading: "1"}, {heading: "2"}, {heading: "3"}];
        const cells = D.table_rw(value, formatted_values, AST_node, "dummyID");
        expect(cells.length).toBe(5);
    });
    it('is OK with # elements in values array being less than length of table', () => {
        const code = `({length: 3, heading: {
          default: function(rowIdx) {return rowIdx + 1},
          values: []
        }})`;
        const AST_node = get_expr_nodepath(code);
        const value = [{heading: 1}, {heading: 2}, {heading: 3}];
        const formatted_values = [{heading: "1"}, {heading: "2"}, {heading: "3"}];
        const cells = D.table_rw(value, formatted_values, AST_node, "dummyID");
        expect(cells.length).toBe(5);
    });
    it('can deal with presence of the length property', () => {
        const code = `({length: 3, heading: {
          length: 123,
          default: function(rowIdx) {return rowIdx + 1},
          values: []
        }})`;
        const AST_node = get_expr_nodepath(code);
        const value = [{heading: 1}, {heading: 2}, {heading: 3}];
        const formatted_values = [{heading: "1"}, {heading: "2"}, {heading: "3"}];
        const cells = D.table_rw(value, formatted_values, AST_node, "dummyID");
        expect(cells.length).toBe(5);
    });
});
