const express = require('express')
const Room = require('../schemas/room.js')
const auth = require('../middlewares/auth-middleware.js')
const { v4 } = require('uuid')
const { updateMany } = require('../schemas/room.js')

const router = express.Router()

router.get('/rooms', auth, async (req, res) => {
  try {
    const member = res.locals.user.id
    const room = await Room.find({ members: member }).sort({
      createdAt: 'desc',
    })
    res.status(200).json({ room })
  } catch (error) {
    console.log('display rooms ERROR', error)
    res.status(400).send({ ok: false, message: '서버에러: 방 조회 실패' })
  }
})

router.get('/room/:roomId/main', async (req, res) => {})

router.get('/room/:roomId/page', async (req, res) => {})

router.get('/room/:roomId/board', async (req, res) => {})

router.get('/room/:roomId/timeline', async (req, res) => {})

router.post('/room', auth, async (req, res) => {
  const userId = res.locals.user.id
  const { roomName, roomImage, subtitle, tag } = req.body
  try {
    const room = await Room.create({
      roomName, 
      roomImage, 
      master: userId, 
      members: userId,
      subtitle,
      tag,
      inviteCode: v4(),
    })
  } catch (error) {
    console.log('방 만들기 실패', error)
    res.status(400).send({ 
      ok: false, 
      message: '서버에러: 방 만들기 실패'
    })
  }
})

router.post('/room/member',auth, async (req, res) => {
  const userId = res.locals.user.id
  const { inviteCode } = req.body
  const findRoom = await Room.findOne({ inviteCode })
  if (!findRoom) {
    console.log('찾으려는 방이 없습니다.')
    return res.status(400).send({ message: '초대코드가 잘못됐거나 방을 찾을 수 없어요'})
  }
  try {
    const memberInRoom = findRoom.members.includes(userId)
    const findInviteCode = await Room.findOne({ inviteCode })
    if (memberInRoom) {
      res.json({ errorMessage: '이미 추가 된 방입니다.'})
      return
    }
    if (!findInviteCode) {
      res.status(400).send({ 
        ok: false, 
        message: '서버에러: 존재하지 않는 초대코드입니다.'
      })
    }
    if (inviteCode && !findRoom.members.includes(userId)) {
      await Room.updateOne({ inviteCode }, { $push: { members: userId }})
      const room = await Room.findOne({ inviteCode })
      return res.json({ room })
    } 
    } catch (error) {
      console.log('방 추가 실패', error)
      res.status(400).send({ 
        ok: false,
        message: '서버에러: 다른 사람 방 추가 실패'
      })
    }
  })

router.put('/exitroom', auth, async (req, res) => {})

router.put('/room', auth, async (req, res) => {
  // 입력하지 않은 roomName, roomImage, subtitle, tag는 기존 입력한 대로 가만히 둔다.
  try {
    const { roomId, roomName, roomImage, subtitle, tag } = req.body
    const { userId } = res.locals.user
    const findRoom = await Room.findById(roomId)
    console.log(findRoom.master)
    if (findRoom.master != userId) {
      return res.send({ ok: false, message: '방 수정 권한이 없습니다.' })
    }
    if (roomId && findRoom.master == userId) {
      await Room.updateOne(
        { _id: roomId },
        { $set: { roomName, roomImage, subtitle, tag } }
      )
      return res.json({ ok: true, message: '방 수정 성공' })
    }
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

router.delete('/room', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const { roomId } = req.body
    const findRoom = await Room.findById(roomId)
    if (findRoom.master == userId) {
      await Room.findByIdAndRemove(roomId)
      return res.json({
        ok: true,
        message: '방 삭제 성공',
      })
    }
    if (findRoom.master != userId) {
      return res.json({
        ok: false,
        message: '방장이 아닙니다.',
      })
    }
    res.status(400).json({ errorMessage: '방Id를 찾을 수 없습니다.' })
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

router.delete('/room/member/:roomId', auth, async (req, res) => {
  try {
    const roomId = req.params.roomId
    const userId = res.locals.user.id
    const findRoom = await Room.findById(roomId)
    const members = findRoom.members
    if (members.length === 1 ) {
      return res.json({
        message: '방에 혼자 있어서 나갈 수 없어요. 정말나가려면 방 삭제버튼을 눌러주세요.'
      })
    }
    await Room.findByIdAndUpdate(roomId, { $pull: { members: userId }})
    res.json({
      ok: true,
      message: '방 나가기 성공',
    })
  } catch (error) {
    console.error(error)
    res.status(400).json(error)
  }
})

module.exports = router