const {rewrite_input} = require('../data_entry');

describe('rewrite_input', () => {

    it('leaves strings prefixed with = alone', () => {
        const input_string = '=some_text';
        const expected_output = 'some_text';
        const actual_output = rewrite_input(input_string);
        expect(expected_output).toBe(actual_output);
    });

    it('turns strings of characters into template strings', () => {
        const input_string = 'some_text';
        const expected_output = '`some_text`';
        const actual_output = rewrite_input(input_string);
        expect(expected_output).toBe(actual_output);
    });

    it('turns a dd/mm/yy date into a date expression', () => {
        const input_string = '01/02/34';
        const expected_output = 'new Date(2034, 1, 1)';
        const actual_output = rewrite_input(input_string);
        expect(expected_output).toBe(actual_output);
    });

    it('turns a dd/mm/yyyy date into a date expression', () => {
        const input_string = '01/02/2034';
        const expected_output = 'new Date(2034, 1, 1)';
        const actual_output = rewrite_input(input_string);
        expect(expected_output).toBe(actual_output);
    });

    it('turns a yyyy-mm-dd date into a date expression', () => {
        const input_string = '2034-2-1';
        const expected_output = 'new Date(2034, 1, 1)';
        const actual_output = rewrite_input(input_string);
        expect(expected_output).toBe(actual_output);
    });

    it('allows input of arrays', () => {
        const input_string = '[1, 2]';
        const expected_output = '[1, 2]';
        const actual_output = rewrite_input(input_string);
        expect(expected_output).toBe(actual_output);
    });

    it('allows input of objects', () => {
        const input_string = '{key: "value"}';
        const expected_output = '{key: "value"}';
        const actual_output = rewrite_input(input_string);
        expect(expected_output).toBe(actual_output);
    });

    it('strips leading zeroes from date numbers', () => {
        const input_string = '2034-02-01';
        const expected_output = 'new Date(2034, 1, 1)';
        const actual_output = rewrite_input(input_string);
        expect(expected_output).toBe(actual_output);
    });

    // TODO keep Dates as dates
});
