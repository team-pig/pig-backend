const mongoose = require('mongoose')
const memberStatusSchema = new mongoose.Schema(
  {
    roomId: String,
    userId: String,
    nickname: String,
    desc: { type: String, default: null },
    tags: [String],
    checked: Number,
    notChecked: Number,
    color: String,
    avatar: String,
  },
  {
    versionKey: false,
  }
)



module.exports = mongoose.model('MemberStatus', memberStatusSchema)