const {rewrite_input} = require('../data_entry');

describe('rewrite_input', () => {

    it('leaves strings prefixed with = alone', () => {
        const input_string = '=some_text';
        const expected_output = 'some_text';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('turns strings of characters into literal strings', () => {
        const input_string = 'some_text';
        const expected_output = '"some_text"';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('turns a dd/mm/yy date into a date expression', () => {
        const input_string = '01/02/34';
        const expected_output = 'new Date(2034, 1, 1)';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('turns a dd/mm/yyyy date into a date expression', () => {
        const input_string = '01/02/2034';
        const expected_output = 'new Date(2034, 1, 1)';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('turns a yyyy-mm-dd date into a date expression', () => {
        const input_string = '2034-2-1';
        const expected_output = 'new Date(2034, 1, 1)';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('allows input of arrays', () => {
        const input_string = '[1, 2]';
        const expected_output = '[1, 2]';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('allows input of objects', () => {
        const input_string = '{key: "value"}';
        const expected_output = '({key: "value"})';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('strips leading zeroes from date numbers', () => {
        const input_string = '2034-02-01';
        const expected_output = 'new Date(2034, 1, 1)';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('correctly interprets negative numbers', () => {
        const input_string = '-123';
        const expected_output = '-123';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('correctly handles percentages without decimals', () => {
        const input_string = '5%';
        const expected_output = '0.05';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('correctly handles percentages with decimals', () => {
        const input_string = '-5.21%';
        const expected_output = '-0.0521';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    });

    it('correctly handles strings that contain numbers', () => {
        const input_string = "IE11";
        const expected_output = '"IE11"';
        const actual_output = rewrite_input(input_string);
        expect(actual_output).toBe(expected_output);
    })

    // TODO keep Dates as dates
});
