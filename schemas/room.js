const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
  roomName: String,
  roomImage: String,
  master: { type: Schema.Types.ObjectId, ref: 'User' },
  inviteCode: String,
  subtitle: String,
  tag: [String],
  members: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  timeline: [timeline.schema],
  worksheet: [worksheet.schema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})
module.exports = mongoose.model('Room', roomSchema);
