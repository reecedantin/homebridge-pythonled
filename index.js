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
  this.pyLoc = config['pythonLocation']
}

LEDAccessory.prototype.setHue = function(hue, callback) {
    var accessory = this;
    console.log('setHue:' + hue);
    currentHue = hue;
    accessory.sendRGB(callback()).bind(this);
}

LEDAccessory.prototype.getHue = function(callback) {
    callback(null, currentHue);
}

LEDAccessory.prototype.setPowerState = function(state, callback) {
    var accessory = this;
    console.log("setPow:" + state);
    if(currentPow != state) {
        if(state) {
            currentLev = 100;
        } else {
            currentLev = 0;
        }
        currentPow = state;
        accessory.sendRGB(callback()).bind(this);
    } else {
        callback();
    }
}

LEDAccessory.prototype.getPowerState = function(callback) {
    callback(null, currentPow);
}

LEDAccessory.prototype.setSaturation = function(saturation, callback) {
    var accessory = this;
    console.log("setSat:" + saturation);
    currentSat = saturation;
    accessory.sendRGB(callback()).bind(this);
}

LEDAccessory.prototype.getSaturation = function(callback) {
    callback(null, currentSat);
}

LEDAccessory.prototype.setBrightness = function(brightness, callback) {
    var accessory = this;
    console.log("setBri:" + brightness);
    currentLev = brightness;
    accessory.sendRGB(callback()).bind(this);
}

LEDAccessory.prototype.getBrightness = function(callback) {
    callback(null, currentLev);
}

LEDAccessory.prototype.sendRGB = function(callback) {

    var r, g, b;
    var h = currentHue/360;
    var s = currentSat/100;
    var l = currentLev/100;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }


    var options = {
      mode: 'text',
      args: [Math.round(g * 255), Math.round(r * 255), Math.round(b * 255)]
    };

    PythonShell.run(pyLoc, options, function (err, results) {
      if (err) throw err;
      // results is an array consisting of messages collected during execution
      callback();
    });
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
