'use strict';

var openZwave = require('openzwave-shared');

// See https://github.com/OpenZWave/open-zwave/wiki/Config-Options
var zwave = new openZwave({
    SaveConfiguration: false,
    Logging: false,
    ConsoleOutput: false,
    SuppressValueRefresh: true
	/*
	IntervalBetweenPolls: How long we should spend polling the entire network, or how long between polls we should wait. (See IntervalBetweenPolls). The time period in milliseconds between polls of a nodes value. Be careful about using polling values below 30000 (30 seconds) as polling can flood the zwave network and cause problems. Default value: 60000
	PollInterval: Should the above value be how long to wait between polling the network devices, or how often all devices should be polled
	*/
});

module.exports = {
    'zwave': zwave
};