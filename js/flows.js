'use strict';

var fs = require('fs'),
    flowsLocation = '/root/userdir/flows.json';

function read() {
    return JSON.parse(fs.readFileSync(flowsLocation, 'utf8'));
}

function write(flowsLocation, result) {
    fs.writeFileSync(flowsLocation, result);
}

module.exports = {
    'read': read,
    'write': write
};