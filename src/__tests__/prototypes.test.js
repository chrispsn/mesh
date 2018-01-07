const Prototypes = require('../prototypes.js');

// TODO should we look at cases where not all columns are the same length?
describe('TableObject', () => {
    it('deals with a table with no headings or data', () => {
        const table = {__proto__: Prototypes.TableObject};
        expect([...table].length).toBe(0);
        expect(Object.keys(table).length).toBe(0);
    });
    it('deals with a table with headings but no data', () => {
        const table = {__proto__: Prototypes.TableObject, single_key: []};
        expect([...table].length).toBe(0);
        expect(Object.keys(table).length).toBe(1);
    });
    it('gets all records of a table with data', () => {
        const table = {
            __proto__: Prototypes.TableObject,
            car: ['Mazda', 'Audi'],
            year: [2002, 1991]
        }
        const records = [...table];
        expect(records.length).toBe(2);
        expect(records[0].year).toBe(2002);
        expect(records[1].car).toBe('Audi');
    });
})
