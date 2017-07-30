const path = require('path');

module.exports = {
    entry: './mesh.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve('./dist_web')
    },
    devtool: 'source-map',
    node: {
        fs: 'empty'
    }
};
