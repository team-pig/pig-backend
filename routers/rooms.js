// Room._id -> Room.roomId로 findById -> findOne 변경 예정
const express = require('express')
const Room = require('../schemas/room.js')
const Bookmark = require('../schemas/bookmark.js')
const auth = require('../middlewares/auth-middleware.js')
const BucketOrder = require('../schemas/bucketOrder')
const { v4 } = require('uuid')

const Buckets = require('../schemas/bucket')
const User = require('../schemas/users.js')
const deleteAll = require('../middlewares/deleting')
const MemberStatus = require('../schemas/memberStatus.js')
const Todo = require('../schemas/todo.js')

const router = express.Router()

router.post('/tttt', async (req, res) => {
  res.status(200).send()
})

// pagination 방 불러오기 8월 2일(월) 기존 router.ger('/rooms')에서 현재로 변경 예정
router.get('/rooms', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const page = parseInt(req.query.page)
    const size = parseInt(req.query.size)
    // const startIndex = (page - 1) * size
    // const endIndex = page * size
    const room = {}
    // const bookmarkedRoom = await Room.find(
    //   { 'bookmarkedMembers.userId': userId },
    //   { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false }
    // )
    const totalPages = Math.ceil((await Room.find({ members: userId })).length / size)
    room.totalPages = totalPages
    room.userId = userId
    // if (endIndex < (await Room.countDocuments().exec())) {
    //   room.next = { page: page + 1, size: size }
    // }
    // if (startIndex > 0) {
    //   room.previous = { page: page - 1, size: size }
    // }
    room.room = await Room.find(
      { members: userId },
      { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false, 'bookmarkedMembers._id': false, 'bookmarkedMembers.roomId': false, 'bookmarkedMembers.bookmarkedAt': false}
    )
      .sort({ createdAt: 'desc' })
      .lean()
    // // 찾은 방에서 bookmark된 방 빼기
    // for (let i = 0; i < bookmarkedRoom.length; i++) {
    //   var idx = room.room.findIndex(function (item) {
    //     return item.roomId == String(bookmarkedRoom[i].roomId)
    //   })
    //   if (idx > -1) {
    //     room.room.splice(idx, 1)
    //   }
    // }
    // // 찾은 방에서 bookmark된 방 넣기(정렬때문에)
    // for (let i = 0; i < bookmarkedRoom.length; i++) {
    //   room.room.unshift(bookmarkedRoom[i])
    // }
    //페이지네이션
    room.room = room.room.slice((page - 1) * size, page * size)
    res.send(room)
  } catch (e) {
    res.status(500).json({ message: '서버에러: 방 조회 실패' })
  }
})

//방 불러오기 (inviteCode 입력 시)
router.get('/rooms/room/:inviteCode', auth, async (req, res) => {
  try {const {inviteCode} = req.params
  const room = await Room.findOne({inviteCode: inviteCode})
  if (!room) {
    return res.status(400).json({ message: '방을 찾을 수 없어요! 초대코드를 확인하세요.'})
  }
  console.log(room)
  res.send(room)
} catch (err) {
  res.status(500).json({ message: '서버에러: 방 조회 실패'})
}
})

//즐겨 찾기 된 방 불러오기
router.get('/rooms/markedlist', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const markedList = await Room.find({ 'bookmarkedMembers.userId': userId }, { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false }).sort({ 'bookmarkedMembers.bookmarkedAt': -1 })
    res.send({ markedList })
  } catch (err) {
    res.status(400).send({ message: '즐겨찾기된 방 조회 실패' })
  }
})

//즐겨찾기 안된 방 불러오기
router.get('/rooms/unmarkedlist', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const room = {}
    const markedList = await Room.find({ 'bookmarkedMembers.userId': userId }, { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false }).sort({ 'bookmarkedMembers.bookmarkedAt': -1 })
    room.room = await Room.find({ members: userId }, { _id: false }).sort({ createdAt: 'desc' })
    // console.log(room)
    for (let i = 0; i < markedList.length; i++) {
      var idx = room.room.findIndex(function (item) {
        return item.roomId == String(markedList[i].roomId)
      })
      if (idx > -1) {
        room.room.splice(idx, 1)
      }
    }
    const unMarkedList = room.room
    res.send({ unMarkedList })
  } catch (err) {
    res.status(400).send({ message: '즐겨찾기 안된 방 조회 실패' })
  }
})

