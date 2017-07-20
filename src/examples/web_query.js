'use strict';

// Example: Online API (JSON)

const data_URL = "https://jsonplaceholder.typicode.com/posts";

function download_data(data_URL) {
    const request = new XMLHttpRequest();
    request.open("GET", data_URL, false);
    request.send();
    const raw_response = request.responseText;
    return JSON.parse(raw_response);
};

const posts = download_data(data_URL);

const post_ID = 1;
const filter_on = true;
const filter_fn = (p) => !filter_on || p.id === post_ID;
const filtered_posts = posts.filter(filter_fn);

const display_fns = require('./display.js').display_fns;

if (require.main === module && typeof Mesh !== 'undefined') {
    Mesh.attach("posts", filtered_posts, [4, 0], display_fns.records);
  	Mesh.attach("post_ID", post_ID, [0, 0]);
    Mesh.attach("filter_on", filter_on, [1, 0]);
    Mesh.attach("filter_fn", filter_fn, [2, 0]);
}