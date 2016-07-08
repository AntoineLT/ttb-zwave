var check = require('./check.js');

var nodes =[];

exports.driverReady = function(node, homeid) {
    node.log('Driver ready');
    node.log('Scanning homeid=0x'+homeid.toString(16)+'...');
    node.status({
        fill:'blue',
        shape:'dot',
        text:'node-red:common.status.connecting'
    });
};

exports.driverFailed = function(node) {
    node.warn('Failed to start Z-wave driver');
    node.status({
        fill:'yellow',
        shape:'dot',
        text:'node-red:common.status.error'
    });
};

exports.nodeAdded = function(nodeid) {
    nodes[nodeid] = {
        manufacturer : '',
        manufacturerid : '',
        product : '',
        producttype : '',
        productid : '',
        type : '',
        name : '',
        loc : '',
        classes : {},
        ready : false
    };
};

exports.nodeReady = function(node, nodeid, nodeinfo) {
    // TODO: Finish implementation of this handler
    nodes[nodeid].manufacturer = nodeinfo.manufacturer;
    nodes[nodeid].manufacturerid = nodeinfo.manufacturerid;
    nodes[nodeid].product = nodeinfo.product;
    nodes[nodeid].producttype = nodeinfo.producttype;
    nodes[nodeid].productid = nodeinfo.productid;
    nodes[nodeid].type = nodeinfo.type;
    nodes[nodeid].name = nodeinfo.name;
    nodes[nodeid].loc = nodeinfo.loc;
    nodes[nodeid].ready = true;

    node.log('node ready '+nodeid+': '
        +((nodeinfo.manufacturer) ? nodeinfo.manufacturer : ' id=' + nodeinfo.manufacturerid)+', '
        +((nodeinfo.product) ? nodeinfo.product : 'product=' + nodeinfo.productid + ', type=' + nodeinfo.producttype));

    if(nodeinfo.manufacturer && nodeinfo.product) {
        //var productInfo = nodeinfo.product.replace(/ /g, ''),
        //    productTotal = nodeinfo.manufacturer + ', ' + nodeinfo.product;

    }
};

exports.valueAdded = function(node, mqtt, nodeid, comclass, value) {
    // TODO: Finish implementation of this handler
    if(nodeid !== 1 && value.label !== ""
        && check.isNotInFlow(nodeid, comclass, value, null)){
        if(check.comclassToShow(comclass)) {
            console.log('Value added');
        }
    }

    if (!nodes[nodeid].classes[comclass]) {
        nodes[nodeid].classes[comclass] = {};
    }
    nodes[nodeid].classes[comclass][value.index] = value;

    var msg = {};
    msg.qos = 1;
    msg.retain = false;
    msg.topic = node.topic +  nodeid + '/' + comclass + '/' + value.index + '/';
    msg.payload = value.value;
    if(typeof mqtt != 'undefined') mqtt.publish(msg);
};

exports.valueChanged = function(node, mqtt, nodeid, comclass, value) {
    nodes[nodeid].classes[comclass][value.index] = value;

    var msg = {};
    msg.qos = 1;
    msg.retain = false;
    msg.topic = node.topic +  nodeid + '/' + comclass + '/' + value.index + '/';
    msg.payload = value.value;
    if(typeof mqtt != 'undefined') mqtt.publish(msg);
};

exports.valueRemoved = function(nodeid, comclass, index) {
    if (nodes[nodeid].classes[comclass] &&
        nodes[nodeid].classes[comclass][index]){
        delete nodes[nodeid].classes[comclass][index];
    }
};

exports.notification = function(node, nodeid, notif) {
    switch (notif) {
        case 0:
            node.log('node'+nodeid+': message complete');
            break;
        case 1:
            node.log('node'+nodeid+': timeout');
            break;
        case 2:
            node.log('node'+nodeid+': nop');
            break;
        case 3:
            node.log('node'+nodeid+': node awake');
            break;
        case 4:
            node.log('node'+nodeid+': node sleep');
            break;
        case 5:
            node.log('node'+nodeid+': node dead');
            break;
        case 6:
            node.log('node'+nodeid+': node alive');
            break;
        default:
            node.log('node'+nodeid+': unhandled notification');
            break;
    }
};

exports.scanComplete = function(node) {
    node.log('Z-Wave network scan complete!');
    node.status({
        fill:'green',
        shape:'dot',
        text:'node-red:common.status.connected'
    });
};