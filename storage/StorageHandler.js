/**
 * this class used to store data
 * currently our class use mongo db in order to save data
 * you can use your own
 * @type {{Get: Get}}
 */
const dbs = require('../storage/mongo/DatabaseHandler')
const ScannerSchema = require('./models/ModelScanner');
const ClientSchema = require('./models/ModelClient');
const PersonSchema = require('./models/ModelUser');
const NodeCache = require( "node-cache" );

let db
const myCache = new NodeCache();
const scannerCache = new NodeCache();

class StorageHandler{
    //Client Region
    turnoffAllClient(){
        console.log('turnoffAllClient');
        let newvalues = { $set: {isConnected: 0} };
        db.collection("model_client").updateMany({},newvalues,(err,res)=>{

        })
    }

    turnoffClientOfSensor(floor,room){
        console.log('turnoffClientOfSensor : ', floor, " ",room);
        let newvalues = { $set: {isConnected: 0} };
        db.collection("model_client").updateMany({floor:floor,room:room},newvalues,(err,res)=>{

        })
    }

    turnOffClient(floor,room,clientId,time,delegate){
        db.collection("model_user").findOne({tokenid:clientId},(err,res) => {
            if(res){
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
        })
        
    }

    insertClient(floor,room,clientId,time,delegate){

        db.collection("model_user").findOne({tokenid:clientId},function(err,res){
            if(err){
                console.log("cant find client 1")

            }
            console.log("can res > ",res)    
            if(res){
                let data = new ClientSchema({
                    clientId: clientId,
                    isConnected: 1,
                    floor: floor,
                    timestamp_in:time,
                    room: room,
                    user:res._id
                })    
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


    getCurrentClientInRoom(floor,room,delegate){
        console.log(floor,' , ',room)
        let mode = new ClientSchema()
        ClientSchema.find({floor:floor,room:room,isConnected:1}).populate("user").exec(function (err,res){
            console.log(res)
            delegate(err,res)
        })
    }
    //End of Client Region

    //User Region
    addUser(person,delegate){
        this.getMaxUid((err,res)=>{
            let data = new PersonSchema({
                name:person.name,
                surename:person.surename,
                rule:person.rule,
                tell:person.tell,
                email:person.email,
                password:person.password,
                tokenid:person.tokenid,
                uid:res
            })    
            db.collection("model_user").findOne({$or:[{tokenid:person.tokenid},{email:person.email}]},function(err,res){
                if(!res){
                    db.collection("model_user").insertOne(data,(err,res)=>{
                        delegate(err,res)
                    })
                }
            })    
        })
    }


    getAllUser(delegate){
        console.log('getAllUser')
        db.collection("model_user").find({}).toArray(function (err,res){
            console.log(res)
            delegate(err,res)
        })
        
    }

    getUserByTokenid(tokenid,delegate){
        console.log("getuser by token ",tokenid)
        db.collection("model_user").findOne({tokenid:tokenid},(err,res)=>{
            delegate(err,res)
        })
    }
    //End of user region

    //scanner region

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

    insertScanner(name,floor,room,capacity,sensorid,delegate){

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
                    delegate(err,res)
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

    getAllScanners(delegate){
        db.collection("model_scanner").find({}).toArray(function(err,res){
            delegate(err,res)
        })

    }

    getScanner(floor,room,delegate){
        db.collection("model_scanner").findOne({floor:floor,room:room},(err,res)=>{
            delegate(err,res)
        })
    }
    //end of scanner region
    
    // auth
    login(email,pass,delegate){
        db.collection("model_user").findOne({email:email,password:pass},(err,res)=>{
            delegate(err,res)
        })
    }

    //Statistic

    getCurrentCountOccupideInRoom(floor,room,delegate){
        console.log(floor,' , ',room)

        db.collection("model_client").find({floor:floor,room:room,isConnected:1}).toArray(function (err,res){
            console.log(res.length)
            delegate(err,res.length)
        })
    }

    getMaxUid(delegate){
        let mode = new PersonSchema()
        PersonSchema.find({}).sort({"uid":-1}).limit(1).exec((err,res)=>{
            console.log
            if(err===null){
                if(res.length>0){
                    const newUid=res[0].uid+1
                    delegate(null,newUid)
                }else{
                    delegate(null,101)
                }
            }else{
                delegate(null,101)
            }
        })
    }

    

    init(){
        db = dbs.Get();
    }
}

module.exports = StorageHandler