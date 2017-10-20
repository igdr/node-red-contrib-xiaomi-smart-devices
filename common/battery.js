module.exports.info = function (input) {
    "use strict";

    //battery status
    var voltage = input / 1000;
    var status = {fill: "green", shape: "dot", text: "battery"};
    var voltage_level = 'high';

    if (input < 2.5) {
        status = {fill: "red", shape: "dot", text: "battery"};
        voltage_level = 'critical';
    } else if (input < 2.9) {
        status = {fill: "yellow", shape: "dot", text: "battery"};
        voltage_level = 'middle';
    }

    return {
        voltage: voltage,
        status: status,
        voltage_level: voltage_level
    }
};