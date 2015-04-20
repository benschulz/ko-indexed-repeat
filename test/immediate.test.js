'use strict';

define(['knockout', 'jquery', './tester.test'], function (ko, $, tester) {
    var SOME = 10,
        MANY = 2500;

    describe('Immediate repetition tests:', function () {
        it('The `onSynchronization`-handler should be called, once synchronization is done.', function (done) {
            var itemCount = SOME;

            var repeat = tester.forEach(tester.generate(itemCount).items())
                .incrementally()
                .onSynchronization(function () {
                    expect(repeat.elements().length).to.equal(itemCount);
                    done();
                })
                .insert.anywhere.shortly();
        });

        it('The initial items should be displayed immediately.', function () {
            var itemCount = MANY;

            var repeat = tester.forEach(tester.generate(itemCount).items())
                .immediately()
                .insert.anywhere();

            expect(repeat.elements().length).to.equal(itemCount);
        });

        it('New items should be displayed immediately.', function () {
            var itemCount = MANY,
                items = ko.observableArray([]),
                repeat = tester.forEach(items)
                    .immediately()
                    .insert.anywhere();

            items.push.apply(items, tester.generate(itemCount).items());

            expect(repeat.elements().length).to.equal(itemCount);
        });
    });
});
