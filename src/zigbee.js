'use strict';
var msg_util = require('./message_util');
var interpreter = require('./interpreter');

function write(uart, data, callback) {
  uart.write(data, function (err) {
    if (err) {
      console.log('uart write error: ', err);
    }
    console.log('uart write data succeed');
  });
}

function ZigBee(uart) {
  this._uart = uart;
  this._emitter = interpreter.getEmitter();
}

ZigBee.prototype._writeCmd = function (cmdType, msg) {
  var cmd = msg_util.pack(cmdType, msg);
  write(this._uart, Buffer.from(cmd));
}

ZigBee.prototype.reset = function () {
  console.log('zigbee reset');
  var msg = new Buffer(0);
  this._writeCmd(0x11, msg);
}

ZigBee.prototype.getVersion = function () {
  console.log('request to get version');
  var msg = new Buffer(0);
  this._writeCmd(0x10, msg);
}

ZigBee.prototype.setExtendedPANID = function () {
  console.log('set extended PANID');
  var msg = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  this._writeCmd(0x20, msg);
}

ZigBee.prototype.setChannelMask = function () {
  console.log('set channel mask');
  // TODO channel mask
  var msg = new Buffer([0x00, 0x00, 0x00, 0x10]);
  this._writeCmd(0x21, msg);
}

ZigBee.prototype.setSecurityStateAndKey = function () {
  console.log('set security state and key');
  var msg = new Buffer([
    0x03,
    0x00, 0x01,
    0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c,
    0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39
  ]);
  this._writeCmd(0x22, msg);
}

ZigBee.prototype.setDeviceType = function () {
  console.log('set device type');
  var msg = new Buffer([0x00]);
  this._writeCmd(0x23, msg);
}

ZigBee.prototype.startNetwork = function () {
  console.log('start network');
  var msg = new Buffer(0);
  this._writeCmd(0x24, msg);
}

ZigBee.prototype.startNetworkScan = function () {
  console.log('start network scan');
  var msg = new Buffer(0);
  this._writeCmd(0x25, msg);
}

ZigBee.prototype.permitJoiningRequest = function () {
  console.log('permit joining request');
  var msg = new Buffer([0x00, 0x00, 0xff, 0x00]);
  this._writeCmd(0x49, msg);
}

ZigBee.prototype.turnLightOn = function () {
  console.log('turn light on');
  // TODO short addressES
  var devices = interpreter.getDeviceList();
  var msg = new Buffer([0x2, 0xff, 0xff, 0x1, 0x1, 0x1]);
  if (devices.length !== 0) {
    msg.writeUInt16BE(devices[0].shortAddress, 1);
  }
  this._writeCmd(0x92, msg);
}

ZigBee.prototype.turnLightOff = function () {
  console.log('turn light off');
  // TODO short addressES
  var devices = interpreter.getDeviceList();
  var msg = new Buffer([0x2, 0xff, 0xff, 0x1, 0x1, 0x0]);
  if (devices.length !== 0) {
    msg.writeUInt16BE(devices[0].shortAddress, 1);
  }
  this._writeCmd(0x92, msg);
}

ZigBee.prototype.toggleLight = function () {
  console.log('toggle light');
  var devices = interpreter.getDeviceList();
  var msg = new Buffer([0x2, 0xff, 0xff, 0x1, 0x1, 0x2]);
  if (devices.length !== 0) {
    msg.writeUInt16BE(devices[0].shortAddress, 1);
  }
  this._writeCmd(0x92, msg);
}

ZigBee.prototype.listDevices = function () {}

ZigBee.prototype.startup = function () {
  this.reset();
  this._emitter.emit('read raw data');
  this.getVersion();
  this.setExtendedPANID();
  this.setChannelMask();
  this.setSecurityStateAndKey();
  this.setDeviceType();
  this.startNetwork();
  this.permitJoiningRequest();
}

ZigBee.prototype.setTurnLightOn = function () {
  this._emitter.on('turn light on', this.turnLightOn.bind(this));
}

ZigBee.prototype.setTurnLightOff = function () {
  this._emitter.on('turn light off', this.turnLightOff.bind(this));
}

ZigBee.prototype.setToggleLight = function () {
  this._emitter.on('toggle light', this.toggleLight.bind(this));
}

ZigBee.prototype.removeAllListeners = function () {
  this._emitter.removeAllListeners();
}
ZigBee.prototype.writeDeviceList = function () {
  interpreter.writeDeviceList();
}
ZigBee.prototype.resetDeviceList = function () {
  interpreter.resetDeviceList();
}

module.exports = ZigBee;