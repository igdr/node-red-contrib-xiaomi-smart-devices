module.exports = function (RED) {

  function XiaomiGatewayConfigNode(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.key = config.key;
    this.port = config.port || 9898;
    this.address = config.address || '224.0.0.50';
  }

  RED.nodes.registerType("xiaomi-gateway-config", XiaomiGatewayConfigNode);
};
