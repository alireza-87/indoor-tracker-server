const mongoose = require('mongoose');
var Schema = mongoose.Schema;

let ClientSchema = mongoose.Schema({
    clientId: String,
    floor: String,
    room: String,
    isConnected:Number,
    timestamp_in: Number,
    timestamp_out: Number,
    user: {
        type: Schema.Types.ObjectId,
        ref: "model_persons"
      }
})

module.exports = mongoose.model('model_client', ClientSchema,"model_client");