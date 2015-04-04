# ko-indexed-repeat

**ko-indexed-repeat** provides a [knockout](http://knockoutjs.com/) binding called `indexedRepeat`. In functionality it
is similar to the `foreach` binding. The main difference is that `indexedRepeat` tries to minimize the amount of DOM
manipulation in an effort to provide a smooth user experience. Beyond that it allows for incremental synchronization
between view model and view.

To reduce DOM activity `indexedRepeat` does not rely on `arrayChange` events, but rather a user-defined unique index *i:
item→string*.

## Binding Value

### forEach

**Required**. The items for which the bound element is to be repeated. If the value is of length/size *n*, the bound
element will be repeated *n* times.

The value *must* be observable and *must* contain an array or a list, where a list is any object with a `length`
property or method as well as a method `get: number→item` to access its elements. The values' types must be consistent
for any given binding. I.e., if the value initially contained a list with a `length` property, it must always contain a
list with a `length` property.

### indexedBy

**Required**. A function defining a unique index for all potential items.

Functions of the form `function(x) { return x.id; }` may be abbreviated by the string denoting the property's name,
in this case `'id'`. Values returned by the indexing function *must* be of type `string`.

### as

**Optional**. Defaults to `'$item'`. Defines the variable name under which the current item is accessible in binding
strings of the repeated elements and their descendants.

### at

**Optional**. Defaults to `'$index'`. Defines the variable name under which the current item's index is accessible in
binding strings of the repeated elements and their descendants.

### allowElementRecycling

**Optional**. Defaults to `true`. When set to `false` new elements created even when some just freed up.

### beforeElementRecycling

**Optional**. A handler called immediately *before* an element is recycled. The arguments are the element to be recycled and the elements binding context.

### afterElementRecycled

**Optional**. A handler called immediately *after* an element has been recycled. The arguments are the element to be recycled and the elements binding context.

### allowDeviation

**Optional**. Defaults to `false`. Defines whether the displayed items (DOM) may deviate from the actual items
(view model). The DOM will only deviate when it can not be synchronized quickly enough to avoid UI lock-up.

### onDeviation

**Optional**. Defaults to `function() {}`. Defines a handler function to be called whenever the displayed items deviate
from the actual items. This option is irrelevant unless `allowDeviation` is set to `true`.

### onSynchronization

**Optional**. Defaults to `function() {}`. Defines a handler function to be called whenever the displayed items have
been synchronized with the actual items. The handler will still be called if `allowDeviation` is set to `false`.

### data-repeat-bind (attribute)

**Optional**. Declares bindings to be applied to each repeated element.

## Example

```html
<div
    data-bind="indexedRepeat: {
        forEach: ko.observableArray([
            {id: '1', name:'Alice'},
            {id: '2', name: 'Bob'},
            {id: '3', name: 'Carol'},
            {id: '4', name: 'Dan'}
        ]),
        indexedBy: 'id',
        as: 'user',
        at: 'index',
        allowDeviation: true,
        onDeviation: function() { console.log('Updating user list..'); },
        onSynchronization: function() { console.log('User list is up to date..'); },
    }"
    data-repeat-bind="css: { even: index() % 2 === 1 }"
>
   <span data-bind="text: item().name"></span>
</div>
```

Above code will dynamically produce the following DOM (`data-bind` attributes stripped).

```html
<div>
    <span>Alice</span>
</div>
<div class="even">
    <span>Bob</span>
</div>
<div>
    <span>Carol</span>
</div>
<div class="even">
    <span>Dan</span>
</div>
```
