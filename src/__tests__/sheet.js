// TODOs
// When run, store a calc tree so know what to invalidate for future updates?
// Volatile functions (ie automatically invalidate entire cache)?
// Redefine a cell in existing object (with invalidation of cache)
// Copy over cache of parent?

const {BLANK_FILE, LINE_SEPARATOR} = require('../settings');
const Sheet = eval(BLANK_FILE + LINE_SEPARATOR + "Sheet");

// Setup

const cells = [
    ['a', [0, 0], $ => 1],
    ['b', [0, 0], $ => $.a + 1],
    ['c', [0, 0], $ => $.a + $.b],
];

const sheet = {__proto__: Sheet};
for (let [k, _, fn] of cells) {
    sheet.defineMemoProperty(k, fn);
};

const sheeti = {__proto__: sheet}

// Tests

describe("Object inheriting from Sheet", () => {
    it("handles basic properties like a regular object", () => {
        expect(sheet.a).toBe(1);
        expect(sheet.b).toBe(2);
        expect(sheet.c).toBe(3);
    });
    it("handles inheritance correctly", () => {
        // New sheet can redefine existing cells and flows through to dependencies
        sheeti.defineMemoProperty('b', $ => $.a);
        expect(sheeti.b).toBe(1);
        expect(sheeti.c).toBe(2);
        // New sheet can define new cells and uses existing cells on new sheet
        sheeti.defineMemoProperty('d', $ => $.a + $.b + $.c);
        expect(sheeti.d).toBe(4);
        // New sheet uses its own cache
        expect(Object.keys(sheeti._cache).length).toBe(4);
        // Prototype sheet unaffected
        expect(sheet.c).toBe(3);
        expect(Object.keys(sheet._cache).length).toBe(3);
        expect(Object.hasOwnProperty(sheet, 'd')).toBe(false);
    });
    it("lets you manipulate the cache directly", () => {
        sheet._cache['a'] = -1;
        expect(sheet.a).toBe(-1);
        expect(sheet.c).toBe(3); // Had no reason to refresh

        sheet._cache = {};
        sheet._cache['a'] = -1;
        expect(sheet.c).toBe(-1); // Refreshed because old cache removed
    });
    it("lets you define scenario analysis from within the sheet", () => {
        sheet.defineMemoProperty('z', 
            $ => ({__proto__: $}).defineMemoProperty('a', $ => -1000)
        );
        expect(sheet.z.a).toBe(-1000);
        expect(sheet.z.b).toBe(-999);
    });
    it("prevents you from manipulating existing properties (for now)", () => {
        try {
            sheet.defineMemoProperty('a', $ => 2);
            // TODO check that threw error
        } catch (e) {
            if (!(e instanceof TypeError)) {
                throw new Error("Didn't fail to stop resetting property");
            }
        }
    });
});
