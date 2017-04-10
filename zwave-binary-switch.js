'use strict';

module.exports = function (RED) {
	var homeDir = process.env.NODE_RED_HOME;

	var path = require('path'),
		mqttCP = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

	var flows = require('./js/flows');

	function main(config) {
		RED.nodes.createNode(this, config);
		this.config = config;

		this.brokerConn = RED.nodes.getNode(config.broker);
		if (this.brokerConn === undefined || this.brokerConn === null) {
			this.error(RED._("node-red:mqtt.errors.missing-config"));
			return;
		}

		var zwaveTopic = flows.checkZwaveNodeTopic();
		this.topic = zwaveTopic + '/' + config.nodeid + '/' + config.commandclass + '/' + config.classindex;
		this.topicIn = zwaveTopic + '/' + config.nodeid + '/in';
		// console.log("Node " + config.nodeid + " subscribed to '" + this.topic + "'");
		
		this.mqtt = mqttCP.get(
			this.brokerConn.broker,
			this.brokerConn.port
		);

		var zwave = require('./js/openZWave').zwave;

		subscription(RED, this, zwave);

		var node = this;
		this.on('input', function (msg) {
			SwitchFunc(node, zwave, msg);
		});
	}

	RED.nodes.registerType("zwave-binary-switch", main);

	RED.httpAdmin.get("/zwave/nodesArray", function (req, res) {
		var nodes = require('./js/handler').nodes;
		if (!nodes) {
			return res.status(400).json({err: "ERROR"});
		}
		res.status(200).json(nodes);
	});
};

function subscription(RED, node, zwave) {
	var isUtf8 = require('is-utf8'),
		flows = require('./js/flows');

	var msg = {},
		zwaveTopic = flows.checkZwaveNodeTopic();

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
				console.log("#Exception '" + e + "' in zwave-binary-switch/subscription for Node " + node.config.nodeid + " received value: '" + msg.payload + "'");
			}

			// console.log("Node " + node.config.nodeid + " received value: '" + msg.payload + "'");
			
			if (typeof msg.payload === 'number') {
				msg.intensity = msg.payload;
			}
			
			if(msg.payload === true || msg.payload==1 || msg.payload=="1" ) {
				msg.payload = 1;
				msg.intent = 1;
				msg.message = "Sensor On";
			}
			
			if(msg.payload === false || msg.payload==0 || msg.payload=="0") {
				msg.payload = 0;
				msg.intent = 0;
				msg.message = "Sensor Off";
			}
			/*
			if (node.mqtt !== null) node.mqtt.publish({
				'payload': msg,
				'qos': 0,
				'retain': true,
				'topic': zwaveTopic + '/' + node.config.nodeid + '/out'
			});
			*/
			node.send(msg);
		}, node.id);
	}
	else {
		node.error(RED._("node-red:mqtt.errors.not-defined"));
	}

	if (node.topicIn) {
		node.brokerConn.register(node);
		node.brokerConn.subscribe(node.topicIn, 2, function (topic, payload, packet) {
			if (isUtf8(payload)) {
				payload = payload.toString();
			}
			try {
				msg = JSON.parse(payload);
			} catch (e) {
				console.log("#Exception '" + e + "' in zwave-binary-switch/subscription for Node " + node.config.nodeid + " received value: '" + msg.payload + "'");
				msg.payload = payload;
			}
			SwitchFunc(node, zwave, msg);
		}, node.id);
	}
	else {
		node.error(RED._("node-red:mqtt.errors.not-defined"));
	}

	node.on('close', function (done) {
		if (node.brokerConn) {
			node.brokerConn.unsubscribe(node.topic, node.id);
			node.brokerConn.unsubscribe(node.topicIn, node.id);
			node.brokerConn.deregister(node, done);
		}
	});
}

function SwitchFunc(node, zwave, msg) {
	var handler = require('./js/handler');

	if (handler.nodes[node.config.nodeid].classes[37] !== undefined) {
		if (msg.status && msg.status === "toggle") {
			var currentValue = handler.nodes[node.config.nodeid].classes[37][0].value;
			if (currentValue === false) {
				zwave.setValue(node.config.nodeid, 37, 1, 0, true);
			} else if (currentValue === true) {
				zwave.setValue(node.config.nodeid, 37, 1, 0, false);
			}
		} else {
			if (msg.intent || msg.intent == 0) {
				switch (msg.intent) {
					case 0: // close
						zwave.setValue(node.config.nodeid, 37, 1, 0, false);
						break;

					case 1: // open
						zwave.setValue(node.config.nodeid, 37, 1, 0, true);
						break;
				}
			}
		}
	}
	
	if (handler.nodes[node.config.nodeid].classes[38] !== undefined) {
			if (msg.intent || msg.intent == 0) {
				switch (msg.intent) {
					case 0: // close
						zwave.setValue(node.config.nodeid, 38, 1, 0, false);
						break;

					case 1: // open
						zwave.setValue(node.config.nodeid, 38, 1, 0, true);
						break;
				}
			}	
	}
	
	
}