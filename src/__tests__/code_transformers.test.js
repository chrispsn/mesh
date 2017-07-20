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

// TODO delete object

// AST METHODS (consider refactoring eventually)

describe('create_const_variable', () => {
    it('works when a "use strict" statement is present', () => {
        const old_code = "'use strict';" + LINE_SEPARATOR + "const DUMMY = null;"
        const old_AST = new CM.AST(old_code);
        const new_AST = old_AST.create_const_variable('new_one');
        const new_code = new_AST.to_string;
        const expected_code = new CM.AST(old_code + LINE_SEPARATOR + 'const new_one = null;').to_string;
        expect(new_code).toBe(expected_code);
    });
});