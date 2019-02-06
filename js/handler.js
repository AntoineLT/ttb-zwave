'use strict';

var	deviceNode = require('./deviceNode');

//var nisutil = require(process.env.NODE_RED_HOME+"/node_modules/nisutil");
var nodes = [];

function driverReady(node, RED, homeid) {
	node.log('Driver ready');
	node.log('Scanning homeid=0x' + homeid.toString(16) + '...');
	node.status({
		fill: 'blue',
		shape: 'dot',
		text: 'node-red:common.status.connecting'
	});
}

function driverFailed(node) {
	node.warn('Failed to start Z-wave driver');
	node.status({
		fill: 'yellow',
		shape: 'ring',
		text: 'node-red:common.status.error'
	});
}

function nodeAdded(nodeid) {
	nodes[nodeid] = {
		manufacturer: '',
		manufacturerid: '',
		product: '',
		producttype: '',
		productid: '',
		type: '',
		name: '',
		loc: '',
		classes: {},
		ready: false
	};
}

function nodeReady(node, RED, zwave, mqtt, nodeid, nodeinfo) {
	//node.log('node ready: nodeid:'+ nodeid + ", nodeinfo:");
	//nisutil.dumpPropsHex("nodeinfo:", nodeinfo, 1, false);

	var productIDTotal = nodeinfo.manufacturerid + "-" + nodeinfo.producttype + "-" + nodeinfo.productid;
	node.log("node ready: nodeid:" + nodeid + ", " + nodeinfo.manufacturer + " " + nodeinfo.product + " (" + nodeinfo.type + " '" + productIDTotal + "')");
	/*
	node.log("nodeinfo.product:" + nodeinfo.product);
	node.log("nodeinfo.type:" + nodeinfo.type);
	*/
	nodes[nodeid].manufacturer = nodeinfo.manufacturer;
	nodes[nodeid].manufacturerid = nodeinfo.manufacturerid;
	nodes[nodeid].product = nodeinfo.product;
	nodes[nodeid].producttype = nodeinfo.producttype;
	nodes[nodeid].productid = nodeinfo.productid;
	nodes[nodeid].type = nodeinfo.type;
	nodes[nodeid].name = nodeinfo.name;
	nodes[nodeid].loc = nodeinfo.loc;
	nodes[nodeid].ready = true;

	//node.log('node ready '+nodeid+': '
	//+((nodeinfo.manufacturer) ? nodeinfo.manufacturer : ' id=' + nodeinfo.manufacturerid)+', '
	//+((nodeinfo.product) ? nodeinfo.product : 'product=' + nodeinfo.productid + ', type=' + nodeinfo.producttype));
	if (nodeinfo.manufacturer && nodeinfo.product) {
		var productInfo = nodeinfo.product.replace(/ /g, '');

		if (nodeid !== 1) { // the 1 is the ZWave stick
			deviceNode.newdeviceMQTT(zwave, mqtt, nodeid, nodeinfo);
		}

		for (var comclass in nodes[nodeid]['classes']) {
			if (nodes[nodeid]['classes'].hasOwnProperty(comclass)) {
				switch (comclass) {
					case 0x25: // COMMAND_CLASS_SWITCH_BINARY
					case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
						zwave.enablePoll(nodeid, comclass);
						break;
				}
			}
		}

		dumpNodes(node) // Log

		}
	if (mqtt !== null) mqtt.publish({
		'qos': 0,
		'retain': false,
		'topic': "zwave" + '/nodeready/' + nodeid,
		'payload': true
	});
}

function dumpNodes(node) {
		node.log("--- ZWave Dongle ---------------------");
		for (var i = 1; i < nodes.length; i++) {
			if (nodes[i] === null || typeof nodes[i] === 'undefined') {
				node.log("node: [" + i + "] empty");
				continue;
			}
			if (nodes[i].hasOwnProperty("ready") && nodes[i].ready === true) {
				node.log("node: [" + i + "] " + (nodes[i].manufacturer == "" ? nodes[i].manufacturer + ", " : "") + nodes[i].product + " (" + nodes[i].type + ")");
			} else {
				var alive=" ";
				//nisutil.dumpPropsHex("nodes[i].classes):", nodes[i].classes, 1, false);
				if(Object.keys(nodes[i].classes).length > 1) //!!! don't know why : the commandclass 32 is temporarily present...
					alive = "alive but ";
				node.log("node: [" + i + "] "+alive+"no infos yet");
			}
		}
		node.log("--------------------------------------");
}

