const React = require('react');
const ReactDOM = require('react-dom');

class StatusBar {

    constructor(DOM_element, store) {
        this.DOM_element = DOM_element;
    }
    
    render(state) {
        let displayed_filepath = state.loaded_filepath;
        if (displayed_filepath === null) {
            displayed_filepath = 'No file loaded';
        }

        const current_mode = React.createElement('dd', {}, state.mode);
        const separator = React.createElement('dd', {}, " | ");
        const current_file = React.createElement('dd', {}, displayed_filepath);
        const info = React.createElement('dl', {}, current_mode, separator, current_file);
        ReactDOM.render(info, this.DOM_element);
    }
   
};

module.exports = StatusBar;
