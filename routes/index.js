var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require('express-session');
const upload = require('./multer');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const genAI = new GoogleGenerativeAI("AIzaSyBOEmQGx6SoiesU8wHfh7D80tgMiVLHjYw");

passport.use(new LocalStrategy(userModel.authenticate()));

router.get("/", function (req, res, next) {
  res.redirect("/signup");
});

router.get("/signup", function (req, res, next) {
  res.render("signup");
});
router.get("/login", function (req, res, next) {

  res.render("login", { message: req.flash("error") });


});
router.get("/feed", async function (req, res, next) {
  const user = await userModel.findOne({ _id: req.session.passport.user });

  let query = {};
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = { imageText: searchRegex };
  }

  const posts = await postModel.find(query).populate('user');

  const noResults = posts.length === 0 && req.query.search;

  res.render('feed', { user, posts, noResults });
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

router.post("/upload", isLoggedIn, upload.single("file"), async function (req, res, next) {
  if (!req.file) {
    return res.status(404).send("no file");
  }
  console.log("req.file");
  console.log(req.file);
  const user = await userModel.findOne({ _id: req.session.passport.user });
  let Tags = "";
  try {
    Tags = await run();
  } catch (error) {
    console.error("Error generating tags:", error);
    // Continue without tags if AI fails
  }

  const postdata = await postModel.create({

    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user,
    tags: Tags

  })

  user.posts.push(postdata._id);
  await user.save();
  console.log(user);
  async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "five Tags for this image",
      {
        inlineData: {
          data: Buffer.from(fs.readFileSync(req.file.path)).toString("base64"),
          mimeType: 'image/png'
        }
      }]
    );
    return result.response.text();
  }
  res.redirect("/profile");
})

router.post("/upload-profile-pic", isLoggedIn, upload.single("image"), async function (req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const user = await userModel.findOne({ _id: req.session.passport.user });
    user.dp = req.file.filename;
    await user.save();
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading profile picture");
  }
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ _id: req.session.passport.user })
    .populate("posts")

  console.log(user);
  res.render('profile', { user: user });

});



router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
router.post("/register", upload.single("avatar"), function (req, res, next) {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).send("No file uploaded or invalid file format.");
  }
  const data = new userModel({
    fullname: req.body.fullname,
    username: req.body.username,
    email: req.body.email,
    dp: req.file.filename
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
  }), function (req, res, next) {
  });

// Forgot Password Routes
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

// GET forgot password page
router.get("/forgot-password", function (req, res) {
  res.render("forgot-password", { message: "", error: "" });
});

// POST forgot password - send reset email
router.post("/forgot-password", async function (req, res) {
  try {
    const user = await userModel.findOne({ email: req.body.email });

    if (!user) {
      return res.render("forgot-password", {
        error: "No account with that email address exists.",
        message: ""
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, req);

    if (emailResult.success) {
      res.render("forgot-password", {
        message: "Password reset link has been sent to your email.",
        error: ""
      });
    } else {
      res.render("forgot-password", {
        error: "Error sending email. Please try again later.",
        message: ""
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.render("forgot-password", {
      error: "An error occurred. Please try again.",
      message: ""
    });
  }
});

// GET reset password page
router.get("/reset-password/:token", async function (req, res) {
  try {
    const user = await userModel.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render("forgot-password", {
        error: "Password reset token is invalid or has expired.",
        message: ""
      });
    }

    res.render("reset-password", { token: req.params.token, error: "" });
  } catch (error) {
    console.error('Reset password GET error:', error);
    res.redirect("/forgot-password");
  }
});

// POST reset password - update password
router.post("/reset-password/:token", async function (req, res) {
  try {
    const user = await userModel.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render("forgot-password", {
        error: "Password reset token is invalid or has expired.",
        message: ""
      });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.render("reset-password", {
        token: req.params.token,
        error: "Passwords do not match."
      });
    }

    // Update password using passport-local-mongoose method
    await user.setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.redirect("/login");
  } catch (error) {
    console.error('Reset password POST error:', error);
    res.render("reset-password", {
      token: req.params.token,
      error: "An error occurred. Please try again."
    });
  }
});


function isLoggedIn(req, res, next) {
  console.log('isLoggedIn:' + req.isAuthenticated());
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}


module.exports = router;
