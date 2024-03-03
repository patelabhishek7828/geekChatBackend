const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const messageSchema = new mongoose.Schema({
    senderid: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    roomid: {
        type: String,
        required: true,
    },
    receiverid: {
        type: String,
        default: '',
    }
},
{
    timestamps: true
}
)

mongoose.model("Message", messageSchema);