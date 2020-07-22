/**
 * this class used to store data
 * currently our class use mongo db in order to save data
 * you can use your own
 * @type {{Get: Get}}
 */
const dbs = require('../storage/mongo/DatabaseHandler')
const ScannerSchema = require('./models/ModelScanner');
const ClientSchema = require('./models/ModelClient');
const PersonSchema = require('./models/ModelPerson');
const NodeCache = require( "node-cache" );

let db
const myCache = new NodeCache();
const scannerCache = new NodeCache();

class StorageHandler{
    turnOffScanner(floor,room){
        db.collection("model_scanner").findOne({floor:floor,room:room}, (err, result) => {
            if (result === null) {
                console.log("scanner cant find - turnoff")

            } else {
                console.log("scanner find - turnoff")
                let newvalues = { $set: {isConnected: 0} };
                db.collection("model_scanner").updateOne({floor:floor,room:room},newvalues,(error,result)=>{
                    console.log("scanner update - turnoff")
                    if (scannerCache.get(floor+"/"+room)) {
                        let array = scannerCache.get(floor + "/" + room)
                        array.push(result)
                        scannerCache.set(floor + "/" + room, array)
                    }else{
                        let array = []
                        array.push(result)
                        scannerCache.set(floor + "/" + room, array)
                    }
                });
            }
        });

    }

    turnOffClient(floor,room,clientId,time,delegate){
        db.collection("model_client").findOne({clientId: clientId,floor:floor,room:room},{ sort: { 'created_at' : -1 } },function (err, result) {
            console.log("turnOffClient")
            if (err!=null){
                console.log("insert clint ERROR : ",err)
            }else{
                let newvalues = { $set: {isConnected: 0,timestamp_out:time} };
                console.log("turnOffClient finded")
                db.collection("model_client").updateMany({clientId: clientId},newvalues,(err,result)=>{
                    if (result==null){
                        console.log("turnOffClient update")
                    }
                    delegate()
                })
            }
        })
    }

    insertClient(floor,room,clientId,time,delegate){

        let data = new ClientSchema({
            clientId: clientId,
            isConnected: 1,
            floor: floor,
            timestamp_in:time,
            room: room,
        })
        db.collection("model_persons").findOne({tokenid:clientId},function(err,res){
            if(err){
                console.log("cant find client 1")

            }
            console.log("can res > ",res)

            if(res){
                console.log("can find client 1")
                db.collection("model_client").insertOne(data,(error,result)=>{
                    if (error!=null){
                        console.log("insert clint ERROR : ",error)
                    }else{
                        if (myCache.get(floor+"/"+room)){
                            let array=myCache.get(floor+"/"+room)
                            array.push(data)
                            myCache.set(floor+"/"+room,array)
                        }else{
                            let array = []
                            array.push(data)
                            myCache.set(floor+"/"+room,array)
                        }
                        console.log("insert clint success")
                        delegate()
                    }
                });
            }else{
                console.log("cant find client 2")
            }
        })
        
    }

    insertScanner(name,floor,room,capacity,sensorid){

        let data = new ScannerSchema({
            isConnected: 1,
            floor: floor,
            room: room,
            name: name,
            capacity:capacity,
            sensorid:sensorid
        })
        db.collection("model_scanner").findOne({sensorid:sensorid}, function(err, result){
            if (result === null) {
                console.log("cant find - insertScanner")
                db.collection("model_scanner").insertOne(data,(err,res)=>{
                    if (scannerCache.get(floor+"/"+room)) {
                        let array=scannerCache.get(floor+"/"+room)
                        array.push(data)
                        scannerCache.set(floor + "/" + room, array)
                    }else{
                        let array=[]
                        array.push(data)
                        scannerCache.set(floor + "/" + room, array)
                    }
                })
            } else {
                console.log("scanner find - insertScanner")
                let new_values = { $set: {name:name,floor:floor,room:room,isConnected: 1} };
                db.collection("model_scanner").updateOne({sensorid:sensorid},new_values,(error,result)=>{
                    console.log("scanner update - insertScanner")
                    if (scannerCache.get(floor+"/"+room)) {
                        let array=scannerCache.get(floor+"/"+room)
                        array.push(data)
                        scannerCache.set(floor + "/" + room, array)
                    }else{
                        let array=[]
                        array.push(data)
                        scannerCache.set(floor + "/" + room, array)
                    }
                });
            }
        });
    }

    insertPerson(person,delegate){
        let data = new PersonSchema({
            name:person.name,
            surename:person.surename,
            rule:person.rule,
            tell:person.tell,
            email:person.email,
            password:person.password,
            tokenid:person.tokenid
        })

        db.collection("model_persons").findOne({$or:[{tokenid:person.tokenid},{email:person.email}]},function(err,res){
            if(!res){
                db.collection("model_persons").insertOne(data,(err,res)=>{
                    delegate()
                })
            }
        })
    }

    getAllScanners(delegate){
        db.collection("model_scanner").find({}).toArray(function(err,res){
            delegate(err,res)
        })

    }

    getCurrentOccupideInRoom(floor,room,delegate){
        console.log(floor,' , ',room)

        db.collection("model_client").find({floor:floor,room:room,isConnected:1}).toArray(function (err,res){
            console.log(res.length)
            delegate(err,res.length)
        })
    }
    init(){
        db = dbs.Get();
    }
}

module.exports = StorageHandler