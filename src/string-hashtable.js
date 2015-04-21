'use strict';

define(function () {
    function StringHashtable() {
        this.__size = 0;
        this.__hashtable = {};
    }

    StringHashtable.prototype = {
        add: function (k, v) {
            if (Object.prototype.hasOwnProperty.call(this.__hashtable, k))
                throw new Error('Key `' + k + '` is already taken.');
            ++this.__size;
            this.__hashtable[k] = v;
        },
        get: function (k) {
            return Object.prototype.hasOwnProperty.call(this.__hashtable, k)
                ? this.__hashtable[k]
                : null;
        },
        remove: function (k) {
            if (!Object.prototype.hasOwnProperty.call(this.__hashtable, k))
                throw new Error('No entry for key  `' + k + '` present.');
            delete this.__hashtable[k];
            --this.__size;
        },
        clear: function () {
            this.__hashtable = {};
            this.__size = 0;
        },
        get size() { return this.__size; },
        forEach: function (action) {
            var keys = Object.keys(this.__hashtable);

            for (var i = 0, l = keys.length; i < l; i++) {
                var key = keys[i];
                action(key, this.__hashtable[key]);
            }
        }
    };

    return StringHashtable;
});
