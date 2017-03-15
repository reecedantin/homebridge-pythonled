var Service, Characteristic, Accessory, uuid;
var inherits = require('util').inherits;
var extend = require('util')._extend;
var ws281x = require('rpi-ws281x-native');
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();


/* Register the plugin with homebridge */
module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    Accessory = homebridge.hap.Accessory;
    uuid = homebridge.hap.uuid;

    var acc = LEDAccessory.prototype;
    inherits(LEDAccessory, Accessory);
    LEDAccessory.prototype.parent = Accessory.prototype;
    for (var mn in acc) {
        LEDAccessory.prototype[mn] = acc[mn];
    }

    homebridge.registerPlatform("homebridge-pythonled", "LED Strip", LEDPlatform);
    //homebridge.registerAccessory("homebridge-hdmi-matrix", "HDMIMatrix",MatrixAccessory);
}

function LEDPlatform(log, config) {
    this.log = log;
    this.devices = config.devices;
}

LEDPlatform.prototype.accessories = function (callback) {
    var results = [];
    results.push(new LEDAccessory(this.log, "Bulb1", 0));
    results.push(new LEDAccessory(this.log, "Bulb2", 1));
    results.push(new LEDSpeed(this.log, "Speed"));
    results.push(new LEDFunction(this.log, "Rainbow", 0));
    results.push(new LEDFunction(this.log, "One Color", 1));
    results.push(new LEDFunction(this.log, "Two Colors", 2));
    callback(results);
}


var NUM_LEDS = 300;
var pixelData = new Uint32Array(NUM_LEDS);

ws281x.init(NUM_LEDS);

// ---- trap the SIGINT and reset before exit
process.on('SIGINT', function () {
  ws281x.reset();
  process.nextTick(function () { process.exit(0); });
});


// ---- animation-loop
var offset = 0;
setInterval(function () {
  switch(setting){
    case 0:
    {
        for (var i = 18; i < NUM_LEDS-16; i++) {
          pixelData[i] = hsl2Int(((i + offset) * (10 * count/100) % 360)/360, 1, 1);
        }
        offset = (offset + (5 * speed/100)) % 360;
        break;
    }
    case 1:
    {
        for (var i = 18; i < NUM_LEDS-16; i++) {
          pixelData[i] = hsl2Int(currentHue[0], currentSat[0], currentLev[0]);
        }
        break;
    }
    case 2: //2 colors move
        {
            var hue1 = currentHue[0];
            var hue2 = currentHue[1];
            var newHue = hue1
            var countem = offset % count*2;
            for (var i = 18; i < NUM_LEDS-16; i++) {
                if(countem <= count) {
                    newHue = hue1;
                } else if(countem <= count*2) {
                    newHue = hue2;
                } else {
                    newHue = hue1;
                    countem = 0;
                }
                countem++;
                pixelData[i] = hsl2Int(newHue/360, 1, 1);
            }
            //console.log((hue2 + ((hue1 - hue2) * (((0.0/NUM_LEDS - 0.5)*2.0)^8.0))));
            offset = (offset + (5 * speed/100)) % NUM_LEDS;
            //console.log(offset);
            break;
        }
  }

  ws281x.render(pixelData);
}, 1000 / 60);


console.log('lights started');


function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

