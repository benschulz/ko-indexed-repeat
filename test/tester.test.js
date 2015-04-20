'use strict';

define(['jquery', 'knockout'], function ($, ko) {

    var document = window.document;

    var toBeRemoved = [];
    afterEach(function () {
        while (toBeRemoved.length)
            ko.removeNode(toBeRemoved.pop());
    });

    function createContainer(parent) {
        var container = document.createElement('div');
        (parent || document.body).appendChild(container);
        toBeRemoved.push(container);
        return container;
    }

    function forEach(items) {
        items = ko.isObservable(items) ? items : ko.observableArray(items);

        return indexPreparator({
            items: items
        });
    }

    function indexPreparator(partialConfiguration) {
        var implicitConfiguration = $.extend({}, partialConfiguration, {
            idSelector: function (item) { return '' + item; }
        });

        return $.extend(itemElementTemplatePreparator(implicitConfiguration), {
            indexedBy: function (idSelector) {
                return itemElementTemplatePreparator($.extend({}, partialConfiguration, {
                    idSelector: idSelector
                }));
            }
        });
    }

    function itemElementTemplatePreparator(partialConfiguration) {
        var implicitConfiguration = $.extend({}, partialConfiguration, {
            itemElementTemplate: $('<div data-repeat-bind="text: $index() + \': \' + $item()"></div>')[0]
        });

        return $.extend(deviationPreparator(implicitConfiguration), {
            repeat: function (elementOrElementMarkup) {
                return itemVariableNamePreparator($.extend({}, partialConfiguration, {
                    itemElementTemplate: $(elementOrElementMarkup)[0]
                }));
            }
        });
    }

    function itemVariableNamePreparator(partialConfiguration) {
        return $.extend(indexVariableNamePreparator(partialConfiguration), {
            as: function (itemVariableName) {
                return indexVariableNamePreparator($.extend({}, partialConfiguration, {
                    itemVariableName: itemVariableName
                }));
            }
        });
    }

    function indexVariableNamePreparator(partialConfiguration) {
        return $.extend(deviationPreparator(partialConfiguration), {
            at: function (indexVariableName) {
                return deviationPreparator($.extend({}, partialConfiguration, {
                    indexVariableName: indexVariableName
                }));
            }
        });
    }

    function deviationPreparator(partialConfiguration) {
        function incrementally() {
            return onDeviationPreparator($.extend({}, partialConfiguration, {
                allowDeviation: true
            }));
        }

        return $.extend(onSynchronizationPreparator(partialConfiguration), {
            immediately: function () {
                return onSynchronizationPreparator($.extend({}, partialConfiguration, {
                    allowDeviation: false
                }));
            },
            incrementally: incrementally,
            onDeviation: function () {
                var delegate = incrementally();
                return delegate.onDeviation.apply(delegate, arguments);
            }
        });
    }

    function onDeviationPreparator(partialConfiguration) {
        return $.extend(onSynchronizationPreparator(partialConfiguration), {
            onDeviation: function (handler) {
                return onSynchronizationPreparator($.extend({}, partialConfiguration, {
                    onDeviation: handler
                }));
            }
        });
    }

    function onSynchronizationPreparator(partialConfiguration) {
        return $.extend(inserter(partialConfiguration), {
            onSynchronization: function (handler) {
                return inserter($.extend({}, partialConfiguration, {
                    onSynchronization: handler
                }));
            }
        });
    }

    function inserter(configuration) {
        function anywhere() {
            return into(createContainer());
        }

        anywhere.shortly = function () {
            var container = createContainer();
            window.setTimeout(() => into(container));
            return new Inspector(container);
        };

        function into(container) {
            var indexedRepeatElement = configuration.itemElementTemplate.cloneNode(true);
            container.appendChild(indexedRepeatElement);

            ko.applyBindingsToNode(indexedRepeatElement, {
                indexedRepeat: {
                    forEach: configuration.items,
                    indexedBy: configuration.idSelector,
                    as: configuration.itemVariableName,
                    at: configuration.indexVariableName,
                    allowDeviation: configuration.allowDeviation,
                    onDeviation: configuration.onDeviation,
                    onSynchronization: configuration.onSynchronization
                }
            });

            return new Inspector(container);
        }

        return {
            insert: {
                anywhere: anywhere,
                into: into
            }
        };
    }

    function generate(n) {
        return {
            items: function () {
                return $.map(new Array(n), function (whetever, index) { return 'item ' + (index + 1); });
            }
        };
    }

    function Inspector(container) {
        var self = this;
        self.elements = function () { return $(container).children().toArray(); };
        self.element = function (index) { return $(container).children()[index]; };
    }


    return {
        forEach: forEach,
        generate: generate
    };
});
