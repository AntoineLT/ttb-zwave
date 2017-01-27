'use strict';

module.exports = function (RED) {


	function main(config) {
		RED.nodes.createNode(this, config);
		this.config = config;


		subscription(RED, this);
	}

	RED.nodes.registerType("nodonSoftRemote", main);
};

function subscription(RED, node) {

	node.brokerConn = RED.nodes.getNode(node.config.broker);
	if (node.brokerConn === undefined || node.brokerConn === null) {
		node.error(RED._("node-red:mqtt.errors.missing-config"));
		return;
	}

	var flows = require('./js/flows'),
		zwaveTopic = flows.checkZwaveNodeTopic(),
		topicpub = zwaveTopic + '/' + node.config.nodeid + '/scene';

	node.brokerConn.register(node);
	node.brokerConn.subscribe(topicpub, 2, function (topic, payload, packet) {

		var msg = {}; // !!! unused
		var isUtf8 = require('is-utf8');
		if (isUtf8(payload)) {
			payload = payload.toString();
			}
		try {
			msg.payload = JSON.parse(payload);
		} catch (e) {
			msg.payload = payload;
		}

		publishStatusOut(node, msg.payload /* sceneID ??? */);
		
		node.send(msg);
			
		}
		, node.id);
	
	node.on('close', function (done) {
		if (node.brokerConn) {
			node.brokerConn.unsubscribe(topicpub, node.id);
			node.brokerConn.deregister(node, done);
		}
	});
}

var timer = undefined,
    count = 0;

function publishStatusOut(node, sceneID) {
	var topic = require('./js/flows').checkZwaveNodeTopic();
	
	var msgMQTT = {
			qos: 0,
			retain: true,
			topic: topic + '/' + node.config.nodeid + '/out'
		};
		
	var msg = {
			payload: sceneID
		};

	var path = require('path'),
		mqttCP = require(path.resolve(process.env.NODE_RED_HOME, './nodes/core/io/lib/mqttConnectionPool.js')),
		mqtt = mqttCP.get(
			node.brokerConn.broker,
			node.brokerConn.port
			);

	switch (sceneID) {
		case 10:
			msg.intent = 1; // close
			break;

		case 20:
			msg.intent = 2; // more
			break;

		case 30:
			msg.intent = 0; // open
			break;

		case 40:
			msg.intent = 3; // less
			break;

		case 21:
		case 41:
			clearTimeout(timer);
			count = 0;
			break;
/*
		case 22:
			if (node.config.push === true) {
				count++;
				if (count >= 20) break;
				msg.intent = 2; // more
				msgMQTT.payload = {
					'payload': msg.payload,
					'intent': msg.intent
				};
				timer = setTimeout(function () {
					if (mqtt != null)  
						mqtt.publish(msgMQTT);
					publishStatusOut(node, sceneID);
				}, 1000);
			}
			break;

		case 42:
			if (node.config.push === true) {
				count++;
				if (count >= 20) break;
				msg.intent = 3; // less
				msgMQTT.payload = {
					'payload': msg.payload,
					'intent': msg.intent
				};
				timer = setTimeout(function () {
					if (mqtt != null) mqtt.publish(msgMQTT);
					publishStatusOut(node, sceneID);
				}, 1000);
			}
			break;
*/
		default:
			break;
	}

	msgMQTT.payload = {
		'payload': msg.payload,
		'intent': msg.intent
	};
	
	if (mqtt != null)  
		mqtt.publish(msgMQTT);
	

}

