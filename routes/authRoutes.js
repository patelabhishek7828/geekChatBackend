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
    console.log("hhhh", req.body)
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

// added route otheruserdata
router.post('/otheruserdata', (req, res) => {
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

router.post('/userdata', (req, res) => {
    const {authorization} = req.headers;
    // authorization = "Bearer dfdfhkfhdfkjh"    
    if(!authorization) {
        return res.status(401).json({error : 'You must be logged in, token not given'});
    } 
    const token = authorization.replace("Bearer ", "");
    console.log(token);

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if(err){
            return res.status(401).json({error: "You must be logged in, token invalid"});
        } else {
            const {_id} = payload;
            User.findById(_id).then(userDataa => {
                res.status(200).send({message: 'User Found', user: userDataa})
            })
        }
    })
})


// change Password
router.post('/changePassword', (req, res) => {
    const {oldPassword, newPassword, email} = req.body;

    if(!oldPassword || !newPassword || !email ){
        return res.status(422).json({error : "Please add all the fields"})
    } else {
        User.findOne({email: email}).then(async(savedUser) => {
            if(savedUser){
                bcrypt.compare(oldPassword, savedUser.password).then((doMatch)=> {
                    if(doMatch){
                        savedUser.password = newPassword
                        savedUser.save().then(user => {
                            res.json({message : "Password changed succesfully"})
                        }).catch(err => {
                            console.log(err)
                            return res.status(422).json({error: "Server Error"})
                        })
                    } else {
                        return res.status(422).json({error: "Invalid Credentials"});
                    }
                })
            } else {
                return res.status(422).json({error: "Invalid Credentials"});
            }
        })
    }
})

// Update User Data
router.post('/setusername', (req, res) => {
    const { username, email } = req.body;
    
    if(!username || !email){
        return res.status(422).json({error : "Please add all the fields"})
    }
    User.find({username}).then(async(savedUser) => {
        if(savedUser.length > 0){
            return res.status(422).json({error: 'Username already exists'})
        }else {
            User.findOne({email : email}).then(async(savedUser) => {
                if(savedUser){
                    savedUser.username = username;
                    savedUser.save().then(user => {
                        res.json({message: 'Username Updated Successfully'});
                    }).catch(err => {
                        return res.status(422).json({error: "Server Error"});
                    })
                }else{
                    return res.status(422).json({error: "Invalid Credentials"});
                }
            }).catch(err => {
                return res.status(422).json({error: "Server Error"});
            })
        }
    })
})

// description
router.post('/setdescription', (req, res) => {
    const {email, description} = req.body;
    if(!email || !description){
        return res.status(422).json({error : "Please Add all the fields"});
    }
    User.findOne({email: email}).then(async(savedUser) =>{
        if(savedUser){
            savedUser.description = description
            savedUser.save().then(user => {
                res.json({message: "Description Updated Succesfully"});
            }).catch(err => {
                return res.status(422).json({error : 'Server Error'});
            })
        }else {
            return res.status(422).json({error: "Invalid Credentials"});
        }
    }).catch(error => {
        return res.status(422).json({error : 'Server Error'});
    })
})

// get search user by keyword
router.post('/searchuser', (req, res) => {
    const { keyword } = req.body;
    if(!keyword) {
        return res.status(422).json({error: 'Please search a username'})
    }
    console.log(req.body)
    User.find({ username: { $regex: keyword, $options: 'i' } })
    .then(user => {
        console.log(user)
        let data = [];
        data = user.map(item => ( 
            {
                _id: item.id,
                username: item.username,
                email: item.email,
                description: item.description,
                profilepic: item.profilepic
            }
        ));
            if(data.length == 0){
               return res.status(422).json({error: 'No User found'})
            }
            res.status(200).send({ message: 'User Found', users: data })
    }).catch(err => {
        res.status(422).json({error: "Server Error"})
    })
})

