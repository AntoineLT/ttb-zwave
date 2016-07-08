'use strict';

var fs = require('fs');

// Function to check if the instance is already in flows file
exports.isNotInFlow = function(nodeid, comclass, value, product) {
    var test = true,
        node = '',
        flows = JSON.parse(fs.readFileSync('root/userdir/flows.json', 'utf8'));

    if(product === null) {
        (comclass !== null && value !== null) ? node = "zwave-in-"+nodeid+"-"+comclass+":"+value.index : node = nodeid;
    } else {
        node = nodeid + '-' + product;
    }

    for(var i = 0; i < flows.length; i++) {
        test = !(flows[i].id === node);
        if(test == false) break;
    }

    return test;
};

// Function to avoid some unused instance during the self-generation
exports.comclassToShow = function(comclass) {
    var test = false;

    switch(comclass) {
        case 50:
        case 94:
        case 112:
        case 115:
        case 132:
        case 134:
            test = false;
            break;
        default:
            test = true;
            break;
    }

    return test;
};
