var battery = require('../common/battery');

module.exports = function (RED) {
    "use strict";
    var mustache = require("mustache");

    function XiaomiSwitchNode(config) {
        RED.nodes.createNode(this, config);
        this.gateway = RED.nodes.getNode(config.gateway);
        this.sid = config.sid;
        this.output = config.output;
        this.outmsg = config.outmsg;
        this.outmsgdbcl = config.outmsgdbcl;

        var node = this;
        var persistent = {
            'voltage': null,
            'voltage_level': null
        };

        //initial status
        node.status({fill: "grey", shape: "ring", text: "battery"});

        if (this.gateway) {
            var self = this;
            node.on('input', function (msg) {
                var payload = msg.payload;

                if (payload.sid === node.sid && payload.model.indexOf("switch") >= 0) {
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
                        if (data.status && data.status === "click") {
                            result = mustache.render(node.outmsg, data);
                        }

                        if (data.status && data.status === "double_click") {
                            result = mustache.render(node.outmsgdbcl, data);
                        }
                    }

                    msg.payload = result;
                    node.send([msg]);
                }
            });
        } else {
            node.status({fill: "red", shape: "ring", text: "No gateway configured"});
        }
    }

    RED.nodes.registerType("xiaomi-switch", XiaomiSwitchNode);
};