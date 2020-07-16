const mongoose = require('mongoose');
let ScannerSchema = mongoose.Schema({
    floor: String,
    room: String,
    isConnected: Number,
})

module.exports = mongoose.model('model_scanner', ScannerSchema);