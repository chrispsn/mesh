"use strict";

const Code = require('../settings.js').BLANK_FILE + "tabulate;";
const tabulate = eval(Code);

// Helper function for tests

function* take(n, iterable) {
    for (const x of iterable) {
        if (n <= 0) return;
        n--;
        yield x;
    }
}

// No columns
// Columns, but no length
// No preset length
// Preset length
// Value is function call
// Default thingo is working properly
// No columns with preset length

describe('Table', () => {
    it('deals with a table with no headings or data', () => {
        const spec = {};
        const table = tabulate(spec);
        expect(table.length).toBe(0);
        expect(Object.keys(table).length).toBe(0);
    });
    it('deals with a table with headings but no data', () => {
        const spec = {heading: {values: []}};
        const table = tabulate(spec);
        expect(table.length).toBe(0);
    });
    it('gets all records of a table with data', () => {
        const spec = {
            "car": {values: ['Mazda', 'Audi']},
            "year": {values: [2002, 1991]},
        };
        const table = tabulate(spec);
        expect(table.length).toBe(2);
        expect(table[0].year).toBe(2002);
        expect(table[1].car).toBe('Audi');
    });
    it('handles values from a function call', () => {
        const call = (function() {return [1, 2, 3]})();
        const spec = {
            number: {values: call},
        };
        const table = tabulate(spec);
        expect(table.length).toBe(3);
        expect(table[1].number).toBe(2);
        expect(table[0].number).toBe(1);
    });
    it('handles cells in columns that reference prior (potentially uncomputed) cells in that column', () => {
        const spec = {
            number: {values: [
                1,
                function(rowIdx) {return this[rowIdx-1].number + 1},
            ]},
        };
        const table = tabulate(spec);
        expect(table[1].number).toBe(2);
    });
    it('handles multiple references to the same cell', () => {
        const spec = {
            number: {values: [
                1,
                function(rowIdx) {return this[rowIdx-1].number + 1},
                function(rowIdx) {return this[rowIdx-2].number + 1},
            ]},
        };
        const table = tabulate(spec);
        expect(table[1].number).toBe(2);
        expect(table[2].number).toBe(2);
    });
    it('lets you set a length', () => {
        const spec = {
            length: 3,
            number: {
                values: [],
                default: function(rowIdx) {return rowIdx * 2}
            },
        };
        const table = tabulate(spec);
        expect(table[2].number).toBe(4);
    });
    it('fills in gaps with default values', () => {
        const spec = {
            number: {
                values: [1, undefined],
                default: function(rowIdx) {return this[rowIdx-1].number * 2}
            },
        };
        const table = tabulate(spec);
        expect(table[1].number).toBe(2);
    });
    it('lets you refer to cells across columns', () => {
        const spec = {
            length: 2,
            first: {
                values: [1],
                default: function(rowIdx) {return this[rowIdx-1].second + 1}
            },
            second: {
                values: [],
                default: function(rowIdx) {return this[rowIdx].first + 1}
            },
        };
        const table = tabulate(spec);
        expect(table[1].second).toBe(4);
    });
})
