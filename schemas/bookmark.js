const mongoose = require('mongoose')
const bookmarkSchema = new mongoose.Schema(
  {
    roomId : String,
    userId : String,
    bookmarkedAt:{
      type: Date,
      default: Date.now
    },
  },
  {
    versionKey: false,
  }
)

module.exports = mongoose.model('Bookmark', bookmarkSchema)
