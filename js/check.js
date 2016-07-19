'use strict';

var flows = require('./flows').readFlows();

// Function to check if the instance is already in flows file
function isNotInFlow(nodeid, comclass, value, product) {
    var test = true,
        node = '';

    if(product === null) {
        (comclass !== null && value !== null) ? node = "zwave-in-"+nodeid+"-"+comclass+":"+value.index : node = nodeid;
    } else {
        node = nodeid + '-' + product;
    }

    for(var i = 0; i < flows.length; i++) {
        test = !(flows[i].id === node);
        if(test === false) break;
    }

    return test;
}

// Function to avoid some unused instance during the self-generation
function comclassToShow(comclass) {
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
}

module.exports = {
    'isNotInFlow': isNotInFlow,
    'comclassToShow': comclassToShow
};