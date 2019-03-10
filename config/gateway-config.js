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

module.exports = function (RED) {
  let udpInputPortsInUse = {};

  function XiaomiGatewayConfigNode(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.key = config.key;
    this.port = config.port || 9898;
    this.address = config.address || '224.0.0.50';

    //initialize connection
    let socket;
    if (!udpInputPortsInUse.hasOwnProperty(this.port)) {
      socket = dgram.createSocket({type: 'udp4'});  // default to udp4
      socket.bind(this.port);
      udpInputPortsInUse[this.port] = socket;
    }
    else {
      console.warn('UDP socket is aleady used, try to reuse', this.port);
      socket = udpInputPortsInUse[this.port];  // re-use existing
    }

    socket.on('listening', () => {
      socket.addMembership(this.address);

      //debug
      const address = socket.address();
      this.log(`UDP socket listening on ${address.address}:${address.port}`);

      //initial status
      this.status({fill: 'green', shape: 'ring', text: 'connected'});
    });

    let currentToken = null;
    socket.on('message', (message, rinfo) => {
      let msg = createMessage(message, rinfo);

      //get token
      if (msg.payload.cmd === 'heartbeat' && msg.payload.model === 'gateway') {
        currentToken = getGatewayToken(this.key, msg);
      }

      this.emit('message', msg);
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
  }

  //gets sockets
  RED.httpAdmin.get('/udp-ports/:id', RED.auth.needsPermission('udp-ports.read'), (req, res) => {
    res.json(Object.keys(udpInputPortsInUse));
  });

  //register new type
  RED.nodes.registerType("xiaomi-gateway-config", XiaomiGatewayConfigNode);
};
