'use strict';

// Put your Mesh.attach code in these brackets
// if you need it to run without Mesh
if (require.main === module && typeof Mesh !== 'undefined') {
    const MESH_ATTACHMENTS = [
    ];
    Mesh.attach(MESH_ATTACHMENTS);
}