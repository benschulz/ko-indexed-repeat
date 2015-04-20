'use strict';

define(['knockout', 'jquery', './tester.test'], function (ko, $, tester) {
    var SOME = 10,
        MANY = 2500;


    describe('Incremental repetition tests:', function () {
        it('The `onDeviation`-handler should be called, when displayed elements deviate from the underlying items.', function (done) {
            var itemCount = MANY;

            var repeat = tester.forEach(tester.generate(itemCount).items())
                .onDeviation(function () {
                    expect(repeat.elements().length).to.be.lessThan(itemCount);
                    done();
                    done = function () {}; // the onDeviation-handler might be called again before clean up is done
                })
                .insert.anywhere.shortly();
        });

        it('The `onSynchronization`-handler should be called, once the displayed elements match the underlying items.', function (done) {
            var itemCount = MANY;

            var repeat = tester.forEach(tester.generate(itemCount).items())
                .incrementally()
                .onSynchronization(function () {
                    expect(repeat.elements().length).to.equal(itemCount);
                    done();
                })
                .insert.anywhere.shortly();
        });

        describe('The initial items should be displayed incrementally', function () {
            it('unless it takes little time to do so immediately.', function () {
                var itemCount = SOME;

                var repeat = tester.forEach(tester.generate(itemCount).items())
                    .incrementally()
                    .insert.anywhere();

                expect(repeat.elements().length).to.equal(itemCount);
            });
            it('when it would take too long to do so immediately.', function () {
                var itemCount = MANY;

                var repeat = tester.forEach(tester.generate(itemCount).items())
                    .incrementally()
                    .insert.anywhere();

                expect(repeat.elements().length).to.be.lessThan(itemCount);
            });
        });

        describe('Added items should be displayed incrementally', function () {
            it('unless it takes little time to do so immediately.', function () {
                var itemCount = SOME;
                var items = ko.observableArray([]);
                var repeat = tester.forEach(items)
                    .incrementally()
                    .insert.anywhere();

                items.push.apply(items, tester.generate(itemCount).items());

                expect(repeat.elements().length).to.equal(itemCount);
            });
            it('when it would take too long to do so immediately.', function () {
                var itemCount = MANY;
                var items = ko.observableArray([]);
                var repeat = tester.forEach(items)
                    .incrementally()
                    .insert.anywhere();

                items.push.apply(items, tester.generate(itemCount).items());

                expect(repeat.elements().length).to.be.lessThan(itemCount);
            });
        });

        describe('Items should be removed incrementally', function () {
            function setupRepeatOf(itemCount) {
                return {
                    itemsAndThen: function (action) {
                        var items = ko.observableArray(tester.generate(itemCount).items());

                        var repeat = tester.forEach(items)
                            .incrementally()
                            .onSynchronization(function () {
                                if (repeat.elements().length === itemCount) {
                                    window.setTimeout(function () {
                                        action(items, repeat);
                                    }, 1);
                                }
                            })
                            .insert.anywhere.shortly();
                    }
                };
            }

            it('unless it takes little time to do so immediately.', function (done) {
                setupRepeatOf(SOME).itemsAndThen(function (items, repeat) {
                    items([]);
                    expect(repeat.elements().length).to.equal(0);
                    done();
                });
            });
            it('when it would take too long to do so immediately.', function (done) {
                setupRepeatOf(MANY).itemsAndThen(function (items, repeat) {
                    items(items().filter(function (item, index) {return index % 2 === 0;}));
                    expect(repeat.elements().length).to.be.greaterThan(0);
                    done();
                });
            });
        });
    });
});
