'use strict';

define(['knockout', 'jquery', './tester'], function (ko, $, tester) {

    describe('Incremental repetition tests:', function () {
        it('The `onDeviation`-handler should be called, when displayed elements deviate from the underlying items.', function (done) {
            var itemCount = 5000;
            var container = tester.createContainer();
            var inspector = tester.createInspector(container);

            tester.forEach(tester.generate(itemCount).items())
                .onDeviation(function () {
                    expect(inspector.elements().length).to.be.lessThan(itemCount);
                    done();
                    done = function () {}; // the onDeviation-handler might be called again before clean up is done
                })
                .insert.into(container);
        });

        it('The `onSynchronization`-handler should be called, once the displayed elements match the underlying items.', function (done) {
            var itemCount = 5000;
            var container = tester.createContainer();
            var inspector = tester.createInspector(container);

            tester.forEach(tester.generate(itemCount).items())
                .incrementally()
                .onSynchronization(function () {
                    expect(inspector.elements().length).to.equal(itemCount);
                    done();
                })
                .insert.into(container);
        });

        describe('The initial items should be displayed incrementally', function () {
            it('unless it takes little time to do so immediately.', function () {
                var itemCount = 10;

                var repeat = tester.forEach(tester.generate(itemCount).items())
                    .incrementally()
                    .insert.into(tester.createContainer());

                expect(repeat.elements().length).to.equal(itemCount);
            });
            it('when it would take too long to do so immediately.', function () {
                var itemCount = 5000;

                var repeat = tester.forEach(tester.generate(itemCount).items())
                    .incrementally()
                    .insert.into(tester.createContainer());

                expect(repeat.elements().length).to.be.lessThan(itemCount);
            });
        });

        describe('Added items should be displayed incrementally', function () {
            it('unless it takes little time to do so immediately.', function () {
                var itemCount = 10;
                var items = ko.observableArray([]);
                var repeat = tester.forEach(items)
                    .incrementally()
                    .insert.into(tester.createContainer());

                items.push.apply(items, tester.generate(itemCount).items());

                expect(repeat.elements().length).to.equal(itemCount);
            });
            it('when it would take too long to do so immediately.', function () {
                var itemCount = 5000;
                var items = ko.observableArray([]);
                var repeat = tester.forEach(items)
                    .incrementally()
                    .insert.into(tester.createContainer());

                items.push.apply(items, tester.generate(itemCount).items());

                expect(repeat.elements().length).to.be.lessThan(itemCount);
            });
        });

        describe('Items should be removed incrementally', function () {
            function setupRepeatOf(itemCount) {
                return {
                    itemsAndThen: function (action) {
                        var items = ko.observableArray(tester.generate(itemCount).items());
                        var container = tester.createContainer();
                        var inspector = tester.createInspector(container);

                        tester.forEach(items)
                            .incrementally()
                            .onSynchronization(function () {
                                if (inspector.elements().length === itemCount) {
                                    window.setTimeout(function () {
                                        action(items, inspector);
                                    }, 1);
                                }
                            })
                            .insert.into(container);
                    }
                };
            }

            it('unless it takes little time to do so immediately.', function (done) {
                setupRepeatOf(10).itemsAndThen(function (items, inspector) {
                    items([]);
                    expect(inspector.elements().length).to.equal(0);
                    done();
                });
            });
            it('when it would take too long to do so immediately.', function (done) {
                setupRepeatOf(5000).itemsAndThen(function (items, inspector) {
                    items(items().filter(function (item, index) {return index % 2 === 0;}));
                    expect(inspector.elements().length).to.be.greaterThan(0);
                    done();
                });
            });
        });
    });
});
