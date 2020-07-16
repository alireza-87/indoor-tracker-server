const mqtt = require('./mqtt_server')
const storageHandler = require('./storage/StorageHandler')
require('dotenv/config');

// Init Storage
let storage =new storageHandler()
storage.init()

mqtt.connection()