'use strict';

var flows = require('../flows');

function withClient(RED, zwave, nodeid, nodeinfo) {
    var productInfo  = nodeinfo.product.replace(/ /g, ''),
        productTotal = nodeinfo.manufacturer + ', ' + nodeinfo.product;

    switch (nodeinfo.type) {
        case 'Binary Switch':
            switch (productTotal) {
                case "FIBARO System, FGWPE Wall Plug":
                    RED.nodes.addNodeToClients({
                        "id": nodeid + "-" + productInfo,
                        "type": "zwave-binary-switch",
                        "name": nodeid + ": " + productTotal,
                        "nodeid": nodeid,
                        "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
                        "x": 300,
                        "y": zwave.lastY,
                        "z": "zwave"
                    });
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
                    RED.nodes.addNodeToClients({
                        "id": nodeid + "-" + productInfo,
                        "type": "zwave-light-dimmer-switch",
                        "name": nodeid + ": " + productTotal,
                        "nodeid": nodeid,
                        "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
                        "x": 300,
                        "y": zwave.lastY,
                        "z": "zwave"
                    });
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
                    RED.nodes.addNodeToClients({
                        "id": nodeid + "-" + productInfo,
                        "type": "zwave-remote-control-multi-purpose",
                        "name": nodeid + ": " + nodeinfo.manufacturer + ", SoftRemote",
                        "nodeid": nodeid,
                        "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
                        "x": 300,
                        "y": zwave.lastY,
                        "z": "zwave"
                    });
                    zwave.lastY += 60;
                    break;

                default:
                    break;
            }
            break;

        case 'On/Off Power Switch':
            switch (productTotal) {
                case "NodOn, ASP-3-1-00 Smart Plug":
                    RED.nodes.addNodeToClients({
                        "id": nodeid + "-" + productInfo,
                        "type": "zwave-binary-switch",
                        "name": nodeid + ": " + productTotal,
                        "nodeid": nodeid,
                        "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
                        "x": 300,
                        "y": zwave.lastY,
                        "z": "zwave"
                    });
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
        node = null;

    switch (nodeinfo.type) {
        case 'Binary Switch':
            switch (productTotal) {
                case "FIBARO System, FGWPE Wall Plug":
                    node = {
                        "id": nodeid + "-" + productInfo,
                        "type": "zwave-binary-switch",
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
                    node = {
                        "id": nodeid + "-" + productInfo,
                        "type": "zwave-light-dimmer-switch",
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
                    node = {
                        "id": nodeid + "-" + productInfo,
                        "type": "zwave-remote-control-multi-purpose",
                        "name": nodeid + ": " + nodeinfo.manufacturer + ", SoftRemote",
                        "nodeid": nodeid,
                        "mark": nodeinfo.manufacturer.toLowerCase().replace(/ /g, '') + ".png",
                        "x": 300,
                        "y": zwave.lastY,
                        "z": "zwave",
                        "extra": {
                            "ui": true
                        }
                    };
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
                    node = {
                        "id": nodeid + "-" + productInfo,
                        "type": "zwave-binary-switch",
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