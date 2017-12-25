const Recast = require('recast');

const CT = require('../code_transformers');
const {LINE_SEPARATOR} = require('../settings');

function standardise_code_formatting(code) {
    const options = {tabWidth: 0};
    return Recast.prettyPrint(Recast.parse(code), options).code;
}

describe('get_declaration_node_init', () => {
    it('gets the right node', () => {
        const old_code = "const alpha = 123; const beta = 345; const gamma = 456;"
        const old_AST = CT.parse_code_string_to_AST(old_code);
        const received_node = CT.get_declaration_node_init(old_AST, 'beta');
        expect(received_node.value === 345);
    });
});

// ARRAYS

describe('insert_array_element', () => {
    it('inserts elements in the middle of an array', () => {
        const old_code = "const arr = [1, 2, 3];";
        const AST = CT.parse_code_string_to_AST(old_code);
        const arr_node = CT.get_declaration_node_init(AST, 'arr');
        CT.insert_array_element(arr_node, 1, "null");
        const new_code = CT.print_AST_to_code_string(AST);
        const expected_code = "const arr = [1, null, 2, 3];";
        expect(new_code).toBe(expected_code);
    })
    it('inserts into an array even if the array is empty', () => {
        const old_code = "const arr = [];";
        const AST = CT.parse_code_string_to_AST(old_code);
        const arr_node = CT.get_declaration_node_init(AST, 'arr');
        CT.insert_array_element(arr_node, 0, "null");
        const new_code = CT.print_AST_to_code_string(AST);
        const expected_code = "const arr = [null];";
        expect(new_code).toBe(expected_code);
    })
    it('inserts the supplied text', () => {
        const old_code = "const arr = [];";
        const AST = CT.parse_code_string_to_AST(old_code);
        const arr_node = CT.get_declaration_node_init(AST, 'arr');
        CT.insert_array_element(arr_node, 0, "1 + 2");
        const new_code = CT.print_AST_to_code_string(AST);
        const expected_code = "const arr = [1 + 2];";
        expect(new_code).toBe(expected_code);
    })
});

describe('append_array_element', () => {
    it('appends an element to a non-empty array', () => {
        const old_code = "const arr = [1, 2, 3];";
        const AST = CT.parse_code_string_to_AST(old_code);
        const arr_node = CT.get_declaration_node_init(AST, 'arr');
        CT.append_array_element(arr_node, '4');
        const new_code = CT.print_AST_to_code_string(AST);
        const expected_code = "const arr = [1, 2, 3, 4];";
        expect(new_code).toBe(expected_code);
    })
    it('appends an element to an empty array', () => {
        const old_code = "const arr = [];";
        const AST = CT.parse_code_string_to_AST(old_code);
        const arr_node = CT.get_declaration_node_init(AST, 'arr');
        CT.append_array_element(arr_node, '\'hello!\'');
        const new_code = CT.print_AST_to_code_string(AST);
        const expected_code = "const arr = ['hello!'];";
        expect(new_code).toBe(expected_code);
    })
});

describe('remove_array_element', () => {
    it('removes elements in the middle of an array', () => {
        const old_code = "const arr = [1, 2, 3];";
        const AST = CT.parse_code_string_to_AST(old_code);
        const arr_node = CT.get_declaration_node_init(AST, 'arr');
        CT.remove_array_element(arr_node, 1);
        const new_code = CT.print_AST_to_code_string(AST);
        const expected_code = "const arr = [1, 3];";
        expect(new_code).toBe(expected_code);
    })
    it('keeps the array if the array is now empty', () => {
        const old_code = "const arr = [1];";
        const AST = CT.parse_code_string_to_AST(old_code);
        const arr_node = CT.get_declaration_node_init(AST, 'arr');
        CT.remove_array_element(arr_node, 0);
        const new_code = CT.print_AST_to_code_string(AST);
        const expected_code = "const arr = [];";
        expect(new_code).toBe(expected_code);
    })
});

// OBJECTS

