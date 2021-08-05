const mongoose = require('mongoose')
const bookmarkSchema = new mongoose.Schema(
  {
    roomId : String,
    member : String,
    bookmarkedAt:{
      type: Date,
      default: ''
    },
  },
  {
    versionKey: false,
  }
)

module.exports = mongoose.model('Bookmark', bookmarkSchema)
