const dgram = require('dgram');
const crypto = require('crypto');

/**
 * @param {object} message
 * @param {object} rinfo
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
 * @param {Object} node
 * @param {string} key
 * @param {Object} msg
 * @returns {String}
 */
function getGatewayToken(node, key, msg) {
  let result = null;

  //get gateway key
  if (key) {
    let token = msg.payload.token;
    if (token) {
      try {
        let cipher = crypto.createCipheriv('aes128', key, (new Buffer('17996d093d28ddb3ba695a2e6f58562e', 'hex')));
        let encoded_string = cipher.update(token, 'utf8', 'hex');

        encoded_string += cipher.final('hex');
        result = encoded_string.substring(0, 32);
      } catch (e) {
        //initial status
        node.error(e.message);
        result = null;
      }

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
    this.address = config.address;
    this.multicast = '224.0.0.50';
    this.currentToken = null;
    this.ready = false;

    /**
     * @param {object} input
     */
    this.sendCommand = (input) => {
      if (this.key && this.currentToken) {
        let cmd = Object.assign({}, input);
        cmd.data = cmd.data || {};
        cmd.data.key = this.currentToken;
        cmd.data = JSON.stringify(cmd.data);

        const message = Buffer.from(JSON.stringify(cmd));
        socket.send(message, 0, message.length, this.port, this.multicast, function () {
          console.info(`Sending message '${message}'`);
        });
      } else {
        this.error('key is not set');
      }
    };

    //initialize connection
    let socket;
    let reuse = false;
    if (!udpInputPortsInUse.hasOwnProperty(this.port)) {
      socket = dgram.createSocket({type: 'udp4'});  // default to udp4
      socket.bind(this.port);
      udpInputPortsInUse[this.port] = socket;
    } else {
      console.warn('UDP socket is aleady used, try to reuse', this.port);
      socket = udpInputPortsInUse[this.port];  // re-use existing
      reuse = true;
    }

    socket.on('listening', () => {
      try {
        if (false === reuse) {
          socket.addMembership(this.multicast);
        }

        //debug
        const address = socket.address();
        this.log(`UDP socket listening on ${address.address}:${address.port}`);

        //initial status
        this.status({fill: 'grey', shape: 'ring', text: 'connected'});
      } catch (e) {
        this.status({fill: 'red', shape: 'ring', text: 'connection error'});
      }
    });

    socket.on('message', (message, rinfo) => {
      let msg = createMessage(message, rinfo);

      if (msg.payload.token) {
        //update token
        this.currentToken = getGatewayToken(this, this.key, msg);

        if (false === this.ready) {
          this.emit('ready');
          this.ready = true;
        }
      }

      this.emit('message', msg);
    });

    //listen for node close onMessage and free socket
    this.on("close", () => {
      if (udpInputPortsInUse.hasOwnProperty(this.port)) {
        delete udpInputPortsInUse[this.port];
      }
      try {
        socket.close();
        this.log('UDP socket closed');
      } catch (err) {
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
