const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    home_id: {
        type: Number, 
        required: true
    },
    scenarioTurnOn: {
        type: String,
        required: false
    },
    scenarioTurnOff: {
        type: String,
        required: false
    },
    devices: [{
        device_id: {
            type: Number,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        room_id: {
            type: Number,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        command_on: {
            type: String,
            required: true
        },
        command_off: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'not-active'],
            required: true
        },
        actions: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        protocolData: {
            type: {
                protocol_type: {
                    type: String,
                    enum: ['Zigbee', 'Wifi', 'Bluetooth', 'Z-Wave', 'MQTT']
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
            },
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

const alarmsSchema = new mongoose.Schema({
    home_id: {
        type: Number,
        required: true
    },
    temperatureRange: {
        type: [Number],
        default: [19, 24],
        required: true
    },
    humidityRange: {
        type: [Number],
        default: [40, 60],
        required: true
    }
}, {
    timestamps: true
});

module.exports = {
    Scenario: mongoose.model('Scenario', scenarioSchema),
    DeviceProtocol: mongoose.model('DeviceProtocol', deviceProtocolSchema),
    Alarm: mongoose.model('Alarm', alarmsSchema)
};
