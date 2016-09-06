'use strict';

var flows = require('../flows');

function withClient(RED, zwave, nodeid, nodeinfo) {
    if(!zwave.lastY[nodeid-2]) zwave.lastY[nodeid-2] = 40;
    var productInfo  = nodeinfo.product.replace(/ /g, ''),
        productTotal = nodeinfo.manufacturer + ', ' + nodeinfo.product,
        node = {
            "id": nodeid + "-" + productInfo,
            "name": nodeid + ": " + productTotal,
            "broker": "MQTT.Localhost",
            "nodeid": nodeid,
            "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
            "x": 250+((nodeid-2)*300),
            "y": zwave.lastY[nodeid-2],
            "z": "zwave"
        };

    switch (nodeinfo.type) {
        case 'Binary Switch':
            switch (productTotal) {
                case "FIBARO System, FGWPE Wall Plug":
                    node.type = "zwave-binary-switch";
                    RED.nodes.addNodeToClients(node);
                    zwave.lastY[nodeid-2] += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'Light Dimmer Switch':
            switch (productTotal) {
                case "Zipato, RGBW LED Bulb":
                case "Aeotec, ZW098 LED Bulb":
                    node.type = "zwave-light-dimmer-switch";
                    RED.nodes.addNodeToClients(node);
                    zwave.lastY[nodeid-2] += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'Remote Control Multi Purpose':
            switch (productTotal) {
                case "NodOn, CRC-3-6-0x Soft Remote":
                    zwave.setConfigParam(nodeid, 3, 1, 1);
                    node.type = "zwave-remote-control-multi-purpose";
                    RED.nodes.addNodeToClients(node);
                    zwave.lastY[nodeid-2] += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'On/Off Power Switch':
            switch (productTotal) {
                case "NodOn, ASP-3-1-00 Smart Plug":
                    node.type = "zwave-binary-switch";
                    RED.nodes.addNodeToClients(node);
                    zwave.lastY[nodeid-2] += 60;
                    break;
            }
            break;

        default:
            break;
    }
}

function withoutClient(zwave, nodeid, nodeinfo) {
    if(!zwave.lastY[nodeid-2]) zwave.lastY[nodeid-2] = 40;
    var productInfo  = nodeinfo.product.replace(/ /g, ''),
        productTotal = nodeinfo.manufacturer + ', ' + nodeinfo.product,
        node = {
            "id": nodeid + "-" + productInfo,
            "broker": "MQTT.Localhost",
            "nodeid": nodeid,
            "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
            "x": 250+((nodeid-2)*300),
            "y": zwave.lastY[nodeid-2],
            "z": "zwave",
            "extra": {
                "ui": true
            }
        };
    console.log(nodeinfo);

    switch (nodeinfo.type) {
        case 'Binary Switch':
            switch (productTotal) {
                case "FIBARO System, FGWPE Wall Plug":
                    node.type = "zwave-binary-switch";
                    node.name = "Wall Plug";
                    flows.addNodeToServerFlows(node);
                    zwave.lastY[nodeid-2] += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'Light Dimmer Switch':
            switch (productTotal) {
                case "Zipato, RGBW LED Bulb":
                case "Aeotec, ZW098 LED Bulb":
                    node.type = "zwave-light-dimmer-switch";
                    node.name = "LED Bulb";
                    flows.addNodeToServerFlows(node);
                    zwave.lastY[nodeid-2] += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'Remote Control Multi Purpose':
            switch (productTotal) {
                case "NodOn, CRC-3-6-0x Soft Remote":
                    zwave.setConfigParam(nodeid, 3, 1, 1);
                    node.type = "zwave-remote-control-multi-purpose";
                    node.name = "Remote";
                    flows.addNodeToServerFlows(node);
                    zwave.lastY[nodeid-2] += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'On/Off Power Switch':
            switch (productTotal) {
                case "NodOn, ASP-3-1-00 Smart Plug":
                    node.type = "zwave-binary-switch";
                    node.name = "Smart Plug";
                    flows.addNodeToServerFlows(node);
                    zwave.lastY[nodeid-2] += 60;
                    break;
            }
            break;

        default:
            break;
    }
}

function newdeviceMQTT(zwave, mqtt, nodeid, nodeinfo) {
    var msg = {
            payload: {
                senderID: nodeid,
                nodeInfo: nodeinfo
            }
        },
        productTotal = nodeinfo.manufacturer + ', ' + nodeinfo.product;

    switch (nodeinfo.type) {
        case 'Binary Switch':
            switch (productTotal) {
                case "FIBARO System, FGWPE Wall Plug":
                    msg.payload.typeNode = "zwave-binary-switch";
                    break;

                default:
                    break;
            }
            break;

        case 'Light Dimmer Switch':
            switch (productTotal) {
                case "Zipato, RGBW LED Bulb":
                case "Aeotec, ZW098 LED Bulb":
                    msg.payload.typeNode = "zwave-light-dimmer-switch";
                    break;

                default:
                    break;
            }
            break;

        case 'Remote Control Multi Purpose':
            switch (productTotal) {
                case "NodOn, CRC-3-6-0x Soft Remote":
                    zwave.setConfigParam(nodeid, 3, 1, 1);
                    msg.payload.typeNode = "zwave-remote-control-multi-purpose";
                    break;

                default:
                    break;
            }
            break;

        case 'On/Off Power Switch':
            switch (productTotal) {
                case "NodOn, ASP-3-1-00 Smart Plug":
                    msg.payload.typeNode = "zwave-binary-switch";
                    break;
            }
            break;

        case 'Routing Binary Sensor':
            switch(productTotal) {
                case "FIBARO System, FGMS001 Motion Sensor":
                    msg.payload.typeNode = "zwave-motion-sensor";
                    break;
            }
            break;

        default:
            break;
    }
    msg.qos = 0;
    msg.retain = false;
    msg.topic = "newdevice/zwave";
    if(mqtt !== null && msg.payload.typeNode) mqtt.publish(msg);

}

module.exports = {
    'withClient'   : withClient,
    'withoutClient': withoutClient,
    'newdeviceMQTT'   : newdeviceMQTT
};