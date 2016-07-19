'use strict';

var flows = require('../flows');

function withClient(RED, zwave, nodeid, nodeinfo) {
    var productInfo  = nodeinfo.product.replace(/ /g, ''),
        productTotal = nodeinfo.manufacturer + ', ' + nodeinfo.product,
        node = {
            "id": nodeid + "-" + productInfo,
            "name": nodeid + ": " + productTotal,
            "nodeid": nodeid,
            "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
            "x": 300,
            "y": zwave.lastY,
            "z": "zwave"
        };

    switch (nodeinfo.type) {
        case 'Binary Switch':
            switch (productTotal) {
                case "FIBARO System, FGWPE Wall Plug":
                    node.type = "zwave-binary-switch";
                    RED.nodes.addNodeToClients(node);
                    zwave.lastY += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'Light Dimmer Switch':
            switch (productTotal) {
                case "Zipato, RGBW LED Bulb":
                case "Aeotec, LED Bulb":
                    node.type = "zwave-light-dimmer-switch";
                    RED.nodes.addNodeToClients(node);
                    zwave.lastY += 60;
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
                    zwave.lastY += 60;
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
                    zwave.lastY += 60;
                    break;
            }
            break;

        default:
            break;
    }
}

function withoutClient(zwave, nodeid, nodeinfo) {
    var productInfo  = nodeinfo.product.replace(/ /g, ''),
        productTotal = nodeinfo.manufacturer + ', ' + nodeinfo.product,
        node = {
            "id": nodeid + "-" + productInfo,
            "name": nodeid + ": " + productTotal,
            "nodeid": nodeid,
            "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
            "x": 300,
            "y": zwave.lastY,
            "z": "zwave",
            "extra": {
                "ui": true
            }
        };

    switch (nodeinfo.type) {
        case 'Binary Switch':
            switch (productTotal) {
                case "FIBARO System, FGWPE Wall Plug":
                    node.type = "zwave-binary-switch";
                    flows.addNodeToServerFlows(node);
                    zwave.lastY += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'Light Dimmer Switch':
            switch (productTotal) {
                case "Zipato, RGBW LED Bulb":
                case "Aeotec, LED Bulb":
                    node.type = "zwave-light-dimmer-switch";
                    flows.addNodeToServerFlows(node);
                    zwave.lastY += 60;
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
                    flows.addNodeToServerFlows(node);
                    zwave.lastY += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'On/Off Power Switch':
            switch (productTotal) {
                case "NodOn, ASP-3-1-00 Smart Plug":
                    node.type = "zwave-binary-switch";
                    flows.addNodeToServerFlows(node);
                    zwave.lastY += 60;
                    break;
            }
            break;

        default:
            break;
    }
}

module.exports = {
    'withClient'   : withClient,
    'withoutClient': withoutClient
};