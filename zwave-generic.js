'use strict';

module.exports = function (RED) {
    var homeDir = process.env.NODE_RED_HOME;

    var path = require('path'),
        mqttCP = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

    var flows = require('./js/flows');

    function zwaveGenericNode(config) {
        RED.nodes.createNode(this, config);
        var zwaveTopic = flows.checkZwaveNodeTopic();
        this.nodeid = config.nodeid;
        this.commandclass = config.commandclass;
        this.classindex = config.classindex;
        this.topic = zwaveTopic + '/' + this.nodeid + '/' + this.commandclass + '/' + this.classindex;
        this.broker = config.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        var node = this;

        node.mqtt = mqttCP.get(
            node.brokerConn.broker,
            node.brokerConn.port
        );

        if (node.brokerConn) {
            subscription(RED, node);
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
    }

    RED.nodes.registerType("zwave-generic", zwaveGenericNode);

    RED.httpAdmin.get("/zwave/nodesArray", function (req, res) {
        var nodes = require('./js/handler').nodes;
        if (!nodes) {
            return res.status(400).json({err: "ERROR"});
        }
        res.status(200).json(nodes);
    });

    function subscription(RED, node) {
        var isUtf8 = require('is-utf8');
        var msg = {};
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
};