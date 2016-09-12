'use strict';

module.exports = function(RED) {
    var homeDir = process.env.NODE_RED_HOME;

    var path = require('path'),
        mqttCP = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

    var flows = require('./js/flows'),
        zwave    = require('./js/openZWave').zwave;

    function lightDimmerSwitch(config) {
        RED.nodes.createNode(this, config);
        var zwaveTopic = flows.checkZwaveNodeTopic();
        this.nodeid = config.nodeid;
        this.topic = zwaveTopic + '/' + this.nodeid + '/in';
        this.topicOut = zwaveTopic + '/' + this.nodeid + '/38/0';
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

        this.on('input', function (msg) {
            lightDimmerSwitchFunc(node, zwave, msg);
        });
    }

    RED.nodes.registerType("zwave-light-dimmer-switch", lightDimmerSwitch);
};

function subscription(RED, node, zwave) {
    var isUtf8     = require('is-utf8'),
        flows      = require('./js/flows');

    var msg,
        zwaveTopic = flows.checkZwaveNodeTopic();
    if (node.topic) {
        node.brokerConn.register(node);
        node.brokerConn.subscribe(node.topic,2,function(topic,payload,packet) {
            if (isUtf8(payload)) { payload = payload.toString(); }
            try {
                msg = JSON.parse(payload);
            } catch (e) {
                node.error(e);
            }
            if(typeof msg !== 'object') {
                msg = {
                    payload: msg || payload
                };
            }
            lightDimmerSwitchFunc(node, zwave, msg);
        }, node.id);
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
        node.error(RED._("node-red:mqtt.errors.not-defined"));
    }
    node.on('close', function(done) {
        if (node.brokerConn) {
            node.brokerConn.unsubscribe(node.topic,node.id);
            node.brokerConn.deregister(node,done);
        }
    });
}

function lightDimmerSwitchFunc(node, zwave, msg) {
    var handler = require('./js/handler');

    if(handler.nodes[node.nodeid].classes[38]  !== undefined) {
        var currentValue = handler.nodes[node.nodeid].classes[38][0].value;
        if (msg.status && msg.status === "toggle") {
            if (currentValue <= 50) {
                zwave.setValue(node.nodeid, 38, 1, 0, 99);
            } else if (currentValue > 50) {
                zwave.setValue(node.nodeid, 38, 1, 0, 0);
            }
        } else {
            var intent = (typeof msg.payload !== 'object' && (msg.intent || msg.intent == 0)) ? msg.intent : msg.payload.intent;
            var intensity = parseInt((typeof msg.payload !== 'object') ? msg.intensity : msg.payload.intensity);
            if (intent || intent == 0) {
                switch (intent) {
                    case 0: // close
                        zwave.setValue(node.nodeid, 38, 1, 0, 0);
                        break;

                    case 1: // open
                        zwave.setValue(node.nodeid, 38, 1, 0, 99);
                        break;

                    case 2: // more
                        if (currentValue <= 99) currentValue = currentValue + 10;
                        if (currentValue > 99) currentValue = 99;
                        zwave.setValue(node.nodeid, 38, 1, 0, currentValue);
                        break;

                    case 3: // less
                        if (currentValue >= 0) currentValue = currentValue - 10;
                        if (currentValue < 0) currentValue = 0;
                        zwave.setValue(node.nodeid, 38, 1, 0, currentValue);
                        break;

                    default:
                        break;
                }
            }
            if (intensity || intensity === 0) {
                if (intensity === 100) intensity = 99;
                zwave.setValue(node.nodeid, 38, 1, 0, intensity);
            }
            if (msg.color) zwave.setValue(node.nodeid, 51, 1, 0, msg.color + "0000");
        }
    }
}