var Service;
var Characteristic;

var net = require('net');

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
    callback();
}

LEDAccessory.prototype.getHue = function(callback) {
    callback(0);
}

LEDAccessory.prototype.setPowerState = function(state, callback) {
    callback();
}

LEDAccessory.prototype.getPowerState = function(callback) {
    callback(0);
}

LEDAccessory.prototype.setSaturation = function(saturation, callback) {
    callback();
}

LEDAccessory.prototype.getSaturation = function(callback) {
    callback(0);
}

LEDAccessory.prototype.setBrightness = function(brightness, callback) {
    callback();
}

LEDAccessory.prototype.getBrightness = function(callback) {
    callback(0);
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

    return [informationService, switchService];
}
