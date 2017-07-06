'use strict';

var openZwave = require('openzwave-shared');

// See https://github.com/OpenZWave/open-zwave/wiki/Config-Options
var zwave = new openZwave({
    SaveConfiguration: false,
    Logging: false,
    ConsoleOutput: false,
    SuppressValueRefresh: true
});

module.exports = {
    'zwave': zwave
};