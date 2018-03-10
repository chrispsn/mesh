const {triage} = require('./display_fn_triage');
const CT = require('./code_transformers');

// TODO move this back to reducers?
module.exports = function(DATA, SHEET, AST, ConsumedTablePrototype) {
    const cells = [];
    for (let [id, loc, _] of DATA) {
        const value = SHEET[id];
        let key_cell = {
            location: loc,
            repr: id,
            ref_string: id,
            formula_bar_value: id,
            classes: 'occupied identifier',
            cell_AST_changes_type: 'KEY',
        };

        const module_obj_path = CT.get_root_mesh_obj_node(AST);
        const data_array_nodepath = CT.AOA_get_record_given_key(module_obj_path, 0, id);
        const value_nodepath = CT.get_mesh_data_value_nodepath(data_array_nodepath);
        console.log(value_nodepath);

        // Not sure on exactly which parameters are best here, and which order makes most sense.
        // 1. Value is needed because the AST doesn't know what (eg) a fn call evaluates to.
        // 2. Value nodepath is needed to work out what to display in the formula bar.
        // 3. ID is needed so the cells' fns can access their module item to work on it;
        // technically recoverable from value_nodepath.parent, but feels more efficient to pass now.
        // As ID is not *required*, have listed last so it's easier to delete later if desired.
        const display_fn = triage(value_nodepath.node.type, value, ConsumedTablePrototype);
        const value_cells = display_fn(value, value_nodepath, id);
        
        // Value cells come through with locations as offsets to the name cell.
        // Consider moving back into the display fns as a parameter if this step is slow.
        for (let cell of value_cells) {
            cell.location = [cell.location[0] + loc[0], cell.location[1] + loc[1]];
        }

        // Also needs to take into account the selected cell
        // (and preserving the existing value after recalc if possible)
        cells.push(key_cell, ...value_cells);
    }

    return cells;
}
