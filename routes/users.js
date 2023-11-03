const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect("mongodb://localhost/gmailappp");

const userSchema = mongoose.Schema({
  name: String,
  username: String,
  email:{
    type: String,
    unique: true,
  },
  password: String,
  profilePic: {
    type: String,
    default: "default-profile-pic.png"
  },
  sentMails:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "mails"
  }],
  recivedMails:[{
    type: mongoose.Schema.Types.ObjectId, 
    ref: "mails"
  }]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("users", userSchema);