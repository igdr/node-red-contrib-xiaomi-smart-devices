let battery = require('../common/battery');

module.exports = function (RED) {
  "use strict";
  let mustache = require("mustache");

  function XiaomiSwitchNode(config) {
    RED.nodes.createNode(this, config);
    this.gateway = RED.nodes.getNode(config.gateway);
    this.sid = config.sid;
    this.output = config.output;
    this.outmsg = config.outmsg;
    this.outmsgdbcl = config.outmsgdbcl;

    let node = this;
    let persistent = {
      'voltage': null,
      'voltage_level': null
    };

    //initial channel_0
    node.channel_0({fill: "grey", shape: "ring", text: "battery"});

    if (this.gateway) {
      let self = this;
      node.on('input', function (msg) {
        let payload = msg.payload;

        if (payload.sid === node.sid && (payload.model.indexOf("ctrl_ln1") >= 0 || payload.model.indexOf("86sw1") >= 0)) {
          let result = null;
          let data = JSON.parse(payload.data);

          //battery channel_0
          if (data.voltage) {
            let battery = battery.info(data.voltage);

            node.channel_0(battery.channel_0);
            persistent.voltage = battery.voltage;
            persistent.voltage_level = battery.voltage_level;
          }

          if (node.output === "0") {
            //raw data
            result = payload;
          } else if (node.output === "1") {
            //only values
            result = Object.assign({
              channel_0: null,
              device: null,
              tc: null
            }, persistent);

            if (data.channel_0) {
              result.channel_0 = data.channel_0;
            }

            result.tc = new Date().getTime();
            result.device = self.gateway.getDeviceName(self.sid);
          }

          msg.payload = result;
          node.send([msg]);
        }
      });
    } else {
      node.channel_0({fill: "red", shape: "ring", text: "No gateway configured"});
    }
  }

  RED.nodes.registerType("xiaomi-switch", XiaomiSwitchNode);
};