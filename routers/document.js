const express = require('express')
const Documents = require('../schemas/document')
const Rooms = require('../schemas/room')
const Users = require('../schemas/users')
const authMiddleware = require('../middlewares/auth-middleware')

const router = express.Router()

//DOCUMENT 작성

router.post('/room/:roomId/document', authMiddleware, async (req, res) => {
  try {
    //check if this user is a member of the room
    const userId = res.locals.user._id
    const { roomId } = req.params
    const { title, content } = req.body

    const room = await Rooms.findOne({ roomId: roomId });
    if (!room) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸아이디 입니다.'
      })
      return;
    }

    if (room.members.includes(userId) === false) {
      res.status(400).send({
        'ok': false,
        message: '본 유저는 방의 멤버가 아닙니다.'
      })
      return;
    }
    const newDocument = await Documents.create({
      title: title,
      content: content,
      userId: userId,
      roomId: roomId,
    });
    res.status(200).send({
      ok: true,
      message: 'document 작성 성공',
      documentId: newDocument.documentId
    })
  } catch (err) {
    console.error('document 작성 에러', err)
    res.status(400).send({
      ok: false,
      message: 'document 작성 실패',
    })
  }
})

//모든 DOCUMENT 보여주기
router.get('/room/:roomId/documents', authMiddleware, async (req, res) => {
  try {
    const userId = res.locals.user._id

    const { roomId } = req.params
    const room = await Rooms.findOne({ roomId: roomId });
    if (!room) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸아이디 입니다.'
      })
      return;
    }
    if (room.members.includes(userId) === false) {
      res.status(400).send({
        'ok': false,
        message: '본 유저는 방의 멤버가 아닙니다.'
      })
      return;
    }

    const result = await Documents.find({ roomId: roomId })
    if (result.length === 0) {
      res.status(400).send({
        ok: false,
        message: '이 방에는 도큐먼트가 없습니다.',
      })
      return
    }

    res.status(200).send({
      ok: true,
      message: '도큐먼트 보여주기 성공',
      result: result
    })
  } catch (error) {
    console.log('display document ERROR', error)
    res.status(400).send({
      ok: false,
      message: '서버에러: 도큐먼트 보여주기 실패',
    })
  }
})

//DOCUMENT 상세 보여주기
router.get('/room/:roomId/document', authMiddleware, async (req, res) => {
  try {
    //check if this user is a member of the room
    const userId = res.locals.user._id

    const { roomId } = req.params
    if (!roomId) {
      res.status(400).send({
        ok: false,
        message: 'roomId가 입력되지 않았습니다.',
      })
      return;
    }

    const room = await Rooms.findOne({ roomId: roomId });
    if (!room) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸아이디 입니다.'
      })
      return;
    }

    if (room.members.includes(userId) === false) {
      res.status(400).send({
        'ok': false,
        message: '본 유저는 방의 멤버가 아닙니다.'
      })
      return;
    }
    const { documentId } = req.body
    const result = await Documents.findOne({ documentId: documentId })
    // const room = await Rooms.findById(roomId).exec();
    // const result = await room.document.id(documentId);

    if (!result) {
      res.status(400).send({
        ok: false,
        message: '존재하지 않는 도큐먼트 입니다.',
      })
      return
    }

    res.status(200).send({
      ok: true,
      message: '상세 도큐먼트 보여주기 성공',
      title: result.title,
      content: result.content,
      documentId: result.documentId
    })
  } catch (error) {
    console.log('display document ERROR', error)
    res.status(400).send({
      ok: false,
      message: '서버에러: 상세 도큐먼트 보여주기 실패',
    })
  }
})

//DOCUMENT 수정
router.put('/room/:roomId/document', authMiddleware, async (req, res) => {
  try {
    //check if this user is a member of the room
    const userId = res.locals.user._id
    const { roomId } = req.params
    const room = await Rooms.findOne({ roomId: roomId });
    if (!room) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸아이디 입니다.'
      })
      return;
    }

    if (room.members.includes(userId) === false) {
      res.status(400).send({
        'ok': false,
        message: '본 유저는 방의 멤버가 아닙니다.'
      })
      return;
    }

    const { documentId, title, content } = req.body
    const findDocument = await Documents.findOne({ documentId: documentId });
    if (!findDocument) {
      res.status(400).send({
        ok: 'false',
        message: '존재하지 않는 도큐먼트 입니다.'
      })
      return;
    }
    const editDocument = await Documents.findOneAndUpdate({ documentId: documentId }, {
      title: title,
      content: content,
    })
    if (!editDocument) {
      res.status(400).send({
        ok: false,
        message: '존재하지 않는 도큐먼트 입니다.',
      })
      return;
    }
    res.status(200).send({
      ok: true,
      message: '도큐먼트 수정 성공',
    })
  } catch (error) {
    console.log('document수정 서버에러', error)
    res.status(400).send({
      ok: false,
      message: '서버에러: 도큐먼트 수정 실패',
    })
  }
})

//DOCUMENT 삭제
router.delete('/room/:roomId/document', authMiddleware, async (req, res) => {
  try {
    //check if this user is a member of the room OR A MASTER OF THE ROOM??
    const userId = res.locals.user._id
    const { roomId } = req.params
    const { documentId } = req.body
    const room = await Rooms.findOne({roomId:roomId});
    if (!room) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸아이디 입니다.'
      })
      return;
    }

    if (room.members.includes(userId) === false) {
      res.status(400).send({
        'ok': false,
        message: '본 유저는 방의 멤버가 아닙니다.'
      })
      return;
    }

    const deleteDocument = await Documents.findByIdAndDelete(documentId)
    if (!deleteDocument) {
      res.status(400).send({
        ok: false,
        message: '존재하지 않는 도큐먼트 입니다',
      })
      return
    }

    res.status(200).send({
      ok: true,
      message: '도큐먼트 삭제 성공',
    })
  } catch (error) {
    res.status(400).send({
      ok: false,
      message: '서버에러: 도큐먼트 삭제 실패',
    })
  }
})

//문서 백업기능
router.post('/room/:roomId/document/backup', authMiddleware, async (req, res) => {
  try {

  } catch (error) {
    console.log('문서 백업 에러', error);
    res.status(400).send({
      'ok': false,
      message: '서버에러: 문서백업 실패'
    })
  }
})

// router.get("/posts/:contentId", async (req, res, next) => {
//   try {
//     const { contentId } = req.params;
//     posts = await Posts.findOne({ contentId: contentId });
//     res.json({ posts: posts });
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }

// });

// router.get("/posts", async (req, res, next) => {
//   try {
//     // const { category } = req.query;
//     const posts = await Posts.find().sort('-contentId');
//     res.json({ posts: posts });
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// });

// router.post("/edit", async (req, res, next) => {
//   try {
//     const { contentId, title, name, password, content } = req.body;
//     await Posts.updateOne({ 'contentId': contentId, 'password': password }, { $set: { 'title': title, 'name': name, 'content': content } });
//     res.send({ result: "success" });
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }

// });

// router.post("/delete", async (req, res, next) => {
//   try {
//     const { contentId, password } = req.body;
//     await Posts.deleteOne({ 'contentId': contentId, 'password': password });
//     res.send({ result: "success" });
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// });

module.exports = router