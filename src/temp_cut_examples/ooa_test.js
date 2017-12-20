'use strict';

const fruits = {'a key': [1, 2], he: ['hehe', 'ahaha']};

if (typeof Mesh !== 'undefined') {
    const display_fns = require('./display.js').display_fns;
    const MESH_ATTACHMENTS = [
        {id: 'fruits', value: fruits, loc: [0, 0], display_fn: display_fns.OOA},
    ];
    Mesh.attach(MESH_ATTACHMENTS);
}
