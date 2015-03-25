'use strict';

define(['knockout', './accessors', './configuration', './synchronizer'], function (ko, accessors, Configuration, Synchronizer) {
    var OPTION_FOR_EACH = 'forEach';

    var binding = ko.bindingHandlers['indexedRepeat'] = {
        'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            var configuration = new Configuration(element, value);
            var disposeIndicatorNode = configuration.disposeIndicatorNode;

            configuration.parent.replaceChild(configuration.endMarker, element);
            configuration.parent.insertBefore(configuration.startMarker, configuration.endMarker);

            var synchronizer = new Synchronizer(configuration, bindingContext);
            if (configuration.allowDeviation)
                ko.utils.domNodeDisposal.addDisposeCallback(disposeIndicatorNode, function () {
                    synchronizer.abortActiveSynchronization();
                });

            var items = value[OPTION_FOR_EACH];
            var Accessor = accessors.inferAccessor(items());

            return {
                'controlsDescendantBindings': true,
                'subscribable': ko.computed(function () {
                    var newItems = new Accessor(items());
                    ko.ignoreDependencies(synchronizer.startOrRestartSynchronization, synchronizer, [newItems]);
                }, null, {
                    'disposeWhenNodeIsRemoved': disposeIndicatorNode
                })
            };
        }
    };

    return binding;
});