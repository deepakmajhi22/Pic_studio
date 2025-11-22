const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
var express = require("express");

var router = express.Router();
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Pinterest1");
const userschema = mongoose.Schema({
  username: {
    type: String,
    // required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,

    unique: true,
  },
  fullname: {
    type: String,
    // required: true,
  },
  dp: {
    type: String,
    required: true,
    default: "ee7f4260-ce39-438d-b622-4eedbfac1609.jpg"
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post"
  }
  ]

});
userschema.plugin(plm);
module.exports = mongoose.model("user", userschema);
