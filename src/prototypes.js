const TableObject = {
    // Syntactically defined as {heading: iterable, ...} pairs;
    // when consumed, yields {heading: value, ...} row records
    // which are added to the table by their index upon first iteration
    // (so can be accessed by table[row index][col name]).
    // The TableObject is now an array for prototype purposes.
    [Symbol.iterator]: function* () {
        const orig_headings = Object.keys(this);
        // Get iterator equivalents of each column
        const iterators = {};
        for ([heading, iterable] of Object.entries(this)) {
            let iterator = iterable[Symbol.iterator]();
            iterators[heading] = iterator;
        }
        // Delete original headings
        for (let h of orig_headings) { delete this[h] }
        if (Object.keys(iterators).length === 0) {return}
        // Generate rows ( {heading: value} )
        let index = 0;
        let done = false;
        for (;;) {
            let row = {};
            // Remember past rows
            this[index] = row;
           for (let [h, iterator] of Object.entries(iterators)) {
                Object.defineProperty(row, h, {
                    enumerable: true, // So the prop will show up in Object.keys
                    configurable: true, // So we can delete the prop later
                    get() {
                        // TODO should we pass the current index through via next?
                        // Would it make it easier to write generators?
                        const item = iterator.next();
                        if (item.done) {
                            done = true;
                            return;
                        } else {
                            // Yield only once from each column; store the values
                            delete this[h];
                            this[h] = item.value;
                            return item.value;
                        }
                    }
                });
            }
            // Trigger access for all props in row
            for (let h of orig_headings) { row[h] /* nothing */ }
            if (done) {
                // Delete last row - the last iteration was unsuccessful
                delete this[index];
                // TODO Should it be a TableArray prototype?
                Object.setPrototypeOf(this, Array.prototype);
                this.length = index;
                return;
            } else {
                yield row;
                index = index + 1;
            }
        }
    }
}

module.exports = {TableObject};
