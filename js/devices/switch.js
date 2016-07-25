'use strict';

var handler = require('../handler');

function binarySwitch(node, zwave, msg) {
    if (msg.intent || msg.intent == 0) {
        switch(msg.intent) {
            case 0:
                zwave.setValue(node.nodeid, 37, 1, 0, false);
                break;

            case 1:
                zwave.setValue(node.nodeid, 37, 1, 0, true);
                break;
        }
    }
}

function lightDimmerSwitch(node, zwave, msg) {
    var currentValue = handler.nodes[node.nodeid].classes[38][0].value;
    var intent = (msg.intent || msg.intent == 0)?msg.intent: msg.payload.intent;
    var intensity = parseInt((msg.intensity || msg.intensity === 0)?msg.intensity: msg.payload.intensity);
    if (intent || intent == 0) {
        switch(intent) {
            case 0: // close
                zwave.setValue(node.nodeid, 38, 1, 0, 0);
                break;

            case 1: // open
                zwave.setValue(node.nodeid, 38, 1, 0, 99);
                break;

            case 2: // more
                if(currentValue <= 99) currentValue = currentValue+10;
                if(currentValue > 99) currentValue = 99;
                zwave.setValue(node.nodeid, 38, 1, 0, currentValue);
                break;

            case 3: // less
                if(currentValue >= 0) currentValue = currentValue-10;
                if(currentValue < 0) currentValue = 0;
                zwave.setValue(node.nodeid, 38, 1, 0, currentValue);
                break;

            default:
                break;
        }
    }
    if(intensity || intensity === 0) {
        if(intensity === 100) intensity = 99;
        zwave.setValue(node.nodeid, 38, 1, 0, intensity);
    }
    if(msg.color) zwave.setValue(node.nodeid, 51, 1, 0, msg.color+"0000");
}

module.exports = {
    'binarySwitch': binarySwitch,
    'lightDimmerSwitch': lightDimmerSwitch
};