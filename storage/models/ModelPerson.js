const mongoose = require('mongoose');
let ClientSchema = mongoose.Schema({
    name: String,
    surename: String,
    rule: String,
    tell:String,
    email: String,
    password: String,
    tokenid: String,
})

module.exports = mongoose.model('model_persons', ClientSchema);