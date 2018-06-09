const {triage} = require('../display_fn_triage');

describe('triage', () => {
    /*
    // TODO Will need this, but it won't look like this test
    it('detects Tables', () => {
        const data = ({__proto__: Table});
        data._eval();
        expect(Table.isPrototypeOf(data)).toBe(true);
        const result = triage('ObjectExpression', data, Table);
        expect(result.name).toBe('table_rw');
    });
    */
    it('is a dummy test', () => expect(true).toBe(true));
});
