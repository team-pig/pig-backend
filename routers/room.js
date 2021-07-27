const express = require("express");
const Room = require("../schemas/room.js")

const router = express.Router()

router.get('/rooms', auth, async (req, res) => {
  const room = await Room.find().sort({ createdAt: 'desc' })
  res.status(200).json({ room })
})

router.get('/room/:roomId/main', auth, async (req, res) => {})

router.get('/room/:roomId/page', auth, async (req, res) => {})

router.get('/room/:roomId/board', auth, async (req, res) => {})

router.get('/room/:roomId/timeline', auth, async (req, res) => {})

router.post('/room', auth, async (req, res) => {
  const userId = res.locals.user._id
  const { roomName, roomImage, subtitle, tag, inviteCode } = req.body

  if (!inviteCode) {
    let room = new Room()
    room.roomName = roomName
    room.roomImage = roomImage
    room.master = userId
    room.subtitle = subtitle
    room.tag = tag
    room.save(function (err) {
      if (err) {
        console.error(err)
        res.json({ result: '에러 발생' })
        return
      }
      return
    })
  }
//   if (inviteCode) {
//     find = await Room.findOne({ inviteCode: inviteCode })
//     await find.update({
//       $push: { ratings: { user: res.locals.user._id } },
//     })
//     return
//   }
})

router.put('/room', auth, async (req, res) => {
  const { roomId, roomName, roomImage, subtitle, tag } = req.body
  await Room.updateMany(
    { _id: roomId },
    { $set: { roomName, roomImage, subtitle, tag } }
  )
})

router.delete('/room', auth, async (req, res) => {
  const userId = res.locals.user._id
  const { roomId } = req.body
  const findRoom = await Room.findById(roomId)

  if (userId in findRoom) {
    await Room.findByIdAndRemove(roomId)
  }
})

module.exports = router;