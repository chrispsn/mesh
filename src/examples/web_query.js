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

const {display_fns} = require('./display.js');

if (require.main === module && typeof Mesh !== 'undefined') {
  const MESH_ATTACHMENTS = [
    {id: "posts", value: filtered_posts, loc: [4, 0], display_fn: display_fns.records_ro},
    {id: "post_ID", value: post_ID, loc: [0, 0]},
    {id: "filter_on", value: filter_on, loc: [1, 0]},
    {id: "filter_fn", value: filter_fn, loc: [2, 0]},
  ];
  Mesh.attach(MESH_ATTACHMENTS);
}