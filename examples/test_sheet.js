'use strict';

// Primitive values
const string = "Hello world!";
const number = 123;
const boolean = true;

// Object values
const object_string = String("Hello world!");
const object_number = Number(123);
const object_boolean = Boolean(1);

// Call 
const unformatted_calc = number + Math.random() + 1;
const formatted_calc = (unformatted_calc).toFixed(2);

// Empty values
const empty_null = null;
const empty_undefined = undefined;

// Arrow function
const arrow_fn = () => "MEMES";

// Named functions

// TODO looks like this throws an error when I try to select the cell
// Probably because no '=' is involved
function named_fn_1 () {
  return "O";
}
const named_fn_2 = function () {
  return "HAI";
}

// Array of various types
const array = [ ['a', 'b'], {} ];

// Map
const map = new Map([
  	["first_name", "Chris"], 
  	["last_name", "Pearson"]
])

// Object
const object = {yo: "MAMA", so: "FAT"}

// Records (array of objects or maps)
// TODO auto-detect records?
const array_of_objects = [
  {name: "Chris", last_name: "Pearson"},
  {name: "Jade", last_name: "Derham"},
  {name: "Chris", last_name: "Derham"}
]

// Set
const set_iterator = new Set(array_of_objects.map(r => r.name))
// http://stackoverflow.com/a/28719692
const set_array = Array.from(set_iterator);
// alt: [...set_iterator];

// Regular expressions
const regex = /beans/;
const regex_examples = ['bean', 'beans'];
const regex_results = regex_examples.map(x => regex.test(x));

if (typeof Mesh !== 'undefined') {

    let lowest_x = 0;

    const primitives = [
        ["string", string],
        ["number", number],
        ["boolean", boolean]
    ]
    lowest_x = 1 + Mesh.bulk_attach(primitives, [lowest_x, 0]);
    
    const object_primitives = [
        ["object_string", object_string],
        ["object_number", object_number],
        ["object_boolean", object_boolean]
    ]
    lowest_x = 1 + Mesh.bulk_attach(object_primitives, [lowest_x, 0]);
    
    const calc_examples = [
        ["unformatted_calc", unformatted_calc],
        ["formatted_calc", formatted_calc],
    ]
    lowest_x = 1 + Mesh.bulk_attach(calc_examples, [lowest_x, 0]);
    
    const nope_values = [
        ["empty_null", empty_null],
        ["empty_undefined", empty_undefined]
    ]
    lowest_x = 1 + Mesh.bulk_attach(nope_values, [lowest_x, 0]);
    
    const functions = [
        ["arrow_fn", arrow_fn],
        ["named_fn_1", named_fn_1],
        ["named_fn_2", named_fn_2]
    ]
    lowest_x = 1 + Mesh.bulk_attach(functions, [lowest_x, 0]);
    
    let indices = [0, 3];
    let offset = 0;
    const key_value = [
        ["object", object],
        ["map", map],
        ["array_of_objects", array_of_objects]
    ];
    let length;
    for (let data of key_value) {
        Mesh.attach(data[0], data[1], [indices[0] + offset, indices[1]]);   
        
        if (data[1].size) {
        length = data[1].size;
        } else {
        length = Object.keys(data[1]).length;
        }
        // One extra for each of the name and the gap
        offset = offset + length + 2;
    }
    
    indices = [0, 6];
    const arrays = [
        ["array", array],
        ["set_array", set_array]
    ]
    offset = 0;
    for (let data of arrays) {
        Mesh.attach(data[0], data[1], [indices[0] + offset, indices[1]]);
        offset = offset + data[1].length + 2;
    }

    Mesh.attach("regex", regex, [0,8]);
    Mesh.attach("regex_examples", regex_examples, [2,8]);
    Mesh.attach("regex_results", regex_results, [2, 9]);
}