'use strict';

function checkDevices(node, productIDTotal, nodes, nodeid, zwave) {
    switch (productIDTotal) {
        case "0086-0003-0062": // Aeotec, ZW098 LED Bulb
        case "0086-0103-0062": // Aeotec, ZW098 LED Bulb
        case "0086-0203-0062": // Aeotec, ZW098 LED Bulb
        case "0131-0002-0002": // Zipato, RGBW LED Bulb
            (node.senderID !== undefined)? node.typeNode = "zwave-light-dimmer-switch" : node.type = "zwave-light-dimmer-switch";
            node.commandclass = "38";
            node.classindex = "0";
            break;

        case "0165-0002-0002": // NodOn, CRC-3-6-0x Soft Remote
            (node.senderID !== undefined)? node.typeNode = "nodonSoftRemote" : node.type = "nodonSoftRemote";
            zwave.setConfigParam(node.config.nodeid, 3, 1, 1); // Enable scene mode for the SoftRemote
            break;

        case "010f-0600-1000": // FIBARO System, FGWPE Wall Plug
        case "0165-0001-0001": // NodOn, ASP-3-1-00 Smart Plug
            (node.senderID !== undefined)? node.typeNode = "zwave-binary-switch" : node.type = "zwave-binary-switch";
            node.commandclass = "37";
            node.classindex = "0";
            break;

        case "010f-0800-1001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0800-2001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0800-4001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0801-1001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0801-2001": // FIBARO System, FGMS001 Motion Sensor
            (node.senderID !== undefined)? node.typeNode = "zwave-motion-sensor" : node.type = "zwave-motion-sensor";
            node.commandclass = "48";
            node.classindex = "0";
            break;

        case "010f-0700-1000": // FIBARO System, FGK101 Door Opening Sensor
        case "010f-0700-2000": // FIBARO System, FGK101 Door Opening Sensor
        case "010f-0700-3000": // FIBARO System, FGK101 Door Opening Sensor
        case "010f-0700-4000": // FIBARO System, FGK101 Door Opening Sensor
            (node.senderID !== undefined)? node.typeNode = "zwave-binary-sensor" : node.type = "zwave-binary-sensor";
            node.commandclass = "48";
            node.classindex = "0";
            break;

        case "0086-0002-004a": // Aeotec, ZW074 MultiSensor Gen5
        case "0086-0102-004a": // Aeotec, ZW074 MultiSensor Gen5
        case "0086-0202-004a": // Aeotec, ZW074 MultiSensor Gen5
        case "0086-0002-0064": // Aeotec, ZW074 MultiSensor 6
        case "0086-0102-0064": // Aeotec, ZW074 MultiSensor 6
        case "0086-0202-0064": // Aeotec, ZW074 MultiSensor 6
            (node.senderID !== undefined)? node.typeNode = "aeotecMultiSensor" : node.type = "aeotecMultiSensor";
            node.commandclass = "48";
            node.classindex = "0";
            zwave.setConfigParam(node.config.nodeid, 3, 30, 2); // Set the time(sec) that the PIR stay ON before sending OFF
            zwave.setConfigParam(node.config.nodeid, 4, 1, 1);  // Enable PIR sensor
            zwave.setConfigParam(node.config.nodeid, 5, 1, 1);  // Send PIR detection on binary sensor command class
            break;

        default:
            (node.senderID !== undefined)? node.typeNode = "zwave-generic" : node.type = "zwave-generic";
            node.commandclass = Object.keys(nodes[nodeid].classes)[0];
            node.classindex = Object.keys(nodes[nodeid].classes[node.commandclass])[0];
            break;
    }
    if (node.commandclass !== undefined && node.classindex !== undefined)
        node.classindexname = nodes[nodeid].classes[node.commandclass][node.classindex].label;

    return node;
}

module.exports = {
    'checkDevices': checkDevices
};