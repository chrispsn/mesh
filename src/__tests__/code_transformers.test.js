const Recast = require('recast');

const CM = require('../code_transformers');
const {LINE_SEPARATOR} = require('../settings');

describe('get_text', () => {
    it('works when the start is the same as the end', () => {
        const old_text = "const a = sample_text";
        const loc = {
            start:  {line: 1, column: 13}, 
            end:    {line: 1, column: 13}
        };
        const expected_text = "";
        const new_text = CM.get_text(old_text, loc);
        expect(new_text).toBe(expected_text);
    });
    it('works when the start is not the same as the end', () => {
        const old_text = "const a = sample_text";
        const loc = {
            start:  {line: 1, column: 13}, 
            end:    {line: 1, column: 15}
        };
        const expected_text = "pl";
        const new_text = CM.get_text(old_text, loc);
        expect(new_text).toBe(expected_text);
    });
    it('works across multiple lines', () => {
        const old_text = "const a = sample_text;" 
                            + LINE_SEPARATOR 
                            + "const b = simple_text";
        const loc = {
            start:  {line: 1, column: 13}, 
            end:    {line: 2, column: 5}
        };
        const expected_text = "ple_text;" + LINE_SEPARATOR + "const";
        const new_text = CM.get_text(old_text, loc);
        expect(new_text).toBe(expected_text);
    });
});

describe('replace_text', () => {
    it('works when the start is the same as the end', () => {
        const old_text = "const a = sample_text";
        const loc = {
            start:  {line: 1, column: 13}, 
            end:    {line: 1, column: 13}
        };
        const expected_text = "const a = samimple_text";
        const new_text = CM.replace_text(old_text, loc, 'im');
        expect(new_text).toBe(expected_text);
    });
    it('works when the start is before the end', () => {
        const old_text = "const a = sample_text";
        const loc = {
            start:  {line: 1, column: 11}, 
            end:    {line: 1, column: 13}
        };
        const expected_text = "const a = simple_text";
        const new_text = CM.replace_text(old_text, loc, 'im');
        expect(new_text).toBe(expected_text);
    });
    it('works when the start is on a different line to the end', () => {
        const old_text = "const a = sample_text;"
                            + LINE_SEPARATOR + "const b = simple_text;"
                            + LINE_SEPARATOR + "call();";
        const loc = {
            start:  {line: 1, column: 11}, 
            end:    {line: 2, column: 13}
        };
        const expected_text = "const a = simple_text;"
                                + LINE_SEPARATOR + "call();";
        const new_text = CM.replace_text(old_text, loc, 'im');
        expect(new_text).toBe(expected_text);
    });

});

// DECLARATIONS
// TODO rewrite these tests
// TODO let's attach this to the 'delete name' code

describe('create_const_variable', () => {
    it('works when a "use strict" statement is present', () => {
        const old_code = `
        'use strict';
        const MESH_ATTACHMENTS = [];
        `
        let new_code = CM.create_const_variable(old_code, 'new_one');
        const expected_code = `
        'use strict';
        const new_one = null;
        const MESH_ATTACHMENTS = [];
        `
        expect(new_code).toBe(expected_code);
    });
});

describe('remove_declaration', () => {
    it('removes the named declaration', () => {
        let old_code = "const a_name = null; const b_name = null; const c_name = null;";
        let new_code = CM.remove_declaration(old_code, 'b_name');
        let expected_code = "const a_name = null; const c_name = null;";

        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    })
})

// ATTACHMENTS

describe('add_attachment', () => {
    it('adds to the bottom of the MESH_ATTACHMENTS array', () => {
        const old_code = `const MESH_ATTACHMENTS = [
            {id: "something", value: "DUMMY", loc: "DUMMY"},
        ];`;
        let new_code = CM.add_attachment(old_code, "new_id", [1, 2]);
        let expected_code = `const MESH_ATTACHMENTS = [
            {id: "something", value: "DUMMY", loc: "DUMMY"},
            {id: "new_id", value: new_id, loc: [1, 2]},
        ];`;
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    });
});

// ARRAYS

describe('insert_array_element', () => {
    it('inserts elements in the middle of an array', () => {
        const old_code = "const arr = [1, 2, 3];";
        const new_code = CM.insert_array_element(old_code, 'arr', 1, "null");
        const expected_code = "const arr = [1, null, 2, 3];";
        expect(new_code).toBe(expected_code);
    })
    it('inserts into an array even if the array is empty', () => {
        const old_code = "const arr = [];";
        const new_code = CM.insert_array_element(old_code, 'arr', 0, "null");
        const expected_code = "const arr = [null];";
        expect(new_code).toBe(expected_code);
    })
    it('inserts the supplied text', () => {
        const old_code = "const arr = [];";
        const new_code = CM.insert_array_element(old_code, 'arr', 0, "1 + 2");
        const expected_code = "const arr = [1 + 2];";
        expect(new_code).toBe(expected_code);
    })
});

describe('append_array_element', () => {
    it('appends an element to a non-empty array', () => {
        const old_code = "const arr = [1, 2, 3];";
        const new_code = CM.append_array_element(old_code, 'arr', '4');
        const expected_code = "const arr = [1, 2, 3, 4];";
        expect(new_code).toBe(expected_code);
    })
    it('appends an element to an empty array', () => {
        const old_code = "const arr = [];";
        const new_code = CM.append_array_element(old_code, 'arr', '\'hello!\'');
        const expected_code = "const arr = ['hello!'];";
        expect(new_code).toBe(expected_code);
    })
});

