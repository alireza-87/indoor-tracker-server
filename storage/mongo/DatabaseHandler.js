/**
 * a singleton class on mongo
 * DONT USE THIS CLASS DIRECTLY INSTEAD USE STORAGEHANDLER
 * @type {Mongoose}
 */
const mongoDb = require('mongoose')
mongoDb.Promise = global.Promise;

let DbConnection = function () {

    let mdb = null;
    let instance = 0;

    function DbConnect() {
        try {
            mongoDb.connect(process.env.DB_CONNECTION,
                {useNewUrlParser: true, useUnifiedTopology: true},
                () => {
                    console.log('MonogoDB is connected successfully')
                });
            mdb = mongoDb.connection;
            mdb.on('error', console.error.bind(console, 'connection error:'));
            mdb.once('open', function callback() {
                console.log("database opened ...");
            });
            return mdb
        } catch (e) {
            return e;
        }
    }


    function Get() {
        try {
            instance++;     // this is just to count how many times our singleton is called.
            console.log(`DbConnection called ${instance} times`);

            if (mdb != null) {
                console.log(`db connection is already alive`);
                return mdb;
            } else {
                console.log(`getting new db connection`);
                mdb = new DbConnect();
                return mdb;
            }
        } catch (e) {
            return e;
        }
    }

    return {
        Get: Get
    }
}
module.exports = DbConnection();