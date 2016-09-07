'use strict';

var openZwave = require('openzwave-shared');

var zwave = new openZwave({
    SaveConfiguration: false,
    Logging: false,
    ConsoleOutput: false,
    SuppressValueRefresh: true
});

module.exports = {
    'zwave': zwave
};