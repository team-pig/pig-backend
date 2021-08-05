// Room._id -> Room.roomId로 findById -> findOne 변경 예정
const express = require('express')
const Room = require('../schemas/room.js')
const Bookmark = require('../schemas/bookmark.js')
const auth = require('../middlewares/auth-middleware.js')
const { v4 } = require('uuid')

const router = express.Router()
// pagination 방 불러오기 8월 2일(월) 기존 router.ger('/rooms')에서 현재로 변경 예정
router.get('/test', auth, async (req, res) => {
  const userId = res.locals.user._id
  const page = parseInt(req.query.page)
  const size = parseInt(req.query.size)
  const member = res.locals.user._id
  const startIndex = (page - 1) * size
  const endIndex = page * size
  const totalPages = Math.ceil((await Room.find({ members: member })).length/size)
  const c = await Room.find({ members: member })
  const d = await Room.find({ bookmarkedMembers : userId})
  console.log(d)
  const b = []
  // const idx = await c.findIndex(function(item) {return item.roomId == d[0].roomId})
  // for (let i = 0; i < (c.length+1); i++) {
  //   if (idx > -1) c.splice(idx, 1) 
  // }
  console.log(c,'c')


  const room = {}

  // const findBookmark = await Bookmark.find({ member: member})
  // console.log(findBookmark)

  room.totalPages = totalPages
  if (endIndex < (await Room.countDocuments().exec())) {
    room.next = { page: page + 1, size: size }
  }

  if (startIndex > 0) {
    room.previous = { page: page - 1, size: size }
  }
  try {
    // if (page === 1 ) {
    //   BookmarkId = {}
    //   room.Bookmark = await Room.find({ BookmarkedMembers : member }).sort({
    //     createdAt: 'desc',
    //   }).exec()
    //   console.log(room.Bookmark)
    //   for (var i = 0; i < room.Bookmark.length; i++) {
    //     console.log(room.Bookmark[i].id)
    //   }
      
    //   room.room = await Room.find({ members: member })
    //     .sort({
    //       createdAt: 'desc',
    //     })
    //     .limit((size)-(room.Bookmark.length))
    //     .skip((startIndex)+(room.Bookmark.length))
    //     .exec()
        
    //    console.log('hi',room.room[0].bookmarkedMembers.includes(member))
    // }
    // if (page !== 1) {
    //   room.room = await Room.find({ members: member })
    //     .sort({
    //       createdAt: 'desc',
    //     })
    //     .limit(size)
    //     .skip(startIndex)
    //     .exec()
    // }


    room.room = await Room.find({ members: member })
        .sort({
          createdAt: 'desc',
        })
        .limit(size)
        .skip(startIndex)
        .exec()
    res.paginatedroom = room
  } catch (e) {
    res.status(500).json({ message: '서버에러: 방 조회 실패' })
  }

  res.send(res.paginatedroom)
})

router.get('/rooms', auth, async (req, res) => {
  try {
    const member = res.locals.user._id
    const room = await Room.find({ members: member }).sort({
      createdAt: 'desc',
    })
    res.status(200).json({ room })
  } catch (error) {
    console.log('display rooms ERROR', error)
    res.status(400).send({ ok: false, message: '서버에러: 방 조회 실패' })
  }
})

router.get('/room/:roomId/main', async (req, res) => { })

router.get('/room/:roomId/page', async (req, res) => { })

router.get('/room/:roomId/board', async (req, res) => { })

router.get('/room/:roomId/timeline', async (req, res) => { })

router.post('/room/:roomId/like', auth, async (req, res) => {
  const { userId } = res.locals.user
  const roomId = req.params.roomId
  const findRoom = await Room.findOne({ roomId : roomId})
  const roomLikedAt = findRoom.bookmarkedMembers.includes(userId)
  console.log(roomLikedAt)
  if (roomLikedAt) {
    await Room.updateOne({ roomId: roomId }, { $pull: { bookmarkedMembers: userId } })
    await Bookmark.findOneAndRemove({roomId: roomId, member: userId})
    return res.send('즐겨찾기 취소')
  }
  if (!roomLikedAt) {
    await Room.findOneAndUpdate({roomId: roomId}, { $push: { bookmarkedMembers: userId } })
    await Bookmark.create({ roomId, member: userId, bookmarkedAt: Date.now() })
    return res.send('즐겨찾기 등록')
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
    console.log(findRoom.master)
    if (findRoom.master != userId) {
      return res.send({ ok: false, message: '방 수정 권한이 없습니다.' })
    }
    if (roomId && findRoom.master == userId) {
      await Room.updateOne(
        { roomId: roomId },
        { $set: { roomName, roomImage, subtitle, tag:tag.split(', ') } }
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