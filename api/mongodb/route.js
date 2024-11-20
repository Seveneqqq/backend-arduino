const express = require('express');
const router = express.Router();
const Scenario = require('./schema');

router.get('/', async (req, res) => {

    try {
        const scenarios = await Scenario.find();
        res.json(scenarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

router.post('/add-scenario', async (req, res) => {

    try {

        console.log(req.body);

        const {name, home_id, devices} = req.body;
        const {scenarioTurnOn,scenarioTurnOff} = req.body || null;

        

        const newScenario = new Scenario({
            name,
            home_id,
            scenarioTurnOn,
            scenarioTurnOff,
            devices: devices.map(device => ({
                device_id: device.device_id,
                device_name: device.device_name,
                status: device.status,
                additional_options: device.additional_options || {} 
            }))
        });

        const savedScenario = await newScenario.save();
        res.status(200).json(savedScenario);
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
    
});

module.exports = router;