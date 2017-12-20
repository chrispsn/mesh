'use strict';

const fruits = ['Apple', 'Banana', 'Pear'];

if (typeof Mesh !== 'undefined') {
    const MESH_ATTACHMENTS = [
        {id: 'fruits', value: fruits, loc: [0, 0]},
    ];
    Mesh.attach(MESH_ATTACHMENTS);
}
