const mongoose = require('mongoose')
// const Timeline = require('./timeline')
const roomSchema = new mongoose.Schema(
  {
    roomId: { auto: true, type: 'objectId', index: true },
    roomName: String,
    roomImage: String,
    master: String,
    inviteCode: String,
    subtitle: String,
    tag: [String],
    members: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
)
module.exports = mongoose.model('Room', roomSchema)
