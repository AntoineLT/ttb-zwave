'use strict';

var isUtf8 = require('is-utf8');
var flows = require('./js/flows');

module.exports = function (RED) {

	function main(config) { // from MQTTInNode
		RED.nodes.createNode(this, config);
		var node = this;
		node.config = config;

		var brokerConn = RED.nodes.getNode(node.config.broker);
		if (brokerConn === undefined || brokerConn === null) {
			node.error(RED._("node-red:mqtt.errors.missing-config"));
			console.log("zwave-generic node-red:mqtt.errors.missing-config");
			return;
		}

		var zwaveTopic = flows.checkZwaveNodeTopic();
		var topicpub = zwaveTopic + '/' + node.config.nodeid + '/' + node.config.commandclass + '/' + node.config.classindex;
		//console.log("zwave-generic.js: topicpub " + topicpub);

		brokerConn.register(node);
		brokerConn.subscribe(topicpub, 2, function (topic, payload, packet){
			if (isUtf8(payload)) { payload = payload.toString(); }
			var msg = {};
			try {
				msg.payload = JSON.parse(payload);
			} catch (e) {
				msg.payload = payload;
			}

			// console.log("zwave-generic.js: Node " + node.config.nodeid + " received value: '" + msg.payload + "'");
			
			if (typeof msg.payload === 'number') {
				msg.intensity = msg.payload;
			}
			
			msg.topic = node.config.nodeid;
			msg.commandclass = node.config.commandclass;
			msg.classindexname = node.config.classindexname;

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
			/* Homekeeper
			var path = require('path');
			var mqttCP = require(path.resolve(process.env.NODE_RED_HOME, './nodes/core/io/lib/mqttConnectionPool.js'));
			var mqtt = mqttCP.get(
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
			*/
			node.send(msg);
		}, node.id);

		node.on('close', function (done) {
			if (brokerConn) {
				brokerConn.unsubscribe(topicpub, node.id);
				brokerConn.deregister(node, done);
				}
			});

	}

	RED.nodes.registerType("zwave-generic", main);
	
};
