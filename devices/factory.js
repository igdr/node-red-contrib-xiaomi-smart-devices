const Device = require('./device');

/**
 * @param {Red} RED
 * @param {Node} node
 * @param {object} config
 * @param {object} options
 * @return {Device}
 */
module.exports = function (RED, node, config, options = {}) {
  let gateway = RED.nodes.getNode(config.gateway);

  return new Device(gateway, node, config, options);
};