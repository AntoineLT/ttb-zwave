'use strict';

module.exports = function(RED) {
    var zwave = require('./js/openZWave').zwave;

    function zwaveInclusionNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on('input', function(msg) {
            if(typeof msg.payload !== 'undefined') {
                node.log("Inclusion mode activated !");
                RED.comms.publish("notifyUI", {
                    text : RED._("ttb-zwave/zwave:zwave.inclusion"),
                    type: 'success',
                    fixed: false
                });
                zwave.addNode();
            }
        });
    }

    RED.nodes.registerType('zwave-inclusion-node', zwaveInclusionNode);
};

// TODO: use this function to activate the inclusion mode with NFC tag later
function subscription(RED, node, zwave) {
    var isUtf8 = require('is-utf8');

    var NFCTopic = "smartcard/msgread/#";
    if (node.topic) {
        node.brokerConfig.register(node);
        node.brokerConfig.subscribe(NFCTopic, 2, function (topic, payload, packet) {
            if (isUtf8(payload)) {
                payload = payload.toString();
            }
            try {
                payload = JSON.parse(payload);
            } catch (e) {
            }
            // TODO: this variable will invoke a function which check if the NFC tag have been already passed
            // TODO: like : var existAlready = checkIfExists(payload);
            // TODO: checkIfExists() will return true or false
            var existAlready = false;
            if (!existAlready && payload === "04628662A62780") {
                node.log("Inclusion mode activated !");
                zwave.addNode();
                // TODO: Add this NFC tag to known NFC tags
            }
        }, node.id);
    }
    else {
        node.error(RED._("node-red:mqtt.errors.not-defined"));
    }
    node.on('close', function (done) {
        if (node.brokerConfig) {
            node.brokerConfig.unsubscribe(node.topic, node.id);
            node.brokerConfig.deregister(node, done);
        }
    });
}