const path = require('path');

module.exports = {
    entry: './mesh.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve('./dist_electron')
    },
    devtool: 'source-map',
    target: 'electron'
};
