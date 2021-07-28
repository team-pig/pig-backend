const express = require('express')
const Room = require('../schemas/room.js')
const auth = require('../middlewares/auth-middleware.js')
const { v4 } = require('uuid')

const router = express.Router()

router.get('/rooms', auth, async (req, res) => {
  const member = res.locals.user.id
  const room = await Room.find({ members: member }).sort({ createdAt: 'desc' })
  res.status(200).json({ room })
})

router.get('/room/:roomId/main', async (req, res) => {})

router.get('/room/:roomId/page', async (req, res) => {})

router.get('/room/:roomId/board', async (req, res) => {})

router.get('/room/:roomId/timeline', async (req, res) => {})

router.post('/room', auth, async (req, res) => {
  const userId = res.locals.user.id
  const { roomName, roomImage, subtitle, tag, inviteCode} = req.body
  // 방 만들기
  if (!inviteCode) {
  const room = new Room()
  room.roomName = roomName
  room.roomImage = roomImage
  room.master = userId
  room.subtitle = subtitle
  room.tag = tag
  room.inviteCode = v4()
  room.save(function (err) {
    if (err) {
      console.error(err)
      res.json({ result: '에러 발생' })
      return
    }
    return
  })
  res.json({ room })
  }
  // 다른 사람 방 추가하기(초대코드입력)
    if (inviteCode) {
      const room = await Room.findOneAndUpdate({inviteCode: inviteCode}, { members : userId});
      return res.json({ room })
    }  

})

router.put('/room', auth, async (req, res) => {
  const { roomId, roomName, roomImage, subtitle, tag } = req.body
  const findRoom = await Room.findById(roomId)

  // 입력하지 않은 roomName, roomImage, subtitle, tag는 기존 입력한 대로 가만히 둔다.
  try {
    if (roomId && findRoom.master == userId) {
      await Room.updateOne(
        { _id: roomId },
        { $set: { roomName, roomImage, subtitle, tag } }
      )
      return res.json({
        'ok': true,
        message: '방 수정 성공'
        })
  }
    
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

router.delete('/room', auth, async (req, res) => {
  const userId = res.locals.user._id
  const { roomId } = req.body
  const findRoom = await Room.findById(roomId)

  try {
  if (findRoom.master == userId) {
    await Room.findByIdAndRemove(roomId)
    return res.json({
      'ok': true,
      message: '방 삭제 성공'
      })
  }
  res.json({errorMessage: "방장이 아니거나, 방Id를 찾을 수 없습니다."})
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }

  //   await Room.findByIdAndRemove(roomId)
  //   return res.send()
})

module.exports = router
