'use strict';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace

const rewrite_rules = [
    
    // Formulas (escape code for raw input)
    // TODO also consider whether +, etc should be here
    { pattern: /^=/, rewrite: "" },

    // Dates
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
    { pattern: /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})/,
        rewrite: function(match, day, month, year, offset, string) {
            return "new Date(" + [
                year, 
                parseInt(month-1, 10).toString(), 
                parseInt(day, 10).toString(),
            ].join(", ") + ")";
        } },
    { pattern: /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2})/,
        rewrite: function(match, day, month, year, offset, string) {
            return "new Date(" + [
                "20" + year, 
                parseInt(month-1, 10).toString(), 
                parseInt(day, 10).toString(),
            ].join(", ") + ")";
        } },
    { pattern: /^([0-9]{4})\-([0-1]?[0-9])\-([0-2]?[0-9])/,
        rewrite: function(match, year, month, day, offset, string) {
            return "new Date(" + [
                year, 
                parseInt(month-1, 10).toString(), 
                parseInt(day, 10).toString()
            ].join(", ") + ")";
        } },

    // Arrays
    // TODO replace with a catch-all?
    // TODO make allow newlines
    { pattern: /^\[.*\]$/, rewrite: "$&" },

    // Objects
    // TODO replace with a catch-all?
    // TODO make allow newlines
    // Note the brackets around the object
    { pattern: /^\{.*\}$/, rewrite: "($&)" },

    // Booleans
    // TODO make case-insensitive
    { pattern: /true/, rewrite: "$&" },
    { pattern: /false/, rewrite: "$&" },
    
    // Numbers
    { pattern: /-?[0-9]+\.?[0-9]+/, rewrite: "$&" },

    // Strings
    { pattern: /^[\D]+/, rewrite: "`$&`" },
]

function rewrite_input(input_string) {
    for (let rule of rewrite_rules) {
        if (rule.pattern.test(input_string)) {
            return input_string.replace(rule.pattern, rule.rewrite);
        }
    }
    return input_string;
}

module.exports = { rewrite_input };
