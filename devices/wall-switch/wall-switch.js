const factory = require('../factory');

/**
 * @param {Red} RED
 */
module.exports = function (RED) {

  function XiaomiWallSwitch(config) {
    //create the node-red node
    RED.nodes.createNode(this, config);

    let options = {};
    switch (config.model) {
      case 'wired_single_button':
        options.persistence = ['channel_0'];
        break;

      case 'wired_double_button':
        options.persistence = ['channel_0', 'channel_1'];
        break;

      default:
        options.persistence = [];
        break;
    }

    /**
     * @param {object} device
     * @param {object} payload
     * @returns {void}
     */
    options._onInput = function (device, payload) {
      if (payload.data.channel_0 === 'switch') {
        payload.data.channel_0 = device.persistence['channel_0'] === 'on' ? 'off' : 'on';
      }
    };

    //create the device
    factory(RED, this, config, options);
  }

  RED.nodes.registerType('xiaomi-wall-switch', XiaomiWallSwitch);
};