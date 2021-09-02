
const mongoose = require('mongoose')
const MemberStatus = require('./memberStatus')
const Bookmark = require('./bookmark')
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
    bookmarkedMembers: [Bookmark.schema],
    memberStatus: [MemberStatus.schema]

  },
  {
    versionKey: false,
  }
)

module.exports = mongoose.model('Room', roomSchema)
