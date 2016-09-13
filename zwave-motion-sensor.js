'use strict';

module.exports = function (RED) {
    var homeDir = process.env.NODE_RED_HOME;

    var path = require('path'),
        mqttCP = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

    var flows = require('./js/flows');

    function motionSensor(config) {
        RED.nodes.createNode(this, config);

        this.brokerConn = RED.nodes.getNode(this.broker);
        if (this.brokerConn === undefined && this.brokerConn === null) {
            this.error(RED._("node-red:mqtt.errors.missing-config"));
            return;
        }

        var zwaveTopic = flows.checkZwaveNodeTopic();
        this.nodeid = config.nodeid;
        this.topic = zwaveTopic + '/' + this.nodeid + '/48/0';
        this.broker = config.broker;

        this.mqtt = mqttCP.get(
            node.brokerConn.broker,
            node.brokerConn.port
        );

        subscription(RED, this);
    }

    RED.nodes.registerType("zwave-motion-sensor", motionSensor);
};

function subscription(RED, node) {
    var isUtf8 = require('is-utf8'),
        flows = require('./js/flows');

    var msg = {},
        zwaveTopic = flows.checkZwaveNodeTopic();

    if (node.topic) {
        node.brokerConn.register(node);
        node.brokerConn.subscribe(node.topic, 2, function (topic, payload, packet) {
            if (isUtf8(payload)) {
                payload = payload.toString();
            }
            try {
                msg.payload = JSON.parse(payload);
            } catch (e) {
                msg.payload = payload;
            }
            (msg.payload === true) ? msg.intent = 1 : msg.intent = 0;
            if (node.mqtt !== null) node.mqtt.publish({
                'payload': msg,
                'qos': 0,
                'retain': true,
                'topic': zwaveTopic + '/' + node.nodeid + '/out'
            });
            node.send(msg);
        }, node.id);
    }
    else {
        node.error(RED._("node-red:mqtt.errors.not-defined"));
    }
    node.on('close', function (done) {
        if (node.brokerConn) {
            node.brokerConn.unsubscribe(node.topic, node.id);
            node.brokerConn.deregister(node, done);
        }
    });
}