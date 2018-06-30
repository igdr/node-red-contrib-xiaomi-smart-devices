const battery = require('../../common/battery');

module.exports = function (RED) {
  'use strict';
  let mustache = require('mustache');

  function XiaomiCubeNode(config) {
    RED.nodes.createNode(this, config);
    this.gateway = RED.nodes.getNode(config.gateway);
    this.sid = config.sid;
    this.output = config.output;

    let node = this;
    let persistent = {
      'previous_status': null,
      'voltage': null,
      'voltage_level': null
    };

    node.status({fill: 'grey', shape: 'ring', text: 'battery'});

    if (this.gateway) {
      let self = this;
      node.on('input', function (msg) {
        let payload = msg.payload;

        if (payload.sid === node.sid && payload.model.indexOf('cube') >= 0) {
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
            //values
            result = Object.assign({
              status: null,
              duration: null,
              lux: null
            }, persistent);

            if (data.status) {
              result.status = data.status;
            }
            if (data.no_cube) {
              result.status = 'no_cube';
              result.duration = data.no_cube;
            }

            result.time = new Date().getTime();
            result.device = self.gateway.getDeviceName(self.sid);
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
      node.status({fill: 'red', shape: 'ring', text: 'No gateway configured'});
    }
  }

  RED.nodes.registerType('magic-cube-controller', XiaomiCubeNode);
};
