const factory = require('../factory');

/**
 * @param {object} data
 */
function extractor(data) {
  if (data.alarm) {
    data.alarm = parseInt(data.alarm);
    switch (data.alarm) {
      case 0:
        data.status = "standby";
        break;
      case 2:
        data.status = "alarm";
        break;
      case 8:
        data.status = "Low battery";
        break;
      default:
        data.status = "unknown";
        break;
    }
  }
  if (data.density) {
    data.density = parseInt(data.density);
  }

  return data;
}

/**
 * @param {Red} RED
 */
module.exports = function (RED) {

  function XiaomiSmokeDetectorNode(config) {
    //create the node-red node
    RED.nodes.createNode(this, config);

    //create the device
    factory(RED, this, config, {
      extractor: extractor,
      persistence: ['status', 'density', 'alarm'],
      send_on_ready: true
    });
  }

  RED.nodes.registerType('xiaomi-smoke-detector', XiaomiSmokeDetectorNode);
};