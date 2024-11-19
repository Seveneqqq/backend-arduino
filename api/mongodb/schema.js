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
            type: String,
            enum: ['ON', 'OFF'],
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

module.exports = mongoose.model('Scenario', scenarioSchema);