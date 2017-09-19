module.exports = function (RED) {
    "use strict";
    var mustache = require("mustache");

    function XiaomiMagnetNode(config) {
        RED.nodes.createNode(this, config);
        this.gateway = RED.nodes.getNode(config.gateway);
        this.sid = config.sid;
        this.output = config.output;
        this.openmsg = config.openmsg;
        this.closemsg = config.closemsg;

        var node = this;
        var persistent = {
            'previous_status': null,
            'voltage': null,
            'voltage_level': null
        };

        //initial status
        node.status({fill: "grey", shape: "ring", text: "battery"});

        if (this.gateway) {
            var self = this;
            node.on('input', function (msg) {
                // var payload = JSON.parse(msg);
                var payload = msg.payload;

                if (payload.sid === node.sid && payload.model.indexOf("magnet") >= 0) {
                    var result = null;
                    var data = JSON.parse(payload.data);

                    //battery status
                    if (data.voltage) {
                        persistent.voltage = data.voltage / 1000;
                        if (data.voltage < 2.5) {
                            node.status({fill: "red", shape: "dot", text: "battery"});
                            persistent.voltage_level = 'critical';
                        } else if (data.voltage < 2.9) {
                            node.status({fill: "yellow", shape: "dot", text: "battery"});
                            persistent.voltage_level = 'middle';
                        } else {
                            node.status({fill: "green", shape: "dot", text: "battery"});
                            persistent.voltage_level = 'high';
                        }
                    }

                    if (node.output === "0") {
                        //raw data
                        result = payload;
                    } else if (node.output === "1") {
                        //only values
                        result = Object.assign({
                            status: null
                        }, persistent);

                        if (data.status) {
                            result.status = data.status;
                        }

                        result.tc = new Date().getTime();
                        result.device = self.gateway.getDeviceName(self.sid);
                    } else if (node.output === "2") {
                        //template
                        if (data.status && data.status === "open") {
                            result = mustache.render(node.openmsg, data);
                        } else {
                            result = mustache.render(node.closemsg, data);
                        }
                    }

                    msg.payload = result;
                    node.send([msg]);

                    //save previous state
                    if (result.status) {
                        persistent.previous_status = result.status;
                    }
                }
            });
        } else {
            node.status({fill: "red", shape: "ring", text: "No gateway configured"});
        }
    }

    RED.nodes.registerType("xiaomi-magnet", XiaomiMagnetNode);
};