// 방 검색하기 2021 08 16(월) pagination 추가
router.get('/rooms/search', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const { roomName } = req.query
    const page = parseInt(req.query.page)
    const size = parseInt(req.query.size)
    const totalPages = Math.ceil((await Room.find({ members: userId, roomName: roomName})).length / size)
    // const { roomName, subtitle, tag } = req.body
    // const room = await Room.find({ $and: [ {$or: [{ roomName }, { subtitle }, { tag }]} ] },{_id:false})
    let room = {}
    findroom = await Room.find({ roomName:{$regex:roomName}, members: userId , }, { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false, 'bookmarkedMembers._id': false, 'bookmarkedMembers.roomId': false, 'bookmarkedMembers.bookmarkedAt': false })
    // room.totalPages = totalPages
    // room.room = findroom.slice((page - 1) * size, page * size)
    room.room = findroom
    res.send(room)
  } catch (e) {
    res.status(500).json({ message: '서버에러: 방 검색 실패' })
  }
})
// 방 메인페이지 불러오기
router.get('/room/:roomId/main', auth, async (req, res) => {
  try {
    const { roomId } = req.params
    const userId = res.locals.user._id
    const result = await Room.findOne({ roomId, members: userId }, { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false })
    console.log({ result })
    res.send({ result })
  } catch (e) {
    res.status(500).json({ message: '서버에러: 방 메인페이지 불러오기 실패' })
  }
})

// 방 유저 현황 불러오기 8월 10일 완성
router.get('/room/:roomId/main/status', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const { roomId } = req.params
    let projectStatus = {}
    let memberStatus = []
    let endDate = await Room.findOne({ roomId, members: userId }, { _id: false, endDate: true })
    endDate = endDate.endDate
    let checked = 0
    let notChecked = 0
    const todo = await Todo.find({ roomId })
    for (let i = 0; i < todo.length; i++) {
      if (todo[i].isChecked === true) {
        checked += 1
      } else {
        notChecked += 1
      }
    }
    projectStatus = { endDate, checked, notChecked }
    //위에까지 projectStatus, 아래부터memberStatus 시작
    // const findMemberStatus = await MemberStatus.find({ roomId }, { _id: false }).lean()  위에서 아래로 변화(memberstatus 따로 생성되는 부분 지워도 될듯)
    const findRoom = await Room.findOne({ roomId }, { _id: false })
    const findMemberStatus = findRoom.memberStatus

    for (let j = 0; j < findMemberStatus.length; j++) {
      var findTodo = await Todo.find({ roomId: roomId, 'members.memberId': findMemberStatus[j].userId })
      bchecked = 0
      bnotChecked = 0
      for (let k = 0; k < findTodo.length; k++) {
        if (findTodo[k].isChecked === true) {
          bchecked += 1
        } else {
          bnotChecked += 1
        }
      }
      memberStatus.push(findMemberStatus[j])
      memberStatus[j].checked = bchecked
      memberStatus[j].notChecked = bnotChecked
    }
    res.send({ projectStatus, memberStatus })
  } catch (err) {
    res.status(500).send({ message: '서버에러: 유저 현황 불러오기 실패' })
  }
})

// 방의 멤버 정보 불러오기 (닉네임과 userId)
router.get('/room/:roomId/members', auth, async (req, res) => {
  try {
    const { roomId } = req.params
    const findRoom = await Room.findOne({ roomId: roomId })
    const allMembers = []
    for (let i = 0; i < findRoom.members.length; i++) {
      memberId = findRoom.members[i]
      memberInfo = await User.findOne({ _id: memberId }, { email: false, password: false, __v: false }).lean()
      memberInfo.memberId = memberInfo._id
      memberInfo.memberName = memberInfo.nickname
      delete memberInfo._id
      delete memberInfo.nickname
      allMembers.push(memberInfo)
    }
    console.log(allMembers)
    res.send({ allMembers })
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: '방 조회 혹은 멤버 불러오기 실패' })
  }
})

// 방 프로필 수정하기
router.patch('/room/:roomId/myprofile', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const { roomId } = req.params
    const { desc, tags } = req.body
    // await MemberStatus.updateOne({ userId: userId, roomId }, { $set: { desc, tags } })
    await Room.updateMany({roomId:roomId, 'memberStatus.userId':userId}, {$set: {'memberStatus.$.desc': desc, 'memberStatus.$.tags': tags}})
    res.send({ message: '프로필 수정 성공' })
  } catch (e) {
    res.status(500).json({ message: '서버에러: 프로필 수정 실패' })
  }
})

