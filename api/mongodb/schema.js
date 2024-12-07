const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    home_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    scenarioTurnOn:{
        type: String,
        required: false
    },
    scenarioTurnOff:{
        type: String,
        required: false
    },
    devices: [{
        device_id: {
            type: String,
            required: true
        },
        device_name: {
            type: String,
            required: true
        },
        status: {
            type: Boolean,
            required: true
        },
        additional_options: {
            type: mongoose.Schema.Types.Mixed,
            required: false
        }
    }]
}, {
    timestamps: true 
});

const deviceProtocolSchema = new mongoose.Schema({
    device_id: {
        type: Number,
        required: true,
        unique: true
    },
    protocol_type: {
        type: String,
        enum: ['Zigbee', 'Wifi', 'Bluetooth', 'Z-Wave', 'MQTT'],
        required: true
    },
    zigbee: {
        zigbeeId: String,
        zigbeeChannel: String,
        zigbeeGroupId: String,
        zigbeeHub: String
    },
    wifi: {
        ipAddress: String,
        macAddress: String,
        ssid: String,
        password: String
    },
    bluetooth: {
        bleUuid: String,
        bleConnection: String
    },
    zwave: {
        zwaveDeviceId: String,
        zwaveNetworkKey: String,
        zwaveGroupId: String
    },
    mqtt: {
        mqttBrokerUrl: String,
        mqttTopicOn: String,
        mqttTopicOff: String,
        mqttDeviceId: String
    }
}, {
    timestamps: true
});

module.exports = {
    Scenario: mongoose.model('Scenario', scenarioSchema),
    DeviceProtocol: mongoose.model('DeviceProtocol', deviceProtocolSchema)
};
