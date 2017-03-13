var Service;
var Characteristic;
var PythonShell = require('python-shell');
var pyshell = new PythonShell('/../../../../../../../../../../../../../usr/local/lib/node_modules/homebridge-pythonled/echo_text.py');

var net = require('net');

pyshell.on('message', function (message) {
  console.log(message);
});

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
    var message = "sethue:" + hue;
    pyshell.send(message);
    callback();
}

LEDAccessory.prototype.getHue = function(callback) {
    var message = "gethue:" + hue;
    pyshell.send(message);
    pyshell.on('message', function (message) {
        if(message.split(":")[0] === "gethue") {
            callback(message.split(":")[1]);
        }
    });
}

LEDAccessory.prototype.setPowerState = function(state, callback) {
    var message = "setPowerState:" + hue;
    pyshell.send(message);
    callback();
}

LEDAccessory.prototype.getPowerState = function(callback) {
    var message = "getPowerState:" + hue;
    pyshell.send(message);
    pyshell.on('message', function (message) {
        if(message.split(":")[0] === "getPowerState") {
            callback(message.split(":")[1]);
        }
    });
}

LEDAccessory.prototype.setSaturation = function(saturation, callback) {
    var message = "setSaturation:" + hue;
    pyshell.send(message);
    callback();
}

LEDAccessory.prototype.getSaturation = function(callback) {
    var message = "getSaturation:" + hue;
    pyshell.send(message);
    pyshell.on('message', function (message) {
        if(message.split(":")[0] === "getSaturation") {
            callback(message.split(":")[1]);
        }
    });
}

LEDAccessory.prototype.setBrightness = function(brightness, callback) {
    var message = "setBrightness:" + hue;
    pyshell.send(message);
    callback();
}

LEDAccessory.prototype.getBrightness = function(callback) {
    var message = "getBrightness:" + hue;
    pyshell.send(message);
    pyshell.on('message', function (message) {
        if(message.split(":")[0] === "getBrightness") {
            callback(message.split(":")[1]);
        }
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
