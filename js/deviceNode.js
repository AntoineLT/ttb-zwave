'use strict';

var flows = require('./flows'),
    devices = require('./devices');

// productIDTotal refers to '../../node_modules/openzwave-shared/deps/open-zwave/config/manufacturer_specific.xml'

function withClient(RED, zwave, nodeid, nodeinfo) {
    var nodes = require('./handler').nodes;

    if (!zwave.lastY[nodeid - 2]) zwave.lastY[nodeid - 2] = 40;
    var manufacturerid = nodeinfo.manufacturerid.slice(2, nodeinfo.manufacturerid.length),
        producttype = nodeinfo.producttype.slice(2, nodeinfo.producttype.length),
        productid = nodeinfo.productid.slice(2, nodeinfo.productid.length),
        productIDTotal = manufacturerid + "-" + producttype + "-" + productid,
        node = {
            "id": nodeid + "-" + nodeinfo.product.replace(/ /g, ''),
            "name": nodeid + ": " + nodeinfo.manufacturer + ', ' + nodeinfo.product,
            "broker": "MQTT.Localhost",
            "nodeid": nodeid,
            "productname": nodeid + ": " + nodeinfo.manufacturer + " - " + nodeinfo.product,
            "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
            "x": 250 + ((nodeid - 2) * 300),
            "y": zwave.lastY[nodeid - 2],
            "z": "zwave"
        };

    node = devices.checkDevices(node, productIDTotal, nodes, nodeid);

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
            "id": nodeid + "-" + nodeinfo.product.replace(/ /g, ''),
            "name": nodeid + ": " + nodeinfo.manufacturer + ', ' + nodeinfo.product,
            "broker": "MQTT.Localhost",
            "nodeid": nodeid,
            "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
            "x": 250 + ((nodeid - 2) * 300),
            "y": zwave.lastY[nodeid - 2],
            "z": "zwave"
        },
        productIDTotal,
        nodes,
        nodeid);

    flows.addNodeToServerFlows(node);
    zwave.lastY[nodeid - 2] += 60;
}

function newdeviceMQTT(zwave, mqtt, nodeid, nodeinfo) {
    var nodes = require('./handler').nodes;

    var manufacturerid = nodeinfo.manufacturerid.slice(2, nodeinfo.manufacturerid.length),
        producttype = nodeinfo.producttype.slice(2, nodeinfo.producttype.length),
        productid = nodeinfo.productid.slice(2, nodeinfo.productid.length),
        productIDTotal = manufacturerid + "-" + producttype + "-" + productid;

    var MQTTpayload = devices.checkDevices({
            senderID: nodeid,
            nodeInfo: nodeinfo,
            productname: nodeid + ": " + nodeinfo.manufacturer + " - " + nodeinfo.product
        },
        productIDTotal,
        nodes,
        nodeid);

    if (mqtt !== null && MQTTpayload.typeNode) mqtt.publish({
        payload: MQTTpayload,
        qos: 0,
        retain: false,
        topic: "newdevice/zwave"
    });
}

module.exports = {
    'withClient': withClient,
    'withoutClient': withoutClient,
    'newdeviceMQTT': newdeviceMQTT
};