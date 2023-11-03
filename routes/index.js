const express = require('express');
const passport = require('passport');
const router = express.Router();
const localStrategy = require("passport-local");
const multer = require("multer");

const userInfo = require("./users");
const mailInfo = require("./mails");

passport.use(new localStrategy(userInfo.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const fn = Date.now()+Math.floor(Math.random()* 1000)+file.originalname;
    cb(null, fn);
  }
});

function fileFilter (req, file, cb) {
  if(file.mimetype !== "profile-pic/png" || file.mimetype !== "profile-pic/jpg" || file.mimetype !== "profile-pic/gif"){
    cb(null, false, new Error('Wrong File type Selected'));
  }
  else{
    cb(null, true);
  }
}

const upload = multer({ storage: storage })

router.get('/', function(req, res, next) {
  res.render("index");
});

router.post("/register", alreadyLoggedIn,function(req,res){
  const userData = new userInfo({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
  })
  userInfo.register(userData, req.body.password)
    .then(function(registeredUser){
      passport.authenticate('local')(req,res,function(){
        res.redirect("/profile");
      })
    })
    .catch(function(err){
      res.send(err);
    })
});

router.get("/register",function(req,res){
  res.render("registerUser");
});

router.post("/login", alreadyLoggedIn,passport.authenticate('local',{
  successRedirect: "/profile",
  failureRedirect: "/login"
}) ,function(req,res){});

router.get("/login",alreadyLoggedIn,function(req,res){
  res.render("loginUser");
});

router.post("/composeMail", isLoggedIn,async function(req,res){
  const loggedInUser = await userInfo.findOne({username: req.session.passport.user});

  const mailCreated = await mailInfo.create({
    email: req.body.email,
    subject: req.body.subject,
    mailText: req.body.mailText,
    userid: loggedInUser._id
  })

  loggedInUser.sentMails.push(mailCreated._id);
  const loggedInUserUpdated = await loggedInUser.save();

  const reciverUser = await userInfo.findOne({email: req.body.email});
  
  reciverUser.recivedMails.push(mailCreated._id);
  const reciverUserUpdated = await reciverUser.save();

  res.redirect("/profile")
})

router.get("/logout", isLoggedIn, function(req,res){
  req.logOut(function(err){
    if (err) throw err;
    res.redirect("/login");
  });
});

router.get("/profile", isLoggedIn, async function(req,res){
  const loggedInUser = await userInfo.findOne({username: req.session.passport.user})
  .populate({
    path: 'recivedMails',
    populate: {
      path: 'userid'
    }
  })
  
  res.render("profile", {user: loggedInUser});
});

router.get("/sentMails", isLoggedIn, async function(req,res){
  const loggedInUser = await userInfo.findOne({username: req.session.passport.user})
  .populate('sentMails')
  res.render("sentMails",{user: loggedInUser})
});

router.get("/read/mail/:id", isLoggedIn, async function(req,res){
  const foundMail = await mailInfo.findOne({_id: req.params.id})
  .populate("userid")

  foundMail.read = true;
  await foundMail.save();
  res.render("mails", {mail: foundMail});
});

router.post("/profilePic", fileFilter,upload.single('profile-pic'), async function (req, res, next) {
  const loggedInUser = await userInfo.findOne({username : req.session.passport.user})
  
  loggedInUser.profilePic = req.file.filename;
  const profilePicUpdated = await loggedInUser.save();

});

router.get("/check-username/:username",function(req,res){
  userInfo.findOne({username : req.params.username})
  .then(function(user){
    res.json(user);
  })
});

router.get("/check-email/:email",function(req,res){
  userInfo.findOne({email : req.params.email})
  .then(function(email){
    res.json(email);
  })
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect("/login");
  }
}

function alreadyLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    res.redirect("/profile");
  }
  return next();
}

module.exports = router;
