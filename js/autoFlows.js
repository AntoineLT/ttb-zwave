'use strict';

var fs = require('fs');

var flows = require('./flows'),
    nodeLocation  = '/root/userdir/node_modules/ttb-zwave';

var zwaveTab = {
        "type": "tab",
        "id": "zwave",
        "label": "Z-wave"
    },
    zwaveNode = {
        "id": "zwave-node",
        "type": "zwave",
        "z": "zwave",
        "name": "",
        "topic": "coldfacts/zwave/",
        "broker": "MQTT.HomeKeeper",
        "x": 70,
        "y": 40,
        "wires": []
    };

function init() {
    try {
        fs.accessSync(nodeLocation, fs.F_OK);
        flows.addNodeToServerFlows(zwaveTab);
        flows.addNodeToServerFlows(zwaveNode);
    } catch (e) { console.log(e); }
}

module.exports = {
    'init': init
};