'use strict';

module.exports = function (RED) {

  /**
   * @param {Object} config
   * @constructor
   */
  function XiaomiGatewayNode(config) {
    RED.nodes.createNode(this, config);
    this.sid = null;
    this.healthcheck = config.healthcheck * 1000 || 60000;
    this.timer = null;

    this.gateway = RED.nodes.getNode(config.gateway);
    if (this.gateway) {
      //initial status
      this.status({fill: 'grey', shape: 'ring', text: 'not connected'});

      //listen for the gateway messages
      this.gateway.on('message', (input) => {
        let msg = Object.assign({}, input);
        let payload = msg.payload;

        switch (payload.cmd) {
          case 'heartbeat' :
            this.sid = payload.sid;
            this.status({fill: 'green', shape: 'ring', text: 'connected, sid: ' + payload.sid});

            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
              this.status({fill: 'grey', shape: 'ring', text: 'not connected'});
            }, this.healthcheck);
            break;

          default:
            this.send([msg]);
            break;
        }
      });

      //listen for incoming messages
      this.on('input', function (msg) {
        let command = {
          sid: this.sid,
          cmd: 'write',
          model: 'gateway',
          data: msg.payload
        };
        this.gateway.sendCommand(command);
      });
    } else {
      //initial status
      this.status({fill: 'grey', shape: 'ring', text: 'not configured'});
    }
  }

  RED.nodes.registerType('xiaomi-gateway', XiaomiGatewayNode);
};