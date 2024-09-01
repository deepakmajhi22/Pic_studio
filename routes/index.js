var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session=require('express-session');
const upload = require('./multer');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const genAI = new GoogleGenerativeAI("AIzaSyBOEmQGx6SoiesU8wHfh7D80tgMiVLHjYw");

passport.use(new LocalStrategy(userModel.authenticate()));

router.get("/", function (req, res, next) {
  res.render("signup");
});
router.get("/login", function (req, res, next) {
  
  res.render("login", { message: req.flash("error") });


});
router.get("/feed",async function (req, res, next) {
  const user = await userModel
  .findOne({_id: req.session.passport.user})
  const posts = await postModel.find(); 
  res.render('feed', { user, posts});
  
});
router.post('/posts/:postId', async (req, res) => {
  try {
    await postModel.findByIdAndDelete(req.params.postId);
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.post("/upload",isLoggedIn, upload.single("file"),async function(req,res,next){
  if(!req.file){
    return res.status(404).send("no file");
  }
  console.log("req.file");
  console.log(req.file);
  const user= await userModel.findOne({_id:req.session.passport.user});
  const Tags = await run();
  const postdata = await postModel.create({
   
    image:req.file.filename ,
    imageText: req.body.filecaption,
    user: user,
    tags: Tags
    
  })

  user.posts.push(postdata._id);
  await user.save();
  console.log(user);
  async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    const result = await model.generateContent([
    "five Tags for this image",
    {inlineData: {data: Buffer.from(fs.readFileSync(req.file.path)).toString("base64"),
    mimeType: 'image/png'}}]
    );
    return result.response.text();
    }
  res.redirect("/profile");
})

router.get('/profile', isLoggedIn,async function(req, res, next) {
   const user = await userModel
  .findOne({_id: req.session.passport.user})
  .populate("posts")
  
 console.log(user);
 res.render('profile',{user: user});
 
});



router.get("/logout", function (req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
router.post("/register", upload.single("avatar"),function (req, res, next) {
  console.log(req.file);
  if (!req.file ) {
    return res.status(400).send("No file uploaded or invalid file format.");
  }
  const data = new userModel({
    fullname: req.body.fullname,
    username: req.body.username,
    email: req.body.email,
    dp:req.file.filename
  });
  console.log("hi bro");
  userModel.register(data, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post("/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true
  }),function(req, res, next) {
  });


function isLoggedIn(req, res, next) {
  console.log('isLoggedIn:' + req.isAuthenticated());
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}


module.exports = router;
