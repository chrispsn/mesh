"use strict";

describe('mesh_sheet_structure', () => {

    const structure = {
        a: 123,
        get b() {
            const sheet = this;
            return sheet.a
        },
        get table() {
            const sheet = this;
            return {
                a: 321,
                get b() {return this.a},
                get c() {return sheet.a},
            }
        }
    };

    const using_template = {
        __proto__: structure,
        a: 111,
        get table() {
            const sheet = this;
            return {
                __proto__: super.table,
                a: 222,
                get d() {
                    return super.a;
                },
                get e() {
                    return Object.getPrototypeOf(sheet).a;
                }
            }
        }
    }

    it('can see sheet object for "direct" properties', () => {
        expect(structure.b).toBe(123);
    });

    it('correctly uses "this" to refer to sheet child objects for props on those objects', () => {
        expect(structure.table.b).toBe(321);
    });

    it('can see sheet object for props of sheet child objects', () => {
        expect(structure.table.c).toBe(123);
    });

    it('works properly with sheets that use it as a template', () => {
        expect(using_template.a).toBe(111);
        expect(using_template.b).toBe(111);
        expect(using_template.table.a).toBe(222)
        expect(using_template.table.b).toBe(222)
        expect(using_template.table.c).toBe(111)
        expect(using_template.table.d).toBe(321)
        expect(using_template.table.e).toBe(123)
    });

})
