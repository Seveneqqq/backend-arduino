const express = require('express');
const router = express.Router();
const { Scenario, DeviceProtocol } = require('./schema');

router.get('/', async (req, res) => {

    try {
        const scenarios = await Scenario.find();
        res.json(scenarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

router.post('/add-device-protocol', async (req, res) => {
    
    try {
        const { device_id, protocol_type } = req.body;
        
        const existingProtocol = await DeviceProtocol.findOne({ device_id });
        if (existingProtocol) {
            return res.status(400).json({ error: 'Protocol configuration for this device already exists' });
        }

        const protocolConfig = {};
        switch (protocol_type) {
            case 'Zigbee':
                const { zigbeeId, zigbeeChannel, zigbeeGroupId, zigbeeHub } = req.body;
                protocolConfig.zigbee = { zigbeeId, zigbeeChannel, zigbeeGroupId, zigbeeHub };
                break;
            case 'Wifi':
                const { ipAddress, macAddress, ssid, password } = req.body;
                protocolConfig.wifi = { ipAddress, macAddress, ssid, password };
                break;
            case 'Bluetooth':
                const { bleUuid, bleConnection } = req.body;
                protocolConfig.bluetooth = { bleUuid, bleConnection };
                break;
            case 'Z-Wave':
                const { zwaveDeviceId, zwaveNetworkKey, zwaveGroupId } = req.body;
                protocolConfig.zwave = { zwaveDeviceId, zwaveNetworkKey, zwaveGroupId };
                break;
            case 'MQTT':
                const { mqttBrokerUrl, mqttTopicOn, mqttTopicOff, mqttDeviceId } = req.body;
                protocolConfig.mqtt = { mqttBrokerUrl, mqttTopicOn, mqttTopicOff, mqttDeviceId };
                break;
            default:
                return res.status(400).json({ error: 'Invalid protocol type' });
        }

        const newDeviceProtocol = new DeviceProtocol({
            device_id,
            protocol_type,
            ...protocolConfig
        });
      
        const savedProtocol = await newDeviceProtocol.save();
        res.status(200).json(savedProtocol);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/add-scenario', async (req, res) => {
    try {
        console.log(req.body);
        const { name, home_id, devices } = req.body;
        const { scenarioTurnOn, scenarioTurnOff } = req.body || {};

        
        const newScenario = new Scenario({
            name,
            home_id,
            scenarioTurnOn: scenarioTurnOn || null,
            scenarioTurnOff: scenarioTurnOff || null,
            devices: devices.map(device => ({
                device_id: device.device_id,
                name: device.name,
                label: device.label,
                room_id: device.room_id,
                category: device.category,
                command_on: device.command_on,
                command_off: device.command_off,
                status: device.status,
                actions: device.actions,
                protocolData: device.protocolData || null
            }))
        });

        const savedScenario = await newScenario.save();
        res.status(200).json(savedScenario);

    } catch (error) {
        console.error('Error adding scenario:', error);
        res.status(400).json({ error: error.message });
    }
});

router.get('/device-protocol/:device_id', async (req, res) => {
    try {
        const deviceProtocol = await DeviceProtocol.findOne({ 
            device_id: req.params.device_id 
        });
        
        if (!deviceProtocol) {
            return res.status(404).json({ error: 'Protocol configuration not found' });
        }
        
        res.json(deviceProtocol);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;