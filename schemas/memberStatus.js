const mongoose = require('mongoose')
const memberStatusSchema = new mongoose.Schema({
  roomId : String,
  memberId: String,
  nickname: String,
  desc: String,
  tags: [String],
  checked: Number,
  notChecked: Number
},
{
  versionKey: false,
}
)


module.exports = mongoose.model('MemberStatus', memberStatusSchema)