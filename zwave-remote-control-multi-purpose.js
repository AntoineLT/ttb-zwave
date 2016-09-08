'use strict';

module.exports = function(RED) {
    var homeDir = process.env.NODE_RED_HOME;

    var path      = require('path'),
        mqttCP    = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

    var flows     = require('./js/flows'),
        zwave     = require('./js/openZWave').zwave;

    var zwaveTopic = flows.checkZwaveNodeTopic();

    function remoteControlMultiPurpose(config) {
        RED.nodes.createNode(this, config);
        this.nodeid = config.nodeid;
        this.push = config.push;
        this.topic = zwaveTopic + this.nodeid + '/scene';
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

    RED.nodes.registerType("zwave-remote-control-multi-purpose", remoteControlMultiPurpose);
};

function subscription(RED, node) {
    var isUtf8 = require('is-utf8');
    var msg;
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
            softRemote(node, payload);
        }, node.id);
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

var timer = undefined,
    count = 0,
    topic = 'zwave/';

var flows = require('./js/flows').readFlows();

for(var i = 0; i < flows.length; i++) {
    if (flows[i].type === 'zwave') {
        topic = flows[i].topic;
        break;
    }
}

function softRemote(node, sceneID) {
    var msgMQTT = {
            qos: 0,
            retain: true,
            topic: topic + node.nodeid + '/out'
        },
        msg = {
            payload: sceneID
        };
    switch (sceneID) {
        case "10":
            msg.intent = 1; // close
            break;

        case "20":
            msg.intent = 2; // more
            break;

        case "30":
            msg.intent = 0; // open
            break;

        case "40":
            msg.intent = 3; // less
            break;

        case "21":
        case "41":
            clearTimeout(timer);
            count = 0;
            break;

        case "22":
            if (node.push === true) {
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

        case "42":
            if (node.push === true) {
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