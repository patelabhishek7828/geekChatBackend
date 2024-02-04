const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

require('dotenv').config();

const nodemailer = require("nodemailer")

// setProfilepicture

router.post('/setprofilepic', (req, res) => {
    const {email, profilepic} = req.body

    console.log("email", email);
    console.log("pp", profilepic)
    User.findOne({email: email}).then(async(savedUser) =>{
        if(savedUser){
            savedUser.profilepic = profilepic
            savedUser.save().then(user =>{
                res.json({message: 'Profile Picture Updated successfully'})
            })
            .catch(err =>{
                return res.status(422).json({error: "Server Error"})
            })
        } else {
            return res.status(422).json({error: "Invalid Credentials"})
        }
    })
})

router.post('/addpost', (req, res) => {
    const {email, post, postDescription} = req.body;
    console.log("object", req.body)
    User.findOne({email: email}).then(async(savedUser) =>{
        if(!savedUser){
            return res.status(422).json({error : 'Invalid Credentials'});
        }else {
            savedUser.posts.push({post, postDescription, likes:[], comments:[]});
            savedUser.save().then(user =>{
                res.json({message: 'Post Added Succesfully'})
            })
            .catch(err =>{
                console.log(err)    
            })
        }
    }).catch(err =>{
        console.log(err)
    })
})
 
module.exports = router;