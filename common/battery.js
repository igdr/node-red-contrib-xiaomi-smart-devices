/**
 * @param {number} input
 * @return {{voltage: number, voltage_level: string}}
 */
function getVoltage(input) {
  let voltage = input / 1000;
  let voltage_level = 'high';

  if (input < 2.5) {
    voltage_level = 'critical';
  } else if (input < 2.9) {
    voltage_level = 'middle';
  }

  return {
    voltage: voltage,
    voltage_level: voltage_level
  }
}

function Battery(node) {
  this.node = node;
  this.color = 'grey';
  this.voltage = null;
  this.voltage_level = null;
}

/**
 * @param {object} payload
 */
Battery.prototype.setData = function (payload) {
  if (!payload.voltage) {
    return;
  }

  let info = getVoltage(payload.voltage);

  this.voltage = info.voltage;
  this.voltage_level = info.voltage_level;

  switch (info.voltage_level) {
    case 'critical':
      this.color = 'red';
      break;
    case 'middle':
      this.color = 'yellow';
      break;
    default:
      this.color = 'green';
      break;
  }
};

/**
 * @return {number}
 */
Battery.prototype.getVoltage = function () {
  return this.voltage;
};

/**
 * @return {string}
 */
Battery.prototype.getVoltageLevel = function () {
  return this.voltage_level;
};

/**
 * @return {string}
 */
Battery.prototype.getColor = function () {
  return this.color;
};

module.exports = Battery;