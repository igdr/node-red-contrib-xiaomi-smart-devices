'use strict';

module.exports = function (RED) {

  /**
   * @param {Object} config
   * @constructor
   */
  function XiaomiGatewayUtilsNode(config) {
    RED.nodes.createNode(this, config);
    this.sid = config.sid;
    this.devices = {};

    /**
     * @private
     */
    this._onGatewayReady = function () {
      let cmd = {'cmd': 'get_id_list', 'sid': this.sid};
      this.gateway.sendCommand(cmd);
    };

    /**
     * @param {Object} msg
     * @private
     */
    this._onReadAck = function (msg) {
      let payload = msg.payload;
      this.devices[payload.sid] = payload.model;
    };

    /**
     * @param {Object} msg
     * @private
     */
    this._onGetIdListAck = function (msg) {
      msg.payload.data.forEach((sid) => {
        this.devices[sid] = 'unknown';
        let cmd = {'cmd': 'read', 'sid': sid};
        //initialize
        this.gateway.sendCommand(cmd);
      })
    };

    this.gateway = RED.nodes.getNode(config.gateway);
    if (this.gateway) {
      //on ready
      this.gateway.on('ready', () => this._onGatewayReady());

      //listen for the gateway messages
      this.gateway.on('message', (input) => {
        let msg = Object.assign({}, input);
        let payload = msg.payload;

        switch (payload.cmd) {
          case 'read_ack':
            this._onReadAck(msg);
            break;

          case 'get_id_list_ack':
            //request info
            this._onGetIdListAck(msg);

            //wait for result
            setTimeout(() => {
              this.send({
                payload: this.devices
              });
            }, 2000);
            break;
        }

        //status
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
      });

      //initial status
      this.status({fill: 'grey', shape: 'ring', text: 'not connected'});
    } else {
      //initial status
      this.status({fill: 'grey', shape: 'ring', text: 'not configured'});
    }

    //listen for incoming messages
    this.on('input', function () {
      this._onGatewayReady();
    });
  }

  RED.nodes.registerType('xiaomi-gateway-utils', XiaomiGatewayUtilsNode);
};