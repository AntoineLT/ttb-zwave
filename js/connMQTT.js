'use strict';

var isUtf8 = require('is-utf8'),
    switchFunc = require('./devices/switch');

var msg;

function subscription(RED, node, zwave, mqtt) {
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
            msg.qos = 1;
            msg.retain = false;
            msg.topic = (RED.nodes.getNode('zwave-node').topic || 'zwave/') +  node.nodeid + '/out';
            if(typeof mqtt != 'undefined') mqtt.publish(msg);
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