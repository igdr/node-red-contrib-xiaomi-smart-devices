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
            node.on('input', function (msg) {
                var payload = msg.payload;

                if (payload.sid === node.sid && (payload.model.indexOf("sensor_ht") >= 0 || payload.model.indexOf("weather") >= 0)) {
                    var result = null;
                    var data = JSON.parse(payload.data);

                    //battery status
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

                    //temperature
                    if (data.temperature) {
                        persistent.temperature = data.temperature;
                    }

                    //humidity
                    if (data.humidity) {
                        persistent.humidity = data.humidity;
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
