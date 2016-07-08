module.exports = function(RED) {
    'use strict';

    var homeDir = process.env.NODE_RED_HOME;

    var path      = require('path'),
        isUtf8    = require('is-utf8'),
        openZwave = require('openzwave-shared'),
        mqttCP    = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

    var handler = require('./js/handler.js');

    var zwave = null,
        mqtt  = null,
        zwaveConnected = false,
        mqttConnected = false;

    function zwaveController(config) {
        RED.nodes.createNode(this, config);
        this.topic = config.topic;
        this.broker = config.broker;
        this.brokerConfig = RED.nodes.getNode(this.broker);
        var node = this;
        node.status({
            fill:'grey',
            shape:'dot',
            text:'node-red:common.status.not-connected'
        });
        if(typeof this.brokerConfig != 'undefined') {
            if(!mqtt) {
                mqtt = mqttCP.get(
                    node.brokerConfig.broker,
                    node.brokerConfig.port
                );
                mqtt.on("connectionlost", function() {
                    node.warn("Connection to MQTT lost");
                });
                mqtt.on("connect", function() {
                    node.log("Connection to MQTT established");
                });
                mqtt.connect();
                mqttConnected = true;
            }

            if(!zwave) {
                zwave = new openZwave({
                    SaveConfiguration: false,
                    Logging: false,
                    ConsoleOutput: false,
                    SuppressValueRefresh: true
                });
                zwave.removeAllListeners();
            }
            zwave.lastY = 40;

            zwave.on('driver ready', function(homeid) {
                handler.driverReady(node, homeid);
            });

            zwave.on('driver failed', function() {
                handler.driverFailed(node);
            });

            zwave.on('node added', function(nodeid) {
                handler.nodeAdded(nodeid);
            });

            zwave.on('node ready', function(nodeid, nodeinfo) {
                handler.nodeReady(node, nodeid, nodeinfo);
            });

            zwave.on('value added', function(nodeid, comclass, value) {
                handler.valueAdded(node, mqtt, nodeid, comclass, value);
            });

            zwave.on('value changed', function(nodeid, comclass, value) {
                handler.valueChanged(node, mqtt, nodeid, comclass, value);
            });

            zwave.on('value removed', function(nodeid, comclass, index) {
                handler.valueRemoved(nodeid, comclass, index);
            });

            zwave.on('notification', function(nodeid, notif) {
                handler.notification(node, nodeid, notif);
            });

            zwave.on('scan complete', function() {
                handler.scanComplete(node);
            });

            var zwaveController="/dev/ttyACM0"; // Z-Stick Gen5
            //var zwaveController="/dev/ttyUSB0"; // Z-Stick S2
            if(!zwaveConnected){
                node.status({
                    fill:'blue',
                    shape:'dot',
                    text:'node-red:common.status.connecting'
                });
                zwave.connect(zwaveController);
                zwaveConnected = true;
            } else {
                node.status({
                    fill:'green',
                    shape:'dot',
                    text:'node-red:common.status.connected'
                });
            }

            this.on('close', function() {
                node.log('ZWave node closure!');
                if (zwave) {
                    zwave.disconnect(zwaveController);
                    zwave = null;
                    zwaveConnected = false;
                }
                if (mqtt && mqttConnected) {
                	mqtt.disconnect();
                    mqttConnected = false;
                }
            });
        }
    }
    RED.nodes.registerType("zwave-controller", zwaveController);

    function MQTTInNode(n) {
        RED.nodes.createNode(this,n);
        this.topic = n.topic;
        this.broker = n.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        if (!/^(#$|(\+|[^+#]*)(\/(\+|[^+#]*))*(\/(\+|#|[^+#]*))?$)/.test(this.topic)) {
            return this.warn(RED._("mqtt.errors.invalid-topic"));
        }
        var node = this;
        if (this.brokerConn) {
            this.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
            if (this.topic) {
                node.brokerConn.register(this);
                this.brokerConn.subscribe(this.topic,2,function(topic,payload,packet) {
                    /* Original MQTTin code
                     if (isUtf8(payload)) { payload = payload.toString(); }
                     var msg = {topic:topic,payload:payload, qos: packet.qos, retain: packet.retain};
                     if ((node.brokerConn.broker === "localhost")||(node.brokerConn.broker === "127.0.0.1")) {
                     msg._topic = topic;
                     }
                     */

                    // --- Node specific code - begin
                    if (isUtf8(payload)) { payload = payload.toString(); }
                    var msg = {topic: topic,payload: payload,intent: payload,qos: packet.qos,retain: packet.retain};
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
                // TODO : signaler la correction dans mqtt.js pour le status des mqttIn
                if (this.brokerConn.connected) {
                    node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                }
            }
            else {
                this.error(RED._("mqtt.errors.not-defined"));
            }
            this.on('close', function(done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic,node.id);
                    node.brokerConn.deregister(node,done);
                }
            });
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
    }
    RED.nodes.registerType("zwavein", MQTTInNode);
};