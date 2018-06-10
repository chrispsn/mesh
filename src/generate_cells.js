const {triage} = require('./display_fn_triage');
const CT = require('./code_transformers');

// TODO move this back to reducers?
module.exports = function(RESULTS, cellsNodePath, TablePrototype) {
    const cells = [];
    const cellNodePaths = CT.getCellNodePaths(cellsNodePath);
    // TODO implement f, s, t, n
    for (let [id, {v:value, l:loc, f, s:transpose, t: isTable, n:showID}] of Object.entries(RESULTS)) {

        // TODO add work of defining this back into display.js?
        // Would seem to fit better there, even if the fn signature is different
        if (showID !== false) {
            cells.push({
                location: loc,
                repr: id,
                ref_string: id,
                formula_bar_value: id,
                classes: 'occupied identifier',
                cell_AST_changes_type: 'KEY',
                AST_props: {key: id},
            });
        }

        const value_nodepath = cellNodePaths[id].value;
        const display_fn = triage(value_nodepath.node.type, value, TablePrototype);

        // Not sure on exactly which parameters are best here, and which order makes most sense.
        // 1. Value is needed because the AST doesn't know what (eg) a fn call evaluates to.
        // 2. Value nodepath is needed to work out what to display in the formula bar.
        // 3. ID is needed so the cells' fns can access their module item to work on it;
        // could be recoverable from value_nodepath.parent, but feels more efficient to pass now.
        
        const value_cells = display_fn(value, value_nodepath, id);
        // Value cells come through with locations as offsets to the name cell.
        // Consider moving the offset back into the display fns as a parameter if this is slow.
        for (let cell of value_cells) {
            // TODO adjust display logic so that doesn't assume it needs to leave a space for the name
            cell.location = [cell.location[0] + loc[0], cell.location[1] + loc[1]];
            cells.push(cell);
        }
        
    }
    return cells;
}
