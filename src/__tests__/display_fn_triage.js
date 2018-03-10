const {triage} = require('../display_fn_triage');
const Code = require('../settings.js').BLANK_FILE + "[Table, ConsumedTable];";
const [Table, ConsumedTable] = eval(Code);

describe('triage', () => {
    it('detects ConsumedTables', () => {
        const data = ({__proto__: Table});
        data.eval();
        expect(ConsumedTable.isPrototypeOf(data)).toBe(true);
        const result = triage('ObjectExpression', data, ConsumedTable);
        expect(result.name).toBe('table_rw');
    });
});
