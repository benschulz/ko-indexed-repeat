'use strict';

define(function () {
    function StringHashtable() {
        this._size = 0;
        this._hashtable = {};
    }

    StringHashtable.prototype = {
        add: function (k, v) {
            if (Object.prototype.hasOwnProperty.call(this._hashtable, k))
                throw new Error('Key `' + k + '` is already taken.');
            ++this._size;
            this._hashtable[k] = v;
        },
        get: function (k) {
            return this._hashtable[k];
        },
        remove: function (k) {
            if (!Object.prototype.hasOwnProperty.call(this._hashtable, k))
                throw new Error('No entry for key  `' + k + '` present.');
            delete this._hashtable[k];
            --this._size;
        },
        clear: function () {
            this._hashtable = {};
            this._size = 0;
        },
        get size() { return this._size; },
        forEach: function (action) {
            for (var k in this._hashtable)
                if (Object.prototype.hasOwnProperty.call(this._hashtable, k))
                    action(k, this._hashtable[k]);
        }
    };

    return StringHashtable;
});
