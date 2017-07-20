const React = require('react');

function StatusBar (props) {

    let displayed_filepath = props.loaded_filepath;
    if (displayed_filepath === null) {
        displayed_filepath = 'No file loaded';
    }

    const current_mode = React.createElement('dd', {}, props.mode);
    const separator = React.createElement('dd', {}, " | ");
    const current_file = React.createElement('dd', {}, displayed_filepath);
    return React.createElement('dl', {}, current_mode, separator, current_file);
}

module.exports = StatusBar;