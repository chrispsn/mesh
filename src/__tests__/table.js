"use strict";

const Code = require('../settings.js').BLANK_FILE + "[_makeTable, _calcTable];";
const [_makeTable, _calcTable] = eval(Code);

// No columns
// Columns, but no length
// No preset length
// Preset length
// Value is function call
// Default thingo is working properly
// No columns with preset length

describe('_makeTable', () => {
    it('deals with a table with no headings or data', () => {
        const spec = {};
        const table = _makeTable(spec);
        expect(table.length).toBe(0);
        expect(Object.keys(table).length).toBe(0);
    });
    it('deals with a table with headings but no data', () => {
        const spec = {heading: {values: []}};
        const table = _makeTable(spec);
        expect(table.length).toBe(0);
    });
    it('gets all records of a table with data', () => {
        const spec = {
            "car": {values: ['Mazda', 'Audi']},
            "year": {values: [2002, 1991]},
        };
        const table = _makeTable(spec);
        expect(table.length).toBe(2);
        expect(table[0].year).toBe(2002);
        expect(table[1].car).toBe('Audi');
    });
    it('handles values from a function call', () => {
        const call = (function() {return [1, 2, 3]})();
        const spec = {
            number: {values: call},
        };
        const table = _makeTable(spec);
        expect(table.length).toBe(3);
        expect(table[1].number).toBe(2);
        expect(table[0].number).toBe(1);
    });
    it('handles cells in columns that reference prior (potentially uncomputed) cells in that column', () => {
        const spec = {
            number: {values: [
                1,
                function(row, i) {return this[i-1].number + 1},
            ]},
        };
        const table = _makeTable(spec);
        expect(table[1].number).toBe(2);
    });
    it('handles multiple references to the same cell', () => {
        const spec = {
            number: {values: [
                1,
                function(row, i) {return this[i-1].number + 1},
                function(row, i) {return this[i-2].number + 1},
            ]},
        };
        const table = _makeTable(spec);
        expect(table[1].number).toBe(2);
        expect(table[2].number).toBe(2);
    });
    it('lets you set a length', () => {
        const spec = {
            length: 3,
            number: {
                values: [],
                default: function(row, i) {return i * 2}
            },
        };
        const table = _makeTable(spec);
        expect(table[2].number).toBe(4);
    });
    it('fills in gaps with default values', () => {
        const spec = {
            number: {
                values: [1, undefined],
                default: function(row, i) {return this[i-1].number * 2}
            },
        };
        const table = _makeTable(spec);
        expect(table[1].number).toBe(2);
    });
    it('lets you refer to cells across columns', () => {
        const spec = {
            length: 2,
            first: {
                values: [1],
                default: function(row, i) {return this[i-1].second + 1}
            },
            second: {
                values: [],
                default: function(row, i) {return row.first + 1}
            },
        };
        const table = _makeTable(spec);
        expect(table[1].second).toBe(4);
    });
})

describe('_calcTable', () => {
    it("calcs and memoises cells", () => {
        const spec = {heading: {values: [1, 2, 3], default: function() {return 123}}};
        const table = _makeTable(spec);
        const before = Object.getOwnPropertyDescriptor(table[0], 'heading');
        expect(before.value).toBeUndefined();
        expect(before.get).toBeDefined();
        _calcTable(table);
        const after = Object.getOwnPropertyDescriptor(table[0], 'heading');
        expect(after.value).toBeDefined();
        expect(after.get).toBeUndefined();
    });
});
