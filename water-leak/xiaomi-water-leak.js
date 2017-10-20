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

                if (payload.sid === node.sid && payload.model.indexOf("sensor_wleak") >= 0) {
                    var result = null;
                    var data = JSON.parse(payload.data);

                    //battery status
                    if (data.voltage) {
                        var battery = battery.info(data.voltage);

                        node.status(battery.status);
                        persistent.voltage = battery.voltage;
                        persistent.voltage_level = battery.voltage_level;
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

    RED.nodes.registerType("xiaomi-water-leak", XiaomiMagnetNode);
};
