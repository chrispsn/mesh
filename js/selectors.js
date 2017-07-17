const {EMPTY_CELL} = require(__dirname + '/cells.js');

function get_cell(cells, cell_location) {
    const cell_id = JSON.stringify(cell_location);
    if (cells.hasOwnProperty(cell_id)) {
        return cells[cell_id];
    } else {
        return Object.assign({}, EMPTY_CELL, {location: cell_location});
    }
}

function get_selected_cell(state) {
    return get_cell(state.cells, state.selected_cell_loc);
}

module.exports = {
    get_cell,
    get_selected_cell,
}
