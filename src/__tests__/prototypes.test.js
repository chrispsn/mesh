const Prototypes = require('../prototypes.js');

function* take(n, iterable) {
    for (const x of iterable) {
        if (n <= 0) return;
        n--;
        yield x;
    }
}


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
    it('handles generator columns', () => {
        const table = {
            __proto__: Prototypes.TableObject,
            number: (function* () { yield 1; yield 2; yield 3; })(),
        }
        const records = [...table];
        expect(records.length).toBe(3);
        expect(records[1].number).toBe(2);
        expect(records[0].number).toBe(1);
    });
    it('handles cells in columns that reference prior cells in that column', () => {
        const table = {
            __proto__: Prototypes.TableObject,
            get number() { 
                // Note to readers:
                // this 't' pattern is used for convenience in testing,
                // but in a real Mesh sheet you could just use an
                // explicit ref to the table:
                // sheet.table[i-1]
                const t = this; 
                return (function* () {
                    yield 1;
                    for (let i = 1; true; i++) {
                        yield t[i - 1].number + 1;
                    }
                })();
            },
        }
        const [...records] = take(10, table);
        expect(records.length).toBe(10);
        expect(records[5].number).toBe(6);
    });
    it('handles row cells that use other cells in that row which may be uncomputed', () => {
        const table = {
            __proto__: Prototypes.TableObject,
            get power() { 
                const t = this; 
                return (function* () {
                    for (let i = 0; true; i++) {
                        yield t[i].number ** 2;
                    }
                })();
            },
            get number() { 
                const t = this; 
                return (function* () {
                    yield 1;
                    for (let i = 1; true; i++) {
                        yield t[i - 1].number + 1;
                    }
                })();
            },
        }
        const [...records] = take(10, table);
        expect(records.length).toBe(10);
        expect(records[5].power).toBe(36);
    });
    it('handles multiple references to the same cell', () => {
        const table = {
            __proto__: Prototypes.TableObject,
            get power() { 
                const t = this; 
                return (function* () {
                    for (let i = 0; true; i++) {
                        yield t[i].number ** 2;
                    }
                })();
            },
            get power2() { 
                const t = this; 
                return (function* () {
                    for (let i = 0; true; i++) {
                        yield t[i].number ** 2;
                    }
                })();
            },
            get number() { 
                const t = this; 
                return (function* () {
                    yield 1;
                    for (let i = 1; true; i++) {
                        yield t[i - 1].number + 1;
                    }
                })();
            },
        }
        const [...records] = take(10, table);
        expect(records.length).toBe(10);
        expect(records[5].power).toBe(36);
        expect(records[5].power2).toBe(36);
    });
    it('handles data literal columns and computed columns', () => {
        const table = {
            __proto__: Prototypes.TableObject,
            get power() { 
                const t = this; 
                return (function* () {
                    for (let i = 0; true; i++) {
                        yield t[i].number ** 2;
                    }
                })();
            },
            get number() { return [1, 2, 3, 4, 5]; }
        }
        const [...records] = table;
        expect(records.length).toBe(5);
        expect(records[2].power).toBe(9);
    });
})
