'use strict';


module.exports = function (RED) {

	function main(config) {
		RED.nodes.createNode(this, config);
		this.config = config;
		
		//this.status({fill:"red",shape:"ring",text:""+Date.now() });
		//console.log("setStatus");

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

	var topicpub = "zwave" + '/' + node.config.nodeid + '/scene';

	node.brokerConn.register(node);
	node.brokerConn.subscribe(topicpub, 2, function (topic, payload, packet) {
		
	//console.log("payload[0]:", payload[0]);
	//console.log("payload[1]:", payload[1]);

	var msg = {payload:payload}; // let the device outpout unchanged

	switch (payload[0]) {
	case 49:
		msg.intent = 1; // open
		break;

	case 51:
		msg.intent = 0; // close
		break;

	case 50:
		msg.intent = 2; // more
		break;

	case 52:
		msg.intent = 3; // less
		break;
	/*

			case "21":
			case "41":
				clearTimeout(timer);
				count = 0;
				break;
			case "22":
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

			case "42":
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
			node.warn("no intent");
			break;
	}

		//publishStatusOut(node, msg.payload /* sceneID ??? */);
		
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
	
	var msgMQTT = {
			qos: 0,
			retain: true,
			topic: "zwave" + '/' + node.config.nodeid + '/out'
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

	msgMQTT.payload = {
		'payload': msg.payload,
		'intent': msg.intent
	};
	
	if (mqtt != null)  
		mqtt.publish(msgMQTT);
	

}

