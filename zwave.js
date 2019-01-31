'use strict';

module.exports = function (RED) {

	var path = require("path");
	var mqtt = require("mqtt"); // https://www.npmjs.com/package/mqtt


	var handler = require('./js/handler');
	var zwave = require('./js/openZWave').zwave;

	var zwaveConnected = false;
	var mqttConnected = false;
	var mqtt = null;

	function main(config) { // copied from MQTTOutNode
	
		RED.nodes.createNode(this, config);
		this.topic = config.topic;
		this.broker = config.broker;
		this.brokerConn = RED.nodes.getNode(this.broker);
		var node = this;

		if (this.brokerConn) {
			mqtt = this.brokerConn;
			
			this.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});


			zwave.lastY = [];

			zwave.on('driver ready', function (homeid) {
				handler.driverReady(node, RED, homeid);
			});

			zwave.on('driver failed', function () {
				handler.driverFailed(node);
			});

			zwave.on('node added', function (nodeid) {
      //.log('Node added: nodeid:'+ nodeid);
				handler.nodeAdded(nodeid);
				var mess = "Node " + nodeid + " is added";
				var msg = {
					payload: mess,
					message: mess,
					ready: false,
					topic: nodeid
				};
				node.send(msg);
			});

			zwave.on('node ready', function (nodeid, nodeinfo) {
				handler.nodeReady(node, RED, zwave, mqtt, nodeid, nodeinfo);
				var device = nodeinfo.type + " (" + nodeinfo.product + ")";
				var mess = "Node " + nodeid + " - " + device + " is ready";
				var msg = {
					payload: mess,
					message: mess,
					device: device,
					ready: true,
					topic: nodeid
				};
				node.send(msg);
			});

			// first time device detected
			zwave.on('value added', function (nodeid, comclass, value) {
				handler.valueAdded(node, RED, zwave, mqtt, nodeid, comclass, value);
				//node.send({payload:"value added!" + comclass + " / " + value});
			});

			// changed device's state
			zwave.on('value changed', function (nodeid, comclass, value) {
				handler.valueChanged(node, mqtt, nodeid, comclass, value);
			});

			zwave.on('value removed', function (nodeid, comclass, index) {
				handler.valueRemoved(node, nodeid, comclass, index);
			});

			zwave.on('scene event', function (nodeid, sceneid) {
				handler.sceneEvent(node, mqtt, nodeid, sceneid);
			});

			zwave.on('notification', function (nodeid, notif) {
				handler.notification(node, nodeid, notif);
			});

			zwave.on('scan complete', function () {
				handler.scanComplete(RED, node);
			});

			var zwaveUSB = "/dev/ttyACM0"; // Z-Stick Gen5
			//var zwaveUSB="/dev/ttyUSB0"; // Z-Stick S2

			if (!zwaveConnected) {
				node.status({
					fill: 'blue',
					shape: 'dot',
					text: 'node-red:common.status.connecting'
				});
				zwave.connect(zwaveUSB);
				zwaveConnected = true;
			} else {
				node.status({
					fill: 'green',
					shape: 'ring',
					text: 'node-red:common.status.connected'
				});
			}
			
			node.brokerConn.register(node);
			
			this.on('close', function (done) {
				node.brokerConn.deregister(node,done);
				if (zwave && zwaveConnected) {
					zwave.removeAllListeners();
					//zwave.disconnect(zwaveUSB);
					//zwaveConnected = false;
				}

			});
		}
	}

	RED.nodes.registerType("zwave", main);
	
	
	RED.httpAdmin.get("/zwave/nodesArray", function (req, res) {
		var nodes = require('./js/handler').nodes;
		if (!nodes) {
			return res.status(400).json({err: "ERROR"});
		}
		res.status(200).json(nodes);
	});
	
};