'use strict';

const battery = require('../../common/battery');
const crypto = require('crypto');


/**
 * @param {RED} RED
 */
module.exports = function (RED) {
  let udpInputPortsInUse = {};

  /**
   * @param {Object} config
   * @constructor
   */
  function XiaomiGatewayNode(config) {
    RED.nodes.createNode(this, config);

    this.gateway = RED.nodes.getNode(config.gateway);
    this.healthcheck = parseInt(config.healthcheck) || 60;

    let currentToken = null;
    let timer;

    if (this.gateway && this.gateway.address && this.gateway.port) {
      //initial status
      this.status({fill: 'grey', shape: 'ring', text: 'not connected'});

      

      // //listen for incomming messages
      // this.on('input', function (msg) {
      //   if (this.gateway.key && currentToken) {
      //     let cmd = msg.payload;
      //     cmd.data.key = currentToken;
      //     cmd.data = JSON.stringify(cmd.data);
      //
      //     const message = Buffer.from(JSON.stringify(cmd));
      //     socket.send(message, 0, message.length, this.gateway.port, this.gateway.address, function () {
      //       console.info(`Sending message '${message}'`);
      //     });
      //   } else {
      //     this.status({fill: 'red', shape: 'ring', text: 'key is not set'});
      //   }
      //
      //   return [null];
      // })
    } else {
      //initial status
      this.status({fill: 'grey', shape: 'ring', text: 'not configured'});
    }
  }

  RED.nodes.registerType('xiaomi-gateway', XiaomiGatewayNode);
};