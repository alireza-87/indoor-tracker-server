const mongoose = require('mongoose');
let UserSchema = mongoose.Schema({
    name: String,
    surename: String,
    rule: String,
    tell:String,
    email: String,
    password: String,
    tokenid: String,
    uid:{ type: Number, default: 100 }
})

module.exports = mongoose.model('model_user', UserSchema,"model_user");