'use strict';

const React = require('react');
const c = React.createElement;

function StatusBar (props) {
    const current_mode = c('dd', {}, props.mode);
    const separator = c('dd', {}, " | ");
    const current_file = c('dd', {}, props.filepath || 'No file loaded');
    const mesh_link = c('a', { href: "http://mesh-spreadsheet.com", target: "_blank" }, "Mesh website");
    const github_link = c('a', { href: "https://github.com/chrispsn/mesh/", target: "_blank" }, "GitHub");
    const twitter_link = c('a', { href: "https://twitter.com/MeshSpreadsheet", target: "_blank" }, "Twitter");
    const change_theme = c('a', {id: "theme_changer", href: "#"}, "Change theme")
    const toggle_code_pane = c('a', {id: "code_pane_toggler", href: "#"}, "Toggle code pane")
    return c('dl', {}, 
        current_mode, separator, 
        current_file, separator,
        mesh_link, separator,
        github_link, separator,
        twitter_link, separator,
        change_theme, separator,
        toggle_code_pane
    );
}

module.exports = StatusBar;
