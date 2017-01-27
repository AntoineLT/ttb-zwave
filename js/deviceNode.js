'use strict';

// var flows = require('./flows');
var devices = require('./devices');

// productIDTotal refers to '../../node_modules/openzwave-shared/deps/open-zwave/config/manufacturer_specific.xml'
/*
function withClient(RED, zwave, nodeid, nodeinfo) {
    var nodes = require('./handler').nodes;

    if (!zwave.lastY[nodeid - 2]) zwave.lastY[nodeid - 2] = 40;
    var manufacturerid = nodeinfo.manufacturerid.slice(2, nodeinfo.manufacturerid.length),
        producttype = nodeinfo.producttype.slice(2, nodeinfo.producttype.length),
        productid = nodeinfo.productid.slice(2, nodeinfo.productid.length),
        productIDTotal = manufacturerid + "-" + producttype + "-" + productid,
        node = {
            "id": nodeid + "-ZWave",
            "name": nodeid + ": " + nodeinfo.manufacturer + ', ' + nodeinfo.product,
            "broker": "MQTT.Localhost",
            "nodeid": nodeid,
            "productname": nodeinfo.manufacturer + " - " + nodeinfo.product,
            "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
            "x": 250 + ((nodeid - 2) * 300),
            "y": zwave.lastY[nodeid - 2],
            "z": "zwave"
        };

    node = devices.checkDevices(node, productIDTotal, nodes, nodeid, zwave);

    RED.nodes.addNodeToClients(node);
    zwave.lastY[nodeid - 2] += 60;
}

function withoutClient(zwave, nodeid, nodeinfo) {
    var nodes = require('./handler').nodes;

    if (!zwave.lastY[nodeid - 2]) zwave.lastY[nodeid - 2] = 40;
    var manufacturerid = nodeinfo.manufacturerid.slice(2, nodeinfo.manufacturerid.length),
        producttype = nodeinfo.producttype.slice(2, nodeinfo.producttype.length),
        productid = nodeinfo.productid.slice(2, nodeinfo.productid.length),
        productIDTotal = manufacturerid + "-" + producttype + "-" + productid;

    var node = devices.checkDevices({
            "id": nodeid + "-ZWave",
            "name": nodeinfo.manufacturer + ', ' + nodeinfo.product,
            "broker": "MQTT.Localhost",
            "nodeid": nodeid,
            "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
            "x": 250 + ((nodeid - 2) * 300),
            "y": zwave.lastY[nodeid - 2],
            "z": "zwave"
        },
        productIDTotal,
        nodes,
        nodeid,
        zwave);

    flows.addNodeToServerFlows(node);
    zwave.lastY[nodeid - 2] += 60;
}
*/
function newdeviceMQTT(zwave, mqtt, nodeid, nodeinfo) {
    var nodes = require('./handler').nodes;

    var manufacturerid = nodeinfo.manufacturerid.slice(2, nodeinfo.manufacturerid.length);
    var producttype = nodeinfo.producttype.slice(2, nodeinfo.producttype.length);
    var productid = nodeinfo.productid.slice(2, nodeinfo.productid.length);
    var productIDTotal = manufacturerid + "-" + producttype + "-" + productid;

	var node = {
			senderID: nodeid,
			nodeInfo: nodeinfo,
			productname: nodeinfo.manufacturer + " - " + nodeinfo.product
			};

    devices.fillDevices(
		node,
        productIDTotal,
        nodes,
        zwave);

    if (node.commandclass !== undefined && node.classindex !== undefined && nodes[nodeid].classes[node.commandclass] !== undefined) {
        node.classindexname = nodes[nodeid].classes[node.commandclass][node.classindex].label;
	}

    if (mqtt !== null && node.typeNode) 
		mqtt.publish({
			payload: node,
			qos: 0,
			retain: false,
			topic: "newdevice/zwave"
		});
}

module.exports = {
 //   'withClient': withClient,
 //   'withoutClient': withoutClient,
    'newdeviceMQTT': newdeviceMQTT
};