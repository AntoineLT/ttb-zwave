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
        this.topicIn = zwaveTopic + '/' + config.nodeid + '/in';

        this.mqtt = mqttCP.get(
            this.brokerConn.broker,
            this.brokerConn.port
        );

        var zwave = require('./js/openZWave').zwave;

        subscription(RED, this, zwave);

        var node = this;
        this.on('input', function (msg) {
            lightDimmerSwitchFunc(node, zwave, msg);
        });
    }

    RED.nodes.registerType("zwave-light-dimmer-switch", main);

    RED.httpAdmin.get("/zwave/nodesArray", function (req, res) {
        var nodes = require('./js/handler').nodes;
        if (!nodes) {
            return res.status(400).json({err: "ERROR"});
        }
        res.status(200).json(nodes);
    });
};

function subscription(RED, node, zwave) {
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
            (msg.payload >= 50) ? msg.intent = 1 : msg.intent = 0;
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

    if (node.topicIn) {
        node.brokerConn.register(node);
        node.brokerConn.subscribe(node.topicIn, 2, function (topic, payload, packet) {
            if (isUtf8(payload)) {
                payload = payload.toString();
            }
            try {
                msg = JSON.parse(payload);
            } catch (e) {
                msg.payload = payload;
            }
            lightDimmerSwitchFunc(node, zwave, msg);
        }, node.id);
    }
    else {
        node.error(RED._("node-red:mqtt.errors.not-defined"));
    }

    node.on('close', function (done) {
        if (node.brokerConn) {
            node.brokerConn.unsubscribe(node.topic, node.id);
            node.brokerConn.unsubscribe(node.topicIn, node.id);
            node.brokerConn.deregister(node, done);
        }
    });
}

function lightDimmerSwitchFunc(node, zwave, msg) {
    var handler = require('./js/handler');

    if (handler.nodes[node.config.nodeid].classes[38] !== undefined) {
        var currentValue = handler.nodes[node.config.nodeid].classes[38][0].value;
        if (msg.status && msg.status === "toggle") {
            if (currentValue <= 50) {
                zwave.setValue(node.config.nodeid, 38, 1, 0, 99);
            } else if (currentValue > 50) {
                zwave.setValue(node.config.nodeid, 38, 1, 0, 0);
            }
        } else {
            var intent = (typeof msg.payload !== 'object' && (msg.intent || msg.intent == 0)) ? msg.intent : msg.payload.intent;
            var intensity = parseInt((typeof msg.payload !== 'object') ? msg.intensity : msg.payload.intensity);
            if (intent || intent == 0) {
                switch (intent) {
                    case 0: // close
                        zwave.setValue(node.config.nodeid, 38, 1, 0, 0);
                        break;

                    case 1: // open
                        zwave.setValue(node.config.nodeid, 38, 1, 0, 99);
                        break;

                    case 2: // more
                        if (currentValue <= 99) currentValue = currentValue + 10;
                        if (currentValue > 99) currentValue = 99;
                        zwave.setValue(node.config.nodeid, 38, 1, 0, currentValue);
                        break;

                    case 3: // less
                        if (currentValue >= 0) currentValue = currentValue - 10;
                        if (currentValue < 0) currentValue = 0;
                        zwave.setValue(node.config.nodeid, 38, 1, 0, currentValue);
                        break;

                    default:
                        break;
                }
            }
            if (intensity || intensity === 0) {
                if (intensity === 100) intensity = 99;
                zwave.setValue(node.config.nodeid, 38, 1, 0, intensity);
            }
            if (msg.color) zwave.setValue(node.config.nodeid, 51, 1, 0, msg.color + "0000");
        }
    }
}