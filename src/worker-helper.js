// https://stackoverflow.com/a/10372280/996380

self.onmessage = function(e) {
    self.onmessage = null; // Clean-up
    eval(e.data);
};