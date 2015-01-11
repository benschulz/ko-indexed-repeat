'use strict';

define(['knockout', 'jquery', './tester'], function (ko, $, tester) {

    describe('Immediate repetition tests:', function () {
        it('The `onSynchronization`-handler should be called, once synchronization is done.', function (done) {
            var itemCount = 10;
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

        it('The initial items should be displayed immediately.', function () {
            var itemCount = 5000;

            var repeat = tester.forEach(tester.generate(itemCount).items())
                .immediately()
                .insert.into(tester.createContainer());

            expect(repeat.elements().length).to.equal(itemCount);
        });

        it('New items should be displayed immediately.', function () {
            var itemCount = 5000;
            var items = ko.observableArray([]);
            var repeat = tester.forEach(items)
                .immediately()
                .insert.into(tester.createContainer());

            items.push.apply(items, tester.generate(itemCount).items());

            expect(repeat.elements().length).to.equal(itemCount);
        });
    });
});
