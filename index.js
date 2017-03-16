var Service, Characteristic, Accessory, uuid;
var inherits = require('util').inherits;
var extend = require('util')._extend;
var ws281x = require('rpi-ws281x-native');
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

myEmitter.on('event', (data) => {
    console.log("function change to: " + data);
});


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
    results.push(new LEDAccessory(this.log, "Bulb3", 2));
    results.push(new LEDSpeed(this.log, "Speed"));
    results.push(new LEDFunction(this.log, "Rainbow", 0));
    results.push(new LEDFunction(this.log, "One Color", 1));
    results.push(new LEDFunction(this.log, "Multi Colors", 2));
    results.push(new LEDCount(this.log, "Count"));
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
        var color = offset;
        for (var i = 18; i < NUM_LEDS-16; i++) {
            pixelData[i] = hsl2Int(color/360, 1, currentLev[0]);
            color = color + count;
            if (color > 360) {
                color = color - 360;
            }
        }
        offset = offset + speed;
        if (offset > 360) {
            offset = offset - 360;
        } else if(offset < 0) {
            offset = offset + 360;
        }
        break;
    }
    case 1:
    {
        for (var i = 18; i < NUM_LEDS-16; i++) {
          pixelData[i] = hsl2Int(currentHue[0]/360, currentSat[0]/100, currentLev[0]/100);
        }
        break;
    }
    case 2: //3 colors move
        {
            var counter = offset;
            for (var i = 18; i < NUM_LEDS-16; i++) {
                for(light in currentPow) {
                    if(counter > count*light && counter < count * currentPow.length){
                        pixelData[i] = hsl2Int(currentHue[currentPow[light]]/360, currentSat[currentPow[light]]/100, currentLev[currentPow[light]]/100);
                    }
                }
                counter++;
                if (counter > count*currentPow.length){
                    counter = counter - count*currentPow.length;
                }
            }
            offset = offset + speed/5;
            if (offset > count*currentPow.length) {
                offset = offset - count*currentPow.length;
            } else if(offset < 0) {
                offset = offset + count*currentPow.length;
            }
            break;
        }
  }

  ws281x.render(pixelData);
}, 1000 / 100);


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

var currentHue = [];
var currentSat = [];
var currentLev = [];
var currentPow = [];

var setting = 2;
var count = 100;
var speed = 1;

function LEDAccessory(log, name, index) {
    this.log = log;
    this.service = 'Light';
    this.name = name;
    this.index = index;

    currentHue.push(0);
    currentSat.push(0);
    currentLev.push(0);
    //currentPow.push(this.index);
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
    if(state == 0) {
        currentLev[accessory.index] = 0;
        for(i in currentPow) {
            if(currentPow[i] == this.index) {
                currentPow.splice(i,1);
            }
        }
    } else {
        for(i in currentPow) {
            if(currentPow[i] == this.index) {
                callback(null);
                return;
            }
        }
        currentPow.push(this.index);
    }
    callback(null)
}

LEDAccessory.prototype.getPowerState = function(callback) {
    var accessory = this;
    for(i in currentPow) {
        if(currentPow[i] == this.index) {
            callback(null, 1);
            return;
        }
    }
    callback(null, 0);
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
    this.uuid_base = id;
}

LEDSpeed.prototype.setPowerState = function(state, callback) {
    var accessory = this;
    accessory.log(accessory.name + " setPow: " + state);
    if(state == 0) {
        speed = 0;
    }
    callback(null)
}

LEDSpeed.prototype.getPowerState = function(callback) {
    var accessory = this;
    callback(null, Math.abs(speed) > 0);
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
    callback(null, Math.abs(speed));
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
        .getCharacteristic(Characteristic.On)
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
    this.uuid_base = id;

    this.services = [];
    this.service = new Service.Switch(this.name);
    var informationService = new Service.AccessoryInformation();

    informationService
        .setCharacteristic(Characteristic.Manufacturer, 'LED Manufacturer')
        .setCharacteristic(Characteristic.Model, 'LED Model')
        .setCharacteristic(Characteristic.SerialNumber, 'LED Serial Number');

    this.services.push(informationService);

    this.service
        .getCharacteristic(Characteristic.On)
        .on('set', this.setPowerState.bind(this))
        .on('get', this.getPowerState.bind(this));

    this.service.subtype = "default";
    this.services.push(this.service);

    myEmitter.on('event', function (data) {
        this.selfSet = true;
        if(this.value == data) {
          this.service.getCharacteristic(Characteristic.On).setValue(true);
        } else {
          this.service.getCharacteristic(Characteristic.On).setValue(false);
        }
    }.bind(this));
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
    if(state == 0) {
        for(level in currentLev) {
            currentLev[level] = 0;
        }
    }
    callback(null);
}

LEDFunction.prototype.getPowerState = function(callback) {
    var accessory = this;
    callback(null, setting === accessory.value);
}

LEDFunction.prototype.getServices = function() {
    return this.services;
}


function LEDCount(log, name) {
    this.log = log;
    this.service = 'Dimmer';
    this.name = name;

    var id = uuid.generate('dimmer.' + this.name);
    this.uuid_base = id;
}

LEDCount.prototype.setPowerState = function(state, callback) {
    var accessory = this;
    accessory.log(accessory.name + " setPow: " + state);
    count = 100 * state;
    callback(null);
}

LEDCount.prototype.getPowerState = function(callback) {
    var accessory = this;
    callback(null, count > 0);
}

LEDCount.prototype.getValue = function(callback) {
    callback(null, count);
}

LEDCount.prototype.setValue = function(state, callback) {
    var accessory = this;
    accessory.log(accessory.name + " setBri: " + state);
    count = state;
    callback(null);
}


LEDCount.prototype.getServices = function() {
    var informationService = new Service.AccessoryInformation();
    var dimmerService = new Service.Lightbulb(this.name);

    informationService
        .setCharacteristic(Characteristic.Manufacturer, 'LED Manufacturer')
        .setCharacteristic(Characteristic.Model, 'LED Model')
        .setCharacteristic(Characteristic.SerialNumber, 'LED Serial Number');

    dimmerService
        .getCharacteristic(Characteristic.On)
        .on('set', this.setPowerState.bind(this))
        .on('get', this.getPowerState.bind(this));

    dimmerService
        .addCharacteristic(Characteristic.Brightness)
        .on('set', this.setValue.bind(this))
        .on('get', this.getValue.bind(this));

    return [informationService, dimmerService];
}
