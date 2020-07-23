const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const storageHandler = require('../storage/StorageHandler')

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
router.use(express.urlencoded({ extended: true }))
router.use(express.json());

let storage =new storageHandler()

router.post('/', async (req, res) => {
    console.log("1",req.body)
    storage.login(req.body.email,req.body.password,(err,result) =>{
        console.log("2")
        if(result){
            console.log("3")
            res.status(200).send({message: 'success',result});
        }else{
            console.log("4")
            res.status(400).send({message: 'failed',result});
        }
    })
});
module.exports = router;
