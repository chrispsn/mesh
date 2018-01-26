const Recast = require('recast');

const CT = require('../code_transformers');
const {LINE_SEPARATOR} = require('../settings');

// MESH-SPECIFIC

describe('get_root_mesh_obj_node', () => {
    it('gets the right node', () => {
        const old_code = "const DATA = []; const SHEET = {};"
        const old_AST = CT.parse_code_string_to_AST(old_code);
        const received_node = CT.get_root_mesh_obj_node(old_AST);
        expect(received_node.value.type).toBe('ArrayExpression');
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

// RECORDS - ARRAY OF ARRAYS

run_tests('AOA_append_record', CT.AOA_append_record, [
    {
        desc: 'adds array to the end of the array with specified values',
        in: "[[1, 2, 3]]",
        args: [['4', '5', '6']],
        out: "[[1, 2, 3], [4, 5, 6]]"
    }
]);

describe('AOA_get_record_given_key', () => {
    it('gets the array with the value in the specified position', () => {
        const nodepath = get_expr_nodepath("[['a', 1], ['b', 2]]");
        const obj_item_nodepath = CT.AOA_get_record_given_key(nodepath, 0, 'b');
        expect(obj_item_nodepath.node.elements[1].value).toBe(2);
    });
});

// RECORDS - ARRAY OF OBJECTS

// TODO should be the more generic 'get_record_given_key'
run_tests('AOO_remove_record_given_key', CT.AOO_remove_record_given_key, [
    {
        desc: 'removes based on key field and key value',
        in: "[{key_field: 'lol', another_field: 'huh'}]",
        args: ['key_field', 'lol'],
        out: "[]"
    },
    {
        desc: 'works with string literals as keys',
        in: "[{'key_field': 'lol', 'another_field': 'huh'}]",
        args: ['key_field', 'lol'],
        out: "[]"
    },
])

run_tests('AOO_append_record', CT.AOO_append_record, [
    {
        desc: 'adds a new record to the end of the records with the relevant field filled in and the rest left null',
        in: `[
            {"key_field": 'lol', "another_field": 'huh'},
        ]`,
        args: [{"another_field": 'filled_in'}],
        out: `[
            {"key_field": 'lol', "another_field": 'huh'},
            {"key_field": null, "another_field": 'filled_in'},
        ]`,
    }
]);

// RECORDS - OBJECT OF ARRAYS

run_tests('OOA_append_datum', CT.OOA_append_datum, [
    {
        desc: 'appends datum to bottom of correct field, and fills rest with null',
        in: "({field1: ['value'], 'field2': [123]})",
        args: ['field1', 'new_datum'],
        out: "({field1: ['value', new_datum], 'field2': [123, null]})"
    },
    {
        desc: "skips arrays that are not literals",
        in: `({
            field1: ['value'],
            'field2': fn_call()
        })`,
        args: ['field1', 'new_datum'],
        out: `({
            field1: ['value', new_datum], 
            'field2': fn_call(),
        })`
    },
])

run_tests('OOA_remove_record', CT.OOA_remove_record, [
    {
        desc: 'removes correct record',
        in: `({
            field1: ['value', 'value2', 'value3'],
            'field2': ['he', 'hehe', 'hehehe'],
        })`,
        args: [1],
        out: `({
            field1: ['value', 'value3'],
            'field2': ['he', 'hehehe'],
        })`,
    },
    {
        desc: "skips arrays that aren't literals",
        in: `({
            field1: ['value', 'value2', 'value3'],
            'field2': func_call(),
        })`,
        args: [1],
        out: `({
            field1: ['value', 'value3'],
            'field2': func_call(),
        })`,
    },
])

run_tests('OOA_add_field', CT.OOA_add_field, [
    {
        desc: 'adds specified field',
        in: `({
            field1: ['value1', 'value2', 'value3'],
        })`,
        args: ['field2'],
        out: `({
            field1: ['value1', 'value2', 'value3'],
            field2: [null, null, null],
        })`,
    },
])

run_tests('OOA_remove_field', CT.OOA_remove_field, [
    {
        desc: 'removes specified field',
        in: `({
            field1: ['value', 'value2', 'value3'],
            'field2': ['he', 'hehe', 'hehehe'],
        })`,
        args: ['field1'],
        out: `({
            'field2': ['he', 'hehe', 'hehehe'],
        })`,
    },
    {
        desc: 'leaves empty object if field was last one',
        in: `({
            field1: ['value', 'value2', 'value3'],
        })`,
        args: ['field1'],
        out: `({
        })`,
    },
])

// TODO delete object
