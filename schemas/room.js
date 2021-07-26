import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema({
  roomName: String,
  roomImage: String,
  master: { type: Schema.Types.ObjectId, ref: 'User' },,
  inviteCode: String,
  subtitle: String,
  tag: [String],
  timeline: [timeline.schema],
  worksheet: [worksheet.schema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})
export default mongoose.model('Room', roomSchema)
