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
            "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
            "x": 250 + ((nodeid - 2) * 300),
            "y": zwave.lastY[nodeid - 2],
            "z": "zwave"
        };

    switch (productIDTotal) {
        case "0086-0003-0062": // Aeotec, ZW098 LED Bulb
        case "0086-0103-0062": // Aeotec, ZW098 LED Bulb
        case "0086-0203-0062": // Aeotec, ZW098 LED Bulb
        case "0131-0002-0002": // Zipato, RGBW LED Bulb
            node.type = "zwave-light-dimmer-switch";
            node.name = "LED Bulb";
            break;

        case "0165-0002-0002": // NodOn, CRC-3-6-0x Soft Remote
            zwave.setConfigParam(nodeid, 3, 1, 1);
            node.type = "zwave-remote-control-multi-purpose";
            node.name = "Remote";
            break;

        case "010f-0600-1000": // FIBARO System, FGWPE Wall Plug
        case "0165-0001-0001": // NodOn, ASP-3-1-00 Smart Plug
            node.type = "zwave-binary-switch";
            node.name = "Smart Plug";
            break;

        case "010f-0800-1001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0800-2001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0800-4001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0801-1001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0801-2001": // FIBARO System, FGMS001 Motion Sensor
            node.type = "zwave-motion-sensor";
            node.name = "Motion Sensor";
            break;

        case "010f-0700-1000": // FIBARO System, FGK101 Door Opening Sensor
        case "010f-0700-2000": // FIBARO System, FGK101 Door Opening Sensor
        case "010f-0700-3000": // FIBARO System, FGK101 Door Opening Sensor
        case "010f-0700-4000": // FIBARO System, FGK101 Door Opening Sensor
            node.type = "zwave-binary-sensor";
            node.name = "Door Sensor";
            break;

        default:
            break;
    }
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