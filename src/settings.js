'use strict';

const LINE_SEPARATOR = require('os').EOL; // Was '\n' before

const BLANK_FILE = [
    // Maybe get rid of this line if always intended to be consumed as ES6 modules?
    "'use strict';", 
    "",
    "const DATA = [];",
    "",
    "// Transform data into a spreadsheet object",
    "const SHEET = {};",
    "for (let [k, _, v] of DATA) {",
    "    Object.defineProperty(SHEET, k, {",
    "        get: () => {delete SHEET[k]; return SHEET[k]=v(SHEET)},",
    "        configurable: true",
    "    })",
    "}",
    // Add ES6 export line?
].join(LINE_SEPARATOR);

module.exports = { LINE_SEPARATOR, BLANK_FILE }
