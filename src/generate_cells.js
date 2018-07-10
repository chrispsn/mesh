const triage = require('./display_fn_triage').triage;
const CT = require('./code_transformers');
const DisplayFns = require('./display').display_fns;

// TODO move this back to reducers?
module.exports = function(RESULTS, cellsNodePath) {
    const cells = [];
    // TODO implement f, s, n
    for (let id in RESULTS) {

        const cell = RESULTS[id];
        const location = cell.l;
//      {v, l:loc, f:formatted_value, s:transpose, t:isTable, n:showID}] of Object.entries(RESULTS)) {

        // TODO add work of defining this back into display.js?
        // Would seem to fit better there, even if the fn signature is different
        const showID = cell.n;
        if (showID !== false) {
            cells.push({
                location: cell.l,
                repr: id,
                ref_string: id,
                formula_bar_value: id,
                classes: 'occupied identifier',
                cell_AST_changes_type: 'KEY',
                AST_props: {key: id},
            });
        }

        let value_nodepath = CT.getCellNodePath(cellsNodePath, id).value;
        if (Boolean(cell.t)) {value_nodepath = CT.FunctionCall_GetArgument(value_nodepath, 0)};
        const display_fn = DisplayFns[triage(value_nodepath.node.type, cell.v, Boolean(cell.t))];

        // Not sure on exactly which parameters are best here, and which order makes most sense.
        // 1. Value is needed because the AST doesn't know what (eg) a fn call evaluates to.
        // 2. Value nodepath is needed to work out what to display in the formula bar.
        // 3. ID is needed so the cells' fns can access their module item to work on it;
        // could be recoverable from value_nodepath.parent, but feels more efficient to pass now.
        
        const value_cells = display_fn(cell.v, cell.f, value_nodepath, id);
        // Value cells come through with locations as offsets to the name cell.
        // Consider moving the offset back into the display fns as a parameter if this is slow.
        value_cells.forEach(function(cell) {
            // TODO adjust display logic so doesn't assume it needs to leave a space for the name
            cell.location = [cell.location[0] + location[0], cell.location[1] + location[1]];
            cells.push(cell);
        });
        
    }
    return cells;
}