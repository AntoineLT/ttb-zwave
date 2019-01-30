'use strict';

var fs = require('fs'),
    exec = require('child_process').exec,
    flowsLocation = '/root/userdir/flows.json';

function readFlows() {
    //return JSON.parse(fs.readFileSync(flowsLocation, 'utf8'));
}

function writeFlows(flowsLocation, result) {
    // fs.writeFileSync(flowsLocation, result);
    // exec('service thethingbox restart', function(error, stdout, stderr) {
    //     if (error) console.error('exec error: '+error);
    // });
}



function checkZwaveNodeTopic() {
    // var content = readFlows(),
    //     contentL = content.length;

    // for(var i = 0; i < contentL; i++) {
    //     if(content[i].type === "zwave") {
    //         var topic = content[i].topic;
    //         break;
    //     }
    // }
    return "zwave" /*|| topic || "coldfacts/zwave";*/
}

module.exports = {
    'readFlows': readFlows,
    'writeFlows': writeFlows,
    'checkZwaveNodeTopic': checkZwaveNodeTopic
};