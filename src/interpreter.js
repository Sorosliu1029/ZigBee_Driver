'use strict';
var fs = require('fs');
var EventEmitter = require('events');

var emitter = new EventEmitter();

var deviceList = [];

fs.exists('/etc/devices', function (exists) {
    console.log('devices exists: ', exists);
    if (exists) {
        fs.readFile('/etc/devices', function (err, data) {
            if (err) throw err;
            deviceList = JSON.parse(data);
            console.log('get stored devices: ', deviceList);
        });
    }
});

function getEmitter() {
    return emitter;
}

function writeDeviceList() {
    fs.writeFile('/etc/devices', JSON.stringify(deviceList), function (err) {
        if (err) throw err;
        console.log('To Save Devices: ', deviceList);
        console.log('Device List saved!');
    })
}

function getDeviceList() {
    return deviceList;
}

function removeDevice(deviceExtendedAddress) {
    for (var i = deviceList.length - 1; i >= 0; i--) {
        if (deviceList[i].IEEEAddress === deviceExtendedAddress) {
            deviceList.splice(i, 1);
        }
    }
}

function resetDeviceList() {
    deviceList = [];
}

function isDeviceJoined(deviceParameter) {
    for (var i = 0; i < deviceList.length; i++) {
        // TODO should be device unique identifier
        if (deviceList[i].shortAddress === deviceParameter) {
            return true;
        }
    }
    return false;
}

// handle message
function handleMessage(message) {
    var handledMessage = {};
    if (message.valid) {
        switch (message.MsgType) {
            case '0x004d':
                handledMessage = handleDeviceAnnounce(message.MsgContent);
                deviceList.push(handledMessage);
                break;
            case '0x8000':
                handledMessage = handleStatusResponse(message.MsgContent);
                break;
            case '0x8001':
                handledMessage = handleLogMessage(message.MsgContent);
                break;
            case '0x8004':
                handledMessage = handleNodeClusterAttributeList(message.MsgContent);
                break;
            case '0x8005':
                handledMessage = handleNodeCommandIDList(message.MsgContent);
                break;
            case '0x8006':
                handledMessage = handleNonFactoryNewReset(message.MsgContent);
                break;
            case '0x8010':
                handledMessage = handleVersionList(message.MsgContent);
                break;
            case '0x8101':
                handledMessage = handleDefaultResponse(message.MsgContent);
                break;
            case '0x8102':
                handledMessage = handleAttributeReport(message.MsgContent);
                sendControlCommand(handledMessage);
                break;
            case '0x8024':
                handledMessage = handleNetworkJoinedOrFormed(message.MsgContent);
                break;
            case '0x8048':
                handledMessage = handleLeaveIndication(message.MsgContent);
                removeDevice(handledMessage.extendedAddress);
                break;
            default:
                console.log(message);
        }
        console.log('handled message: ', handledMessage);
    }
    return handledMessage;
}

function sendControlCommand(attrRepo) {
    var data = attrRepo.responseData || attrRepo.status;
    switch (data) {
        case '0x00':
            if (!isDeviceJoined(attrRepo.shortAddress)) {
                emitter.emit('toggle light');
            }
            break;
        case '0x01':
            if (isDeviceJoined(attrRepo.shortAddress)) {
                emitter.emit('turn light on');
            }
            break;
        default:
            break;
    }
}

// hex to ascii
function stringifyMessage(msg) {
    var temp = msg.map(function (e) {
        return Number('0x' + e);
    });
    temp = Buffer.from(temp);
    return temp.toString('ascii');
}

function getEntries(msg, entryLength) {
    var entries = [];
    var entry;
    for (var i = 0; i < msg.length; i += entryLength) {
        entry = msg.slice(i, i + entryLength).join('');
        entries.push(('0x' + entry));
    }
    return entries;
}

function handleAttributeReport(msg) {
    var result = {};
    result.msgType = 'Attribute Report';
    result.sequenceNumber = ('0x' + msg[0]);
    result.shortAddress = ('0x' + msg[1] + msg[2]);
    result.endPoint = ('0x' + msg[3]);
    result.clusterID = ('0x' + msg[4] + msg[5]);
    result.attributeID = ('0x' + msg[6] + msg[7]);
    if (msg.length < 13) {
        result.attributeStatus = ('0x' + msg[8]);
        result.responseType = ('0x' + msg[9]);
        result.responseData = ('0x' + msg.slice(10).join(''));
    } else {
        result.attributeSize = Number('0x' + msg[8] + msg[9]);
        result.attributeType = '0x' + msg[10];
        result.attributeData = '0x' + msg.slice(11, -1).join('');
        result.status = '0x' + msg[msg.length - 1];
    }
    return result;
}

