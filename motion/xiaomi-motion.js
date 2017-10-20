module.exports = function (RED) {
    "use strict";
    var mustache = require("mustache");

    function XiaomiMotionNode(config) {
        RED.nodes.createNode(this, config);
        this.gateway = RED.nodes.getNode(config.gateway);
        this.sid = config.sid;
        this.output = config.output;
        this.motionmsg = config.motionmsg;
        this.nomotionmsg = config.nomotionmsg;

        var node = this;
        var persistent = {
            'lux': null,
            'previous_status': null,
            'voltage': null,
            'voltage_level': null
        };

        node.status({fill: "grey", shape: "ring", text: "battery"});

        if (this.gateway) {
            var self = this;
            node.on('input', function (msg) {
                var payload = msg.payload;

                if (payload.sid === node.sid && payload.model.indexOf("motion") >= 0) {
                    var result = null;
                    var data = JSON.parse(payload.data);

                    //battery status
                    if (data.voltage) {
                        var battery = battery.info(data.voltage);

                        node.status(battery.status);
                        persistent.voltage = battery.voltage;
                        persistent.voltage_level = battery.voltage_level;
                    }

                    //lux
                    if (data.lux) {
                        persistent.lux = parseInt(data.lux);
                    }

                    if (node.output === "0") {
                        //raw data
                        result = payload;
                    } else if (node.output === "1") {
                        //values
                        result = Object.assign({
                            status: null,
                            duration: null,
                            lux: null
                        }, persistent);

                        if (data.status) {
                            result.status = data.status;
                        }
                        if (data.no_motion) {
                            result.status = "no_motion";
                            result.duration = data.no_motion;
                        }

                        result.tc = new Date().getTime();
                        result.device = self.gateway.getDeviceName(self.sid);
                    } else if (node.output === "2") {
                        //template
                        if (data.status === 'motion') {
                            result = mustache.render(node.motionmsg, data);
                        } else {
                            result = mustache.render(node.nomotionmsg, data);
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

    RED.nodes.registerType("xiaomi-motion", XiaomiMotionNode);
};
