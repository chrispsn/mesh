'use strict';

const EMPTY_CELL = require('./display').EMPTY_CELL;
const assign = require('./settings').assign;

function get_cell(cells, cell_location) {
    const cell_id = JSON.stringify(cell_location);
    if (cell_id in cells) {
        return cells[cell_id];
    } else {
        return assign({}, EMPTY_CELL, {location: cell_location});
    }
}

function get_selected_cell(state) {
    return get_cell(state.cells, state.selected_cell_loc);
}

module.exports = {
    get_cell: get_cell,
    get_selected_cell: get_selected_cell
}
