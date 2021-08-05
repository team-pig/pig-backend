// Room._id -> Room.roomId로 findById -> findOne 변경 예정
const express = require('express')
const Room = require('../schemas/room.js')
const Bookmark = require('../schemas/bookmark.js')
const auth = require('../middlewares/auth-middleware.js')
const { v4 } = require('uuid')

const router = express.Router()
// pagination 방 불러오기 8월 2일(월) 기존 router.ger('/rooms')에서 현재로 변경 예정

router.get('/rooms', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const page = parseInt(req.query.page)
    const size = parseInt(req.query.size)
    const startIndex = (page - 1) * size
    const endIndex = page * size
    const room = {}
    const bookmarkedRoom = await Room.find({ bookmarkedMembers: userId })
    const totalPages = Math.ceil((await Room.find({ members: userId })).length / size)
    room.totalPages = totalPages
    if (endIndex < (await Room.countDocuments().exec())) {
      room.next = { page: page + 1, size: size }
    }
    if (startIndex > 0) {
      room.previous = { page: page - 1, size: size }
    }
    room.room = await Room.find({ members: userId }).sort({ createdAt: 'desc' })
    // 찾은 방에서 bookmark된 방 빼기
    for (let i = 0; i < bookmarkedRoom.length; i++) {
      var idx = room.room.findIndex(function (item) {
        return item.roomId == String(bookmarkedRoom[i].roomId)
      })
      if (idx > -1) {room.room.splice(idx, 1)}
    }
    // 찾은 방에서 mookmark된 방 넣기(정렬때문에)
    for (let i = 0; i < bookmarkedRoom.length; i++) {
      room.room.unshift(bookmarkedRoom[i])
    }
    //페이지네이션
    room.room = room.room.slice((page - 1) * size, page * size)
    res.send(room)
  } catch (e) {
    res.status(500).json({ message: '서버에러: 방 조회 실패' })
  }
})

router.get('/room/:roomId/main', async (req, res) => { })

router.get('/room/:roomId/page', async (req, res) => { })

router.get('/room/:roomId/board', async (req, res) => { })

router.get('/room/:roomId/timeline', async (req, res) => { })

// router.post('/room/:roomId/bookmark', auth, async (req, res) => {
//   const { userId } = res.locals.user
//   const roomId = req.params.roomId
//   const findRoom = await Room.findOne({ roomId : roomId})
//   const roomLikedAt = findRoom.bookmarkedMembers.includes(userId)
//   console.log(roomLikedAt)
//   if (roomLikedAt) {
//     await Room.updateOne({ roomId: roomId }, { $pull: { bookmarkedMembers: userId } })
//     await Bookmark.findOneAndRemove({roomId: roomId, member: userId})
//     return res.send('즐겨찾기 취소')
//   }
//   if (!roomLikedAt) {
//     await Room.findOneAndUpdate({roomId: roomId}, { $push: { bookmarkedMembers: userId } })
//     await Bookmark.create({ roomId, member: userId, bookmarkedAt: Date.now() })
//     return res.send('즐겨찾기 등록')
//   }
// })

