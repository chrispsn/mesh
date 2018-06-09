'use strict';

const LINE_SEPARATOR = require('os').EOL; // Was '\n' before

const BLANK_FILE = [
    // Maybe get rid of this line if always intended to be consumed as ES6 modules?
    "/* Mesh boilerplate - do not change. 2018-06-09-1 */",
    "'use strict';", 
    "",
    "var _defProp = Object.defineProperty;",
    "function _defCell(k, c) {",
    "    return _defProp(self, k, {",
    "        configurable: true, get() {",
    "            if (k in _RESULTS) return _RESULTS[k].v;",
    "            var v = c.v;",
    "            if (typeof v === 'function') v = v();",
    // TODO maybe do a loop for each prop to check whether fn, and if so, assign call of that instead
    // TODO can we delay non-value calcs until later?
    "            if (Table.isPrototypeOf(v)) v = tabulate(v);",
    "             _RESULTS[k] = {v: v, l: c.l, f: c.f};",
    "            return v;",
    "    }})",
    "};",
    "function _calculate() {for (let k of Object.keys(_CELLS)) self[k]}", 
    // TODO what about resolving table cells?
    "var _RESULTS = {}, Table = {};",
    "function tabulate(spec) {",
    "    var t = [], entries = []; ",
    "    var setupColumnInfo = function(h) {",
    "        if (h !== 'length') { // && h !== 'keyHeading'",
    "            entries.push([h, spec[h].values, spec[h].default])",
                // TODO do we really need this? What if we want to filter first *then* get col?
                // _defProp(t, h, {get: function() {return this.map(function(r) {return r[h]})}});
    "        }",
    "    };",
    "    Object.keys(spec).forEach(setupColumnInfo);",
    "    if (spec.length !== undefined) {",
    "       t.length = spec.length",
    "    } else entries.forEach(function(e) {var l = e[1].length; if (l > t.length) t.length = l});",
    "    for (var i = 0, length = t.length, row; i < length; i++) {",
    "        t[i] = row = {};",
    "        entries.forEach(function(pair) {",
    "            var h = pair[0], c = pair[1][i], j = i;",
    "            if (c === undefined) c = pair[2];",
    "            _defProp(row, h, {configurable: true, get: function() {",
    "                delete this[h];",
    "                return this[h] = (typeof c === 'function') ? c.call(t, j) : c;",
    "            }});",
    "        })",
    "    };",
    "    return t;",
    "};",
    "",
    "self.onmessage = function(e) {",
    "    for (let k of Object.keys(_CELLS)) _defCell(k, _CELLS[k]);",
    // "    if (e.data.action === 'full') {",
    // "        var V = e.data.values;", // get rid of Object.entries for IE11 compat
    // "        for (var k in Object.keys(V)) _defCell(k, {v: V[k]});",
    "    _calculate();",
    // TODO something to strip out functions and other non-data from the results?
    "    postMessage(_RESULTS);",
    // "    }",
         // TODO invalidate calc tree for cells that were redefined
         // TODO reset changed variables at end?
    "};",
    "/* END Mesh boilerplate */",
    "",
    "var _CELLS = {};",
].join(LINE_SEPARATOR);

module.exports = { LINE_SEPARATOR, BLANK_FILE }
