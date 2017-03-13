var Service;
var Characteristic;
var PythonShell = require('python-shell');
var pyLoc = '/../../../../../../../../../../../../../usr/local/lib/node_modules/homebridge-pythonled/echo_text.py';

var net = require('net');

var currentHue = 0;
var currentSat = 0;
var currentLev = 0;

var currentPow = 0;

var currentG = 0;
var currentR = 0;
var currentB = 0;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-pythonled", "LED Strip", LEDAccessory);
}

function LEDAccessory(log, config) {
  this.log = log;
  this.service = 'Light';
  this.name = config['name'];
}

LEDAccessory.prototype.setHue = function(hue, callback) {
    console.log('setHue:' + hue);
    currentHue = hue;
    callback();
}

LEDAccessory.prototype.getHue = function(callback) {
    callback(null, currentHue);
}

LEDAccessory.prototype.setPowerState = function(state, callback) {
    console.log("setPow:" + state);
    currentPow = state;
    callback();
}

LEDAccessory.prototype.getPowerState = function(callback) {
    callback(null, currentPow);
}

LEDAccessory.prototype.setSaturation = function(saturation, callback) {
    console.log("setSat:" + saturation);
    currentSat = saturation;
    callback();
}

LEDAccessory.prototype.getSaturation = function(callback) {
    callback(null, currentSat);
}

LEDAccessory.prototype.setBrightness = function(brightness, callback) {
    console.log("setBri:" + brightness);
    currentLev = brightness;
    callback();
}

LEDAccessory.prototype.getBrightness = function(callback) {
    callback(null, currentLev);
}

LEDAccessory.prototype.getServices = function() {
    var informationService = new Service.AccessoryInformation();
    var lightbulbService = new Service.Lightbulb(this.name);

    informationService
        .setCharacteristic(Characteristic.Manufacturer, 'LED Manufacturer')
        .setCharacteristic(Characteristic.Model, 'LED Model')
        .setCharacteristic(Characteristic.SerialNumber, 'LED Serial Number');

    lightbulbService
        .addCharacteristic(Characteristic.Hue)
        .on('set', this.setHue.bind(this))
        .on('get', this.getHue.bind(this));

    lightbulbService
        .getCharacteristic(Characteristic.On)
        .on('set', this.setPowerState.bind(this))
        .on('get', this.getPowerState.bind(this));

    lightbulbService
        .addCharacteristic(Characteristic.Saturation)
        .on('set', this.setSaturation.bind(this))
        .on('get', this.getSaturation.bind(this));

    lightbulbService
        .addCharacteristic(Characteristic.Brightness)
        .on('set', this.setBrightness.bind(this))
        .on('get', this.getBrightness.bind(this));

    return [informationService, lightbulbService];
}