router.post('/room/:roomId/bookmark', auth, async (req, res) => {
  const { userId } = res.locals.user
  const roomId = req.params.roomId
  try {
    const findRoom = await Room.findOne({ roomId: roomId })
    const roomLikedAt = findRoom.bookmarkedMembers.includes(userId)
    if (!roomId) {
      return res.status(400).send({ message: 'roomId에 해당하는 방을 찾을 수 없습니다.' })
    }
    if (roomLikedAt) {
      return res.status(400).send({ message: '이미 즐겨찾기 등록이 되어있습니다.' })
    }
    if (!roomLikedAt) {
      await Room.findOneAndUpdate({ roomId: roomId }, { $push: { bookmarkedMembers: userId } })
      await Bookmark.create({ roomId, member: userId, bookmarkedAt: Date.now() })
      return res.send('즐겨찾기 등록')
    }
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

router.delete('/room/:roomId/bookmark', auth, async (req, res) => {
  const { userId } = res.locals.user
  const roomId = req.params.roomId
  try {
    const findRoom = await Room.findOne({ roomId: roomId })
    const roomLikedAt = findRoom.bookmarkedMembers.includes(userId)
    if (!roomId) {
      return res.status(400).send({ message: 'roomId에 해당하는 방을 찾을 수 없습니다.' })
    }
    if (!roomLikedAt) {
      return res.status(400).send({ message: '이미 즐겨찾기에서 삭제되었습니다.' })
    }
    if (roomLikedAt) {
      await Room.updateOne({ roomId: roomId }, { $pull: { bookmarkedMembers: userId } })
      await Bookmark.findOneAndRemove({ roomId: roomId, member: userId })
      return res.send('즐겨찾기 삭제')
    }
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

router.post('/room', auth, async (req, res) => {
  const userId = res.locals.user._id
  const { roomName, roomImage, subtitle, tag } = req.body
  try {
    const room = await Room.create({
      roomName,
      roomImage,
      master: userId,
      members: userId,
      subtitle,
      tag: tag.split(', '),
      inviteCode: v4(),
    })
    res.json({ room })
  } catch (error) {
    console.log('방 만들기 실패', error)
    res.status(400).send({
      ok: false,
      message: '서버에러: 방 만들기 실패'
    })
  }
})

router.post('/room/member', auth, async (req, res) => {
  const userId = res.locals.user._id
  const { inviteCode } = req.body
  const findRoom = await Room.findOne({ inviteCode })
  if (!findRoom) {
    console.log('찾으려는 방이 없습니다.')
    return res
      .status(400)
      .send({ message: '초대코드가 잘못됐거나 방을 찾을 수 없어요' })
  }
  try {
    const memberInRoom = await findRoom.members.includes(userId)
    const findInviteCode = await Room.findOne({ inviteCode })
    if (memberInRoom) {
      res.json({ errorMessage: '이미 추가 된 방입니다.' })
      return
    }
    if (!findInviteCode) {
      res.status(400).send({
        ok: false,
        message: '서버에러: 존재하지 않는 초대코드입니다.'
      })
    }
    if (inviteCode && !findRoom.members.includes(userId)) {
      await Room.updateOne({ inviteCode }, { $push: { members: userId } })
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

router.put('/room', auth, async (req, res) => {
  // 입력하지 않은 roomName, roomImage, subtitle, tag는 기존 입력한 대로 가만히 둔다.
  try {
    const { roomId, roomName, roomImage, subtitle, tag } = req.body
    const { userId } = res.locals.user
    const findRoom = await Room.findOne({roomId: roomId})
    console.log(tag.split(', '))
    if (findRoom.master != userId) {
      return res.send({ ok: false, message: '방 수정 권한이 없습니다.' })
    }
    if (roomId && findRoom.master == userId) {
      await Room.updateOne({ roomId: roomId }, { $set: { roomName, roomImage, subtitle, tag: tag.split(', ') } })
      return res.json({ ok: true, message: '방 수정 성공' })
    }
    res.send("test")
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

router.delete('/room', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const { roomId } = req.body
    const findRoom = await Room.findOne({roomId:roomId})
    if (findRoom.master == userId) {
      await Room.findOneAndRemove({roomId:roomId})
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
    const userId = res.locals.user._id
    const findRoom = await Room.findOne({roomId:roomId})
    const members = findRoom.members

    if (members.length === 1) {
      return res.json({
        message:
          '방에 혼자 있어서 나갈 수 없어요. 정말 나가려면 방 삭제버튼을 눌러주세요.',
      })
    }
    await Room.findOneAndUpdate({roomId: roomId}, { $pull: { members: userId } })
    res.json({
      ok: true,
      message: '방 나가기 성공',
    })
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

module.exports = router