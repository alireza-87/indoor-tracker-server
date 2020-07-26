/**
 * MQTT server
 */
const mosca = require('mosca');
//const storageHandler = require('./storage/StorageHandler');
const storageHandler = require('./storage/StorageHandler')
let storage =new storageHandler()

let settings = {
    port: 1885,
    persistence: mosca.persistence.Memory,
    http: {port: 3002, bundle: true, static: './'}
};
let server = new mosca.Server(settings, function () {
    console.log('Mqtt server');
});

let sendAlarm = (floor,room) =>{
    //send alarm by mqtt
    const topic='alarm/room'
    const answer={
        type:"roomoverload",
        room:room,
        floor:floor
    }
    console.log("start publist ",JSON.stringify({type:"roomoverload",result:[answer]}))
    server.publish({topic:topic, payload:JSON.stringify({type:"roomoverload",result:[answer]})})
    storage.getCurrentClientInRoom(floor,room,(err,res) =>{
        if(err==null){
            res.forEach(function(item) {
                const topic='user/'+'server'+'/'+item.user.uid
              });              
            //server.publish({topic:topic, payload:JSON.stringify({type:"personOfRoom",result:res})})
        }
    })

}

let connection = function Broker() {
    //let storage=new storageHandler()

    server.on('ready', function () {
        console.log('ready');
    });


    server.on('clientConnected', function (client) {
        console.log('scanner : scanner Connected => ',client.id);
        let dibrisScannerPattern = new RegExp(/^scanner\/[0-9]*\/[0-9]*$/);
        let arrMatches = client.id.match(dibrisScannerPattern);
        if (arrMatches) {
            //console.log('new scanner : ', client.id);
            // let floor=client.id.split('\/')[1]
            // let room=client.id.split('\/')[2]
            // storage.insertScanner(floor,room)
        }

    });

    server.on('clientDisconnected', function (client) {
        console.log('scanner : scanner Disconnected');
        let dibrisScannerPattern = new RegExp(/^scanner\/[0-9]*\/[0-9]*$/);
        let arrMatches = client.id.match(dibrisScannerPattern);
        if (arrMatches) {
            let floor=client.id.split('\/')[1]
            let room=client.id.split('\/')[2]
            storage.turnoffClientOfSensor(floor,room)
        }

    });

    server.on('published', function (packet, client) {
        if (client!=null){
            let dashboardCommandPattern = new RegExp(/^command\/[0-9]*\/s$/);
            if(packet.topic.match(dashboardCommandPattern)){
                let cId=packet.topic.split('/')[1]
                console.log("clientID =====> ",cId)
                let data=JSON.parse(packet.payload.toString())
                console.log("data =====> ",data)
                switch(data.type){
                    case "/App/ADD_ROOM":
                        storage.insertScanner(data.name,data.floor,data.room,data.capacity,data.sensorid,(e,r)=>{
                            if(e==null){
                                const topic='dashboard/'+cId+'/result/success'
                                console.log(" publish >> ",topic)
                                server.publish({topic:topic, payload:JSON.stringify({result:"done"})})
                            }else{
                                const topic='dashboard/'+cId+'/result/fail'
                                console.log(" publish >> ",topic)
                                server.publish({topic:topic, payload:JSON.stringify({result:"fail"})})
                            }
                        })
                        break
                        case "/App/ADD_PERSON":
                            storage.addUser(data,(e)=>{
                                if(e==null){
                                    const topic='dashboard/'+cId+'/result/success'
                                    console.log(" publish >> ",topic)
                                    server.publish({topic:topic, payload:JSON.stringify({result:"done"})})
                                    }else{
                                        const topic='dashboard/'+cId+'/result/fail'
                                        console.log(" publish >> ",topic)
                                        server.publish({topic:topic, payload:JSON.stringify({result:"fail"})})
                                    }
                            })
                            break
    
                    case '/App/GET_ROOM_LIST':
                        storage.getAllScanners((err,res)=>{
                            if(err==null){
                                const topic='dashboard/'+cId+'/data'
                                server.publish({topic:topic, payload:JSON.stringify({type:"roomList",result:res})})
                            }
                        })
                        break;
                    case "/App/GET_PERSON_LIST":
                        storage.getAllUser((err,res) =>{
                            if(err==null){
                                const topic='dashboard/'+cId+'/data'
                                server.publish({topic:topic, payload:JSON.stringify({type:"personList",result:res})})
                            }
                        })

                    break;   
                    case "/App/GET_PERSON_LIST_OF_ROOM":
                        storage.getCurrentClientInRoom(data.floor,data.room,(err,res) =>{
                            if(err==null){
                                const topic='dashboard/'+cId+'/data'
                                server.publish({topic:topic, payload:JSON.stringify({type:"personOfRoom",result:res})})
                            }
                        })

                    break;         
                    case "/App/GET_ROOM_COUNT":
                        storage.getCurrentCountOccupideInRoom(data.floor,data.room,(err,res) =>{
                            if(err==null){
                                const topic='dashboard/'+cId+'/data'
                                const answer={
                                    count:res,
                                    room:data.room,
                                    floor:data.floor
                                }
                                console.log(JSON.stringify({result:answer}))
                                server.publish({topic:topic, payload:JSON.stringify({type:"roomCount",result:answer})})
                            }
                        })
                        break;
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
            let dibrisEntrancePattern = new RegExp(/^\/dibrisbuilding\/[0-9]*\/[0-9A-Z-]*\/[0-9A-Z-]*$/);
            //let dibrisExitPattern = new RegExp(/^\/dibrisbuilding\/[0-9]*\/corridor\/[0-9A-Z-]*$/);
            let arrMatches = topic.match(dibrisRoomPattern);
            let enteranceMatches = topic.match(dibrisEntrancePattern);
            if (arrMatches){
                console.log('new Client : ',topic);
                let floor=topic.split('\/')[2]
                let room=topic.split('\/')[3]
                let clientId=topic.split('\/')[4]
                storage.insertClient(floor,room,clientId,Date.now(), () => {
                    storage.getCurrentCountOccupideInRoom(floor,room,(err,res) =>{
                        if(err==null){
                            const topic='update/room'
                            const answer={
                                count:res,
                                room:room,
                                floor:floor
                            }
                            console.log(JSON.stringify({type:"roomCount",result:answer}))
                            server.publish({topic:topic, payload:JSON.stringify({type:"roomCount",result:answer})})
                            storage.getScanner(floor,room,(err,result)=>{
                                if(!err && result){
                                    console.log(result.capacity," ",res)
                                    if(res>=result.capacity){
                                        sendAlarm(floor,room)
                                    }
                                }
                            })
                        }
                    })
                    storage.getUserByTokenid(clientId,(err,res)=>{
                        const topic='update/useractivity'
                        const answer={
                            user:res,
                            action:"entertoroom",
                            room:room,
                            floor:floor
                        }
                        console.log("start publist ",JSON.stringify({type:"useractivity",result:answer}))
                        server.publish({topic:topic, payload:JSON.stringify({type:"useractivity",result:[answer]})})

                    })
                })
                
            }else if (enteranceMatches){
                let floor=topic.split('\/')[2]
                let room=topic.split('\/')[3]
                let clientId=topic.split('\/')[4]
                storage.insertClient(floor,room,clientId,Date.now(),() => {

                })
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
                storage.turnOffClient(floor,room,clientId,Date.now(),() => {
                    storage.getCurrentCountOccupideInRoom(floor,room,(err,res) =>{
                        if(err==null){
                            const topic='update/room'
                            const answer={
                                count:res,
                                room:room,
                                floor:floor
                            }
                            console.log('.............')
                            console.log(JSON.stringify({result:answer}))
                            server.publish({topic:topic, payload:JSON.stringify({type:"roomCount",result:answer})})
                        }
                    })

                    storage.getUserByTokenid(clientId,(err,res)=>{
                        const topic='update/useractivity'
                        const answer={
                            user:res,
                            action:"exitfromroom",
                            room:room,
                            floor:floor
                        }
                        console.log("start publist ",JSON.stringify({type:"useractivity",result:answer}))
                        server.publish({topic:topic, payload:JSON.stringify({type:"useractivity",result:[answer]})})

                    })

                })
                
            }

        }
    });
}

module.exports.connection = connection;
