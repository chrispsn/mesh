const {triage} = require('../display_fn_triage');

describe('triage', () => {
    it('correctly recognises non-table ObjectExpressions', () => {
        const nodetype = "ObjectExpression";
        const value = {some: "object"};
        const isTable = false;
        expect(triage(nodetype, value, isTable)).toBe("object_ro");
    });
});
