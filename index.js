const express = require('express');
const port = 3000;
const port1 = 3001;
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
app.use(cors());
require('./db');
require('./models/User')
require('./models/Message')

const authRoutes = require('./routes/authRoutes');
const uploadMediaRoutes = require('./routes/uploadMediaRoutes')
const messageRoutes = require('./routes/messageRoutes')
// requireToken skippes


// 
const {createServer} = require('http')
const {Server} = require('socket.io');
const httpServer = createServer();
const io = new Server(httpServer, {});
// 

app.use(bodyParser.json());
app.use(authRoutes);
app.use(uploadMediaRoutes);
app.use(messageRoutes);

app.get('/', (req, res)=>{
    return res.send('hello abhishek');
})

// ......18
io.on('connection', (socket) => {
    console.log("USER CONNECTED - ", socket.id);

    socket.on('disconnect', () => {
        console.log("USER DISCONNECT - ", socket.id)
    })

    socket.on("join_room", (data)=> {
        console.log("USER WITH ID - ", socket.id, "JOIN ROOM - ", data.roomId);
        socket.join(data);
    })

    socket.on("send_message", (data) => {
        console.log("MESSAGE RECEIVED - ", data);
        io.emit("receive_message", data);
    })
})

httpServer.listen(port1, ()=> {
    console.log("Socketio server is running on port1 " + port1)
})

app.listen(port, ()=>{
    console.log("server is running on port " + port)
})