// 즐겨찾기 북마크 추가
router.post('/room/:roomId/bookmark', auth, async (req, res) => {
  const { userId } = res.locals.user
  const roomId = req.params.roomId
  try {
    const markedRoom = await Room.findOne({roomId, 'bookmarkedMembers.userId': userId }, { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false })
    if (!roomId) {
      return res.status(400).send({ message: 'roomId에 해당하는 방을 찾을 수 없습니다.' })
    }
    if (markedRoom) {
      return res.status(400).send({ message: '이미 즐겨찾기 등록이 되어있습니다.' })
    }
    if (!markedRoom) {
      await Room.findOneAndUpdate({ roomId: roomId }, { $push: { bookmarkedMembers: {userId, roomId } }})
      const bookmarkedRoom = await Room.findOne({ roomId: roomId })
      const markedList = await Room.find(
        { 'bookmarkedMembers.userId': userId },
        { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false }
      ).sort({'bookmarkedMembers.bookmarkedAt': -1})
      // const room = {}
      // room.room = await Room.find(
      //   { members: userId },
      //   { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false }
      // )
      //   .sort({ createdAt: 'desc' })
      //   .lean()
      //   for (let i = 0; i < markedList.length; i++) {
      //     var idx = room.room.findIndex(function (item) {
      //       return item.roomId == String(markedList[i].roomId)
      //     })
      //     if (idx > -1) {
      //       room.room.splice(idx, 1)
      //     }
      //   }
      // const unmarkedList = room.room
      return res.send({message:"즐겨찾기가 등록되었습니다.", markedList, bookmarkedRoom})
    }
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

// 북마크 삭제
router.delete('/room/:roomId/bookmark', auth, async (req, res) => {
  const { userId } = res.locals.user
  const roomId = req.params.roomId
  try {
    const markedRoom = await Room.findOne({roomId, 'bookmarkedMembers.userId': userId }, { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false })
    if (!roomId) {
      return res.status(400).send({ message: 'roomId에 해당하는 방을 찾을 수 없습니다.' })
    }
    if (!markedRoom) {
      return res.status(400).send({ message: '이미 즐겨찾기에서 삭제되었습니다.' })
    }
    if (markedRoom) {
      // await Room.findOneAndUpdate({ roomId: roomId }, { $pull: { bookmarkedMembers: {userId } }}) //아래와 기능 동일
    Room.findOneAndUpdate(
        { roomId: roomId },
        { $pull: { bookmarkedMembers: { userId: userId} } },
        { new: true },
        function(err) {
            if (err) { console.log(err) }
        }
    )
      const markedList = await Room.find(
        { 'bookmarkedMembers.userId': userId },
        { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false }
      ).sort({'bookmarkedMembers.bookmarkedAt': -1})
      // const room = {}
      // room.room = await Room.find(
      //   { members: userId },
      //   { _id: false, 'memberStatus.tags': false, 'memberStatus._id': false, 'memberStatus.roomId': false }
      // )
      //   .sort({ createdAt: 'desc' })
      //   .lean()
      //   for (let i = 0; i < markedList.length; i++) {
      //     var idx = room.room.findIndex(function (item) {
      //       return item.roomId == String(markedList[i].roomId)
      //     })
      //     if (idx > -1) {
      //       room.room.splice(idx, 1)
      //     }
      //   }
      // const unmarkedList = room.room
      return res.send({message:"즐겨찾기가 취소되었습니다.", markedList})
    }
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

// 방 만들기
router.post('/room', auth, async (req, res) => {
  const userId = res.locals.user._id
  const {avatar, color} = res.locals.user
  const { roomName, roomImage, subtitle, tag, desc, endDate } = req.body
  try {
    let room = await Room.create({
      roomName,
      roomImage,
      desc,
      endDate,
      master: userId,
      members: userId,
      subtitle,
      tag: tag.split(', '),
      inviteCode: v4(),
    })

    let nickname = await User.findById(userId, { __v: false, password: false, email: false, _id: false })
    nickname = nickname.nickname
    const roomId = room.roomId

    //create Bucket
    const newBucket = await Buckets.create({ roomId: roomId, cardOrder: [], bucketName: null })
    const bucketId = newBucket.bucketId

    // await MemberStatus.create({ roomId: roomId, userId: userId, nickname })
    await Room.findOneAndUpdate(
      { roomId: room.roomId },
      { $push: { memberStatus: { roomId: roomId, userId: userId, nickname: nickname, avatar, color } } }
    )
    await BucketOrder.create({ roomId: roomId })
    await BucketOrder.updateOne({ roomId: roomId }, { $push: { bucketOrder: bucketId } })
    room = await Room.findOne({ roomId: room.roomId })
    res.json({ room })
  } catch (error) {
    console.log('방 만들기 실패', error)
    res.status(400).send({
      ok: false,
      message: '서버에러: 방 만들기 실패',
    })
  }
})

// 방 추가하기(입장)
router.post('/room/member', auth, async (req, res) => {
  const userId = res.locals.user._id
  const { inviteCode } = req.body
  const findRoom = await Room.findOne({ inviteCode })

  if (!findRoom) {
    console.log('찾으려는 방이 없습니다.')
    return res.status(400).send({ message: '초대코드가 잘못됐거나 방을 찾을 수 없어요' })
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
        message: '서버에러: 존재하지 않는 초대코드입니다.',
      })
    }
    if (inviteCode && !findRoom.members.includes(userId)) {
      let nickname = await User.findById(userId, { __v: false, password: false, email: false, _id: false })
      nickname = nickname.nickname
      let room = await Room.findOne({ inviteCode })
      const roomId = room.roomId
      await Room.findOneAndUpdate(
        { inviteCode },
        { $push: { members: userId, memberStatus: { userId: userId, nickname, roomId } } }
      )
      // await MemberStatus.create({ roomId: roomId, userId: userId, nickname })
      room = await Room.findOne({ roomId: roomId})
      return res.json({ room })
    }
  } catch (error) {
    console.log('방 추가 실패', error)
    res.status(400).send({
      ok: false,
      message: '서버에러: 다른 사람 방 추가 실패',
    })
  }
})

// 방 수정하기 (put에서 patch로 프론트와 얘기 후 바꿔야함)
router.patch('/room', auth, async (req, res) => {
  try {
    const { roomId, roomName, roomImage, subtitle, tag, desc, endDate } = req.body
    const { userId } = res.locals.user
    const findRoom = await Room.findOne({ roomId: roomId })
    if (findRoom.master != userId) {
      return res.send({ ok: false, message: '방 수정 권한이 없습니다.' })
    }
    if (roomId && findRoom.master == userId) {
      await Room.updateOne(
        { roomId: roomId },
        { $set: { roomName, roomImage, subtitle, tag: tag, desc, endDate } }
      )
      const room = await Room.findOne({ roomId: roomId })
      return res.json({ room })
    }
    // res.send('test')
  } catch (err) {
    console.error(err)
    res.status(400).json(err)
  }
})

// 방 삭제하기
router.delete('/room', auth, async (req, res) => {
  try {
    const userId = res.locals.user._id
    const { roomId } = req.body
    const findRoom = await Room.findOne({ roomId: roomId })
    if (findRoom.master == userId) {
      //룸안에 속해있는 모든걸 삭제하기
      await deleteAll.deleteDocuments(roomId)
      await deleteAll.deleteBuckets(roomId)
      await Room.findOneAndRemove({ roomId: roomId })
      await BucketOrder.deleteOne({ roomId: roomId })
      // await MemberStatus.findOneAndRemove({ roomId: roomId })
      return res.json({
        ok: true,
        message: '방 삭제 성공',
      })
    }
    if (findRoom.master != userId) {
      return res.status(400).json({
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

//방 나가기
router.delete('/room/member/:roomId', auth, async (req, res) => {
  try {
    const roomId = req.params.roomId
    const userId = res.locals.user._id
    const findRoom = await Room.findOne({ roomId: roomId })
    const members = findRoom.members
    // if (master == userId) {
    //   return res.status(400).json({message: 'master는 나갈 수 없어요, 권한을 넘겨줘야 나갈 수 있어요!'})
    // }
    if (members.length === 1) {
      return res.status(400).json({
        message: '방에 혼자 있어서 나갈 수 없어요. 정말 나가려면 방 삭제버튼을 눌러주세요.',
      })
    }
    await Room.findOneAndUpdate({ roomId: roomId }, { $pull: { members: userId, bookmarkedMembers: {userId},memberStatus: { userId} } })
    // await MemberStatus.findOneAndRemove({ roomId: roomId })
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