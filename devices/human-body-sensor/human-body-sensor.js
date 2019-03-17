const factory = require('../factory');

/**
 * @param {object} data
 */
function extractor(data) {
  if (data.lux) {
    data.lux = parseInt(data.lux);
  }

  if (data.no_motion) {
    data.status = 'no_motion';
    data.duration = data.no_motion;
    delete data.no_motion;
  }

  return data;
}

/**
 * @param {Red} RED
 */
module.exports = function (RED) {

  function XiaomiHumanBodySensor(config) {
    //create the node-red node
    RED.nodes.createNode(this, config);

    //create the device
    factory(RED, this, config, {
      extractor: extractor,
      persistence: ['lux', 'status']
    });
  }

  RED.nodes.registerType('xiaomi-human-body-sensor', XiaomiHumanBodySensor);
};