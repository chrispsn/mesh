'use strict';

const ROOT = {
    get _cache() {
        const calc = this;
        delete calc._cache;
        return (calc._cache = new Proxy({}, {
            get(c, k) {
                // TODO how does speed compare to try/catch?
                if (k in c) {
                    console.log("Cached")
                    return c[k];
                } else {
                    console.log("Calculated and stored");
                    return (c[k] = calc[k])
                // What we'll actually use (above is verbose for debug):
                // return (k in c) ? c[k] : (c[k] = calc[k])
                }
            }
        }));
    },

    get some_val() {
        const sheet = this._cache;
        return sheet.hardcode;
    },

    hardcode: 123,
}

describe('Memoisation strategy', () => {
    it('can calculate values where not in the cache', () => {
        expect(ROOT.some_val).toBe(123);
    });
    it('first tries to retrieve values from the cache', () => {
        delete ROOT.hardcode;
        expect(ROOT.some_val).toBe(123);
    });
});
