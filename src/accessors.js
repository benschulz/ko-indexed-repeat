'use strict';

define([], function () {
    function ArrayAccessor(array) {
        this.length = function () { return array.length; };
        this.get = function (index) { return array[index]; };
    }

    function ListWithLengthMethod(list) {
        this.length = function () { return list.length(); };
        this.get = function (index) { return list.get(index); };
    }

    function ListWithLengthProperty(list) {
        this.length = function () { return list.length; };
        this.get = function (index) { return list.get(index); };
    }

    function inferAccessor(arrayOrList) {
        if (Array.isArray(arrayOrList))
            return ArrayAccessor;
        else
            return inferListAccessor(arrayOrList);
    }

    function inferListAccessor(list) {
        var s = typeof list.length;

        switch (typeof list.length) {
            case 'function':
                return ListWithLengthMethod;
            case 'number':
                return ListWithLengthProperty;
            default:
                throw new Error('Unsupported type: The `forEach` value must be an array or a list with a `length` property or method.');
        }
    }

    return {
        inferAccessor: inferAccessor
    };
});