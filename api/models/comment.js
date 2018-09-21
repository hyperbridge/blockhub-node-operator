const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = Schema({
  objectId: { type: Schema.Types.ObjectId, required: true },
  author: { type: String, required: true },
  text: { type: String, required: true },
  rate: { type: Number, required: true },
  createdAt: Date,
  updatedAt: Date,
  replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
});

module.exports = mongoose.model('Comment', commentSchema);
