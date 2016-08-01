'use strict';

var isUtf8     = require('is-utf8'),
    flows      = require('./flows'),
    switchFunc = require('./devices/switch');

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

                default:
                    break;
            }
        }, node.id);
        node.brokerConn.subscribe(node.topicOut,2,function(topic,payload,packet) {
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
            node.send(msg);
            msg.qos = 0;
            msg.retain = true;
            msg.topic = zwaveTopic +  node.nodeid + '/out';
            if(node.mqtt !== null) node.mqtt.publish(msg);
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

module.exports = {
    'subscription': subscription
};