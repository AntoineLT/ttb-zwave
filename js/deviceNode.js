'use strict';

// var flows = require('./flows');
var devices = require('./devices');

// productIDTotal refers to '../../node_modules/openzwave-shared/deps/open-zwave/config/manufacturer_specific.xml'

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
    'newdeviceMQTT': newdeviceMQTT
};