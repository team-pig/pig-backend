
const mongoose = require('mongoose')
const MemberStatus = require('./memberStatus')
const roomSchema = new mongoose.Schema(
  {
    roomId: { auto: true, type: 'objectId', index: true },
    roomName: String,
    roomImage: String,
    master: String,
    inviteCode: String,
    subtitle: String,
    tag: [String],
    desc: String,
    members: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    endDate: String,
    // likedAt:{
    //   type: Date,
    //   default: ''
    // }
    bookmarkedMembers: [String],
    memberStatus: [MemberStatus.schema]
    // memberStatus: [{}]

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
