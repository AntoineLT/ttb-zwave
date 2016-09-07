module.exports = function(RED) {
    'use strict';

    var homeDir = process.env.NODE_RED_HOME;

    var path      = require('path'),
        mqttCP    = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

    var flows     = require('./js/flows'),
        connMQTT  = require('./js/connMQTT'),
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
            connMQTT.subscription(RED, node, zwave);
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
    }

    RED.nodes.registerType("zwave-remote-control-multi-purpose", remoteControlMultiPurpose);
};