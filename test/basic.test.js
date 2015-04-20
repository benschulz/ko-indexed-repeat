'use strict';

define(['knockout', 'jquery', './tester.test'], function (ko, $, tester) {

    describe('Basic repetition tests:', function () {
        describe('The element count should equal the item count', function () {
            function parametrization(description, items) {
                it(description, function () {
                    var repeat = tester.forEach(items)
                        .insert.anywhere();

                    expect(repeat.elements().length).to.equal(items.length);
                });
            }

            parametrization('for no items.', []);
            parametrization('for one item.', ['item one']);
            parametrization('for two items.', ['item one', 'item two']);
            parametrization('for three items.', ['item one', 'item two', 'item three']);
            parametrization('for many items.', tester.generate(100).items());
        });

        it('Item elements should have the `data-repeat-bind`-binding applied.', function () {
            var expectedText = 'expected text';

            var repeat = tester.forEach(['item'])
                .repeat('<div data-repeat-bind="text: \'' + expectedText + '\'" ></div>')
                .insert.anywhere();

            expect(repeat.element(0).textContent).to.equal(expectedText);
        });

        it('The respective item should be accessible via the variable name specified in `as`.', function () {
            var items = ['item a', 'item b', 'item c'];
            var itemVariableName = 'someItemVariableName';

            var repeat = tester.forEach(items)
                .repeat('<div data-repeat-bind="text: ' + itemVariableName + '" ></div>')
                .as(itemVariableName)
                .insert.anywhere();

            for (var i = 0; i < items.length; ++i)
                expect(repeat.element(i).textContent).to.equal(items[i]);
        });

        it('The respective item index should be accessible via the variable name specified in `at`.', function () {
            var items = ['item a', 'item b', 'item c'];
            var indexVariableName = 'someIndexVariableName';

            var repeat = tester.forEach(items)
                .repeat('<div data-repeat-bind="text: ' + indexVariableName + '" ></div>')
                .at(indexVariableName)
                .insert.anywhere();

            for (var i = 0; i < items.length; ++i)
                expect(repeat.element(i).textContent).to.equal(i.toString());
        });

        it('Duplicate ids should fail fast.', function (done) {
            var items = [1, 3];

            try {
                tester.forEach(items)
                    .indexedBy(function (item) {return item % 2;})
                    .insert.anywhere();
                done(new Error('Expected exception not raised.'));
            } catch (e) {
                expect(e.message).to.contain('Key `1` is already taken.');
                done();
            }
        });

        it('`indexedBy` may be an item property name.', function () {
            var items = [{id: 1}, {id: 2}, {id: 3}];

            var repeat = tester.forEach(items)
                .indexedBy('id')
                .insert.anywhere();

            expect(repeat.elements().length).to.equal(items.length);
        });

        describe('When an item is removed', function () {
            function forEach(items) {
                return {
                    repeat: function (markup) {
                        return tester.forEach(items)
                            .repeat(markup)
                            .insert.anywhere();
                    }
                };
            }

            it('the corresponding element should be removed also.', function () {
                var items = ko.observableArray(['item a', 'item b', 'item c', 'item d', 'item e']);
                var repeat = forEach(items).repeat('<div data-repeat-bind="text: $item" ></div>');

                var removed = items.splice(2, 1)[0];

                for (var i = 0; i < items.length - 1; ++i)
                    expect(repeat.element(i).textContent).to.not.equal(removed);
            });

            it('the indices of elements of following items should be decremented by one.', function () {
                var items = ko.observableArray(['item a', 'item b', 'item c', 'item d', 'item e']);
                var repeat = forEach(items).repeat('<div data-repeat-bind="text: $index" ></div>');

                items.splice(2, 1);

                for (var i = 0; i < items.length - 1; ++i)
                    expect(repeat.element(i).textContent).to.equal(i.toString());
            });
        });

        it('When an item is replaced, its element should be reused.', function () {
            var items = ko.observableArray(['item a', 'item b', 'item c']);
            var repeat = tester.forEach(items)
                .insert.anywhere();
            var elementPreReplacement = repeat.element(1);

            items.splice(1, 1, 'foo');

            var elementPostReplacement = repeat.element(1);
            expect(elementPostReplacement).to.equal(elementPreReplacement);
        });
    });
});