// otherdata
router.post('/differentuserdata', (req, res) => {
    const {email} = req.body;

    User.findOne({email: email}).then(savedUser => {
        if(!savedUser){
            return res.status(422).json({error: "Invalid Credentials"})
        }else {
            let data = {
                _id : savedUser._id,
                username : savedUser.username,
                email : savedUser.email,
                description : savedUser.description,
                profilepic : savedUser.profilepic,
                followers : savedUser.followers,
                following : savedUser.following,
                posts : savedUser.posts,
            }
            // console.log(data)
            res.status(200).send({
                message: 'User Found', 
                user: data
            })
        }
    }).catch(err => {
        return res.status(422).json({error: "Server Error"})
    })
})

// check follow user
router.post('/checkFollow' , (req, res) => {
    const {followfrom, followto} = req.body;
    console.log(followfrom, followto) // (myEmail, searchUserEnail)
    if(!followfrom || !followto){
        return res.status(422).json({error: "Invalid Credentials"})
    } else {
        User.findOne({email: followfrom}).then(mainUser => {
            if(!mainUser){
                return res.status(200).json({error: "Invalid Credentials"});
            } else {
                let data = mainUser.following.includes(followto)
                console.log(data)
                if(data == true){
                    res.status(200).send({
                        message: "User in following list"
                    })
                }else {
                    res.status(200).send({
                        message: "User not in following list"
                    })
                }
            }
        }).catch(err => {
            res.status(422).json({error: "Server Error"})
        })
    }
})

// follow user
router.post('/followUser', (req, res) => {
    // followfrom: self,
    // followto: other,
    const {followfrom, followto} = req.body
    console.log(followfrom, followto)

    // our profile -> add friend email in our following section
    // friend profile -> add our email in friend followers section
    if(!followfrom || !followto){
        return res.status(422).json({ error: "Invalid Credentials" });
    }
    User.findOne({email: followfrom}).then(mainUser =>{
        if(!mainUser){
            return res.status(422).json({ error: "Invalid Credentials" });
        }else {
            if(mainUser.following.includes(followto)){
                return res.status(422).json({ error: "Already Following" });
            }else {
                mainUser.following.push(followto);
                mainUser.save();
            }

            User.findOne({email: followto}).then(otherUser =>{
                if(!otherUser){
                    return res.status(422).json({ error: "Invalid Credentials" });
                }else {
                    if(otherUser.followers.includes(followfrom)){
                        return res.status(422).json({ error: "Already Following" });
                    }else {
                        otherUser.followers.push(followfrom);
                        otherUser.save();
                    }

                    res.status(200).send({
                        message: "User Followed"
                    })
                }
            })
        }
    }).catch(err =>{
        return res.status(422).json({ error: "Server"})
    })
})

// unfollow user
router.post('/unfollowUser', (req, res) => {
    // followfrom: self,
    // followto: other,
    const {followfrom, followto} = req.body
    console.log(followfrom, followto)

    // our profile -> remove friend email in our following section
    // friend profile -> remove our email in friend followers section
    if(!followfrom || !followto){
        return res.status(422).json({ error: "Invalid Credentials" });
    }
    User.findOne({email: followfrom}).then(mainUser =>{
        if(!mainUser){
            return res.status(422).json({ error: "Invalid Credentials" });
        }else {
            if(mainUser.following.includes(followto)){
                mainUser.following.pop(followto);
                mainUser.save();
            }

            User.findOne({email: followto}).then(otherUser =>{
                if(!otherUser){
                    return res.status(422).json({ error: "Invalid Credentials" });
                }else {
                    if(otherUser.followers.includes(followfrom)){
                        otherUser.followers.pop(followfrom);
                        otherUser.save();
                    }

                    res.status(200).send({
                        message: "User unFollowed"
                    })
                }
            })
        }
    }).catch(err =>{
        return res.status(422).json({ error: "Server Error"})
    })
})

module.exports = router;