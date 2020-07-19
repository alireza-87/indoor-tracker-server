/**
 * MQTT server
 */
const mosca = require('mosca');
//const storageHandler = require('./storage/StorageHandler');
const storageHandler = require('./storage/StorageHandler')

let settings = {
    port: 1885,
    persistence: mosca.persistence.Memory,
    http: {port: 3002, bundle: true, static: './'}
};

let connection = function Broker() {
    //let storage=new storageHandler()
    let storage =new storageHandler()
    let server = new mosca.Server(settings, function () {
        console.log('Mqtt server');
    });

    server.on('ready', function () {
        console.log('ready');
    });


    server.on('clientConnected', function (client) {
        console.log('new connection : clientConnected => ',client.id);
        let dibrisScannerPattern = new RegExp(/^scanner\/[0-9]*\/[0-9]*$/);
        let arrMatches = client.id.match(dibrisScannerPattern);
        if (arrMatches) {
            console.log('new scanner : ', client.id);
            let floor=client.id.split('\/')[1]
            let room=client.id.split('\/')[2]
            storage.insertScanner(floor,room)

        }

    });

    server.on('clientDisconnected', function (client) {
        console.log('new scanner : clientDisconnected');
        let dibrisScannerPattern = new RegExp(/^scanner\/[0-9]*\/[0-9]*$/);
        let arrMatches = client.id.match(dibrisScannerPattern);
        if (arrMatches) {
            console.log('new scanner : ', client.id);
            let floor=client.id.split('\/')[1]
            let room=client.id.split('\/')[2]
            storage.turnOffScanner(floor,room)
        }

    });

    server.on('published', function (packet, client) {
        if (client!=null){
            let dashboardCommandPattern = new RegExp(/^command\/[0-9]*\/s$/);
            if(packet.topic.match(dashboardCommandPattern)){
                let cId=packet.topic.split('/')[1]
                console.log("clientID =====> ",cId)
                let data=JSON.parse(packet.payload.toString())
                switch(data.type){
                    case "addRoom":
                        storage.insertScanner(data.name,data.floor,data.room,data.capacity,data.sensorid,(e)=>{
                            if(e==null){
                                const topic='dashboard/'+cId+'/result/success'
                                server.publish({topic:topic, payload:JSON.stringify({result:"done"})})
                            }else{
                                const topic='dashboard/'+cId+'/result/fail'
                                server.publish({topic:topic, payload:JSON.stringify({result:"fail"})})
                            }
                        })
                        break
                        default:
                            break
                }
                //console.log('published',packet);
            }
    
        }
    });

    server.on('subscribed', function (topic, client) {
        if (client!=null) {
            let dibrisRoomPattern = new RegExp(/^\/dibrisbuilding\/[0-9]*\/[0-9]*\/[0-9A-Z-]*$/);
            let dibrisEntrancePattern = new RegExp(/^\/dibrisbuilding\/[0-9]*\/entrance\/[0-9A-Z-]*$/);
            let dibrisExitPattern = new RegExp(/^\/dibrisbuilding\/[0-9]*\/corridor\/[0-9A-Z-]*$/);
            let arrMatches = topic.match(dibrisRoomPattern);
            let enteranceMatches = topic.match(dibrisEntrancePattern);
            let exitMatches = topic.match(dibrisExitPattern);
            if (arrMatches){
                console.log('new Client : ',topic);
                let floor=topic.split('\/')[2]
                let room=topic.split('\/')[3]
                let clientId=topic.split('\/')[4]
                storage.insertClient(floor,room,clientId,Date.now())
            }else if (enteranceMatches){
                let floor=topic.split('\/')[2]
                let clientId=topic.split('\/')[4]
                storage.insertClient(floor,"entrance",clientId,Date.now())
            }else if(exitMatches){
                let floor=topic.split('\/')[2]
                let clientId=topic.split('\/')[4]
                storage.insertClient(floor,"corridor",clientId,Date.now())
            }
        }

    });

    server.on('unsubscribed', function (topic, client) {
        if (client!=null) {
            let dibrisRoomPattern = new RegExp(/^\/dibrisbuilding\/[0-9]*\/[0-9]*\/[0-9A-Z-]*$/);
            let arrMatches = topic.match(dibrisRoomPattern);
            if (arrMatches){
                console.log('new Client : ',topic);
                let floor=topic.split('\/')[2]
                let room=topic.split('\/')[3]
                let clientId=topic.split('\/')[4]
                storage.turnOffClient(floor,room,clientId,Date.now())
            }

        }
    });
}

module.exports.connection = connection;
