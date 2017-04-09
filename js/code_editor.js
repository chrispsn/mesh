const CodeMirror = require('codemirror/lib/codemirror');
require('codemirror/addon/selection/active-line.js');
require('codemirror/mode/javascript/javascript');

const {LINE_SEPARATOR} = require(__dirname + "/settings.js");

module.exports = CodeMirror(document.getElementById("code_editor"), {
    value: '',
    mode: "javascript",
    theme: "neo",
    styleActiveLine: true,
    lineWrapping: true,
    lineNumbers: true,
    lineSeparator: LINE_SEPARATOR
});