module.exports = function (RED) {
    'use strict';

    var isUtf8 = require('is-utf8');

    function MQTTInNode(n) {
        RED.nodes.createNode(this, n);
        this.topic = n.topic;
        this.broker = n.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        if (!/^(#$|(\+|[^+#]*)(\/(\+|[^+#]*))*(\/(\+|#|[^+#]*))?$)/.test(this.topic)) {
            return this.warn(RED._("mqtt.errors.invalid-topic"));
        }
        var node = this;
        if (this.brokerConn) {
            this.status({fill: "red", shape: "ring", text: "node-red:common.status.disconnected"});
            if (this.topic) {
                node.brokerConn.register(this);
                this.brokerConn.subscribe(this.topic, 2, function (topic, payload, packet) {
                    /* Original MQTTin code
                     if (isUtf8(payload)) { payload = payload.toString(); }
                     var msg = {topic:topic,payload:payload, qos: packet.qos, retain: packet.retain};
                     if ((node.brokerConn.broker === "localhost")||(node.brokerConn.broker === "127.0.0.1")) {
                     msg._topic = topic;
                     }
                     */

                    // --- Node specific code - begin
                    if (isUtf8(payload)) {
                        payload = payload.toString();
                    }
                    var msg = {topic: topic, payload: payload, intent: payload, qos: packet.qos, retain: packet.retain};
                    switch (payload) {
                        case "TRUE":
                        case "true":
                            msg.payload = 1;
                            msg.intent = 1;
                            msg.message = "The sensor is open";
                            break;

                        case "FALSE":
                        case "false":
                            msg.payload = 0;
                            msg.intent = 0;
                            msg.message = "The sensor is closed";
                            break;

                        default:
                            break;
                    }
                    // --- Node specific code - end
                    node.send(msg);
                }, this.id);
                if (this.brokerConn.connected) {
                    node.status({fill: "green", shape: "dot", text: "node-red:common.status.connected"});
                }
            }
            else {
                this.error(RED._("node-red:mqtt.errors.not-defined"));
            }
            this.on('close', function (done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic, node.id);
                    node.brokerConn.deregister(node, done);
                }
            });
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
    }

    RED.nodes.registerType("zwave-in", MQTTInNode);
};