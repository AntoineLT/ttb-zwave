'use strict';

var fs = require('fs'),
    flowsLocation = '/root/userdir/flows.json';

function readFlows() {
    return JSON.parse(fs.readFileSync(flowsLocation, 'utf8'));
}

function writeFlows(flowsLocation, result) {
    fs.writeFileSync(flowsLocation, result);
}

function addNodeToServerFlows(node) {
    var content = readFlows(),
        contentL = content.length,
        test = false;

    for(var i = 0; i < contentL; i++) {
        if(!node.id) node.id = (1+Math.random()*4294967295).toString(16);
        if(content[i].id === node.id && content[i].type === node.type)
            test = true;
    }
    if(!test) content.push(node);
    if(contentL < content.length) {
        var result = JSON.stringify(content, null, 4);
        writeFlows(flowsLocation, result);
    }
}

module.exports = {
    'readFlows': readFlows,
    'writeFlows': writeFlows,
    'addNodeToServerFlows': addNodeToServerFlows
};