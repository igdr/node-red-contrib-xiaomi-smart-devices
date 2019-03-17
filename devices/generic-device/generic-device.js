const factory = require('../factory');

/**
 * @param {Red} RED
 */
module.exports = function (RED) {

  function XiaomiGenericDevice(config) {
    //create the node-red node
    RED.nodes.createNode(this, config);

    //create the device
    factory(RED, this, config);
  }

  RED.nodes.registerType('xiaomi-generic-device', XiaomiGenericDevice);
};