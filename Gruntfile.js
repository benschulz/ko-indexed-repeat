'use strict';

module.exports = function (grunt) {
    require('grunt-commons')(grunt, {
        name: 'ko-indexed-repeat',
        main: 'binding',
        internalMain: 'binding',

        shims: {
            knockout: 'window.ko'
        }
    }).initialize({
        karma: {
            requirejs: {
                additionalPaths: {
                    jquery: '../node_modules/jquery/dist/jquery'
                }
            },
            additionalFiles: [
                {pattern: 'node_modules/jquery/dist/jquery.js', included: false}
            ]
        }
    });
};