function handleStatusResponse(msg) {
    var statusList = ['Success', 'Incorrect parameters', 'Unhandled command',
        'Command failed', 'Busy', 'Stack already started', 'Failed'
    ];
    var result = {};
    result.msgType = 'Status Response';
    var status = Number('0x' + msg[0]);
    result.responseStatus = statusList[status < 6 ? status : 6];
    result.sequenceNumber = ('0x' + msg[1]);
    result.packetType = ('0x' + msg[2] + msg[3]);
    return result;
}

function handleLogMessage(msg) {
    var logLevel = ['Emergency', 'Alert', 'Critical', 'Error', 'Warning',
        'Notice', 'Information', 'Debug'
    ];
    var result = {};
    result.msgType = 'Log Message';
    result.logLevel = logLevel[Number('0x' + msg[0])];
    result.logMessage = stringifyMessage(msg.slice(1));
    return result;
}

function handleNodeCommandIDList(msg) {
    var result = {};
    result.msgType = 'Node Command ID List';
    result.sourceEndpoint = ('0x' + msg[0]);
    result.profileID = ('0x' + msg[1] + msg[2]);
    result.clusterID = ('0x' + msg[3] + msg[4]);
    result.commandIDList = getEntries(msg.slice(5), 1);
    return result;
}

function handleNodeClusterAttributeList(msg) {
    var result = {};
    result.msgType = 'Node Cluster Attribute List';
    result.sourceEndpoint = ('0x' + msg[0]);
    result.profileID = ('0x' + msg[1] + msg[2]);
    result.clusterID = ('0x' + msg[3] + msg[4]);
    result.attributeList = getEntries(msg.slice(5), 2);
    return result;
}

function handleNonFactoryNewReset(msg) {
    var statusList = ['STARTUP', 'WAIT_START', 'NFN_START', 'DISCOVERY',
        'NETWORK_INIT', 'RESCAN', 'RUNNING'
    ];
    var result = {};
    result.msgType = 'Non "Factory New" Reset';
    result.status = statusList[Number('0x' + msg[0])];
    return result;
}

function handleNetworkJoinedOrFormed(msg) {
    var statusList = ['Joined existing network', 'Formed new network', 'Failed'];
    var result = {};
    result.msgType = 'Network Joined / Formed';
    var status = Number('0x' + msg[0]);
    result.status = statusList[status < 2 ? status : 2];
    result.shortAddress = ('0x' + msg[1] + msg[2]);
    result.extendedAddress = ('0x' + msg.slice(3, 3 + 8).join(''));
    result.channel = ('0x' + msg[11]);
    return result;
}

function handleVersionList(msg) {
    var result = {};
    result.msgType = 'Version List';
    result.majorVersionNumber = ('0x' + msg[0] + msg[1]);
    result.installerVersionNumber = ('0x' + msg[2] + msg[3]);
    return result;
}

function handleDefaultResponse(msg) {
    var result = {};
    result.msgType = 'Default Response';
    result.sequenceNumber = ('0x' + msg[0]);
    result.endPoint = ('0x' + msg[1]);
    result.clusterID = ('0x' + msg[2] + msg[3]);
    result.commandID = ('0x' + msg[4]);
    result.statusCode = ('0x' + msg[5]);
    return result;
}

function handleLeaveIndication(msg) {
    var result = {};
    result.msgType = 'Leave Indication';
    result.extendedAddress = ('0x' + msg.slice(0, 8).join(''));
    result.rejoinStatues = ('0x' + msg[8]);
    return result;
}

function handleDeviceAnnounce(msg) {
    var result = {};
    result.msgType = 'Device Announce';
    result.shortAddress = ('0x' + msg[0] + msg[1]);
    result.IEEEAddress = ('0x' + msg.slice(2, 2 + 8).join(''));
    result.macCapability = Number('0x' + msg[10]).toString(2);
    return result;
}

module.exports.handleMessage = handleMessage;
module.exports.getDeviceList = getDeviceList;
module.exports.resetDeviceList = resetDeviceList;
module.exports.writeDeviceList = writeDeviceList;
module.exports.getEmitter = getEmitter;