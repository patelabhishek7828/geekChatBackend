const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const Message = mongoose.model("Message");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

require('dotenv').config();

const nodemailer = require("nodemailer")

router.post('/savemessagetodb', async(req, res) => {
    const {senderid, message, receiverid, roomid} = req.body
    // console.log("MESSAGE RECIEVED", req.body);

    try{
        const newMessage = new Message ({
            senderid,
            message,
            receiverid,
            roomid,
        })
        await newMessage.save();
        res.send("Messsage Saved Succesfully")
    } catch(err){
        console.log("ERROR WHILE SAVING MESSAGE TO DB line 18", err)
        res.status(422).send(err.message);
    }
})


router.post('/getmessages', async(req, res) => {
    const {roomid} = req.body;

    Message.find({roomid: roomid})
    .then(messages =>{
        res.send(messages)
    })
    .catch(err =>{
        console.log("error get in line 41 - ", err)
        res.status(422).send(err.message)
    })
})

router.post('/setusermessages', async(req, res) => {
    const {ouruserid, fuserid, lastmessage, roomid} = req.body;
    // console.log("MESSAGE RECEIVED - ", req.body);

    User.findOne({_id: ouruserid})
    .then(user => {
        user.allmessages.map((item)=> {
            if(item.fuserid == fuserid){
                user.allmessages.pull(item.fuserid);
            }
        })
        const date = Date.now();

        user.allmessages.push({
            ouruserid,
            fuserid,
            lastmessage,
            roomid,
            date
        })

        user.save()
        res.status(200).send({ message: "Message saved succesfully"})
    })
    .catch(err =>{
        console.log("error updateing all chats line 71 - ", err)
        res.status(422).send(err.message)
    })
})


router.post('/getusermessages', async(req, res)=> {
    const {userid} = req.body;

    // console.log("USERID RECEIVED - ", userid)
    User.findOne({_id : userid})
    .then(user => {
        res.send(user.allmessages)
    })
    .catch(err => {
        console.log('error getting all chats line 86 - ', err)
        res.status(422).send(err.message);
    })
})

module.exports = router;