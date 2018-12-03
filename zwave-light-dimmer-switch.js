'use strict';

module.exports = function (RED) {
	var homeDir = process.env.NODE_RED_HOME;

	var path = require('path');
	var mqttCP = require(path.resolve(homeDir, './nodes/core/io/lib/mqttConnectionPool.js'));

	var flows = require('./js/flows');

	function main(config) { // from MQTTInNode
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

	RED.nodes.registerType("zwave-light-dimmer-switch", main);

	RED.httpAdmin.get("/zwave/nodesArray", function (req, res) {
		var nodes = require('./js/handler').nodes;
		if (!nodes) {
			return res.status(400).json({err: "ERROR"});
		}
		res.status(200).json(nodes);
	});
};

function subscription(RED, node, zwave) {
	var isUtf8 = require('is-utf8');
	var flows = require('./js/flows');

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
				console.log("#Exception '" + e + "' in zwave-light-dimmer-switch/subscription for Node " + node.config.nodeid + " received value: '" + msg.payload + "'");
			}
			/* ???
			if (msg.payload >= 50) 
				msg.intent = 1;
			else
				msg.intent = 0;
			*/
			/*
			if (node.mqtt !== null) 
				node.mqtt.publish({
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
				console.log("#Exception '" + e + "' in zwave-light-dimmer-switch/subscription for Node " + node.config.nodeid + " received value: '" + msg.payload + "'");
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

	if (handler.nodes[node.config.nodeid] && handler.nodes[node.config.nodeid].ready && handler.nodes[node.config.nodeid].classes[38] !== undefined) {
		
		var currentValue = handler.nodes[node.config.nodeid].classes[38][0].value;
		
		// ---- toggle ----------------------------------------------------------------
		/*
		if (msg.status && msg.status === "toggle") {
			if (currentValue <= 50) {
				zwave.setValue(node.config.nodeid, 38, 1, 0, 99);
			} else if (currentValue > 50) {
				zwave.setValue(node.config.nodeid, 38, 1, 0, 0);
			}
		} 
		*/
		// ---- intents  ----------------------------------------------------------------
		
		var intent = (msg.intent ? msg.intent : msg.payload);

		switch (intent) {
			case 0: // close
				zwave.setValue(node.config.nodeid, 38, 1, 0, 0);
				break;

			case 1: // open
				zwave.setValue(node.config.nodeid, 38, 1, 0, 99);
				break;

			case 2: // more
				if (currentValue <= 99)
					currentValue = currentValue + 10;
				if (currentValue > 99)
					currentValue = 99;
				
				setIntensity(node.config.nodeid, currentValue);
				break;

			case 3: // less
				if (currentValue >= 0) 
					currentValue = currentValue - 10;
				if (currentValue < 0) 
					currentValue = 0;
				setIntensity(node.config.nodeid, currentValue);
				break;

			default:
				break;
		}
		
		// ---- intensity  ----------------------------------------------------------------
		

		var intensity = msg.intensity;
		if (intensity) {
			if (intensity === 100) intensity = 99;
			setIntensity(node.config.nodeid, intensity);
		}

		
		// ---- color  ----------------------------------------------------------------
		
		if (msg.color) {
			zwave.setValue(node.config.nodeid, 51, 1, 0, msg.color + "0000");
		}
	}
	
	function setIntensity (nodeid, intensity) {
		node.warn("intensity: " + intensity);
		zwave.setValue(nodeid, 38, 1, 0, intensity);
	}
	
}

