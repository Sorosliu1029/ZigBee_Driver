'use strict';

var util = require('util');
var driver = require('ruff-driver');

var ZigBee = require('./zigbee');
var msg_util = require('./message_util');

module.exports = driver({
    /**
     * @param {Object} inputs A map of assigned interfaces according to `driver.json`.
     * @param {Object} context Context of this instance to attach.
     * @param {string} context.id ID of the device.
     * @param {string} context.model Model of the device.
     * @param {Object} context.args A map of device arguments.
     * @param {Function} callback If the third parameter is added, it's the callback for asyncrhonous attaching.
     */
    attach: function (inputs /*, callback */ ) {
        // Get assigned GPIO interface and set property `_gpio`.
        // See https://ruff.io/zh-cn/api/gpio.html for more information about GPIO interfaces.
        this._uart = inputs['uart'];
        this._initUart();
        this.zigbee = new ZigBee(this._uart);
        this.on('read raw data', function (rawData) {
            msg_util.unpack(rawData);
        })
    },

    detach: function () {
        this.zigbee.removeAllListeners();
        this.zigbee.writeDeviceList();
    },

    exports: {
        _initUart: function () {
            var that = this;

            function readNext() {
                that._uart.read(function (err, data) {
                    if (err) {
                        console.log('read error');
                        return;
                    }
                    that.emit('read raw data', data);
                    process.nextTick(readNext);
                });
            }
            readNext();
        },

        startup: function () {
            this.zigbee.startup();
        },

        setTurnLightOn: function () {
            this.zigbee.setTurnLightOn();
        },

        setTurnLightOff: function () {
            this.zigbee.setTurnLightOff();
        },

        setToggleLight: function () {
            this.zigbee.setToggleLight();
        },

        resetDeviceList: function () {
            this.zigbee.resetDeviceLis();
        },

    }
});