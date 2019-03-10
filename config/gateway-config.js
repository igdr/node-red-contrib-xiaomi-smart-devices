module.exports = function (RED) {

  function XiaomiGatewayConfigNode(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.deviceList = config.deviceList || [];
    this.key = config.key;
    this.port = config.port || 9898;
    this.address = config.address || '224.0.0.50';

    this.getDeviceName = function (sid) {
      for (let i in this.deviceList) {
        if (this.deviceList[i].sid === sid) {
          return this.deviceList[i].desc;
        }
      }

      return null;
    }
  }

  RED.nodes.registerType("xiaomi-gateway-config", XiaomiGatewayConfigNode);

};
