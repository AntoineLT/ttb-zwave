'use strict';

module.exports = function(RED) {
    var homeDir = process.env.NODE_RED_HOME;

    var path      = require('path'),
        mqttCP    = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

    var flows     = require('./js/flows'),
        zwave     = require('./js/openZWave').zwave;

    var zwaveTopic = flows.checkZwaveNodeTopic();

    function motionSensor(config) {
        RED.nodes.createNode(this, config);
        this.nodeid = config.nodeid;
        this.topic = zwaveTopic + this.nodeid + '/in';
        this.topicOut = zwaveTopic + this.nodeid + '/48/0';
        this.broker = config.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        var node = this;
        node.mqtt = mqttCP.get(
            node.brokerConn.broker,
            node.brokerConn.port
        );

        if (node.brokerConn) {
            subscription(RED, node, zwave);
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
    }

    RED.nodes.registerType("zwave-motion-sensor", motionSensor);
};

function subscription(RED, node, zwave) {
    var isUtf8     = require('is-utf8'),
        flows      = require('./js/flows');

    var msg,
        zwaveTopic = flows.checkZwaveNodeTopic();

    if (node.topic) {
        node.brokerConn.register(node);
        if(node.topicOut !== undefined) {
            node.brokerConn.subscribe(node.topicOut, 2, function (topic, payload, packet) {
                if (isUtf8(payload)) {
                    payload = payload.toString();
                }
                try {
                    msg = JSON.parse(payload);
                } catch (e) {
                    node.error(e);
                }
                if (typeof msg !== 'object') {
                    msg = {
                        payload: msg || payload,
                        intent: (((msg || payload) === true)||((msg || payload) >= 50))? 1 : 0
                    };
                }
                switch(msg.payload) {
                    case "true":
                    case "TRUE":
                        msg.payload = true;
                        break;

                    case "false":
                    case "FALSE":
                        msg.payload = false;
                        break;

                    default:
                        break;
                }
                var msgMQTT = {
                    'payload': msg,
                    'qos': 0,
                    'retain': true,
                    'topic': zwaveTopic + node.nodeid + '/out'
                };
                if (node.mqtt !== null) node.mqtt.publish(msgMQTT);
                node.send(msg);
            }, node.id);
        }
    }
    else {
        node.error(RED._("mqtt.errors.not-defined"));
    }
    node.on('close', function(done) {
        if (node.brokerConn) {
            node.brokerConn.unsubscribe(node.topic,node.id);
            node.brokerConn.deregister(node,done);
        }
    });
}