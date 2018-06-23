const Recast = require('recast');

const CT = require('../code_transformers');
const {LINE_SEPARATOR} = require('../settings');

describe('makeUniqueID', () => {
    it('output strings of the given length', () => {
        const new_ID = CT.makeUniqueID(new Set(), 8);
        expect(new_ID.length).toBe(8);
    });
    it('keeps going until a unique ID is found', () => {
        const lc = /* no a */ "bcdefghijklmnopqrstuvwxyz";
        const num = "0123456789"
        const existingChars = new Set((lc + num).split(""));
        const newID = CT.makeUniqueID(existingChars, 1);
        expect(newID).toBe("a");
    });
});

// MESH-SPECIFIC

describe('getCellsNodePath', () => {
    it('gets the right node', () => {
        const old_code = "const _CELLS = {};"
        const old_AST = CT.parse_code_string_to_AST(old_code);
        const received_node = CT.getCellsNodePath(old_AST);
        expect(received_node.value.type).toBe('ObjectExpression');
    });
});

describe('getCellNodePath', () => {

    const code = `const _CELLS = {
        "name1": {v: abc},
        "name2": {v: function() {return def}},
    }`;
    const AST = CT.parse_code_string_to_AST(code);
    const cellsNodePath = CT.getCellsNodePath(AST);

    it('gets the property nodepath', () => {
        const nodePath = CT.getCellNodePath(cellsNodePath, "name1");
        const propNode = nodePath.property;
        const found_code = CT.print_AST_to_code_string(propNode)
        expect(found_code).toBe(`"name1": {v: abc}`);
    });
    it('gets the value nodepath if not a function', () => {
        const nodePath = CT.getCellNodePath(cellsNodePath, "name1");
        const propNode = nodePath.value;
        const found_code = CT.print_AST_to_code_string(propNode)
        expect(found_code).toBe("abc");
    });
    it('gets the return value nodepath if a function nodepaths', () => {
        const nodePath = CT.getCellNodePath(cellsNodePath, "name2");
        const propNode = nodePath.value;
        let found_code = CT.print_AST_to_code_string(propNode)
        expect(found_code).toBe("def");
    });
});

// TEST HELPERS

function standardise_code_formatting(code) {
    const options = {tabWidth: 0};
    return Recast.prettyPrint(Recast.parse(code), options).code;
}

function get_expr_nodepath(code_string) {
    let nodepath;
    const AST = CT.parse_code_string_to_AST(code_string) 
    Recast.visit(AST, {
        visitExpression: function (path) {
            nodepath = path;
            return false;
        }
    });
    return nodepath;
}

function run_tests(fn_description, fn, tests) {
    describe(fn_description, () => {
        tests.forEach(test => {
            it(test.desc, () => {
                const nodepath = get_expr_nodepath(test.in);
                fn(nodepath, ...test.args);
                let new_code = CT.print_AST_to_code_string(nodepath);
                let expected_code = test.out;
                new_code = standardise_code_formatting(new_code);
                expected_code = standardise_code_formatting(expected_code);
                expect(new_code).toBe(expected_code);
            });
        })
    })
}

// ARRAYS

// Trying a new style - separating data and logic more...
// Could even convert to a single table and have the fn be an extra column ;)
//
// First argument is consistent - indicates a method?
// Probably not worth it, the nodepath goes away almost immediately after application

run_tests('insert_array_element', CT.insert_array_element, [
    {desc: "inserts in middle", in: "[1, 2, 3]", args:[1, "null"], out: "[1, null, 2, 3]"},
    {desc: "inserts in empty array", in: "[]", args: [0, "null"], out: "[null]"},
    {desc: "inserts the supplied text", in: "[]", args: [0, "1 + 2"], out: "[1 + 2]"},
])

run_tests('append_array_element', CT.append_array_element, [
    {desc: "appends to an empty array", in: "[]", args: ["'hello!'"], out: "['hello!']"},
    {desc: "appends to a non-empty array", in: "[1, 2]", args:['3'], out: "[1, 2, 3]"},
])

run_tests('replace_array_element', CT.replace_array_element, [
    {
        desc: "replaces correct element",
        in: "[1, 2, 3]",
        args: [1, "'hello'"],
        out: "[1, 'hello', 3]",
    },
]);

run_tests('remove_array_element', CT.remove_array_element, [
    {desc: "removes from middle of array", in: "[1, 2, 3]", args: [1], out: "[1, 3]"},
    {desc: "keeps array if arr is now empty", in: "[1]", args: [0], out: "[]"},
])

// OBJECTS
// Literals need to be surrounded by (), otherwise interpreted as a block

describe('get_object_item', () => {
    it('gets the right item', () => {
        const nodepath = get_expr_nodepath("({a_key: 123})");
        const obj_item_nodepath = CT.get_object_item(nodepath, 'a_key');
        expect(obj_item_nodepath.node.value.value).toBe(123);
    });
})

