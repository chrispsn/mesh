'use strict';

const React = require('react');

function StatusBar (props) {

    let displayed_filepath = props.filepath;
    if (displayed_filepath === null) {
        displayed_filepath = 'No file loaded';
    }

    const current_mode = React.createElement('dd', {}, props.mode);
    const separator = React.createElement('dd', {}, " | ");
    const current_file = React.createElement('dd', {}, displayed_filepath);
    const mesh_link = React.createElement('a', {
        href: "http://mesh-ide.com", target: '_blank',
    }, "Mesh website");
    const twitter_link_desc = React.createElement('dd', {}, "Updates: ");
    const twitter_link = React.createElement('a', {
        href: "https://twitter.com/mesh_ide", target: '_blank',
    }, "@mesh_ide");
    const change_theme = React.createElement('a', {id: "theme_changer", href: "#"}, "Change theme")
    return React.createElement('dl', {}, 
        current_mode, 
        separator, 
        current_file,
        separator,
        mesh_link,
        separator,
        twitter_link_desc,
        twitter_link,
        separator,
        change_theme,
    );
}

module.exports = StatusBar;
