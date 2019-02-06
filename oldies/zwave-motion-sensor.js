<'use strict';

module.exports = function (RED) {
	var homeDir = process.env.NODE_RED_HOME;

	var path = require('path'),
		mqttCP = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

	function main(config) {
		RED.nodes.createNode(this, config);
		this.config = config;

		this.brokerConn = RED.nodes.getNode(config.broker);
		if (this.brokerConn === undefined || this.brokerConn === null) {
			this.error(RED._("node-red:mqtt.errors.missing-config"));
			return;
		}

		this.topic = "zwave" + '/' + config.nodeid + '/' + config.commandclass + '/' + config.classindex;

		// console.log("Node " + config.nodeid + " subscribed to '" + this.topic + "'");
		
		this.mqtt = mqttCP.get(
			this.brokerConn.broker,
			this.brokerConn.port
		);

		subscription(RED, this);
	}

	RED.nodes.registerType("zwave-motion-sensor", main);

	RED.httpAdmin.get("/zwave/nodesArray", function (req, res) {
		var nodes = require('./js/handler').nodes;
		if (!nodes) {
			return res.status(400).json({err: "ERROR"});
		}
		res.status(200).json(nodes);
	});
};

function subscription(RED, node) {
	var isUtf8 = require('is-utf8');

	var msg = {};

	if (node.topic) {
		node.brokerConn.register(node);
		node.brokerConn.subscribe(node.topic, 2, function (topic, payload, packet) {
			if (isUtf8(payload)) {
				payload = payload.toString();
			}
			try {
				msg.payload = JSON.parse(payload);
			} catch (e) {
				msg.payload = payload;
			}

			// console.log("Node " + node.config.nodeid + " received value: '" + msg.payload + "'");
			
			if (typeof msg.payload === 'number') {
				msg.intensity = msg.payload;
			}
			
			if(msg.payload === true) {
				msg.payload = 1;
				msg.intent = 1;
				msg.message = "Sensor On";
			}
			
			if(msg.payload === false) {
				msg.payload = 0;
				msg.intent = 0;
				msg.message = "Sensor Off";
			}
			/*
			if (node.mqtt !== null) node.mqtt.publish({
				'payload': msg,
				'qos': 0,
				'retain': true,
				'topic': "zwave" + '/' + node.config.nodeid + '/out'
			});
			*/
			node.send(msg);
		}, node.id);
	}
	else {
		node.error(RED._("node-red:mqtt.errors.not-defined"));
	}
	node.on('close', function (done) {
		if (node.brokerConn) {
			node.brokerConn.unsubscribe(node.topic, node.id);
			node.brokerConn.deregister(node, done);
		}
	});
}