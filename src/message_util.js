/*

 start = 0x1
 end = 0x3
 data = [0x2, 0x44, 0xa6, 0x1, 0x1, 0x1]
 msgType = 146 = 0x92 (OnOff)
 msgLen = 0x6
 crc = 0x92 ^ 0x6 ^ 0x2 ^ 0x44 ^ 0xa6 ^ 0x1 ^ 0x1 ^ 0x1 = 0x75

 -----------------------------------------------------------------------------------
 |  0x1  |   0x92   |   0x6   |  0x75 |   0x2, 0x44, 0xa6, 0x1, 0x1, 0x1   |  0x3  |
 -----------------------------------------------------------------------------------
 | start | msgType  |  msgLen |  crc  |              Data                  |  stop |
 -----------------------------------------------------------------------------------

 0x00 0x92 -> 0x2 0x10^0x00 0x92

 ------------------------------------------------------------------------------------------------------------
 |  0x1  | 0x2 0x10 0x92 | 0x2 0x10 0x2 0x16 | 0x75 | 0x2 0x12 0x44 0xa6 0x2 0x11 0x2 0x11 0x2 0x11 |  0x3  |
 ------------------------------------------------------------------------------------------------------------
 | start |     msgType   |      msgLen       | crc  |                  Data                         |  stop |
 ------------------------------------------------------------------------------------------------------------

 */
'use strict';
var handleMessage = require('./interpreter').handleMessage;

var storedMessage = [];

var START = 0x1;
var STOP = 0x3;
var ESC = 0x2;
var MASK = 0x10;

function formatToUInt16BE(value) {
  var valueBuf = new Buffer(2);
  valueBuf.writeUInt16BE(value, 0);
  return valueBuf;
}

function pack(msgType, msg) {
  var packet = new Buffer(1);
  packet.writeUInt8(START, 0);
  packet = Buffer.concat([packet, stuff(formatToUInt16BE(msgType))]);
  packet = Buffer.concat([packet, stuff(formatToUInt16BE(msg.length))]);
  packet = Buffer.concat([packet, stuff(crcCaculate(msgType, msg.length, msg))]);
  packet = Buffer.concat([packet, stuff(msg)]);
  packet = Buffer.concat([packet, Buffer.from([STOP])]);
  return packet;
}

function unpack(rawData) {
  var unstuffedData = unstuff(rawData);
  var slicedData = sliceData(unstuffedData);
  var entireMessages = storeMessage(slicedData);
  var parsedMessages = [];
  if (entireMessages.length !== 0) {
    for (var i = 0; i < entireMessages.length; i++) {
      var protocolContent = parseMessage(entireMessages[i]);
      var parsedMessage = handleMessage(protocolContent);
      parsedMessages.push(parsedMessage);
    }
  }
  return parsedMessages;
}

function stuff(buffer) {
  var packet = [];
  for (var i = 0; i < buffer.length; i++) {
    if (buffer[i] < MASK) {
      packet.push(ESC);
      packet.push(buffer[i] ^ MASK);
    } else {
      packet.push(buffer[i]);
    }
  }
  return Buffer.from(packet);
}

// unstuff raw data to meaningful data(Buffer type)
function unstuff(buffer) {
  var packet = [];
  for (var i = 0; i < buffer.length; i++) {
    if (buffer[i] === ESC) {
      i++;
      packet.push(buffer[i] ^ MASK);
    } else {
      packet.push(buffer[i]);
    }
  }
  return Buffer.from(packet);
}

function crcCaculate(msgType, msgLen, msg) {
  var crcResult = msgType ^ msgLen;
  for (var i = 0; i < msg.length; i++) {
    crcResult ^= msg[i];
  }
  return Buffer.from([crcResult]);
}

// check checksum of read data
function checkCheckSum(message) {
  var xorResult = 0;
  for (var i = 0; i < message.length; i++) {
    xorResult ^= Number('0x' + message[i]);
  }
  return xorResult === 0;
}

// slice raw data to readable data
function sliceData(data) {
  var slicedData = [];
  var strData = data.toString('hex');
  for (var i = 0; i < strData.length; i += 2) {
    slicedData.push(strData.slice(i, i + 2));
  }
  return slicedData;
}

// store uart read message into cache array
function storeMessage(data) {
  storedMessage = storedMessage.concat(data);
  var messages = [];
  while (storedMessage.length > 0) {
    var firstEndIndex = storedMessage.indexOf('03');
    if (firstEndIndex !== -1) {
      var entireMessage = storedMessage.slice(0, firstEndIndex + 1);
      storedMessage = storedMessage.slice(firstEndIndex + 1);
      messages.push(entireMessage);
    } else {
      break;
    }
  }
  return messages;
}

// parse message into zigbee protocol segment
function parseMessage(msg) {
  var protocolContent = {
    valid: false
  };
  if (msg[0] === '01' && msg[msg.length - 1] === '03') {
    protocolContent.valid = checkCheckSum(msg.slice(1, -1));
    protocolContent.MsgType = '0x' + msg[1] + msg[2];
    protocolContent.MsgLength = Number('0x' + msg[3] + msg[4]);
    protocolContent.MsgContent = msg.slice(6, -1);
  }
  return protocolContent;
}

module.exports.pack = pack;
module.exports.unpack = unpack;