const express = require("express");
const Room = require("../schemas/room.js")

const router = express.Router()

router.get('/rooms',  async (req, res) => {
  const room = await Room.find().sort({ createdAt: 'desc' })
  res.status(200).json({ room })
})

router.get('/room/:roomId/main',  async (req, res) => {})

router.get('/room/:roomId/page',  async (req, res) => {})

router.get('/room/:roomId/board',  async (req, res) => {})

router.get('/room/:roomId/timeline',  async (req, res) => {})

router.post('/room',  async (req, res) => {
  console.log('in')
  // const userId = res.locals.user._id
  const userId = 'asldkja123123'
  const { roomName, roomImage, subtitle, tag, inviteCode } = req.body

  // if (!inviteCode) {
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
    res.json({ result: '성공' })

  // }
//   if (inviteCode) {
//     find = await Room.findOne({ inviteCode: inviteCode })
//     await find.update({
//       $push: { ratings: { user: res.locals.user._id } },
//     })
//     return
//   }
})

router.put('/room',  async (req, res) => {
  const { roomId, roomName, roomImage, subtitle, tag } = req.body
  await Room.updateMany(
    { _id: roomId },
    { $set: { roomName, roomImage, subtitle, tag } }
  )
})

router.delete('/room',  async (req, res) => {
  // const userId = res.locals.user._id
  const { roomId } = req.body
  const findRoom = await Room.findById(roomId)

  await Room.findByIdAndRemove(roomId)
  res.send()

  // if (userId in findRoom) {
  //   await Room.findByIdAndRemove(roomId)
  // }
})

module.exports = router;