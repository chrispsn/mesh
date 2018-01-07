const TableObject = {
    // TODO Add array-like functions such as filter, map, reduce?
    [Symbol.iterator]: function* () {
        const headings = Object.keys(this);
        if (headings.length === 0) return [];
        let idx = 0;
        for (let _ of this[headings[0]]) {
            const obj = {};
            for (let heading of headings) {
                obj[heading] = this[heading][idx];
            }
            yield obj;
            idx++;
        };
    },
}

module.exports = {TableObject};
