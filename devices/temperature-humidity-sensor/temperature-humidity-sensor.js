const factory = require('../factory');

/**
 * @param {object} data
 */
function extractor(data) {
  //temperature
  if (data.temperature) {
    data.temperature = data.temperature / 100;
  }

  //humidity
  if (data.humidity) {
    data.humidity = Math.round(data.humidity / 100);
  }

  return data;
}

/**
 * @param {Red} RED
 */
module.exports = function (RED) {

  function XiaomiTemperatureHumiditySensor(config) {
    //create the node-red node
    RED.nodes.createNode(this, config);

    //create the device
    factory(RED, this, config, {
      extractor: extractor,
      persistence: ['temperature', 'humidity', 'pressure'],
      send_on_ready: true
    });
  }

  RED.nodes.registerType('xiaomi-temperature-humidity-sensor', XiaomiTemperatureHumiditySensor);
};