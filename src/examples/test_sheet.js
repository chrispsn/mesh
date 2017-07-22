'use strict';

/* SINGLE VALUES */
const name = "World";
const template_lit = `Hello ${name}!`;
const number = 123;
const boolean_true = true;
const boolean_false = false;
const object_string = String("Hello world!");
const object_number = Number(123);
const object_boolean = Boolean(1);
const result = number + Math.random();
const empty_null = null;
const empty_undefined = undefined;
const regex = /beans/;
const str_to_test = 'bean';
const regex_result = regex.test(str_to_test);

/* ARRAYS */

const arr = [
  1, 
  'two', 
  true, 
  ['a', 'b'], 
  {k: 'v'}, 
  x => x ** 2, 
  null, 
  undefined,
];
const new_arr = arr.map(x => typeof x);

/* OBJECTS */

const obj = {
  a_key: 123,
  'another_one': Math.random(),
};
const new_obj = (() => {
  const output = {};
  for (let [k, v] of Object.entries(obj)) {
    let new_k = String(v);
    output[new_k] = k;
  };
  return output;
})();

/* FUNCTIONS */

const arrow_fn = () => "cool beans";

/* MESH-SPECIFIC CODE */

// Put your Mesh.attach code in these brackets
// if you need it to run without Mesh
if (require.main === module && typeof Mesh !== 'undefined') {

    const next_row = (function () {
        let row_count = 0;
        return () => [row_count++, 0];
    })();

    const MESH_ATTACHMENTS = [
        {id: "name", value: name, loc: next_row()},
        {id: "template_lit", value: template_lit, loc: next_row()},
        {id: "number", value: number, loc: next_row()},
        {id: "boolean_true", value: boolean_true, loc: next_row()},
        {id: "boolean_false", value: boolean_false, loc: next_row()},
        {id: "object_string", value: object_string, loc: next_row()},
        {id: "object_number", value: object_number, loc: next_row()},
        {id: "object_boolean", value: object_boolean, loc: next_row()},
        {id: "result", value: result, loc: next_row()},
        {id: "empty_null", value: empty_null, loc: next_row()},
        {id: "empty_undefined", value: empty_undefined, loc: next_row()},
        {id: "regex", value: regex, loc: next_row()},
        {id: "str_to_test", value: str_to_test, loc: next_row()},
        {id: "regex_result", value: regex_result, loc: next_row()},

        {id: "arr", value: arr, loc: [0, 3]},
        {id: "new_arr", value: new_arr, loc: [0, 4]},

        {id: "obj", value: obj, loc: [0, 6]},
        {id: "new_obj", value: new_obj, loc: [3 + Object.keys(obj).length, 6]},
        
        {id: "arrow_fn", value: arrow_fn, loc: [0, 9]},
    ];
    Mesh.attach(MESH_ATTACHMENTS);

}