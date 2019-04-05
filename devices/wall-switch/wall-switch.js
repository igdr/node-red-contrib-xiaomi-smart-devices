const battery = require('../../common/battery');

module.exports = function (RED) {
  'use strict';

  function XiaomiWallSwitchNode(config) {
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

    //initial status
    node.status({fill: 'grey', shape: 'ring', text: 'battery'});

    if (this.gateway) {
      let self = this;
      node.on('input', function (msg) {
        let payload = msg.payload;

        if (payload.sid === node.sid && (
          payload.model.indexOf('ctrl_ln1') >= 0 ||
          payload.model.indexOf('86sw1') >= 0 ||
          payload.model.indexOf('ctrl_ln2') >= 0 ||
          payload.model.indexOf('86sw2') >= 0 ||
          payload.model.indexOf('remote.b186acn01') >= 0 ||
          payload.model.indexOf('remote.b286acn01') >= 0)
      ) {
          let result = null;
          let data = payload.data;

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
            //only values
            result = Object.assign({
              channel_0: null,
              channel_1: null,
              device: null,
              time: null
            }, persistent);

            if (data.channel_0) {
              result.channel_0 = data.channel_0;
            }
            if (data.channel_1) {
              result.channel_1 = data.channel_1;
            }

            result.time = new Date().getTime();
            result.device = self.gateway.getDeviceName(self.sid);
          }

          msg.payload = result;
          node.send([msg]);
        }
      });
    } else {
      node.status({fill: 'red', shape: 'ring', text: 'No gateway configured'});
    }
  }

  RED.nodes.registerType('xiaomi-wall-switch', XiaomiWallSwitchNode);
};