module.exports = function (RED) {

    function XiaomiConfiguratorNode(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.deviceList = n.deviceList || [];
        this.key = n.key;

        var node = this;

        this.getDeviceName = function (sid) {
            for (var device in this.deviceList) {
                if (device.sid === sid) {
                    return device.desc;
                }
            }

            return null;
        }
    }

    RED.nodes.registerType("xiaomi-configurator", XiaomiConfiguratorNode);

};
