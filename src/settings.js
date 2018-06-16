'use strict';

const LINE_SEPARATOR = require('os').EOL; // Was '\n' before

const BLANK_FILE = [
    "/* Mesh boilerplate - do not change. 2018-06-16-1 */",
    "'use strict';", // TODO remove line if always intended to be consumed as ES6 module?
    "",
    "var _defProp = Object.defineProperty, _OUTPUT = {};",
    "function _isFn(value) {return typeof value === 'function'};",
    "function _defCell(k, c) {",
    "    return _defProp(self, k, {configurable: true, get() {",
    "        if (k in _OUTPUT) return _OUTPUT[k].v;",
    "        var o = _OUTPUT[k] = {};",
    "        var t = o.t = c.t; o.s = c.s; o.n = c.n;",
    "        var v = c.v; v = _isFn(v)? (t? _makeTable(v()) : v()) : v;",
    "        var f = c.f; o.f = (f) ? c.f(v) : String(v);",
    "        var l = c.l; o.l = _isFn(l) ? l() : l;",
    // TODO can we delay non-value calcs (formats, etc) until later?
    "        o.v = v; return v;",
    "    }})",
    "};",
    "function _makeTable(s) {",
    "    var t = [], cols = [], MAX = Math.max;",
    "    for (var h in s) {",
    "        if (h != 'length') cols.push([h,s[h].values,s[h].default])", // && h !== 'keyHeading'
                // TODO do we really need this? What if we want to filter first *then* get col?
                // indicates operating on columns is not the way to go...
                // _defProp(t, h, {get: function() {return this.map(function(r) {return r[h]})}});
    "    };",
    "    t.length = (s.length === undefined)",
    "        ? cols.reduce(function(a,e){return MAX(a,e[1].length)},0)",
    "        : s.length;",
    "    for (var i = 0, length = t.length, r; i < length; i++) {",
    "        t[i] = r = {};",
    "        cols.forEach(function(col) {",
    "            var h = col[0], c = col[1][i], s = r, j = i;",
    "            if (c === undefined) c = col[2];",
    "            _defProp(r, h, {get: function() {",
    "                delete this[h];",
    "                return this[h] = (_isFn(c)) ? c.call(t, s, j) : c",
    "            }, enumerable: true, configurable: true});",
    "        })",
    "    };",
    "    return t;",
    "};",
    "function _calcTable(t){for(var i in t){var r=t[i];for(var h in r)r[h]}};",
    "",
    "self.onmessage = function(e) {",
    "    for (var k in _CELLS) _defCell(k, _CELLS[k]);",
    // "    if (e.data.action === 'full') {",
    // "        var V = e.data.values;",
    // "        for (var k in V) _CELLSdefCell(k, {v: V[k]});",
    // Ideally keep calcing first uncalced cell til empty
    "    for (var k in _CELLS) var v = self[k]; if (_CELLS[k].t) _calcTable(v);",
    // TODO something to strip out functions and other non-data from the results?
    // TODO pass through list of tables?
    "    postMessage(_OUTPUT);",
    // "    }",
         // TODO invalidate calc tree for cells that were redefined
         // TODO reset changed variables at end?
    "};",
    "", 
    "// Cell props: v = value or formula (fn), l = grid coordinates,",
    "// f = format fn, s = transpose?, t = is table?, n = show name?",
    "/* END Mesh boilerplate */",
    "",
    "var _CELLS = {};",
].join(LINE_SEPARATOR);

module.exports = { LINE_SEPARATOR, BLANK_FILE }
