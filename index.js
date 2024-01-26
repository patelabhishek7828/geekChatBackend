const express = require('express');
const port = 3000;
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
app.use(cors());
require('./db');
require('./models/User')

const authRoutes = require('./routes/authRoutes');
// requireToken skippes
app.use(bodyParser.json());
app.use(authRoutes);


app.get('/', (req, res)=>{
    return res.send('hello abhishek');
})

app.listen(port, ()=>{
    console.log("server is running on port " + port)
})