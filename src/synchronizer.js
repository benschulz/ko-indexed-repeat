'use strict';

define(['knockout', './string-hashtable'], function (ko, StringHashtable) {

    var requestAnimationFrame = window.requestAnimationFrame,
        cancelAnimationFrame = window.cancelAnimationFrame;

    function ElementWithBindingContext(element, bindingContext) {
        var self = this;

        self.element = element;
        self.bindingContext = bindingContext;
    }

    function AddedItem(index, item, id, previousId) {
        var self = this;

        self.index = index;
        self.item = item;
        self.id = id;
        self.previousId = previousId;
    }

    return function Synchronizer(configuration, bindingContext) {
        var self = this,
        // extract constants from the configuration
            idSelector = configuration.idSelector,
            itemVariableName = configuration.itemVariableName,
            indexVariableName = configuration.indexVariableName,
            allowDeviation = configuration.allowDeviation,
            reportDeviation = configuration.reportDeviation,
            reportSynchronization = configuration.reportSynchronization,
            parent = configuration.parent,
            startMarker = configuration.startMarker,
            endMarker = configuration.endMarker,
            itemElementTemplate = configuration.itemElementTemplate,
        // the core state -- when a synchronization is in progress, currentItems may be more current than itemElements
            currentItems = null,
            itemElements = new StringHashtable(), // id
            synchronizedCount = 0, // the number of items for which elements are present in the DOM (may deviate from itemElements.size())
        // state of the current synchronization (if one is in progress)
            step = 0, // synchronization step counter
            cursor = null, // cursor into the DOM for phase one and two (collectNewItemsAndMarkDeados/collectCarcasses)
            animationFrameRequest = null, // request for the next step, if synchronization is incremental
            addedItems = null, // items for which no element exists (yet)
            presumedDead = null, // elements for removed items by id, may contain false positives for moved back items
            carcasses = null; // elements for definitely removed items (no false positives)

        function startNewSynchronization(newItems) {
            step = 0;
            cursor = configuration.startMarker;
            addedItems = [];
            presumedDead = new StringHashtable();

            currentItems = newItems;

            if (allowDeviation)
                initiateIncrementalSynchronization();
            else
                performImmediateSynchronization();
        }

        function performImmediateSynchronization() {
            while (performSynchronizationStep())
                ++step;
            finalizeSynchronization();
        }

        function initiateIncrementalSynchronization() {
            performIncrementalSynchronizationStep(new Date().getTime() + 15); // TODO magic number, allow configuration?
        }

        function resumeIncrementalSynchronization() {
            performIncrementalSynchronizationStep(new Date().getTime() + 40); // TODO magic number, allow configuration?
        }

        function performIncrementalSynchronizationStep(timelimit) {
            while (performSynchronizationStep()) {
                ++step;

                if (new Date().getTime() > timelimit) {
                    reportDeviation();
                    animationFrameRequest = requestAnimationFrame(resumeIncrementalSynchronization);
                    return;
                }
            }

            finalizeSynchronization();
        }

        function performSynchronizationStep() {
            if (step < currentItems.length())
                collectNewItemsAndMarkDeados(step, currentItems.get(step));
            else if (!carcasses)
                collectCarcasses();
            else if (addedItems.length)
                if (configuration.allowElementRecycling && carcasses.length)
                    performNecromancy(carcasses.pop(), addedItems.shift());
                else
                    insertElementFor(addedItems.shift());
            else
                return incinerateCarcasses() && false;

            return true;
        }

        function collectNewItemsAndMarkDeados(index, item) {
            var previousId = index ? idSelector(currentItems.get(index - 1)) : null;
            var id = idSelector(item);
            var elementWithBindingContext = itemElements.get(id);

            if (elementWithBindingContext) {
                elementWithBindingContext.element.style.display = '';
                elementWithBindingContext.bindingContext[indexVariableName](index);

                var notDeadAfterAll = presumedDead.get(id);
                if (notDeadAfterAll) {
                    presumedDead.remove(id);
                    parent.insertBefore(notDeadAfterAll, cursor.nextSibling);
                    cursor = notDeadAfterAll;
                } else {
                    while (elementWithBindingContext.element !== cursor.nextSibling)
                        presumeDead(cursor.nextSibling);
                    cursor = elementWithBindingContext.element;
                }
            } else {
                addedItems.push(new AddedItem(index, item, id, previousId));
            }
        }

        function collectCarcasses() {
            carcasses = [];
            var aliveAndKicking = currentItems.length() - addedItems.length;
            for (var i = synchronizedCount - presumedDead.size - aliveAndKicking; i > 0; --i)
                presumeDead(cursor.nextSibling);
            presumedDead.forEach(function (key, element) {
                itemElements.remove(key);
                carcasses.push(element);
            });
            presumedDead.clear();
        }

        function performNecromancy(carcass, addedItem) {
            carcass.style.display = '';
            insertNodeAfter(carcass, addedItem.previousId);
            var revivedBindingContext = ko.contextFor(carcass);
            revivedBindingContext[itemVariableName](addedItem.item);
            revivedBindingContext[indexVariableName](addedItem.index);

            itemElements.add(addedItem.id, new ElementWithBindingContext(carcass, revivedBindingContext));
        }

        function insertElementFor(newborn) {
            var element = itemElementTemplate.cloneNode(true);

            var contextExtension = {};
            contextExtension[indexVariableName] = ko.observable(newborn.index);
            contextExtension[itemVariableName] = ko.observable(newborn.item);
            var newBindingContext = bindingContext.extend(contextExtension);

            itemElements.add(newborn.id, new ElementWithBindingContext(element, newBindingContext));
            ko.applyBindings(newBindingContext, element);
            insertNodeAfter(element, newborn.previousId);

            ++synchronizedCount;
        }

        function incinerateCarcasses() {
            while (carcasses.length)
                ko.removeNode(carcasses.pop());
        }

        function finalizeSynchronization() {
            for (var i = 0; i < carcasses.length; ++i) ko.removeNode(carcasses[i]);
            synchronizedCount = currentItems.length();
            reset();
            reportSynchronization();
        }

        function reset() {
            step = 0;
            cursor = null;
            addedItems = null;
            presumedDead = null;
            carcasses = null;
        }

        function insertNodeAfter(node, previousId) {
            var before = (previousId ? itemElements.get(previousId).element : startMarker).nextSibling;
            parent.insertBefore(node, before);
        }

        function presumeDead(element) {
            presumedDead.add(idFor(element), element);
            element.style.display = 'none';
            parent.insertBefore(element, endMarker);
            return element;
        }

        function idFor(e) {
            return idSelector(ko.contextFor(e)[itemVariableName]());
        }

        self.startOrRestartSynchronization = function (newItems) {
            abortActiveSynchronization();
            startNewSynchronization(newItems);
        };

        self.abortActiveSynchronization = abortActiveSynchronization;

        function abortActiveSynchronization() {
            if (!animationFrameRequest)
                return;

            cancelAnimationFrame(animationFrameRequest);
            animationFrameRequest = null;

            for (var i = 0; carcasses !== null && i < carcasses.length; ++i) {
                var element = carcasses[i];
                itemElements.add(idFor(element), new ElementWithBindingContext(element, ko.contextFor(element)));
            }

            reset();
        }
    };
});