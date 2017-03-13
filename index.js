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
    var message = "setHue:" + hue;
    pyshell.send(message);
    callback();
}

LEDAccessory.prototype.getHue = function(callback) {
    var message = "getHue:###";
    pyshell.send(message);
    pyshell.on('message', function (message) {
        if(message.split(":")[0] === "getHue") {
            //callback(message.split(":")[1]);
            callback(null, 0);
        }
    });
}

LEDAccessory.prototype.setPowerState = function(state, callback) {
    var message = "setPow:" + state;
    pyshell.send(message);
    callback();
}

LEDAccessory.prototype.getPowerState = function(callback) {
    var message = "getPow:###";
    pyshell.send(message);
    pyshell.on('message', function (message) {
        if(message.split(":")[0] === "getPow") {
            //callback(message.split(":")[1]);
            callback(null, 0);
        }
    });
}

LEDAccessory.prototype.setSaturation = function(saturation, callback) {
    var message = "setSat:" + saturation;
    pyshell.send(message);
    callback();
}

LEDAccessory.prototype.getSaturation = function(callback) {
    var message = "getSat:###";
    pyshell.send(message);
    pyshell.on('message', function (message) {
        if(message.split(":")[0] === "getSat") {
            //callback(message.split(":")[1]);
            callback(null, 0);
        }
    });
}

LEDAccessory.prototype.setBrightness = function(brightness, callback) {
    var message = "setBri:" + brightness;
    pyshell.send(message);
    callback();
}

LEDAccessory.prototype.getBrightness = function(callback) {
    var message = "getBri:###";
    pyshell.send(message);
    pyshell.on('message', function (message) {
        if(message.split(":")[0] === "getBri") {
            //callback(message.split(":")[1]);
            callback(null, 0);
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
