'use strict';

require(['require', 'chai', 'ko-indexed-repeat'], function (require, chai) {
    mocha.setup('bdd');

    window.expect = chai.expect;

    require(['basic.test', 'immediate.test', 'incremental.test'], function () {
        window.__karma__.start();
    });

});
