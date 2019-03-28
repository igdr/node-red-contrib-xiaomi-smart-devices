const battery = require('../../common/battery');

module.exports = function (RED) {
  'use strict';
  let mustache = require('mustache');

  function XiaomiSmokeDetectorNode(config) {
    RED.nodes.createNode(this, config);
    this.gateway = RED.nodes.getNode(config.gateway);
    this.sid = config.sid;
    this.output = config.output;
    this.openmsg = config.openmsg;
    this.closemsg = config.closemsg;

    let node = this;
    let persistent = {
      'status': null,
      'previous_status': null,
      'voltage': null,
      'voltage_level': null,
      'alarm': null,
      'density':null
    };

    //initial status
    node.status({fill: 'grey', shape: 'ring', text: 'battery'});

    if (this.gateway) {
      let self = this;
      node.on('input', function (msg) {
        let payload = msg.payload;

        if (payload.sid === node.sid && payload.model.indexOf('smoke') >= 0) {
          let result = null;
          let data = payload.data;

          //battery status
          if (data.voltage) {
            let info = battery.info(data.voltage);
            node.status(info.status);
            persistent.voltage = info.voltage;
            persistent.voltage_level = info.voltage_level;
          }
          if (data.alarm) {
            persistent.alarm = parseInt(data.alarm);
            switch (persistent.alarm){
              case 0:
                persistent.status = "standby";
                break;
              case 2:
                persistent.status = "alarm";
                break;
              case 8:
                persistent.status = "Low battery";
                break;
              default:
                persistent.status = "unknown";
                break;
            }
          }
          if (data.density) {
            persistent.density = parseInt(data.density);
          }
          if (node.output === '0') {
            //raw data
            result = payload;
          } else if (node.output === '1') {
            //only values
            result = Object.assign({
              alarm: null,
              density: null
            }, persistent);

            if (data.status) {
              result.status = data.status;
            }

            result.time = new Date().getTime();
            result.device = self.gateway.getDeviceName(self.sid);
          } else if (node.output === '2') {
            //template
            if (data.status && data.status === 'open') {
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
      node.status({fill: 'red', shape: 'ring', text: 'No gateway configured'});
    }
  }

  RED.nodes.registerType('xiaomi-smoke-detector', XiaomiSmokeDetectorNode);
};
