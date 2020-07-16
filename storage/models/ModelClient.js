const mongoose = require('mongoose');
let ClientSchema = mongoose.Schema({
    clientId: String,
    floor: String,
    room: String,
    isConnected:Number,
    timestamp_in: Number,
    timestamp_out: Number,
})

module.exports = mongoose.model('model_client', ClientSchema);