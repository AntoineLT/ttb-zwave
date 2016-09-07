'use strict';

var fs = require('fs'),
    exec = require('child_process').exec,
    flowsLocation = '/root/userdir/flows.json';

function readFlows() {
    return JSON.parse(fs.readFileSync(flowsLocation, 'utf8'));
}

function writeFlows(flowsLocation, result) {
    fs.writeFileSync(flowsLocation, result);
    exec('service thethingbox restart', function(error, stdout, stderr) {
        if (error) console.error('exec error: '+error);
    });
}

function addNodeToServerFlows(node) {
    var content = readFlows(),
        contentL = content.length;

    if(!node.id) {
        node.id = (1+Math.random()*4294967295).toString(16);
        content.push(node);
    } else {
        for(var i = 0; i < contentL; i++) {
            if(content[i].id === node.id && content[i].type === node.type)
                break;
        }
        if(i === contentL) content.push(node);
    }
    if(contentL < content.length) {
        var result = JSON.stringify(content, null, 4);
        writeFlows(flowsLocation, result);
    }
}

function checkZwaveNodeTopic() {
    var content = readFlows(),
        contentL = content.length;

    for(var i = 0; i < contentL; i++) {
        if(content[i].type === "zwave") {
            var topic = content[i].topic;
            break;
        }
    }
    return topic || undefined;
}

module.exports = {
    'readFlows': readFlows,
    'writeFlows': writeFlows,
    'addNodeToServerFlows': addNodeToServerFlows,
    'checkZwaveNodeTopic': checkZwaveNodeTopic
};