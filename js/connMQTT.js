'use strict';

var isUtf8 = require('is-utf8'),
    switchFunc = require('./devices/switch');

function subscription(RED, node, zwave) {
    //node.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
    if (node.topic) {
        node.brokerConn.register(node);
        node.brokerConn.subscribe(node.topic,2,function(topic,payload,packet) {
            /* Original MQTTin code
             if (isUtf8(payload)) { payload = payload.toString(); }
             var msg = {topic:topic,payload:payload, qos: packet.qos, retain: packet.retain};
             if ((node.brokerConn.broker === "localhost")||(node.brokerConn.broker === "127.0.0.1")) {
             msg._topic = topic;
             }
             */

            // --- Node specific code - begin
            var msg;
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
            switchFunc.binarySwitch(node, zwave, msg);
            // --- Node specific code - end
            //node.send(msg);
        }, node.id);
        //if (node.brokerConn.connected) {
        //    node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
        //}
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