describe('get_object_item_index', () => {
    it('gets the right index', () => {
        const old_code = `({
            a_key: 123,
            get b_key() { return "-"; },
            c_key: 789,
        })`;
        const nodepath = get_expr_nodepath(old_code);
        const index = CT.get_object_item_index(nodepath, 'b_key');
        expect(index).toBe(1);
    });
});

describe('replace_object_item_key', () => {
    it('replaces the key', () => {
        const old_code = "({a_key: 123})";
        const obj_nodepath = get_expr_nodepath(old_code);
        const obj_item_nodepath = CT.get_object_item(obj_nodepath, 'a_key');

        CT.replace_object_item_key(obj_item_nodepath, 'different_key');
        let new_code = CT.print_AST_to_code_string(obj_nodepath);
        let expected_code = "({different_key: 123})";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    });
});

run_tests('insert_object_item', CT.insert_object_item, [
    {
        desc: 'inserts when object is empty', 
        in: "({})",
        args: ['a_key', '123'], 
        out: "({a_key: 123})"
    },
    {
        desc: 'inserts when object is not empty', 
        in: "({old_key: 456})", 
        args: ['a_key', '123'], 
        out: "({old_key: 456, a_key: 123})"
    },
    {
        desc: 'inserts at chosen location when empty', 
        in: "({})", 
        args: ['a_key', '123', 0], 
        out: "({a_key: 123})"
    },
    {
        desc: 'inserts at chosen location when not empty', 
        in: "({old_key: 456})", 
        args: ['a_key', '123', 0], 
        out: "({a_key: 123, old_key: 456})"
    },
])

describe('replace_object_getter_return_val', () => {
    it('replaces the return value', () => {
        const old_code = "({ get a() { return 123 } })";
        const obj_nodepath = get_expr_nodepath(old_code);
        const obj_item_nodepath = CT.get_object_item(obj_nodepath, 'a');

        CT.replace_object_getter_return_val(obj_item_nodepath, '456');
        let new_code = CT.print_AST_to_code_string(obj_nodepath);
        let expected_code = "({ get a() { return 456 } })";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    });
});

run_tests('remove_object_item', CT.remove_object_item, [
    {
        desc: 'removes item with supplied key', 
        in: "({key1: 3, key2: 2, key3: 1})",
        args: ['key2'], 
        out: "({key1: 3, key3: 1})"},
    {
        desc: 'removes regardless of quotes', 
        in: "({'key1': 3, 'key2': 2, 'key3': 1})",
        args: ['key2'], 
        out: "({'key1': 3, 'key3': 1})"},
    {
        desc: 'removes getter with specified key', 
        in: "({ get num() {return 123} })",
        args: ['num'], 
        out: "({})"},
])

run_tests('insert_object_getter', CT.insert_object_getter, [
    {
        desc: 'inserts text when object is empty',
        in: "({})",
        args: ['num', '123'],
        out: `({ get num() {return 123} })`
    },
    {
        desc: 'inserts text at chosen location when object is empty', 
        in: "({})", 
        args: ['num', '123', 0], 
        out: `({ get num() {return 123} })`
    },
    {
        desc: 'inserts text at chosen location when object is not empty',
        in: "({a_key: 123})", 
        args: ['num', '123', 0], 
        out: `({ get num() {return 123}, a_key: 123 })`
    },
])

/* TABLES */

describe('Table_Create', () => {
    it('creates a table if no existing t flag', () => {
        const code = `const _CELLS = { "cellName": {v: null}, }`;
        const AST = CT.parse_code_string_to_AST(code);
        const cellsNodePath = CT.getCellsNodePath(AST);
        const cellPropsPath = CT.getCellNodePath(cellsNodePath, "cellName")
                                .property.get("value");
        CT.Table_Create(cellPropsPath);
        const found_code = standardise_code_formatting(CT.print_AST_to_code_string(AST));
        const expected_code = standardise_code_formatting(`const _CELLS = {
            "cellName": {v: function() {return {}}, t: true},
        }`);
        expect(found_code).toBe(expected_code);
    });
    it('creates a table if there is an existing t flag', () => {
        const code = `const _CELLS = { "cellName": {v: null, t: false}, }`;
        const AST = CT.parse_code_string_to_AST(code);
        const cellsNodePath = CT.getCellsNodePath(AST);
        const cellPropsPath = CT.getCellNodePath(cellsNodePath, "cellName")
                                .property.get("value");
        CT.Table_Create(cellPropsPath);
        const found_code = standardise_code_formatting(CT.print_AST_to_code_string(AST));
        const expected_code = standardise_code_formatting(`const _CELLS = {
            "cellName": {v: function() {return {}}, t: true},
        }`);
        expect(found_code).toBe(expected_code);
    });
});


