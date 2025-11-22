const mongoose = require('mongoose');

// Define the schema for a post
const postSchema = new mongoose.Schema({
  imageText: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tags: {
    type: String,
    default: "No response"
  }

});

// Create a model for the post schema
const Post = mongoose.model('post', postSchema);

module.exports = Post;
