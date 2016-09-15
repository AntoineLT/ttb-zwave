'use strict';

module.exports = function (RED) {
    var homeDir = process.env.NODE_RED_HOME;

    var path = require('path'),
        mqttCP = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

    var flows = require('./js/flows');

    function main(config) {
        RED.nodes.createNode(this, config);
        this.config = config;

        this.brokerConn = RED.nodes.getNode(config.broker);
        if (this.brokerConn === undefined || this.brokerConn === null) {
            this.error(RED._("node-red:mqtt.errors.missing-config"));
            return;
        }

        var zwaveTopic = flows.checkZwaveNodeTopic();
        this.topic = zwaveTopic + '/' + config.nodeid + '/' + config.commandclass + '/' + config.classindex;

        this.mqtt = mqttCP.get(
            this.brokerConn.broker,
            this.brokerConn.port
        );

        subscription(RED, this);
    }

    RED.nodes.registerType("zwave-generic", main);

    RED.httpAdmin.get("/zwave/nodesArray", function (req, res) {
        var nodes = require('./js/handler').nodes;
        if (!nodes) {
            return res.status(400).json({err: "ERROR"});
        }
        res.status(200).json(nodes);
    });
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

            if (node.mqtt !== null) node.mqtt.publish({
                'payload': msg,
                'qos': 0,
                'retain': true,
                'topic': zwaveTopic + '/' + node.config.nodeid + '/out'
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