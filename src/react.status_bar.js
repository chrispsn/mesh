'use strict';

const React = require('react');

function StatusBar (props) {

    const current_mode = React.createElement('dd', {}, props.mode);
    const separator = React.createElement('dd', {}, " | ");
    const current_file = React.createElement('dd', {}, props.filepath || 'No file loaded');
    const mesh_link = React.createElement('a', { href: "http://mesh-spreadsheet.com", target: "_blank" }, "Mesh website");
    const github_link = React.createElement('a', { href: "https://github.com/chrispsn/mesh/", target: "_blank" }, "GitHub");
    const twitter_link = React.createElement('a', { href: "https://twitter.com/MeshSpreadsheet", target: "_blank" }, "Twitter");
    const change_theme = React.createElement('a', {id: "theme_changer", href: "#"}, "Change theme")
    const toggle_code_pane = React.createElement('a', {id: "code_pane_toggler", href: "#"}, "Toggle code pane")
    return React.createElement('dl', {}, 
        current_mode, 
        separator, 
        current_file,
        separator,
        mesh_link,
        separator,
        github_link,
        separator,
        twitter_link,
        separator,
        change_theme,
        separator,
        toggle_code_pane,
    );
}

module.exports = StatusBar;
