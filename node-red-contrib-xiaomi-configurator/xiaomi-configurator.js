module.exports = function (RED) {

    function XiaomiConfiguratorNode(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.deviceList = n.deviceList || [];
        this.key = n.key;

        var node = this;

        this.getDeviceName = function (sid) {
            return deviceList[sid].desc;
        }
    }

    RED.nodes.registerType("xiaomi-configurator", XiaomiConfiguratorNode);

};
