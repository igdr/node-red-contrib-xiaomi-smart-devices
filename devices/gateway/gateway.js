'use strict';

const battery = require('../../common/battery');
const dgram = require('dgram');
const crypto = require('crypto');

/**
 * @param <Buffer> message
 * @param <Object> rinfo
 *
 * @returns Object
 */
function createMessage(message, rinfo) {
  let payload = JSON.parse(message.toString());
  if (payload.data) {
    payload.data = JSON.parse(payload.data);
  }

  return {
    fromip: `${rinfo.address}:${rinfo.port}`,
    ip: rinfo.address,
    port: rinfo.port,
    payload: payload
  };
}

/**
 * @param {string} key
 * @param {Object} msg
 * @returns {String}
 */
function getGatewayToken(key, msg) {
  let result = null;

  //get gateway key
  if (key) {
    let token = msg.payload.token;
    if (token) {
      let cipher = crypto.createCipheriv('aes128', key, (new Buffer('17996d093d28ddb3ba695a2e6f58562e', 'hex')));
      let encoded_string = cipher.update(token, 'utf8', 'hex');

      encoded_string += cipher.final('hex');
      result = encoded_string.substring(0, 32);
    }
  }

  return result;
}

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

      //initialize connection
      let socket;
      let reuse = false;
      if (!udpInputPortsInUse.hasOwnProperty(this.port)) {
        socket = dgram.createSocket({type: 'udp4'});  // default to udp4
        socket.bind(this.gateway.port);
        udpInputPortsInUse[this.port] = socket;
      } else {
        this.log('UDP socket is aleady used, try reusing existing', this.port);
        socket = udpInputPortsInUse[this.port];  // re-use existing
        reuse = true;
      }

      socket.on('listening', () => {
        if (false === reuse) {
          socket.addMembership(this.gateway.address);
        }

        //debug
        const address = socket.address();
        this.log(`UDP socket listening on ${address.address}:${address.port}`);

        //initial status
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
      });

      socket.on('message', (message, rinfo) => {
        let msg = createMessage(message, rinfo)

        if (msg.payload.cmd == 'heartbeat' && msg.payload.model == 'gateway') {
          //get token
          currentToken = getGatewayToken(this.gateway.key, msg);

          //healthcheck
          this.status({fill: 'green', shape: 'ring', text: 'connected'});

          clearTimeout(timer);
          timer = setTimeout(() => {
            this.status({fill: 'red', shape: 'ring', text: 'healthcheck failed'});
          }, this.healthcheck * 1000);

          return;
        }

        //send message
        if (msg.payload.cmd == 'report' || msg.payload.cmd == 'heartbeat') {
          this.send([msg]);
        }
      });

      //listen for node close message and free socket
      this.on("close", () => {
        if (udpInputPortsInUse.hasOwnProperty(this.port)) {
          delete udpInputPortsInUse[this.port];
        }
        try {
          socket.close();
          this.log('UDP socket closed');
        } catch (err) {
          //this.error(err);
        }
      });

      //listen for incomming messages
      this.on('input', (msg) => {
        if (this.gateway.key && currentToken) {
          let cmd = msg.payload;
          cmd.data.key = currentToken;
          cmd.data = JSON.stringify(cmd.data);

          const message = Buffer.from(JSON.stringify(cmd));
          socket.send(message, 0, message.length, this.gateway.port, this.gateway.address, () => {
            this.log(`Sending message '${message}'`);
          });
        } else {
          this.status({fill: 'red', shape: 'ring', text: 'key is not set'});
        }

        return [null];
      })
    } else {
      //initial status
      this.status({fill: 'grey', shape: 'ring', text: 'not configured'});
    }
  }

  //gets sockets
  RED.httpAdmin.get('/udp-ports/:id', RED.auth.needsPermission('udp-ports.read'), (req, res) => {
    res.json(Object.keys(udpInputPortsInUse));
  });

  //register new type
  RED.nodes.registerType('xiaomi-gateway', XiaomiGatewayNode);
};