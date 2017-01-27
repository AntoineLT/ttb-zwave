'use strict';

module.exports = function (RED) {

	function main(config) {
		RED.nodes.createNode(this, config);
		this.config = config;

		subscription(RED, this);
	}

	RED.nodes.registerType("zwave-generic", main);

	RED.httpAdmin.get("/zwave/nodesArray", function (req, res) {
		var nodes = require('./js/handler').nodes;
		if (!nodes) {
			return res.status(400).json({err: "ERROR"});
		}
		res.status(200).json(nodes);
	});
};

function subscription(RED, node) {

	var brokerConn = RED.nodes.getNode(node.config.broker);
	if (brokerConn === undefined || brokerConn === null) {
		node.error(RED._("node-red:mqtt.errors.missing-config"));
		console.log("zwave-generic node-red:mqtt.errors.missing-config");
		return;
	}

	var flows = require('./js/flows'),
		zwaveTopic = flows.checkZwaveNodeTopic(),
		topicpub = zwaveTopic + '/' + node.config.nodeid + '/' + node.config.commandclass + '/' + node.config.classindex;

	brokerConn.register(node);
	brokerConn.subscribe(topicpub, 2, function (topic, payload, packet) {
		
		var msg = {};
		var isUtf8 = require('is-utf8');
		if (isUtf8(payload)) {
			payload = payload.toString();
			}
		try {
			msg.payload = JSON.parse(payload);
		} catch (e) {
			msg.payload = payload;
		}

		// console.log("zwave-generic.js: Node " + node.config.nodeid + " received value: '" + msg.payload + "'");
		
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
		
		var path = require('path'),
			mqttCP = require(path.resolve(process.env.NODE_RED_HOME, './nodes/core/io/lib/mqttConnectionPool.js')),
			mqtt = mqttCP.get(
				brokerConn.broker,
				brokerConn.port
				);
		if (mqtt !== null) 
			mqtt.publish({
			'payload': msg,
			'qos': 0,
			'retain': true,
			'topic': zwaveTopic + '/' + node.config.nodeid + '/out'
		});
		node.send(msg);
	}
	, node.id);

	node.on('close', function (done) {
		if (brokerConn) {
			brokerConn.unsubscribe(topicpub, node.id);
			brokerConn.deregister(node, done);
		}
	});
}
