'use strict';

var timer = undefined,
    count = 0,
    topic = 'zwave/';

var flows = require('../flows').readFlows();

for(var i = 0; i < flows.length; i++) {
    if(flows[i].type === 'zwave') {
        topic = flows[i].topic;
        break;
    }
}

function softRemote(node, mqtt, nodeID, sceneID){
    if (node.nodeid === nodeID) {
        var msg = {};
        msg.payload = sceneID;
        switch(sceneID) {
            case 10:
                msg.intent = 1; // close
                node.send(msg);
                break;

            case 20:
                msg.intent = 2; // more
                node.send(msg);
                break;

            case 21:
                clearTimeout(timer);
                count = 0;
                node.send(msg);
                break;

            case 22:
                if(node.push === true) {
                    count++;
                    if(count>=20) break;
                    msg.intent = 2; // more
                    timer = setTimeout(function(){node.send(msg); softRemote(nodeID, sceneID);}, 1000);
                } else {
                    node.send(msg);
                }
                break;

            case 30:
                msg.intent = 0; // open
                node.send(msg);
                break;

            case 40:
                msg.intent = 3; // less
                node.send(msg);
                break;

            case 41:
                clearTimeout(timer);
                count = 0;
                node.send(msg);
                break;

            case 42:
                if(node.push === true) {
                    count++;
                    if(count>=20) break;
                    msg.intent = 3; // less
                    timer = setTimeout(function(){node.send(msg); softRemote(nodeID, sceneID);}, 1000);
                } else {
                    node.send(msg);
                }
                break;

            default:
                node.send(msg);
                break;
        }

        var msgMQTT = {};
        msgMQTT.qos = 1;
        msgMQTT.retain = false;
        msgMQTT.topic = topic +  nodeID + '/out';
        msgMQTT.payload = {
            'payload': msg.payload,
            'intent': msg.intent
        };
        if(typeof mqtt != 'undefined') mqtt.publish(msgMQTT);
    }
}

module.exports = {
    'softRemote': softRemote
};