const mongoose = require('mongoose')
const Timeline = require('./timeline')
const Document = require('./worksheet')
const { Schema } = mongoose;

const roomSchema = new mongoose.Schema({
  roomName: String,
  roomImage: String,
  // master: { type: Schema.Types.ObjectId, ref: 'User' },
  master: String,
  inviteCode: String,
  subtitle: String,
  tag: [String],
  members: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  timeline: [Timeline.schema],
  document: [Document.schema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})
module.exports = mongoose.model('Room', roomSchema);
