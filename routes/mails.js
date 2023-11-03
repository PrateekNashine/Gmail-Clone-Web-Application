const mongoose = require('mongoose');

const mailSchema = mongoose.Schema({
    read:{
        type: Boolean,
        default: false
    },
    email: String,
    subject: String,
    mailText: String,
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }
})

module.exports = mongoose.model("mails", mailSchema);