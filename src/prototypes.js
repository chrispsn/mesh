const TableObject = {
    [Symbol.iterator]: function* () {
        const orig_headings = Object.keys(this);
        // Get iterator equivalents of each column
        const iterators = {};
        const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;
        for ([heading, iterable] of Object.entries(this)) {
            let iterator = iterable[Symbol.iterator]();
            iterators[heading] = iterator;
        }
        // Delete original headings - access the table props via [row index][col name] from here
        for (let h of orig_headings) { delete this[h] }
        // Zero columns case
        if (Object.keys(iterators).length === 0) {return}
        // Generate rows ( {heading: value} )
        let index = 0;
        let done = false;
        for (;;) {
            let row = {};
            // Remember past rows
            this[index] = row;
            // Set up property access on this row so that we only
            // yield from the relevant column when someone tries
            // to access that row property; when that happens,
            // cache that value and don't try to yield from that
            // column again for this row
            for (let [h, iterator] of Object.entries(iterators)) {
                Object.defineProperty(row, h, {
                    enumerable: true, // So the prop will show up in Object.keys
                    configurable: true, // So we can delete the prop later
                    get() {
                        delete this[h];
                        // TODO should we pass the current index through via next?
                        // Would it make it easier to write generators?
                        const item = iterator.next();
                        if (item.done) {
                            done = true;
                            return;
                        } else {
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
                return;
            } else {
                yield row;
                index = index + 1;
            }
        }
    }
}

module.exports = {TableObject};
