const express = require('express');
const router = express.Router();
const { Scenario, DeviceProtocol, Alarm, AlarmHistory, DeviceHistory, ScenarioHistory, UserHistory } = require('./schema');

router.get('/', async (req, res) => {
    try {
        const scenarios = await Scenario.find();
        res.json(scenarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

router.post('/devices/history', async (req, res) => {
    try {
        const deviceHistory = new DeviceHistory(req.body);
        await deviceHistory.save();
        res.status(200).json(deviceHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/devices/history/:home_id', async (req, res) => {
    try {
        const history = await DeviceHistory.find({ home_id: req.params.home_id })
            .sort({ timestamp: -1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/scenarios/history', async (req, res) => {
    try {
        const scenarioHistory = new ScenarioHistory(req.body);
        await scenarioHistory.save();
        res.status(200).json(scenarioHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/scenarios/history/:home_id', async (req, res) => {
    try {
        const history = await ScenarioHistory.find({ home_id: req.params.home_id })
            .sort({ timestamp: -1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/users/history', async (req, res) => {
    try {
        const userHistory = new UserHistory(req.body);
        await userHistory.save();
        res.status(200).json(userHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/users/history/:home_id', async (req, res) => {
    try {
        const history = await UserHistory.find({ home_id: req.params.home_id })
            .sort({ timestamp: -1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/alarms/history/:home_id', async (req, res) => {

    try {
        const homeId = req.params.home_id;
        
        const alarms = await AlarmHistory.find({ home_id: homeId })
            .sort({ timestamp: -1 });
        
        if (!alarms) {
            return res.status(404).json({ error: 'No alarm history found for this home' });
        }

        res.status(200).json(alarms);
        
    } catch (error) {
        console.error('Error fetching alarm history:', error);
        res.status(500).json({ error: error.message });
    }
    
});

router.post('/alarms/history', async (req, res) => {
    try {

        const alarmHistory = new AlarmHistory(req.body);
        await alarmHistory.save();

        req.app.get('io').to(req.body.homeId).emit('newAlarmNotification', {
            type: req.body.type,
            status: req.body.status,
            value: req.body.value,
            timestamp: req.body.timestamp
        });
        
        res.status(200).json(alarmHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/scenarios/:home_id', async (req, res) => {

    const homeId = req.params.home_id; 
    
    if (isNaN(homeId)) {
        return res.status(400).json({ error: 'Invalid home_id parameter' });
    }

    try {
        const scenarios = await Scenario.find({ home_id: homeId });
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

router.get('/alarms/:home_id', async (req, res) => {
    try {
        const home_id = req.params.home_id;
        
        const alarmSettings = await Alarm.findOne({ home_id });
        
        if (!alarmSettings) {
            return res.status(404).json({ error: 'Alarm settings not found for this home' });
        }
        
        res.status(200).json(alarmSettings);
        
    } catch (error) {
        console.error('Error fetching alarm settings:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-alarm', async (req, res) => {
    try {
        const { home_id, temperatureRange, humidityRange } = req.body;

        if (!home_id || !temperatureRange || !humidityRange) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newAlarm = new Alarm({
            home_id,
            temperatureRange,
            humidityRange
        });

        const savedAlarm = await newAlarm.save();
        res.status(200).json(savedAlarm);

    } catch (error) {
        console.error('Error adding alarm:', error);
        res.status(400).json({ error: error.message });
    }
});

router.put('/update-alarm/:home_id', async (req, res) => {
    try {
        const { temperatureRange, humidityRange } = req.body;
        const home_id = req.params.home_id;

        if (!temperatureRange && !humidityRange) {
            return res.status(400).json({ error: 'No update data provided' });
        }

        const updateData = {};
        if (temperatureRange) updateData.temperatureRange = temperatureRange;
        if (humidityRange) updateData.humidityRange = humidityRange;

        const updatedAlarm = await Alarm.findOneAndUpdate(
            { home_id },
            { $set: updateData },
            { new: true }
        );

        if (!updatedAlarm) {
            return res.status(404).json({ error: 'Alarm not found for this home' });
        }

        res.status(200).json(updatedAlarm);

    } catch (error) {
        console.error('Error updating alarm:', error);
        res.status(400).json({ error: error.message });
    }
});


module.exports = router;