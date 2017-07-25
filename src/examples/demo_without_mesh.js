'use strict';

const fruits = ['Apple', 'Banana', 'Pear'];

if (require.main === module && typeof Mesh !== 'undefined') {
    const MESH_ATTACHMENTS = [
        {id: 'fruits', value: fruits, loc: [0, 0]},
    ];
    Mesh.attach(MESH_ATTACHMENTS);
}
