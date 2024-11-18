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

router.post('/', async (req, res) => {

    try {
        const scenario = new Scenario(req.body);
        const savedScenario = await scenario.save();
        res.status(201).json(savedScenario);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
    
});

module.exports = router;