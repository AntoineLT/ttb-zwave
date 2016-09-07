'use strict';

var timer = undefined,
    count = 0,
    topic = 'zwave/';

var flows = require('../flows').readFlows();

for(var i = 0; i < flows.length; i++) {
    if (flows[i].type === 'zwave') {
        topic = flows[i].topic;
        break;
    }
}

// node : Node-RED node (object)
// nodeID :  ID in ZWave network (int : example 2)
// sceneID : ID  pushed button (int : example 20)
function softRemote(node, sceneID) {
    var msgMQTT = {
            qos: 0,
            retain: true,
            topic: topic + node.nodeid + '/out'
        },
        msg = {
            payload: sceneID
        };
    switch (sceneID) {
        case "10":
            msg.intent = 1; // close
            break;

        case "20":
            msg.intent = 2; // more
            break;

        case "30":
            msg.intent = 0; // open
            break;

        case "40":
            msg.intent = 3; // less
            break;

        case "22":
            if (node.push === true) {
                count++;
                if (count >= 20) break;
                msg.intent = 2; // more
                msgMQTT.payload = {
                    'payload': msg.payload,
                    'intent': msg.intent
                };
                timer = setTimeout(function () {
                    if (node.mqtt != null)  node.mqtt.publish(msgMQTT);
                    node.send(msg);
                    softRemote(node, sceneID);
                }, 1000);
            }
            break;

        case "42":
            if (node.push === true) {
                count++;
                if (count >= 20) break;
                msg.intent = 3; // less
                msgMQTT.payload = {
                    'payload': msg.payload,
                    'intent': msg.intent
                };
                timer = setTimeout(function () {
                    if (node.mqtt != null) node.mqtt.publish(msgMQTT);
                    node.send(msg);
                    softRemote(node, sceneID);
                }, 1000);
            }
            break;

        case "21":
        case "41":
            clearTimeout(timer);
            count = 0;
            break;

        default:
            break;
    }

    msgMQTT.payload = {
        'payload': msg.payload,
        'intent': msg.intent
    };
    if (node.mqtt != null)  node.mqtt.publish(msgMQTT);
    node.send(msg);
}

module.exports = {
    'softRemote': softRemote
};
