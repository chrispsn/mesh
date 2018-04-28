const {triage} = require('../display_fn_triage');
const Code = require('../settings.js').BLANK_FILE + "Table;";
const Table = eval(Code);

describe('triage', () => {
    it('detects Tables', () => {
        const data = ({__proto__: Table});
        data._eval();
        expect(Table.isPrototypeOf(data)).toBe(true);
        const result = triage('ObjectExpression', data, Table);
        expect(result.name).toBe('table_rw');
    });
});
