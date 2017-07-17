// TODO a lot of the NodePath methods in ast-types could be useful.
// For example, replace, or insertBefore, or insertAfter,
// or (these ones are under scope) .declares, or .lookup

'use strict';

// On the choice of parser:
// https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
// Alternative to Recast: https://github.com/facebook/pfff
const Recast = require('recast');

const {LINE_SEPARATOR} = require(__dirname + '/settings.js');
const RECAST_SETTINGS = { lineTerminator: LINE_SEPARATOR }

function get_lines(body_text) {
    // TODO figure out whether we need a better way than splitting on LINE_SEPARATOR
    return body_text.split(LINE_SEPARATOR);
}

function get_text(body_text, loc) {
    const start_line_no = loc.start.line;
    const end_line_no = loc.end.line;

    const start_char_idx = loc.start.column;
    const end_char_idx = loc.end.column;

    const code_lines = get_lines(body_text);
    const code_lines_subset = code_lines.slice(start_line_no - 1, end_line_no)
    const code_line = code_lines_subset.join(LINE_SEPARATOR)

    const slice_start_idx = start_char_idx;
    const slice_end_idx = code_line.length 
                            - (code_lines[end_line_no - 1].length - end_char_idx)

    const text = code_line.slice(slice_start_idx, slice_end_idx);
    return text;
}

function replace_text(body_string, loc, new_text) {
    const start_line_no = loc.start.line;
    const end_line_no = loc.end.line;

    const start_char_idx = loc.start.column;
    const end_char_idx = loc.end.column;

    const code_lines = get_lines(body_string);
    // Add back the line separators.
    // TODO is this valid if the last line actually ends in a LINE_SEPARATOR?
    // Maybe the last line would actually be the empty string in that case.
    for (let i = 0; i < code_lines.length - 1; i++) {
        code_lines[i] = code_lines[i] + LINE_SEPARATOR;
    }
        
    const code_lines_subset = code_lines.slice(start_line_no - 1, end_line_no)
    let code_line = code_lines_subset.join();
    const slice_start_idx = start_char_idx;
    const slice_end_idx = code_line.length 
                            - (code_lines[end_line_no - 1].length - end_char_idx)

    const new_code_string = code_lines.slice(0, start_line_no - 1).join('')
                            + code_line.slice(0, start_char_idx) 
                                + new_text 
                                + code_line.slice(slice_end_idx)
                            + code_lines.slice(end_line_no).join('');

    return new_code_string;
}

function append_to_array(body_string, array_end_loc, array_length, new_element_string) {
    const replace_loc = {
        start: {line: array_end_loc.line, column: array_end_loc.column - 1},
        end: array_end_loc
    }
    const start_string = (array_length === 0) ? '' : ', ';
    const replacement_string = start_string + new_element_string + ']';
    return replace_text(body_string, replace_loc, replacement_string);
}

class AST {
    
    constructor(code_string) {
        this.tree = Recast.parse(code_string, RECAST_SETTINGS);
        this.program = this.tree.program;
        this.code_string = code_string;
    }

    get to_string() {
        return Recast.print(this.tree, RECAST_SETTINGS).code;
    }

    replace_text(loc, new_text) {
        const new_code_string = replace_text(this.code_string, loc, new_text);
        return new AST(new_code_string);
    }

    create_const_variable(variable_name) {
        // TODO validate variable_name?
        // TODO be more smart about where this is created
        //      eg what if multiple things on the same const line?
        let new_code = `const ${variable_name} = null;`
        const old_code = this.code_string;
        if (old_code !== '') { 
            new_code = old_code + LINE_SEPARATOR + new_code
        }
        return new AST(new_code);
    }

    add_attachment(variable_name, location) {
        // TODO be more smart about where this is created
        const old_code = this.code_string;
        const new_code = old_code + LINE_SEPARATOR + 
            `Mesh.attach("${variable_name}", ${variable_name}, [${location}]);`
        return new AST(new_code);
    }

    get_first_declaration_of_name(name_string) {
        // TODO this is for top-level only - how to address?
        // TODO consider alt approach:
        // const types = Recast.types
        // function get_variable_declaration_node(AST, name) {
        //     let desired_node = null;
        //     types.visit(AST, {visitVariableDeclarator: function(path) {
        //         let node = path.node;
        //         if (node.hasOwnProperty('id') 
        //             && node.id.hasOwnProperty('name') 
        //             && node.id.name === name
        //         ) { desired_node = node; return node }
        //         this.traverse(path);
        //     }})
        //     return desired_node;
        // }
        const declaration_nodes = this.program.body.filter(
                                    node => node.type === 'VariableDeclaration')
        for (let node of declaration_nodes) {
            for (let declaration of node.declarations) {
                if (declaration.id.name === name_string) {
                    return declaration;
                }
            }
        }

        return null;
    }
    
}

module.exports = {
    get_text: get_text,
    replace_text: replace_text,
    append_to_array, append_to_array,
    AST: AST
}
