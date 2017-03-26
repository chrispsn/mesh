'use strict';

// Example: Online API (JSON)

const data_URL = "https://jsonplaceholder.typicode.com/posts";

const Utils = require(__dirname + '/js/utils.js');
const posts = Utils.download_data(data_URL);

const filter_on = true;
const filter = (post) => !filter_on || post.userId === 1;
const filtered_posts = posts.filter(filter);

const DisplayFns = require(__dirname + '/js/display_functions.js');
sheet.attach("posts", filtered_posts, [0, 3], DisplayFns.write_records);
sheet.attach("filter", filter, [0,0]);
sheet.attach("filter_on", filter_on, [1,0]);
