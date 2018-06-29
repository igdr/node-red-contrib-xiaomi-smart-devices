module.exports = function (RED) {

  function XiaomiConfiguratorNode(n) {
    RED.nodes.createNode(this, n);
    this.name = n.name;
    this.deviceList = n.deviceList || [];
    this.key = n.key;

    this.getDeviceName = function (sid) {
      for (let i in this.deviceList) {
        if (this.deviceList[i].sid === sid) {
          return this.deviceList[i].desc;
        }
      }

      return null;
    }
  }

  RED.nodes.registerType("xiaomi-configurator", XiaomiConfiguratorNode);

};