describe('remove_array_element', () => {
    it('removes elements in the middle of an array', () => {
        const old_code = "const arr = [1, 2, 3];";
        const new_code = CM.remove_array_element(old_code, 'arr', 1);
        const expected_code = "const arr = [1, 3];";
        expect(new_code).toBe(expected_code);
    })
    it('keeps the array if the array is now empty', () => {
        const old_code = "const arr = [1];";
        const new_code = CM.remove_array_element(old_code, 'arr', 0);
        const expected_code = "const arr = [];";
        expect(new_code).toBe(expected_code);
    })
});

// OBJECTS

describe('insert_object_item', () => {
    it('inserts the supplied text when object is empty', () => {
        const old_code = "const obj = {};";
        let new_code = CM.insert_object_item(old_code, 'obj', 'a_key', 123);
        let expected_code = "const obj = {a_key: 123};";
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    })
    it('inserts the supplied text when object is not empty', () => {
        const old_code = "const obj = {existing_prop: 456};";
        let new_code = CM.insert_object_item(old_code, 'obj', 'a_key', 123);
        let expected_code = "const obj = {existing_prop: 456, a_key: 123};";
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    })
});

describe('remove_object_item', () => {
    it('removes the item with the supplied key', () => {
        const old_code = "const obj = {a_key: 123, second_key: 456, third_key: 789};";
        let new_code = CM.remove_object_item(old_code, 'obj', 'second_key');
        let expected_code = "const obj = {a_key: 123, third_key: 789};";
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    })
    it('works regardless of whether quotes are used', () => {
        const old_code = "const obj = {'a_key': 123, 'second_key': 456, 'third_key': 789};";
        let new_code = CM.remove_object_item(old_code, 'obj', 'second_key');
        let expected_code = "const obj = {'a_key': 123, 'third_key': 789};";
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    })
});

// RECORDS

/*
describe('append_record', () => {
    it('adds a new record to the end of the records with the relevant field filled in and the rest left null', () => {
        const old_code = "const records = [{key_field: 'lol', another_field: 'huh'}];";
        let new_code = CM.append_record(old_code, 'records', 'another_field', 'filled_in');
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
        let new_code = CM.remove_record_given_key(old_code, 'records', 'key_field', 'lol');
        const expected_code = "const records = [];";
        expect(new_code).toBe(expected_code);
    });
    it('still works with string literals as keys', () => {
        const old_code = "const records = [{'key_field': 'lol', 'another_field': 'huh'}];";
        let new_code = CM.remove_record_given_key(old_code, 'records', 'key_field', 'lol');
        const expected_code = "const records = [];";
        expect(new_code).toBe(expected_code);
    });
});

// RECORDS - OBJECT OF ARRAYS

describe('OOA_append_datum', () => {
    it('appends datum to the bottom of the right field and fills the rest with null', () => {
        const old_code = "const OOA = {field1: ['value'], 'field2': [123]};"
        let new_code = CM.OOA_append_datum(old_code, 'OOA', 'field1', 'new_datum');
        let expected_code = `const OOA = {
            field1: ['value', new_datum],
            'field2': [123, null],
        }`
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    });
});

describe('OOA_remove_record', () => {
    it('removes the specified record', () => {
        const old_code = `const ooa = {
            field1: ['value', 'value2', 'value3'], 
            'field2': ['he', 'hehe', 'hehehe']
        };`
        let new_code = CM.OOA_remove_record(old_code, 'ooa', 1);
        let expected_code = `const ooa = {
            field1: ['value', 'value3'], 
            'field2': ['he', 'hehehe']
        };`
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    });
});

describe('OOA_add_field', () => {
    it('adds the specified field', () => {
        const old_code = `const ooa = {
            field1: ['value', 'value2', 'value3'], 
        };`
        // TODO does this need to distinguish between the two types of key?
        let new_code = CM.OOA_add_field(old_code, 'ooa', 'field2');
        let expected_code = `const ooa = {
            field1: ['value', 'value2', 'value3'], 
            field2: [null, null, null],
        };`
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    });
});

describe('OOA_remove_field', () => {
    it('removes the specified field', () => {
        const old_code = `const ooa = {
            field1: ['value', 'value2', 'value3'], 
            'field2': ['he', 'hehe', 'hehehe']
        };`
        // TODO does this need to distinguish between the two types of key?
        let new_code = CM.OOA_remove_field(old_code, 'ooa', 'field1');
        let expected_code = `const ooa = {
            'field2': ['he', 'hehe', 'hehehe']
        };`
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    });
    it('leaves an empty object if the field was the last one', () => {
        const old_code = `const ooa = {
            field1: ['value', 'value2', 'value3'], 
        };`
        // TODO does this need to distinguish between the two types of key?
        let new_code = CM.OOA_remove_field(old_code, 'ooa', 'field1');
        let expected_code = `const ooa = {
        };`
        const options = {tabWidth: 0};
        new_code = Recast.prettyPrint(Recast.parse(new_code), options).code;
        expected_code = Recast.prettyPrint(Recast.parse(expected_code), options).code;
        expect(new_code).toBe(expected_code);
    });
});
// TODO delete object
