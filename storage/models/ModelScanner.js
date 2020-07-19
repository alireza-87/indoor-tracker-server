const mongoose = require('mongoose');
let ScannerSchema = mongoose.Schema({
    floor: String,
    room: String,
    isConnected: Number,
    name: String,
    capacity:Number,
    sensorid:String,
})

module.exports = mongoose.model('model_scanner', ScannerSchema);