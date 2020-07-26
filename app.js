const mqtt = require('./mqtt_server')
const loginService = require('./services/LoginService')
const express = require('express')
const storageHandler = require('./storage/StorageHandler')
const bodyParser = require('body-parser');
const app = express();
let cors = require('cors');
const PersonSchema = require('./storage/models/ModelUser');

require('dotenv/config');

// Init Storage
let storage =new storageHandler()
storage.init()
//cleanup connected status
storage.turnoffAllClient()

//init admin
let data = new PersonSchema({
    name:'admin',
    surename:'admin',
    rule:'admin',
    tell:'',
    email:'admin@dashboard.com',
    password:'admin',
    tokenid:'root',
    uid:100
})

storage.addUser(data,() => {
    
})

app.use(cors());

app.use('/login', loginService);

app.listen(1080);

mqtt.connection()


