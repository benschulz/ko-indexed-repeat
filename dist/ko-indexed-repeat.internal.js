/**
 * Copyright (c) 2015, Ben Schulz
 * License: BSD 3-clause (http://opensource.org/licenses/BSD-3-Clause)
 */
define(['knockout'],    function(knockout) {
var ko_indexed_repeat_accessors, ko_indexed_repeat_configuration, ko_indexed_repeat_string_hashtable, ko_indexed_repeat_synchronizer, ko_indexed_repeat_binding, ko_indexed_repeat;

ko_indexed_repeat_accessors = function () {
  function ArrayAccessor(array) {
    this.length = function () {
      return array.length;
    };
    this.get = function (index) {
      return array[index];
    };
  }
  function ListWithLengthMethod(list) {
    this.length = function () {
      return list.length();
    };
    this.get = function (index) {
      return list.get(index);
    };
  }
  function ListWithLengthProperty(list) {
    this.length = function () {
      return list.length;
    };
    this.get = function (index) {
      return list.get(index);
    };
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
  return { inferAccessor: inferAccessor };
}();

ko_indexed_repeat_configuration = function (ko) {
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
    self.reportDeviation = value[OPTION_ON_DEVIATION] || function () {
    };
    self.reportSynchronization = value[OPTION_ON_SYNCHRONIZATION] || function () {
    };
    self.parent = element.parentNode;
    self.startMarker = document.createComment('[repeat(' + bindingString + ')');
    self.endMarker = document.createComment('repeat(' + bindingString + ')]');
    self.itemElementTemplate = prepareItemTemplate(element);
    self.disposeIndicatorNode = self.startMarker;
  };
}(knockout);

ko_indexed_repeat_string_hashtable = function () {
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
    get size() {
      return this._size;
    },
    forEach: function (action) {
      for (var k in this._hashtable)
        if (Object.prototype.hasOwnProperty.call(this._hashtable, k))
          action(k, this._hashtable[k]);
    }
  };
  return StringHashtable;
}();

ko_indexed_repeat_synchronizer = function (ko, StringHashtable) {
  var requestAnimationFrame = window.requestAnimationFrame, cancelAnimationFrame = window.cancelAnimationFrame;
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
      idSelector = configuration.idSelector, itemVariableName = configuration.itemVariableName, indexVariableName = configuration.indexVariableName, allowDeviation = configuration.allowDeviation, reportDeviation = configuration.reportDeviation, reportSynchronization = configuration.reportSynchronization, parent = configuration.parent, startMarker = configuration.startMarker, endMarker = configuration.endMarker, itemElementTemplate = configuration.itemElementTemplate,
      // the core state -- when a synchronization is in progress, currentItems may be more current than itemElements
      currentItems = null, itemElements = new StringHashtable(),
      // id
      synchronizedCount = 0,
      // the number of items for which elements are present in the DOM (may deviate from itemElements.size())
      // state of the current synchronization (if one is in progress)
      step = 0,
      // synchronization step counter
      cursor = null,
      // cursor into the DOM for phase one and two (collectNewItemsAndMarkDeados/collectCarcasses)
      animationFrameRequest = null,
      // request for the next step, if synchronization is incremental
      addedItems = null,
      // items for which no element exists (yet)
      presumedDead = null,
      // elements for removed items by id, may contain false positives for moved back items
      carcasses = null;
    // elements for definitely removed items (no false positives)
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
      performIncrementalSynchronizationStep(new Date().getTime() + 15);  // TODO magic number, allow configuration?
    }
    function resumeIncrementalSynchronization() {
      performIncrementalSynchronizationStep(new Date().getTime() + 40);  // TODO magic number, allow configuration?
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
      else if (!addedItems.length)
        return false;
      else if (configuration.allowElementRecycling && carcasses.length)
        performNecromancy(carcasses.pop(), addedItems.shift());
      else
        insertElementFor(addedItems.shift());
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
    function finalizeSynchronization() {
      for (var i = 0; i < carcasses.length; ++i)
        ko.removeNode(carcasses[i]);
      synchronizedCount = currentItems.length();
      reset();
      reportSynchronization();
    }
    function abortActiveSynchronization() {
      cancelAnimationFrame(animationFrameRequest);
      animationFrameRequest = null;
      for (var i = 0; carcasses !== null && i < carcasses.length; ++i) {
        var element = carcasses[i];
        itemElements.add(idFor(element), new ElementWithBindingContext(element, ko.contextFor(element)));
      }
      reset();
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
      if (animationFrameRequest)
        abortActiveSynchronization();
      startNewSynchronization(newItems);
    };
    self.abortActiveSynchronization = abortActiveSynchronization;
  };
}(knockout, ko_indexed_repeat_string_hashtable);

ko_indexed_repeat_binding = function (ko, accessors, Configuration, Synchronizer) {
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
          synchronizer.startOrRestartSynchronization(newItems);
        }, null, { 'disposeWhenNodeIsRemoved': disposeIndicatorNode })
      };
    }
  };
  return binding;
}(knockout, ko_indexed_repeat_accessors, ko_indexed_repeat_configuration, ko_indexed_repeat_synchronizer);
ko_indexed_repeat = function (main) {
  return main;
}(ko_indexed_repeat_binding);return ko_indexed_repeat;
});