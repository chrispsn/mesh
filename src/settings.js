'use strict';

const LINE_SEPARATOR = require('os').EOL; // Was '\n' before

// OBJECT.ASSIGN. Minified version of polyfill from here:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
"function"!=typeof Object.assign&&Object.defineProperty(Object,"assign",{value:function(e,t){"use strict";if(null==e)throw new TypeError("Cannot convert undefined or null to object");for(var n=Object(e),r=1;r<arguments.length;r++){var o=arguments[r];if(null!=o)for(var c in o)Object.prototype.hasOwnProperty.call(o,c)&&(n[c]=o[c])}return n},writable:!0,configurable:!0});

// ARRAY.FROM. Minified version of polyfill from here:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
Array.from||(Array.from=function(){var r=Object.prototype.toString,t=function(t){return"function"==typeof t||"[object Function]"===r.call(t)},n=Math.pow(2,53)-1,e=function(r){var t,e=(t=Number(r),isNaN(t)?0:0!==t&&isFinite(t)?(t>0?1:-1)*Math.floor(Math.abs(t)):t);return Math.min(Math.max(e,0),n)};return function(r){var n=Object(r);if(null==r)throw new TypeError("Array.from requires an array-like object - not null or undefined");var o,a=arguments.length>1?arguments[1]:void 0;if(void 0!==a){if(!t(a))throw new TypeError("Array.from: when provided, the second argument must be a function");arguments.length>2&&(o=arguments[2])}for(var i,u=e(n.length),f=t(this)?Object(new this(u)):new Array(u),c=0;c<u;)i=n[c],f[c]=a?void 0===o?a(i,c):a.call(o,i,c):i,c+=1;return f.length=u,f}}());

const BLANK_FILE = [
    "const _CELLS = {};",
    "",
    "/* Mesh boilerplate - do not change. 2018-06-16-1 */",
    "// Cell props: v = value or formula (fn), l = grid coordinates,",
    "// f = format fn, s = transpose?, t = is table?, n = show name?",
    "'use strict';", // TODO remove line if always intended to be consumed as ES6 module?
    "",
    "const _defProp = Object.defineProperty, _OUTPUT = {};",
    "function _isFn(value) {return typeof value === 'function'};",
    "function _defCell(k, c) {",
    "    return _defProp(self, k, {get: function() {",
    "        if (k in _OUTPUT) return _OUTPUT[k].v;",
    "        const o = _OUTPUT[k] = {};",
    "        const t = o.t = c.t; o.s = c.s; o.n = c.n;",
    "        let v = c.v; v = _isFn(v) ? v() : v; o.v = v;",
    "        const f = c.f; if (f) o.f = c.f(v);",
    "        const l = c.l; o.l = _isFn(l) ? l() : l;",
    // TODO can we delay non-value calcs (formats, etc) until later?
    "        return v;",
    "    }, configurable: true})",
    "};",
    "function _makeTable(s) {",
    "    const table = [], cols = [], MAX = Math.max;",
    "    for (let h in s) {",
    "        if (h !== 'length') cols.push([h,s[h].values,s[h].default])", // && h !== 'keyHeading'
                // TODO do we really need this? What if we want to filter first *then* get col?
                // indicates operating on columns is not the way to go...
                // _defProp(t, h, {get: function() {return this.map(function(r) {return r[h]})}});
    "    };",
    "    table.length = (s.length === undefined)",
    "        ? cols.reduce(function(a,e){return MAX(a,e[1].length)},0)",
    "        : s.length;",
    "    for (let i = 0, length = table.length, row; i < length; i++) {",
    "        table[i] = row = {};",
    "        cols.forEach(function(col) {",
    "            let h = col[0], c = col[1][i];",
    "            if (c === undefined) c = col[2];",
    "            _defProp(row, h, {get: function() {",
    "                delete this[h];",
    "                return this[h] = _isFn(c) ? c.call(table, row, i) : c",
    "            }, enumerable: true, configurable: true});",
    "        })",
    "    };",
    "    return table;",
    "};",
    "function _defCells(c) {for (let k in c) _defCell(k, c[k])};",
    "function _calcSheet(c){for (let k in c) {let v = self[k]; if (c[k].t) _calcTable(v)}}",
    "function _calcTable(t){for (let i in t){let r=t[i];for(let h in r)r[h]}};",
    "",
    "self.onmessage = function(e) {",
    "    _defCells(_CELLS); _calcSheet(_CELLS); postMessage(_OUTPUT)", // close();?
    // "    if (e.data.action === 'full') {",
    // "        var V = e.data.values;",
    // "        for (var k in V) _CELLSdefCell(k, {v: V[k]});",
    // Ideally keep calcing first uncalced cell til empty
    // TODO something to strip out functions and other non-data from the results?
    // TODO pass through list of tables?
    // "    }",
         // TODO invalidate calc tree for cells that were redefined
         // TODO reset changed variables at end?
    "};",
    "/* END Mesh boilerplate */",
].join(LINE_SEPARATOR);

module.exports = {
    LINE_SEPARATOR: LINE_SEPARATOR,
    BLANK_FILE: BLANK_FILE,
    assign: Object.assign,
    createArray: Array.from,
}