const TableObject = {
    // Syntactically defined as {heading: iterable, ...} pairs;
    // when consumed, yields {heading: value, ...} row records
    // which are added to the table by their index upon first iteration
    // (so can be accessed by table[row index][col name]).
    // The TableObject is now an array for prototype purposes.
    [Symbol.iterator]: function* () {
        Object.setPrototypeOf(this, TableArray);
        const orig_headings = Object.keys(this);
        // Get an iterator from each column (each assumed to be iterable)
        const iterators = {};
        for (let [h, i] of Object.entries(this)) {
            iterators[h] = i[Symbol.iterator]();
        }
        if (Object.keys(iterators).length === 0) { return }
        // Generate rows ( {heading: value, ...} )
        let done = false;
        for (let index = 0;;index++) {
            // Remember past rows
            this[index] = row = {};
            for (let [h, iterator] of Object.entries(iterators)) {
                Object.defineProperty(row, h, {
                    enumerable: true, // So the prop will show up in Object.keys
                    configurable: true, // So we can delete the prop later
                    get() {
                        const item = iterator.next(); // Should we pass anything in?
                        if (item.done) {
                            done = true;
                            return;
                        } else {
                            // Yield only once from each column; store the values
                            delete this[h];
                            return this[h] = item.value;
                        }
                    }
                });
            }
            // Trigger access for all props in row
            for (let h of orig_headings) { row[h] }
            if (done) {
                // Delete last row - the last iteration was unsuccessful
                delete this[index];
                this.length = index;
                return;
            } else {
                yield row;
            }
        }
    }
}

const TableArray = {
    __proto__: Array.prototype,
}

module.exports = {TableObject, TableArray};
