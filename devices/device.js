const Battery = require('../common/battery');

/**
 * @param {Node} gateway
 * @param {Node} node
 * @param {object} config
 * @param {object} options
 * @constructor
 */
function Device(gateway, node, config, options) {
  this.node = node;
  this.node.gateway = gateway;
  this.node.sid = config.sid;
  this.node.key = config.key;
  this.node.model = null;
  this.options = options;
  this.fields = options.persistence || [];
  this.readAskInterval = 60000;
  this.battery = new Battery(this.node);
  this.ready = false;
  this.timer = null;

  //save persistent fields
  this.persistence = {};
  this.fields.forEach((name) => {
    this.persistence[name] = null;
  });

  if (this.node.gateway) {
    this.node.gateway.on('message', (input) => this._onMessage(input));
    this.node.gateway.on('ready', () => this._onGatewayReady());
    this.node.on('input', (msg) => this._onInput(msg));
    this.node.on('close', () => this._onClose());
  } else {
    this.node.status({fill: 'red', shape: 'ring', text: 'No gateway configured'});
  }

  //set node status
  this._updateNodeStatus();
}

/**
 * @param {object} msg
 * @private
 */
Device.prototype._onInput = function (msg) {
  let payload = {
    cmd: 'write',
    sid: this.node.sid,
    data: msg.payload
  };
  if (this.options._onInput) {
    this.options._onInput(this, payload);
  }

  this.node.gateway.sendCommand(payload);
};

/**
 * @private
 */
Device.prototype._onGatewayReady = function () {
  let cmd = {'cmd': 'read', 'sid': this.node.sid};
  let gateway = this.node.gateway;

  //initialize
  gateway.sendCommand(cmd);

  //ask for status update
  this.timer = setInterval(() => {
    gateway.sendCommand(cmd);
  }, this.readAskInterval);
};

/**
 * @param {object} input
 * @private
 */
Device.prototype._onMessage = function (input) {
  let msg = Object.assign({}, input);
  let payload = msg.payload;

  if (payload.sid === this.node.sid) {
    if (!this.node.model) {
      this.node.model = payload.model;
    }

    switch (payload.cmd) {
      case 'read_ack':
        this._onReadAck(msg);
        break;

      case 'iam':
      case 'heartbeat':
        this._onHeartbeat(msg);
        break;

      case 'report':
        this._onReport(msg);
        break;
    }
  }
};

/**
 * @param {object} msg
 * @return {object}
 * @private
 */
Device.prototype._onReadAck = function (msg) {
  this.ready = true;
  let data = Object.assign({}, msg.payload.data);

  //update battery info
  this.battery.setData(data);

  //extract initial current state of the xiaomi sensor like (temperature, human body, etc)
  let values = this._extractValues(data);
  this.fields.forEach((name) => {
    if (data[name]) {
      this.persistence[name] = values[name];
    }
  });

  if (this.options['send_on_ready'] === true) {
    //send initial state to the output
    this._onReport(msg);
  }

  //update node status
  this._updateNodeStatus();
};

/**
 * @param {object} msg
 * @return {object}
 * @private
 */
Device.prototype._onHeartbeat = function (msg) {
  //update battery info
  this.battery.setData(msg.payload.data);

  //update node status
  this._updateNodeStatus();
};

/**
 * @param {object} msg
 * @return {object}
 * @private
 */
Device.prototype._onReport = function (msg) {
  let payload = msg.payload;
  let data = payload.data;

  let result = this._extractValues(data);

  //save persistent fields
  this.fields.forEach((name) => {
    if (result[name]) {
      this.persistence[name] = result[name];
    }
  });

  msg.payload = this._createResultPayload(Object.assign(result, this.persistence));

  //send to the output
  this.node.send([msg]);

  //update node status
  this._updateNodeStatus();
};

/**
 * @private
 */
Device.prototype._onClose = function () {
  clearTimeout(this.timer);
};

/**
 * @param {object} payload
 * @return {object}
 * @private
 */
Device.prototype._createResultPayload = function (payload) {
  payload.time = new Date().getTime();
  payload.device = this.node.key;
  payload.sid = this.node.sid;
  payload.model = this.node.model;

  return payload;
};

/**
 * @param {object} data
 * @return {object}
 */
Device.prototype._extractValues = function (data) {
  if (this.options.extractor) {
    return this.options.extractor(data);
  }

  return data;
};

/**
 * @return {object}
 */
Device.prototype._updateNodeStatus = function () {

  //set node status
  if (false === this.ready) {
    //node is not ready
    this.node.status({
      fill: 'grey',
      shape: 'ring',
      text: 'disconnected'
    });
  } else {
    let text = ['battery: ' + this.battery.getVoltage() + 'v'];

    //add fields
    this.fields.forEach((name) => {
      text.push(`${name}: ${this.persistence[name]}`);
    });

    this.node.status({
      fill: this.battery.getColor(),
      shape: 'dot',
      text: text.join(', ')
    });
  }
};


module.exports = Device;