var battery = require('common/battery');

module.exports = function (RED) {
    "use strict";

    function XiaomiHtNode(config) {
        RED.nodes.createNode(this, config);
        this.gateway = RED.nodes.getNode(config.gateway);
        this.sid = config.sid;
        this.output = config.output;
        this.temperature = config.temperature;
        this.humidity = config.humidity;

        var node = this;
        var persistent = {
            'temperature': null,
            'humidity': null,
            'pressure': null,
            'voltage': null,
            'voltage_level': null
        };

        //initial status
        node.status({fill: "grey", shape: "ring", text: "battery"});

        if (this.gateway) {
            var self = this;
            node.on('input', function (msg) {
                var payload = msg.payload;

                if (payload.sid === node.sid && (payload.model.indexOf("sensor_ht") >= 0 || payload.model.indexOf("weather") >= 0)) {
                    var result = null;
                    var data = JSON.parse(payload.data);

                    //battery status
                    if (data.voltage) {
                        var battery = battery.info(data.voltage);

                        node.status(battery.status);
                        persistent.voltage = battery.voltage;
                        persistent.voltage_level = battery.voltage_level;
                    }

                    //temperature
                    if (data.temperature) {
                        persistent.temperature = data.temperature / 100;
                    }

                    //humidity
                    if (data.humidity) {
                        persistent.humidity = data.humidity / 100;
                    }

                    //pressure
                    if (data.pressure) {
                        persistent.pressure = data.pressure;
                    }

                    if (node.output === "0") {
                        //raw data
                        result = payload;
                    } else if (node.output === "1") {
                        //values
                        result = persistent;

                        result.tc = new Date().getTime();
                        result.device = self.gateway.getDeviceName(self.sid);
                    }

                    msg.payload = result;
                    node.send([msg]);
                }
            });
        } else {
            node.status({fill: "red", shape: "ring", text: "No gateway configured"});
        }

    }

    RED.nodes.registerType("xiaomi-ht", XiaomiHtNode);
};
