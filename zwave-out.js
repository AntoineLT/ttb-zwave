module.exports = function (RED) {
    'use strict';

    var outNode = require('./js/outNode'),
        zwave = require('./js/openZWave').zwave;

    function zwaveOutNode(config) {
        RED.nodes.createNode(this, config);
        this.method = config.method;
        this.nodeid = config.nodeid;
        this.level = config.level;
        this.class = config.class;
        this.index = config.index;
        this.value = config.value;
        var node = this;

        this.on('input', function (msg) {
            outNode.onInput(node, zwave, msg);
        });
    }

    RED.nodes.registerType("zwave-out", zwaveOutNode);
};