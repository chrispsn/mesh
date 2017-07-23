'use strict';

const fruits = ['Apple', 'Banana', 'Pear'];

if (require.main === module && typeof Mesh !== 'undefined') {
    Mesh.attach('fruits', fruits, [0, 0]);
}
