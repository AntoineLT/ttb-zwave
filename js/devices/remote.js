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

function softRemote(node, nodeID, sceneID){
    var msgMQTT = {};
    msgMQTT.qos = 0;
    msgMQTT.retain = true;
    msgMQTT.topic = topic +  nodeID + '/out';

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
                    msgMQTT.payload = {
                        'payload': msg.payload,
                        'intent': msg.intent
                    };
                    timer = setTimeout(function(){
                        if(typeof node.mqtt != 'undefined')  node.mqtt.publish(msgMQTT);
                        node.send(msg);
                        softRemote(node, nodeID, sceneID);
                    }, 1000);
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
                    msgMQTT.payload = {
                        'payload': msg.payload,
                        'intent': msg.intent
                    };
                    timer = setTimeout(function(){
                        if(typeof node.mqtt != 'undefined') node.mqtt.publish(msgMQTT);
                        node.send(msg);
                        softRemote(node, nodeID, sceneID);
                    }, 1000);
                } else {
                    node.send(msg);
                }
                break;

            default:
                node.send(msg);
                break;
        }

        msgMQTT.payload = {
            'payload': msg.payload,
            'intent': msg.intent
        };
        if(typeof node.mqtt != 'undefined')  node.mqtt.publish(msgMQTT);
    }
}

module.exports = {
    'softRemote': softRemote
};