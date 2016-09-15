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
        this.topic = zwaveTopic + '/' + config.nodeid + '/scene';

        this.mqtt = mqttCP.get(
            this.brokerConn.broker,
            this.brokerConn.port
        );

        subscription(RED, this);
    }

    RED.nodes.registerType("zwave-remote-control-multi-purpose", main);
};

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

            softRemote(node, msg.payload);
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

var timer = undefined,
    count = 0;

function softRemote(node, sceneID) {
    var topic = require('./js/flows').checkZwaveNodeTopic();
    var msgMQTT = {
            qos: 0,
            retain: true,
            topic: topic + '/' + node.config.nodeid + '/out'
        },
        msg = {
            payload: sceneID
        };
    switch (sceneID) {
        case 10:
            msg.intent = 1; // close
            break;

        case 20:
            msg.intent = 2; // more
            break;

        case 30:
            msg.intent = 0; // open
            break;

        case 40:
            msg.intent = 3; // less
            break;

        case 21:
        case 41:
            clearTimeout(timer);
            count = 0;
            break;

        case 22:
            if (node.config.push === true) {
                count++;
                if (count >= 20) break;
                msg.intent = 2; // more
                msgMQTT.payload = {
                    'payload': msg.payload,
                    'intent': msg.intent
                };
                timer = setTimeout(function () {
                    if (node.mqtt != null)  node.mqtt.publish(msgMQTT);
                    node.send(msg);
                    softRemote(node, sceneID);
                }, 1000);
            }
            break;

        case 42:
            if (node.config.push === true) {
                count++;
                if (count >= 20) break;
                msg.intent = 3; // less
                msgMQTT.payload = {
                    'payload': msg.payload,
                    'intent': msg.intent
                };
                timer = setTimeout(function () {
                    if (node.mqtt != null) node.mqtt.publish(msgMQTT);
                    node.send(msg);
                    softRemote(node, sceneID);
                }, 1000);
            }
            break;

        default:
            break;
    }

    msgMQTT.payload = {
        'payload': msg.payload,
        'intent': msg.intent
    };
    if (node.mqtt != null)  node.mqtt.publish(msgMQTT);
    node.send(msg);
}