describe('get_object_item', () => {
    it('gets the right item', () => {
        const old_code = "const obj = {a_key: 123};";
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_nodepath = CT.get_declaration_node_init(AST, 'obj');
        const obj_item_nodepath = CT.get_object_item(obj_nodepath, 'a_key');
        expect(obj_item_nodepath.node.value.value).toBe(123);
    });
})

describe('get_object_item_index', () => {
    it('gets the right index', () => {
        const old_code = `const obj = {
            a_key: 123,
            get b_key() { return "-"; },
            c_key: 789,
        };`;
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_nodepath = CT.get_declaration_node_init(AST, 'obj');
        const index = CT.get_object_item_index(obj_nodepath, 'b_key');
        expect(index).toBe(1);
    });
});

describe('replace_object_item_key', () => {
    it('replaces the key', () => {
        const old_code = "const obj = {a_key: 123};";
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_nodepath = CT.get_declaration_node_init(AST, 'obj');
        const obj_item_nodepath = CT.get_object_item(obj_nodepath, 'a_key');
        CT.replace_object_item_key(obj_item_nodepath, 'different_key');
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {different_key: 123};";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    });
});

describe('insert_object_item', () => {
    it('inserts the supplied text when object is empty', () => {
        const old_code = "const obj = {};";
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.insert_object_item(obj_node, 'a_key', "123");
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {a_key: 123};";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    })
    it('inserts the supplied text when object is not empty', () => {
        const old_code = "const obj = {existing_prop: 456};";
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.insert_object_item(obj_node, 'a_key', "123");
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {existing_prop: 456, a_key: 123};";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    })
    it('inserts the supplied text at the chosen location when empty', () => {
        const old_code = "const obj = {};";
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.insert_object_item(obj_node, 'a_key', "123", 0);
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {a_key: 123};";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    })
    it('inserts the supplied text at the chosen location when not empty', () => {
        const old_code = "const obj = {existing_prop: 456};";
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.insert_object_item(obj_node, 'a_key', "123", 0);
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {a_key: 123, existing_prop: 456};";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    })
});

describe('insert_object_getter', () => {
    it('inserts the supplied text when object is empty', () => {
        const old_code = "const obj = {};";
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.insert_object_getter(obj_node, 'num', '123');
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {get num() {return 123;}};";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    })
    it('inserts the supplied text at the chosen location when empty', () => {
        const old_code = "const obj = {};";
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.insert_object_getter(obj_node, 'a_key', "123", 0);
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {get a_key() {return 123}};";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    })

    it('inserts the supplied text at the chosen location when not empty', () => {
        const old_code = "const obj = {existing_prop: 456};";
        const AST = CT.parse_code_string_to_AST(old_code);
        const obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.insert_object_getter(obj_node, 'a_key', "123", 0);
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {get a_key() {return 123}, existing_prop: 456};";

        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    })
});

describe('remove_object_item', () => {
    it('removes the item with the supplied key', () => {
        const old_code = "const obj = {a_key: 123, second_key: 456, third_key: 789};";
        const AST = CT.parse_code_string_to_AST(old_code);
        obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.remove_object_item(obj_node, 'second_key');
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {a_key: 123, third_key: 789};";
        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
 
    })
    it('works regardless of whether quotes are used', () => {
        const old_code = "const obj = {'a_key': 123, 'second_key': 456, 'third_key': 789};";
        const AST = CT.parse_code_string_to_AST(old_code);
        obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.remove_object_item(obj_node, 'second_key');
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {'a_key': 123, 'third_key': 789};";
        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    })
    it('removes the getter with the specified key', () => {
        const old_code = "const obj = {get num() {return 123;}};";
        const AST = CT.parse_code_string_to_AST(old_code);
        obj_node = CT.get_declaration_node_init(AST, 'obj');
        CT.remove_object_item(obj_node, 'num');
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = "const obj = {};";
        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    })
});

// RECORDS

/*
describe('append_record', () => {
    it('adds a new record to the end of the records with the relevant field filled in and the rest left null', () => {
        const old_code = "const records = [{key_field: 'lol', another_field: 'huh'}];";
        let new_code = CT.append_record(old_code, 'records', 'another_field', 'filled_in');
        let expected_code = `const records = [
            {key_field: 'lol', another_field: 'huh'},
            {key_field: null, another_field: 'filled_in'},
        ];`;
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    })
});
*/

describe('remove_record_given_key', () => {
    it('deletes a record based on a specified key field and key value', () => {
        const old_code = "const records = [{key_field: 'lol', another_field: 'huh'}];";
        const AST = CT.parse_code_string_to_AST(old_code);
        arr_node = CT.get_declaration_node_init(AST, 'records');
        CT.remove_record_given_key(arr_node, 'key_field', 'lol');
        let new_code = CT.print_AST_to_code_string(AST);
        const expected_code = "const records = [];";
        expect(new_code).toBe(expected_code);
    });
    it('still works with string literals as keys', () => {
        const old_code = "const records = [{'key_field': 'lol', 'another_field': 'huh'}];";
        const AST = CT.parse_code_string_to_AST(old_code);
        arr_node = CT.get_declaration_node_init(AST, 'records');
        CT.remove_record_given_key(arr_node, 'key_field', 'lol');
        let new_code = CT.print_AST_to_code_string(AST);
        const expected_code = "const records = [];";
        expect(new_code).toBe(expected_code);
    });
});

// RECORDS - OBJECT OF ARRAYS

describe('OOA_append_datum', () => {
    it('appends datum to the bottom of the right field and fills the rest with null', () => {
        const old_code = "const OOA = {field1: ['value'], 'field2': [123]};"
        const AST = CT.parse_code_string_to_AST(old_code);
        obj_node = CT.get_declaration_node_init(AST, 'OOA');
        CT.OOA_append_datum(obj_node, 'field1', 'new_datum');
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = `const OOA = {
            field1: ['value', new_datum],
            'field2': [123, null],
        }`
        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    });
});

describe('OOA_remove_record', () => {
    it('removes the specified record', () => {
        const old_code = `const OOA = {
            field1: ['value', 'value2', 'value3'], 
            'field2': ['he', 'hehe', 'hehehe']
        };`
        const AST = CT.parse_code_string_to_AST(old_code);
        obj_node = CT.get_declaration_node_init(AST, 'OOA');
        CT.OOA_remove_record(obj_node, 1);
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = `const OOA = {
            field1: ['value', 'value3'], 
            'field2': ['he', 'hehehe']
        };`
        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    });
});

describe('OOA_add_field', () => {
    it('adds the specified field', () => {
        const old_code = `const OOA = {
            field1: ['value', 'value2', 'value3'], 
        };`
        const AST = CT.parse_code_string_to_AST(old_code);
        obj_node = CT.get_declaration_node_init(AST, 'OOA');
        // TODO does this need to distinguish between the two types of key?
        CT.OOA_add_field(obj_node, 'field2');
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = `const OOA = {
            field1: ['value', 'value2', 'value3'], 
            field2: [null, null, null],
        };`
        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    });
});

describe('OOA_remove_field', () => {
    it('removes the specified field', () => {
        const old_code = `const OOA = {
            field1: ['value', 'value2', 'value3'], 
            'field2': ['he', 'hehe', 'hehehe']
        };`
        const AST = CT.parse_code_string_to_AST(old_code);
        obj_node = CT.get_declaration_node_init(AST, 'OOA');
        // TODO does this need to distinguish between the two types of key?
        CT.OOA_remove_field(obj_node, 'field1');
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = `const OOA = {
            'field2': ['he', 'hehe', 'hehehe']
        };`
        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    });
    it('leaves an empty object if the field was the last one', () => {
        const old_code = `const OOA = {
            field1: ['value', 'value2', 'value3'], 
        };`
        const AST = CT.parse_code_string_to_AST(old_code);
        obj_node = CT.get_declaration_node_init(AST, 'OOA');
        // TODO does this need to distinguish between the two types of key?
        CT.OOA_remove_field(obj_node, 'field1');
        let new_code = CT.print_AST_to_code_string(AST);
        let expected_code = `const OOA = {
        };`
        new_code = standardise_code_formatting(new_code);
        expected_code = standardise_code_formatting(expected_code);
        expect(new_code).toBe(expected_code);
    });
});
// TODO delete object
