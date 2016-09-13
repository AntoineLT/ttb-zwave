'use strict';

var check      = require('./check.js'),
    deviceNode = require('./deviceNode');

//var nisutil = require(process.env.NODE_RED_HOME+"/node_modules/nisutil");
var nodes =[];

function driverReady(node, RED, client, homeid) {
    node.log('Driver ready');
    node.log('Scanning homeid=0x' + homeid.toString(16) + '...');
    node.status({
        fill: 'blue',
        shape: 'dot',
        text: 'node-red:common.status.connecting'
    });
    if (client) {
        var missing = check.isNotInFlow('zwave', null, null, null);
        if (missing === true) {
            RED.nodes.addNodeToClients({
                "type": "tab",
                "id": "zwave",
                "label": "Z-wave"
            });
        }
    }
}

function driverFailed(node) {
    node.warn('Failed to start Z-wave driver');
    node.status({
        fill: 'yellow',
        shape: 'ring',
        text: 'node-red:common.status.error'
    });
}

function nodeAdded(nodeid) {
    nodes[nodeid] = {
        manufacturer: '',
        manufacturerid: '',
        product: '',
        producttype: '',
        productid: '',
        type: '',
        name: '',
        loc: '',
        classes: {},
        ready: false
    };
}

function nodeReady(node, RED, zwave, mqtt, client, nodeid, nodeinfo) {
    //node.log('node ready: nodeid:'+ nodeid + ", nodeinfo:");
    //nisutil.dumpPropsHex("nodeinfo:", nodeinfo, 1, false);

    node.log('node ready: nodeid:' + nodeid + ", " + nodeinfo.manufacturer + " " + nodeinfo.product + " (" + nodeinfo.type + ")");

    nodes[nodeid].manufacturer = nodeinfo.manufacturer;
    nodes[nodeid].manufacturerid = nodeinfo.manufacturerid;
    nodes[nodeid].product = nodeinfo.product;
    nodes[nodeid].producttype = nodeinfo.producttype;
    nodes[nodeid].productid = nodeinfo.productid;
    nodes[nodeid].type = nodeinfo.type;
    nodes[nodeid].name = nodeinfo.name;
    nodes[nodeid].loc = nodeinfo.loc;
    nodes[nodeid].ready = true;

    //if(nodeinfo.product === "CRC-3-6-0x Soft Remote") {
    //zwave.setConfigParam(nodeid, 3, 1, 1);
    //}
    /*
     node.log('node ready '+nodeid+': '
     +((nodeinfo.manufacturer) ? nodeinfo.manufacturer : ' id=' + nodeinfo.manufacturerid)+', '
     +((nodeinfo.product) ? nodeinfo.product : 'product=' + nodeinfo.productid + ', type=' + nodeinfo.producttype));
     */
    if (nodeinfo.manufacturer && nodeinfo.product) {
        var productInfo = nodeinfo.product.replace(/ /g, '');

        if (check.isNotInFlow(nodeid, null, null, productInfo)) {
            if (client) {
                deviceNode.withClient(RED, zwave, nodeid, nodeinfo);
            } else {
                deviceNode.newdeviceMQTT(zwave, mqtt, nodeid, nodeinfo);
                // Internal creation without any additional flows
                // deviceNode.withoutClient(zwave, nodeid, nodeinfo);
            }
        }

        var comclass;
        for (comclass in nodes[nodeid]['classes']) {
            if (nodes[nodeid]['classes'].hasOwnProperty(comclass)) {
                switch (comclass) {
                    case 0x25: // COMMAND_CLASS_SWITCH_BINARY
                    case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
                        zwave.enablePoll(nodeid, comclass);
                        break;
                }
            }
        }
    }
}

