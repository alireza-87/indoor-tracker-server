const mongoose = require('mongoose');
var Schema = mongoose.Schema;

let UserSchema = mongoose.Schema({
    clientId: String,
    floor: String,
    room: String,
    isConnected:Number,
    timestamp_in: Number,
    timestamp_out: Number,
    user: {
        type: Schema.Types.ObjectId,
        ref: "model_user"
      }
})

module.exports = mongoose.model('model_client', UserSchema,"model_client");