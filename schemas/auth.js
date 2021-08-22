const mongoose = require('mongoose')
const authSchema = new mongoose.Schema(
{
  token: String,
  userId: String,
  createdAt: {
    type:Number,
    default: Date.now()
  }
}
  ,
  {
    versionKey: false,
  }
)


module.exports = mongoose.model("Auth", authSchema);