function valueAdded(node, RED, zwave, mqtt, client, nodeid, comclass, value) {
    // node : node object from Node-RED (object)
    // RED : RED global object (object)
    // zwave : openzwave object (object)
    // mqtt : mqtt client (object)
    // nodeid : device id in ZWave network (int)
    // comclass : Zwave command class (int)
    // value : callback result of listener (object)
    //node.log('value added: nodeid:'+ nodeid + " comclass:" + comclass + ", value:");
    // nisutil.dumpPropsHex("value:", value, 1, false);

    //node.log('value added: nodeid:'+ nodeid + " comclass:" + comclass + ", value[" + value.index + "]'" + value.label +"' = " + value.value);

    if (client) {
        if (!zwave.lastY[nodeid - 2]) zwave.lastY[nodeid - 2] = 40;
        if (nodeid !== 1 && value.label !== ""
            && check.isNotInFlow(nodeid, comclass, value, null)) {
            if (check.comclassToShow(comclass)) {
                RED.nodes.addNodeToClients({
                    "id": "zwave-in-" + nodeid + "-" + comclass + ":" + value.index,
                    "type": "zwave-in",
                    "name": "Node" + nodeid + " : " + value.label,
                    "topic": node.topic + nodeid + "/" + comclass + "/" + value.index + "/",
                    "nodeid": nodeid,
                    "broker": node.broker,
                    "x": 250 + ((nodeid - 2) * 300),
                    "y": zwave.lastY[nodeid - 2],
                    "z": "zwave"
                });
                zwave.lastY[nodeid - 2] += 60;
            }
        }
    }

    if (!nodes[nodeid].classes[comclass]) {
        nodes[nodeid].classes[comclass] = {};
    }
    nodes[nodeid].classes[comclass][value.index] = value;

    if (mqtt != null) mqtt.publish({
        'qos': 1,
        'retain': false,
        'topic': node.topic + '/' + nodeid + '/' + comclass + '/' + value.index,
        'payload': value.value
    });
}

function valueChanged(node, mqtt, nodeid, comclass, value) {

    if (nodes[nodeid].classes[comclass][value.index].value !== undefined
        && value.value !== nodes[nodeid].classes[comclass][value.index].value) {
        //node.log('value changed: nodeid:'+ nodeid + " comclass:" + comclass + ", value:");
        //nisutil.dumpPropsHex("value:", value, 1, false);

        node.log('value changed: nodeid:' + nodeid + " comclass:" + comclass + ", value[" + value.index + "]'" + value.label + "' = " + value.value);

        nodes[nodeid].classes[comclass][value.index] = value;

        if (mqtt != null) mqtt.publish({
            'qos': 1,
            'retain': false,
            'topic': node.topic + '/' + nodeid + '/' + comclass + '/' + value.index,
            'payload': value.value
        });
    }
}

function valueRemoved(nodeid, comclass, index) {
    if (nodes[nodeid].classes[comclass] &&
        nodes[nodeid].classes[comclass][index]) {
        delete nodes[nodeid].classes[comclass][index];
    }
}

function sceneEvent(node, mqtt, nodeid, sceneid) {
    node.log('scene event: nodeid:' + nodeid + " sceneid:" + sceneid);

    nodes[nodeid].scene = sceneid;

    if (mqtt != null) mqtt.publish({
        'qos': 1,
        'retain': false,
        'topic': node.topic + '/' + nodeid + '/scene',
        'payload': sceneid
    });
}

function notification(node, nodeid, notif) {
    switch (notif) {
        case 0:
            node.log('node ' + nodeid + ': message complete');
            break;
        case 1:
            node.log('node ' + nodeid + ': timeout');
            break;
        case 2:
            node.log('node ' + nodeid + ': nop');
            break;
        case 3:
            node.log('node ' + nodeid + ': node awake');
            break;
        case 4:
            node.log('node ' + nodeid + ': node sleep');
            break;
        case 5:
            node.log('node ' + nodeid + ': node dead');
            break;
        case 6:
            node.log('node ' + nodeid + ': node alive');
            break;
        default:
            node.log('node ' + nodeid + ': unhandled notification');
            break;
    }
}

function scanComplete(RED, node) {
    node.log('Z-Wave network scan complete!');
    node.status({
        fill: 'green',
        shape: 'ring',
        text: 'node-red:common.status.connected'
    });
    RED.comms.publish("notifyUI", {
        text : RED._("ttb-zwave/zwave:zwave.scancomplete"),
        type: 'success',
        fixed: false
    });
}

module.exports = {
    'nodes'         : nodes,
    'driverReady'   : driverReady,
    'driverFailed'  : driverFailed,
    'nodeAdded'     : nodeAdded,
    'nodeReady'     : nodeReady,
    'valueAdded'    : valueAdded,
    'valueChanged'  : valueChanged,
    'valueRemoved'  : valueRemoved,
    'sceneEvent'    : sceneEvent,
    'notification'  : notification,
    'scanComplete'  : scanComplete
};