function valueAdded(node, RED, zwave, mqtt, nodeid, comclass, value) {
	// node : node object from Node-RED (object)
	// RED : RED global object (object)
	// zwave : openzwave object (object)
	// mqtt : mqtt client (object)
	// nodeid : device id in ZWave network (int)
	// comclass : Zwave command class (int)
	// value : callback result of listener (object)

	node.log('value added: nodeid:'+ nodeid + " comclass:" + comclass + ", value[" + value.index + "] " + value.label +"  = " + value.value);
	//nisutil.dumpPropsHex("value:", value, 1, false);

	if (!nodes[nodeid].classes[comclass])
		nodes[nodeid].classes[comclass] = {};

	nodes[nodeid].classes[comclass][value.index] = value;

	if (mqtt != null) {
		mqtt.publish({
			'qos': 0,
			'retain': false,
			'topic': node.topic + '/' + nodeid + '/' + comclass + '/' + value.index,
			'payload': value.value
		});
	}
}

function valueChanged(node, mqtt, nodeid, comclass, value) {

	//node.log('value changed: nodeid:' + nodeid + " comclass:" + comclass + ", value[" + value.index + "] " + value.label + " = " + value.value);
	//nisutil.dumpPropsHex("value:", value, 1, false);

	if (nodes[nodeid].classes[comclass][value.index].value !== undefined
		&& value.value !== nodes[nodeid].classes[comclass][value.index].value) {

		nodes[nodeid].classes[comclass][value.index] = value;

		if (mqtt != null) mqtt.publish({
			'qos': 0,
			'retain': false,
			'topic': node.topic + '/' + nodeid + '/' + comclass + '/' + value.index,
			'payload': value.value
		});
	}
}

function valueRemoved(node, nodeid, comclass, index) {
	node.log('value removed: nodeid:' + nodeid + " comclass:" + comclass);

	if (nodes[nodeid].classes[comclass] &&	nodes[nodeid].classes[comclass][index]) {
		delete nodes[nodeid].classes[comclass][index];
	}
}

function sceneEvent(node, mqtt, nodeid, sceneid) {
	node.log('scene event: nodeid:' + nodeid + " sceneid:" + sceneid);

	nodes[nodeid].scene = sceneid;

	if (mqtt != null) mqtt.publish({
		'qos': 0,
		'retain': false,
		'topic': node.topic + '/' + nodeid + '/scene',
		'payload': sceneid
	});
}

function notification(node, nodeid, notif) {
	switch (notif) {
		case 0:
			node.log('Notification node ' + nodeid + ': message complete');
			break;
		case 1:
			node.log('Notification node  ' + nodeid + ': timeout');
			break;
			/*
		case 2:
			node.log('Notification node  ' + nodeid + ': nop');
			break;
			*/
		case 3:
			node.log('Notification node  ' + nodeid + ': node awake');
			break;
		case 4:
			node.log('Notification node  ' + nodeid + ': node sleep');
			break;
		case 5:
			node.log('Notification node  ' + nodeid + ': node dead');
			break;
		case 6:
			node.log('Notification node  ' + nodeid + ': node alive');
			break;
		/*	
		default:
			node.log('Notification node  ' + nodeid + ': unhandled notification');
			break;
			*/
	}
}

function scanComplete(RED, node) {
	node.log('Z-Wave network scan complete!');
	node.status({
		fill: 'green',
		shape: 'ring',
		text: 'node-red:common.status.connected'
	});
	RED.comms.publish("notifyUI", {
		text: RED._("ttb-zwave/zwave:zwave.scancomplete"),
		type: 'success',
		fixed: false
	});
}

module.exports = {
	'nodes': nodes,
	'driverReady': driverReady,
	'driverFailed': driverFailed,
	'nodeAdded': nodeAdded,
	'nodeReady': nodeReady,
	'valueAdded': valueAdded,
	'valueChanged': valueChanged,
	'valueRemoved': valueRemoved,
	'sceneEvent': sceneEvent,
	'notification': notification,
	'scanComplete': scanComplete
};
