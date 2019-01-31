'use strict';

// productIDTotal refers to '../../node_modules/openzwave-shared/deps/open-zwave/config/manufacturer_specific.xml'

/*

bool Manager::SetConfigParam	(	
uint32 const 	_homeId,
uint8 const 	_nodeId,
uint8 const 	_param,
int32			_value,
uint8 const 	_size = 2 
)		

Set the value of a configurable parameter in a device. Some devices have various parameters that can be configured to control the device behavior. These are not reported by the device over the Z-Wave network, but can usually be found in the device's user manual. This method returns immediately, without waiting for confirmation from the device that the change has been made.

Parameters
_homeId	The Home ID of the Z-Wave controller that manages the node.
_nodeId	The ID of the node to configure.
_param	The index of the parameter.
_value	The value to which the parameter should be set.
_size	Is an optional number of bytes to be sent for the parameter _value. Defaults to 2.
Returns
true if the a message setting the value was sent to the device.

*/

// called for each node ready
function fillDevices(node, productIDTotal, nodes, zwave) {
    switch (productIDTotal) {
        case "0086-0003-0062": // Aeotec, ZW098 LED Bulb
        case "0086-0103-0062": // Aeotec, ZW098 LED Bulb
        case "0086-0203-0062": // Aeotec, ZW098 LED Bulb
        case "0131-0002-0002": // Zipato, RGBW LED Bulb
            (node.senderID !== undefined)? node.typeNode = "zwave-light-dimmer-switch" : node.type = "zwave-light-dimmer-switch";
            node.commandclass = "38";
            node.classindex = "0";
            break;

        case "0165-0002-0002": // NodOn, CRC-3-6-0x Soft Remote
            (node.senderID !== undefined)? node.typeNode = "nodonSoftRemote" : node.type = "nodonSoftRemote";
            zwave.setConfigParam(node.senderID, 3, 1, 1); // Enable scene mode for the SoftRemote
            break;

        case "010f-0600-1000": // FIBARO System, FGWPE Wall Plug
        case "010f-0f01-1000": // FIBARO Button
        case "0165-0001-0001": // NodOn, ASP-3-1-00 Smart Plug
        case "0060-0004-0001": // AN157 Plug-in switch
        case "0060-0003-0003": // Everspring AD147 Plug-in Dimmer Module
            (node.senderID !== undefined)? node.typeNode = "zwave-binary-switch" : node.type = "zwave-binary-switch";
            node.commandclass = "37";
            node.classindex = "0";
            break;

        case "010f-0800-1001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0800-2001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0800-4001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0801-1001": // FIBARO System, FGMS001 Motion Sensor
        case "010f-0801-2001": // FIBARO System, FGMS001 Motion Sensor
            (node.senderID !== undefined)? node.typeNode = "zwave-generic" : node.type = "zwave-generic";
            // (node.senderID !== undefined)? node.typeNode = "zwave-motion-sensor" : node.type = "zwave-motion-sensor";
            node.commandclass = "48";
            node.classindex = "0";
            break;

        case "010f-0700-1000": // FIBARO System, FGK101 Door Opening Sensor
        case "010f-0700-2000": // FIBARO System, FGK101 Door Opening Sensor
        case "010f-0700-3000": // FIBARO System, FGK101 Door Opening Sensor
        case "010f-0700-4000": // FIBARO System, FGK101 Door Opening Sensor
            (node.senderID !== undefined)? node.typeNode = "zwave-generic" : node.type = "zwave-generic";
            //(node.senderID !== undefined)? node.typeNode = "zwave-binary-sensor" : node.type = "zwave-binary-sensor";
            node.commandclass = "48";
            node.classindex = "0";
            break;

        case "0086-0002-004a": // Aeotec, ZW074 MultiSensor Gen5
        case "0086-0102-004a": // Aeotec, ZW074 MultiSensor Gen5
        case "0086-0202-004a": // Aeotec, ZW074 MultiSensor Gen5
        case "0086-0002-0064": // Aeotec, ZW074 MultiSensor 6
        case "0086-0102-0064": // Aeotec, ZW074 MultiSensor 6
        case "0086-0202-0064": // Aeotec, ZW074 MultiSensor 6
           (node.senderID !== undefined)? node.typeNode = "zwave-generic" : node.type = "zwave-generic";
//            (node.senderID !== undefined)? node.typeNode = "aeotecMultiSensor" : node.type = "aeotecMultiSensor";
            node.commandclass = "48";
            node.classindex = "0";
            zwave.setConfigParam(node.senderID, 3, 30, 2); // Set the time(sec) that the PIR stay ON before sending OFF
            zwave.setConfigParam(node.senderID, 4, 1, 1);  // PIR sensitivity
            zwave.setConfigParam(node.senderID, 5, 1, 1);  // send PIR detection on binary sensor command class
            break;
/*
		case "013c-0002-000c": // ZWave Zipato MultiSensor Quad	
			(node.senderID !== undefined)? node.typeNode = "zwave-generic" : node.type = "zwave-generic";
			// console.log("device.js - ZWave Zipato MultiSensor Quad " + node.senderID);
	        break;
*/

        default:
			console.log("Node " + node.senderID + " handled as generic. (productID:" +productIDTotal + ")");
            (node.senderID !== undefined)? node.typeNode = "zwave-generic" : node.type = "zwave-generic";
            node.commandclass = Object.keys(nodes[node.senderID].classes)[0]; // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object/keys
            node.classindex = Object.keys(nodes[node.senderID].classes[node.commandclass])[0];
            break;
    }
	
}

module.exports = {
    'fillDevices': fillDevices
};