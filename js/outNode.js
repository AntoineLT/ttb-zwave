'use strict';

function onInput(node, zwave, msg) {
    if(msg.method !== undefined && msg.method !== "") node.method = msg.method;
    if(msg.level !== undefined && msg.level !== "")   node.level = msg.level;
    if(msg.class !== undefined && msg.class !== "")   node.class = msg.class;
    if(msg.index !== undefined && msg.index !== "")   node.index = msg.index;
    if(msg.value !== undefined && msg.value !== "")   node.value = msg.value;
    if(msg.nodeid !== undefined && msg.nodeid !== "") node.nodeid = msg.nodeid;

    node.nodeid = parseInt(node.nodeid);
    node.class  = parseInt(node.class);
    node.index  = parseInt(node.index);
    node.level  = parseInt(node.level);

    if (msg.intent || msg.intent == 0) {
        if (msg.intent == 0) { // open
            zwave.setValue(node.nodeid, 37, 1, 0, false);
        } else if (msg.intent == 1) { // close
            zwave.setValue(node.nodeid, 37, 1, 0, true);
        }
    } else {
        switch(node.method){
            case "setlevel":
                zwave.setValue(node.nodeid, 38, 1, 0,  node.level);
                break;
            case "switchon":
                zwave.setValue(node.nodeid, 37, 1, 0, true);
                break;
            case "switchoff":
                zwave.setValue(node.nodeid, 37, 1, 0, false);
                break;
            case "setvalue":
                if(node.class === 37) {
                    node.value = (node.value !== '0');
                } else {
                    node.value = parseInt(node.value);
                }
                if(node.class === 112) {
                    zwave.setConfigParam(node.nodeid, node.index, node.value, node.value.toString().length);
                } else {
                    zwave.setValue(node.nodeid, node.class, 1, node.index, node.value);
                }
                break;
        }
    }
}

module.exports = {
    'onInput': onInput
};