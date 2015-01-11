'use strict';

define(['knockout'], function (ko) {
    var OPTION_INDEXED_BY = 'indexedBy';
    var OPTION_AS = 'as';
    var OPTION_AT = 'at';
    var OPTION_ALLOW_ELEMENT_RECYCLING = 'allowElementRecycling';
    var OPTION_ALLOW_DEVIATION = 'allowDeviation';
    var OPTION_ON_DEVIATION = 'onDeviation';
    var OPTION_ON_SYNCHRONIZATION = 'onSynchronization';

    var document = window.document;

    function selectorFunction(propertyNameOrSelectorFunction) {
        if (typeof propertyNameOrSelectorFunction === 'function')
            return propertyNameOrSelectorFunction;
        else if (typeof propertyNameOrSelectorFunction === 'string')
            return function (item) {
                return item[propertyNameOrSelectorFunction];
            };

        throw new Error('A repeat-binding must specify and indexedBy of type string (property name) or function (custom selector).');
    }

    function prepareItemTemplate(element) {
        ko.cleanNode(element);
        window.setTimeout(function () {
            // for some reason, the above cleanNode is insufficient, probably because applyBindingsToNode
            // sets up part of the state after calling init (and thus the cleanNode above)
            ko.cleanNode(element);
        }, 1);

        var itemTemplate = element.cloneNode(true);
        itemTemplate.removeAttribute('data-bind');
        if (typeof element.getAttribute('data-repeat-bind') === 'string') {
            itemTemplate.setAttribute('data-bind', element.getAttribute('data-repeat-bind'));
            itemTemplate.removeAttribute('data-repeat-bind');
        }
        return itemTemplate;
    }

    return function Configuration(element, value) {
        var self = this;

        var bindingString = element.getAttribute('data-bind');

        self.idSelector = selectorFunction(value[OPTION_INDEXED_BY]);
        self.itemVariableName = value[OPTION_AS] || '$item';
        self.indexVariableName = value[OPTION_AT] || '$index';
        self.allowElementRecycling = value[OPTION_ALLOW_ELEMENT_RECYCLING] !== false;
        self.allowDeviation = value[OPTION_ALLOW_DEVIATION] === true;
        self.reportDeviation = value[OPTION_ON_DEVIATION] || function () {};
        self.reportSynchronization = value[OPTION_ON_SYNCHRONIZATION] || function () {};

        self.parent = element.parentNode;
        self.startMarker = document.createComment('[repeat(' + bindingString + ')');
        self.endMarker = document.createComment('repeat(' + bindingString + ')]');
        self.itemElementTemplate = prepareItemTemplate(element);
        self.disposeIndicatorNode = self.startMarker;
    };
});