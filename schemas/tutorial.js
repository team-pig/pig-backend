const mongoose = require('mongoose')
const tutorialSchema = new mongoose.Schema(
  {
    userId: String,
    roomlist: {
      type: Boolean,
      default: true,
    },
    main: {
      type: Boolean,
      default: true,
    },
    document: {
      type: Boolean,
      default: true,
    },
    bord: {
      type: Boolean,
      default: true,
    },
    calender: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
  }
)
module.exports = mongoose.model('Tutorial', tutorialSchema)