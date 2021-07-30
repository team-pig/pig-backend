const mongoose = require('mongoose')
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
// console.log(roomSchema.path('roomId'))
// roomSchema.virtual('roomId').get(function(){
//   return this._id;
// });
module.exports = mongoose.model('Room', roomSchema)
