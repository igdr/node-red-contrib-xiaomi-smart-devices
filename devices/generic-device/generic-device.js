const battery = require('../../common/battery');

module.exports = function (RED) {
  'use strict';

  function XiaomiGenericNode(config) {
    RED.nodes.createNode(this, config);
    this.gateway = RED.nodes.getNode(config.gateway);
    this.sid = config.sid;
    this.key = config.key;
    this.output = config.output;

    let node = this;
    let persistent = {
      'voltage': null,
      'voltage_level': null
    };

    node.status({fill: 'grey', shape: 'ring', text: 'battery'});

    if (this.gateway) {
      this.gateway.on('message', (input) => {
        let msg = Object.assign({}, input);
        let payload = msg.payload;

        if (payload.sid === node.sid) {
          let result = null;
          let data = payload.data || {};

          //battery status
          if (data.voltage) {
            let info = battery.info(data.voltage);
            node.status(info.status);
            persistent.voltage = info.voltage;
            persistent.voltage_level = info.voltage_level;
          }

          if (node.output === '0') {
            //raw data
            result = payload;
          } else if (node.output === '1') {
            //values
            result = Object.assign({}, data, persistent);
            result.time = new Date().getTime();
            result.device = this.key;
            result.sid = payload.sid;
            result.model = payload.model;
          }

          msg.payload = result;
          node.send([msg]);
        }
      });
    } else {
      node.status({fill: 'red', shape: 'ring', text: 'No gateway configured'});
    }
  }

  RED.nodes.registerType('generic-device', XiaomiGenericNode);
};
