const mongoose = require('mongoose')
// const Timeline = require('./timeline')
const Document = require('./document')
const { Schema } = mongoose
const roomSchema = new mongoose.Schema(
  {
    // roomId: { auto: true, type: 'ObjectId',},
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
    // _id: false,
    versionKey: false,
  }
)
roomSchema.virtual('roomId').get(function(){
  return this._id;
});
module.exports = mongoose.model('Room', roomSchema)
