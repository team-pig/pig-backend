const mongoose = require('mongoose')
const roomSchema = new mongoose.Schema(
  {
    roomId : String,
    likedMember : String,
    likedAt:{
      type: Date,
      default: ''
    },
  },
  {
    versionKey: false,
  }
)

module.exports = mongoose.model('Room', roomSchema)
