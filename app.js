const mqtt = require('./mqtt_server')
const loginService = require('./services/LoginService')
const express = require('express')
const storageHandler = require('./storage/StorageHandler')
const bodyParser = require('body-parser');
const app = express();
let cors = require('cors');

require('dotenv/config');

// Init Storage
let storage =new storageHandler()
storage.init()
app.use(cors());

app.use('/login', loginService);

app.listen(1080);

mqtt.connection()