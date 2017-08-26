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
            'voltage': null,
            'voltage_level': null
        };

        node.status({fill: "grey", shape: "ring", text: "battery"});

        if (this.gateway) {
            node.on('input', function (msg) {
                var payload = msg.payload;

                if (payload.sid === node.sid && payload.model.indexOf("motion") >= 0) {
                    var result = null;
                    var data = JSON.parse(payload.data);

                    if (data.voltage) {
                        persistent.voltage = data.voltage;

                        if (data.voltage < 2500) {
                            node.status({fill: "red", shape: "dot", text: "battery"});
                            persistent.voltage_level = 'critical';
                        } else if (data.voltage < 2900) {
                            node.status({fill: "yellow", shape: "dot", text: "battery"});
                            persistent.voltage_level = 'middle';
                        } else {
                            node.status({fill: "green", shape: "dot", text: "battery"});
                            persistent.voltage_level = 'high';
                        }
                    }

                    if (node.output === "0") {
                        result = payload;
                    } else if (node.output === "1") {
                        result = Object.assign({
                            status: null,
                            duration: null,
                            lux: null
                        }, persistent);

                        if (data.status) {
                            result.status = data.status;
                        }
                        if (data.lux) {
                            result.lux = parseInt(data.lux);
                            persistent.lux = parseInt(data.lux);
                        }
                        if (data.no_motion) {
                            result.status = "no_motion";
                            result.duration = data.no_motion;
                        }
                    } else if (node.output === "2") {
                        if (data.status === 'motion') {
                            result = mustache.render(node.motionmsg, data);
                        } else {
                            result = mustache.render(node.nomotionmsg, data);
                        }
                    }

                    msg.payload = result;
                    node.send([msg]);
                }
            });

            node.on("close", function () {
                // empty
            });

        } else {
            // no gateway configured
        }
    }

    RED.nodes.registerType("xiaomi-motion", XiaomiMotionNode);
};
