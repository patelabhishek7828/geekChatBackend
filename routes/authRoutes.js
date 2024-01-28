const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

require('dotenv').config();

const nodemailer = require("nodemailer")

async function mailer(receiverEmail, code){
    // console.log("func Called")
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: false,
        requireTLS: true,
        auth: {
          // TODO: replace `user` and `pass` values from <https://forwardemail.net>
          user: process.env.NodeMailer_email,
          pass: env.NodeMailer_password,
        },
    });

    let info = await transporter.sendMail({
        from: "geekChatApp",
        to: `${receiverEmail}`,
        subject: 'Email Verification',
        text: `Your verification code is ${code}`,
        html: `<b>Your verification code is ${code}</b>`,
    });
    
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

router.post('/verify', (req, res) => {
    console.log(req.body)

    const {email} = req.body;
    if(!email){
        return res.status(422).json({message: "please add all the fields"});
    } else {
        User.findOne({email: email}).then(async (savedUser) => {
            if(savedUser){
                return res.status(422).json({error : 'Invalid Credentials'})
            }
            try {
                let verificationCode = Math.floor(100000 + Math.random()* 900000)
                // await mailer(email, verificationCode)
                return res.status(200).json({message: 'Email sent', email, verificationCode});
            }
            catch(err){
                return res.status(422).json({ error: "Error sending email", err});
            }
        })
    }
})

router.post('/changeusername', (req, res) => {
    const {username, email}  = req.body;

    User.find({username}).then(async(savedUser)=>{
        if(savedUser) {
            if(savedUser.length > 0){
                return res.status(422).json({error : 'username already exists'});
            }
            else {
                return res.status(200).json({message : 'username available', username, email});
            }
        }
    })
});

router.post('/signup', async( req, res) => {
    const {username, password, email} = req.body;
    if(!username || !password || !email){
        return res.status(422).json({ error: 'Please add all the fields'});
    } else {
        const user = new User({
            username,
            email,
            password
        })
        try {
            await user.save();
            const token = jwt.sign({_id : user._id}, process.env.JWT_SECRET);
            return res.status(200).json({ message : "User Registered Succesfully", token})
        } 
        catch(error) {
            return res.status(422).json({ error: "user not registered", error})
        }
    }
})

// forgot password
router.post('/verifyForgotPassword', (req, res) => {
    console.log(req.body)

    const {email} = req.body;
    if(!email){
        return res.status(422).json({message: "please add all the fields"});
    } else {
        User.findOne({email: email}).then(async (savedUser) => {
            if(savedUser){
                try {
                    let verificationCode = Math.floor(100000 + Math.random()* 900000)
                    return res.send({message: 'Verification code has been sent to your Email', email, verificationCode});
                }
                catch(err){
                    return res.status(422).json({ error: "Error sending email", err});
                }
            }
            else {
                return res.status(422).json({error : 'Invalid Credentials'})
            }
        })
    }
})

// resetPassword
router.post('/resetPassword', (req, res) => {
    console.log(req.body);
    const {email, password} = req.body;
    if(!email || !password){
        return res.status(422).json({ error : "Please add all the fields"});
    }
    else{
        User.findOne({email: email}).then(async(savedUser) => {
            if(savedUser){
                savedUser.password = password
                await savedUser.save()
                .then(user => {
                    res.send({ message: "Password changed succesfully"});
                })
                .catch((err) => {
                    console.log(err)
                })
            } else {
                return res.status(422).json({error : "Invalid Credentials"})
            }
        })
    }
})

router.post('/signin', (req, res) => {
    const {email, password} = req.body;
    if(!email || !password){
        return res.status(422).json({error : "Please add all the fields"})
    } else {
        User.findOne({ email: email}).then(async(savedUser) => {
            if(!savedUser){
                return res.status(422).json({error : "Invalid Credentials"});
            }else {
                // if(password == )
                console.log(savedUser)
                bcrypt.compare(password, savedUser.password).then(doMatch => {
                    if(doMatch){
                      const token = jwt.sign({ _id: savedUser._id}, process.env.JWT_SECRET);
                      const {_id, username, email} = savedUser
                      
                      res.json({message: "Succesfully Sign In", token, user:{_id, username, email} })
                    } else {
                        return res.status(422).json({error : "Invalid Credentials"});
                    }
                })
                    // res.status(200).json({ message: "User Looged in succesfully", savedUser })
            }
        }).catch(err => {
            console.log(err)
        })
    }
})

// added route userdata
router.post('/userdata', (req, res) => {
    const {email} = req.body;
    User.findOne({email: email}).then(async(savedUser) => {
        if(!savedUser){
            return res.status(422).json({error : "Invalid Credentials"})
        } else {
          console.log(savedUser);
          return res.status(200).json({message : "User Found", user : savedUser})  
        }
    })
})

module.exports = router;