function hsl2Int(h,s,l) {
    var r, g, b;
    l = l/2;

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

    return rgb2Int(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

var currentHue = [0,0];
var currentSat = [0,0];
var currentLev = [0,0];
var currentPow = [0,0];

var setting = 2;
var count = 100;
var speed = 100;

function LEDAccessory(log, name, index) {
    this.log = log;
    this.service = 'Light';
    this.name = name;
    this.index = index;
}

LEDAccessory.prototype.setHue = function(hue, callback) {
    var accessory = this;
    accessory.log(accessory.name + ' setHue:' + hue);
    currentHue[accessory.index] = hue;
    callback(null)
}

LEDAccessory.prototype.getHue = function(callback) {
    var accessory = this;
    callback(null, currentHue[accessory.index]);
}

LEDAccessory.prototype.setPowerState = function(state, callback) {
    var accessory = this;
    accessory.log("setPow:" + state);
    currentPow[accessory.index] = state;
    callback(null)
}

LEDAccessory.prototype.getPowerState = function(callback) {
    var accessory = this;
    callback(null, currentPow[accessory.index]);
}

LEDAccessory.prototype.setSaturation = function(saturation, callback) {
    var accessory = this;
    accessory.log(accessory.name + ' setSat:' + saturation);
    currentSat[accessory.index] = saturation;
    callback(null)
}

LEDAccessory.prototype.getSaturation = function(callback) {
    var accessory = this;
    callback(null, currentSat[accessory.index]);
}

LEDAccessory.prototype.setBrightness = function(brightness, callback) {
    var accessory = this;
    accessory.log(accessory.name + ' setBri:' + brightness);
    currentLev[accessory.index] = brightness;
    callback(null)
}

LEDAccessory.prototype.getBrightness = function(callback) {
    var accessory = this;
    callback(null, currentLev[accessory.index]);
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

function LEDSpeed(log, name) {
    this.log = log;
    this.service = 'Fan';
    this.name = name;

    var id = uuid.generate('fan.' + this.name);
    Accessory.call(this, this.name, id);
    this.uuid_base = id;
}

LEDSpeed.prototype.setPowerState = function(state, callback) {
    var accessory = this;
    accessory.log(accessory.name + " setPow: " + state);
    callback(null)
}

LEDSpeed.prototype.getPowerState = function(callback) {
    var accessory = this;
    callback(null, abs(speed) > 0);
}

LEDSpeed.prototype.setSpeed = function(state, callback) {
    var accessory = this;
    accessory.log(accessory.name + " setSpeed: " + state);
    if(speed < 0) {
        speed = state * -1;
    } else {
        speed = state;
    }
    callback(null)
}

LEDSpeed.prototype.getSpeed = function(callback) {
    var accessory = this;
    callback(null, abs(speed));
}

LEDSpeed.prototype.setDirection = function(state, callback) {
    var accessory = this;
    accessory.log(accessory.name + " setDirection: " + state);
    if(state == (speed < 0)) {
        speed = speed * -1;
    }
    callback(null)
}

LEDSpeed.prototype.getDirection = function(callback) {
    var accessory = this;
    var currentDirection;
    if (speed < 0){
        currentDirection = Characteristic.RotationDirection.CLOCKWISE;
    } else {
        currentDirection = Characteristic.RotationDirection.COUNTER_CLOCKWISE;
    }
    callback(null, currentDirection);
}


LEDSpeed.prototype.getServices = function() {
    var informationService = new Service.AccessoryInformation();
    var fanService = new Service.Fan(this.name);

    informationService
        .setCharacteristic(Characteristic.Manufacturer, 'LED Manufacturer')
        .setCharacteristic(Characteristic.Model, 'LED Model')
        .setCharacteristic(Characteristic.SerialNumber, 'LED Serial Number');

    fanService
        .addCharacteristic(Characteristic.On)
        .on('set', this.setPowerState.bind(this))
        .on('get', this.getPowerState.bind(this));

    fanService
        .addCharacteristic(Characteristic.RotationSpeed)
        .on('set', this.setSpeed.bind(this))
        .on('get', this.getSpeed.bind(this));

    fanService
        .getCharacteristic(Characteristic.RotationDirection)
        .on('set', this.setDirection.bind(this))
        .on('get', this.getDirection.bind(this));

    return [informationService, fanService];
}

function LEDFunction(log, name, value) {
    this.log = log;
    this.service = 'Switch';
    this.name = name;
    this.value = value;
    this.selfSet = false;

    var id = uuid.generate('function.' + this.name);
    Accessory.call(this, this.name, id);
    this.uuid_base = id;

    myEmitter.on('event', (data) => {
        this.selfSet = true;
        if(this.value == data) {
          this.getServices()[1].getCharacteristic(Characteristic.On).setValue(true);
        } else {
          this.getServices()[1].getCharacteristic(Characteristic.On).setValue(true);
        }
    });
    myEmitter.emit('event');
}

LEDFunction.prototype.setPowerState = function(state, callback) {
    var accessory = this;
    if(accessory.selfSet){
        accessory.selfSet = false;
        callback(null);
        return;
    }
    accessory.log(accessory.name + " setPow: " + state);
    setting = accessory.value;
    myEmitter.emit('event', accessory.value);
    callback(null);
}

LEDFunction.prototype.getPowerState = function(callback) {
    var accessory = this;
    callback(null, setting === accessory.value);
}

LEDFunction.prototype.getServices = function() {
    var informationService = new Service.AccessoryInformation();
    var switchService = new Service.Switch(this.name);

    informationService
        .setCharacteristic(Characteristic.Manufacturer, 'LED Manufacturer')
        .setCharacteristic(Characteristic.Model, 'LED Model')
        .setCharacteristic(Characteristic.SerialNumber, 'LED Serial Number');

    switchService
        .addCharacteristic(Characteristic.On)
        .on('set', this.setPowerState.bind(this))
        .on('get', this.getPowerState.bind(this));

    return [informationService, switchService];
}
