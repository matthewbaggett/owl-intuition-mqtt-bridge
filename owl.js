const array = require('locutus/php/array'),
      OWL = require("owlintuition"),
      redis = require("redis"),
      mqtt = require("mqtt");

array.ksort(process.env);
var owl = new OWL();
owl.monitor();

// Connect to REDIS/MQTT
var redisSender = null,
    mqttSender = null;

if(process.env.REDIS_HOST){
    redisSender = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    })
}
if(process.env.MQTT_HOST){
    mqttSender = mqtt.connect(process.env.MQTT_HOST);
}

var getNowTime = function(){
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

var sendOwlState = function(event){
    var owlState = JSON.stringify({
        entity: {
            type: 'power-monitor',
            manufacturer: 'Owl Intuition',
            name: 'Network Owl',
            events: {
                electricityConsumptionWatts: {
                    channel: 'owlintuition.electricity',
                    unit: 'w',
                    type: 'literal',
                },
                unitBattery: {
                    channel: 'owlintuition.battery',
                    unit: '%',
                    type: 'literal',
                },
                unitSignal: {
                    channel: 'owlintuition.signal',
                    unit: '%',
                    type: 'literal',
                }
            }
        },
        battery: event.battery,
        signal: event.signal
    });
    if(redisSender) {
        if (event.id != undefined) {
            redisSender.hset("devices", "owlintuition:powerowl:" + event.id, owlState);
        }
        redisSender.publish('owl-state', owlState);
    }
};

owl.on('electricity', function( owlEvent ) {
    owlEvent = JSON.parse(owlEvent);
    console.log("Drawing " + owlEvent.channels[0][0].current + owlEvent.channels[0][0].units);
    if(redisSender) {
        redisSender.set('data:owlintuition:watts', owlEvent.channels[0][0].current);
        redisSender.set('data:owlintuition:battery', owlEvent.battery);
        redisSender.set('data:owlintuition:signal', owlEvent.signal.lqi);
        redisSender.hset('data:owlintuition:watts-historic', getNowTime(), owlEvent.channels[0][0].current);
        redisSender.hset('data:owlintuition:battery-historic', getNowTime(), owlEvent.battery);
        redisSender.hset('data:owlintuition:signal-historic', getNowTime(), owlEvent.signal.lqi);
        redisSender.publish('owlintuition.electricity', JSON.stringify(
            {
                event: 'owlintuition:powerowl:' + owlEvent.id + '/electricityConsumptionWatts',
                value: owlEvent.channels[0][0].current
            }
        ));
        redisSender.publish('owlintuition.battery', JSON.stringify(
            {
                event: 'owlintuition:powerowl:' + owlEvent.id + '/unitBattery',
                value: owlEvent.battery
            }
        ));
        redisSender.publish('owlintuition.signal', JSON.stringify(
            {
                event: 'owlintuition:powerowl:' + owlEvent.id + '/unitSignal',
                value: owlEvent.signal.lqi
            }
        ));
    }
    if(mqttSender){
        mqttSender.publish("owlintuition/watts", owlEvent.channels[0][0].current);
        mqttSender.publish("owlintuition/battery", owlEvent.battery.slice(0, -1));
        mqttSender.publish("owlintuition/signal", owlEvent.signal.lqi);
    }

    sendOwlState(owlEvent);
});

owl.on('weather', function( event ) {
    if(redisSender) {
        redisSender.publish('weather', JSON.stringify({
            event: event
        }));
    }

    sendOwlState(event);
});

owl.on('error', function( error ) {
    if(redisSender) {
        redisSender.publish('errors', JSON.stringify({
            service: "monitor-owl-intuition",
            subservice: "owl network unit",
            more: event
        }));
    }
});

console.log("Started, waiting for data");