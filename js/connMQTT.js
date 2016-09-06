'use strict';

var isUtf8     = require('is-utf8'),
    flows      = require('./flows'),
    switchFunc = require('./devices/switch'),
    remoteFunc = require('./devices/remote');

var msg;

function subscription(RED, node, zwave) {
    var zwaveTopic = flows.checkZwaveNodeTopic();
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
            switch(node.type) {
                case "zwave-binary-switch":
                    switchFunc.binarySwitch(node, zwave, msg);
                    break;

                case "zwave-light-dimmer-switch":
                    switchFunc.lightDimmerSwitch(node, zwave, msg);
                    break;

                case "zwave-remote-control-multi-purpose":
                    remoteFunc.softRemote(node, payload);
                    break;

                default:
                    break;
            }
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
        node.error(RED._("mqtt.errors.not-defined"));
    }
    node.on('close', function(done) {
        if (node.brokerConn) {
            node.brokerConn.unsubscribe(node.topic,node.id);
            node.brokerConn.deregister(node,done);
        }
    });
}

module.exports = {
    'subscription': subscription
};