run_tests('Table_ChangeValueCell', CT.Table_ChangeValueCell, [
    {
        desc: 'changes cell in column', 
        in: "({'columnHeading': {'values': [1, 2, 3], 'default': null}})",
        args: ['columnHeading', 1, '123'], 
        out: "({'columnHeading': {'values': [1, 123, 3], 'default': null}})",
    },
])

// TODO do some checks near the edges - eg expanding empty by 1
run_tests('Table_ResizeArray', CT.Table_ResizeArray, [
    {
        desc: 'expands by the number of cells specified', 
        in: "[1, 2, 3]",
        args: [5], 
        out: "[1, 2, 3, undefined, undefined]",
    },
])

run_tests('Table_ChangeDefaultFormulaCell', CT.Table_ChangeDefaultFormulaCell, [
/*
    {
        desc: 'inserts when object is empty', 
        in: "({})",
        args: ['a_key', '123'], 
        out: "({a_key: 123})"
    },
*/
])

run_tests('Table_AddRow', CT.Table_AddRow, [
    {
        desc: 'inserts the value in the right column', 
        in: `({
            notChosenColumn: {
                values: [1, 2],
                default: null,
            },
            chosenColumn: {
                values: [3, 4],
                default: null,
            },
        })`,
        args: ['chosenColumn', 2, '123'], 
        out: `({
            notChosenColumn: {
                values: [1, 2, undefined],
                default: null,
            },
            chosenColumn: {
                values: [3, 4, 123],
                default: null,
            },
        })`,
    },
    {
        desc: 'adds undefined if no new value specified', 
        in: `({
            notChosenColumn: {
                values: [1, 2],
                default: null,
            },
            chosenColumn: {
                values: [3, 4],
                default: null,
            },
        })`,
        args: ['chosenColumn', 2], 
        out: `({
            notChosenColumn: {
                values: [1, 2, undefined],
                default: null,
            },
            chosenColumn: {
                values: [3, 4, undefined],
                default: null,
            },
        })`,
    },
])

run_tests('Table_DeleteRow', CT.Table_DeleteRow, [
    {
        desc: 'inserts when object is empty', 
        in: "({heading: {default: null, values: [1, 2, 3]}})",
        args: [1], 
        out: "({heading: {default: null, values: [1, 3]}})",
    },
])

run_tests('Table_AppendRow', CT.Table_AppendRow, [
/*
    {
        desc: 'inserts when object is empty', 
        in: "({})",
        args: ['a_key', '123'], 
        out: "({a_key: 123})"
    },
*/
])

run_tests('Table_AddColumn', CT.Table_AddColumn, [
// TODO add case where no heading specified
    {
        desc: 'inserts a column', 
        in: "({})",
        args: ['newHeading'], 
        out: `({
            'newHeading': {'default': null, 'values': []}
        })`
    },
    {
        desc: 'inserts a column with undefined values if another column exists', 
        in: `({
            'oldHeading': {'default': null, 'values': [1, 2, 3]}
        })`,
        args: ['newHeading'], 
        out: `({
            'oldHeading': {'default': null, 'values': [1, 2, 3]}
            'newHeading': {'default': null, 'values': [undefined, undefined, undefined]}
        })`
    },
    {
        desc: 'inserts a column at the right place', 
        in: `({
            'oldHeading': {'default': null, 'values': [1, 2, 3]}
        })`,
        args: ['newHeading', 0], 
        out: `({
            'newHeading': {'default': null, 'values': [undefined, undefined, undefined]}
            'oldHeading': {'default': null, 'values': [1, 2, 3]}
        })`
    },
])

run_tests('Table_DeleteColumn', CT.Table_DeleteColumn, [
    {
        desc: 'deletes the right column a column at the right place', 
        in: `({
            'oldHeading': {'default': null, 'values': [1, 2, 3]}
            'newHeading': {'default': null, 'values': [undefined, undefined, undefined]}
        })`,
        args: ['newHeading'], 
        out: `({
            'oldHeading': {'default': null, 'values': [1, 2, 3]}
        })`
    },

/*
    {
        desc: 'inserts when object is empty', 
        in: "({})",
        args: ['a_key', '123'], 
        out: "({a_key: 123})"
    },
*/
])

run_tests('Table_EditLength', CT.Table_EditLength, [
/*
    {
        desc: 'inserts when object is empty', 
        in: "({})",
        args: ['a_key', '123'], 
        out: "({a_key: 123})"
    },
*/
])

run_tests('Table_DeleteLength', CT.Table_DeleteLength, [
/*
    {
        desc: 'inserts when object is empty', 
        in: "({})",
        args: ['a_key', '123'], 
        out: "({a_key: 123})"
    },
*/
])

