const express = require("express");
const Documents = require("../schemas/document");
const Rooms = require('../schemas/room');
const Users = require('../schemas/users');
const authMiddleware = require('../middlewares/auth-middleware');

const router = express.Router();

//DOCUMENT 작성
router.post("/room/:roomId/document", authMiddleware, async (req, res) => {
  try {

    //check if this user is a member of the room
    const userId = res.locals.user._id
    const { roomId } = req.params;
    const { title, content } = req.body;
    await Rooms.findByIdAndUpdate(roomId, { $push: { document: { title: title, content: content, userId: userId } } });

    res.status(200).send({
      'ok': true,
      message: 'document 작성 성공'
    });
  } catch (err) {
    console.error('document 작성 에러', err);
    res.status(400).send({
      'ok': false,
      message: 'document 작성 실패'
    })
  }
});

//모든 DOCUMENT 보여주기
router.get('/room/:roomId/documents', authMiddleware, async (req, res) => {
  try {
    //check if this user is a member of the room
    const userId = res.locals.user._id

    const { roomId } = req.params;
    const target = await Rooms.findById(roomId).exec();
    if (!target) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸 아이디 입니다.'
      })
      return;
    };

    const result = target.document;

    if (!result) {
      res.status(400).send({
        'ok': false,
        message: '이 방에는 도큐먼트가 없습니다.'
      })
      return;
    }

    //도큐먼트의 _id를 documentId로 변경해서 프론트엔드로 보내주기
    const finalResult = [];
    for (i = 0; i < result.length; i++) {
      let documentId = result[i]._id;
      let title = result[i].title;
      let content = result[i].content;
      finalResult.push({documentId: documentId, title: title, content:content});
    }

    res.status(200).send({
      'ok': true,
      result: finalResult
    })
  } catch (error) {
    console.log('display document ERROR', error);
    res.status(400).send({
      'ok': false,
      message: '서버에러: 도큐먼트 보여주기 실패'
    })
  }
})

//DOCUMENT 상세 보여주기
router.get('/room/:roomId/document', authMiddleware, async (req, res) => {
  try {
    //check if this user is a member of the room
    const userId = res.locals.user._id

    const { roomId } = req.params;
    const { documentId } = req.body;
    const target = await Rooms.findById(roomId).exec();

    if (!target) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸 아이디 입니다.'
      })
      return;
    };

    const result = await target.document.id(documentId);

    if (!result) {
      res.status(400).send({
        'ok': false,
        message: '이 방에는 도큐먼트가 없습니다.'
      })
      return;
    }

    res.status(200).send({
      'ok': true,
      message: '도큐먼트 보여주기 성공',
      title: result.title,
      content: result.content,
      documentId: documentId

    })
  } catch (error) {
    console.log('display document ERROR', error);
    res.status(400).send({
      'ok': false,
      message: '서버에러: 도큐먼트 보여주기 실패'
    })
  }
})

//DOCUMENT 수정
router.put('/room/:roomId/document', authMiddleware, async (req, res) => {
  try {
    //check if this user is a member of the room
    const userId = res.locals.user._id

  } catch (error) {

  }
})



//DOCUMENT 삭제
router.delete('/room/:roomId/document', authMiddleware, async (req, res) => {
  try {
    //check if this user is a member of the room OR A MASTER OF THE ROOM??
    const userId = res.locals.user._id

  } catch (error) {

  }
})

router.get("/posts/:contentId", async (req, res, next) => {
  try {
    const { contentId } = req.params;
    posts = await Posts.findOne({ contentId: contentId });
    res.json({ posts: posts });
  } catch (err) {
    console.error(err);
    next(err);
  }

});

router.get("/posts", async (req, res, next) => {
  try {
    // const { category } = req.query;
    const posts = await Posts.find().sort('-contentId');
    res.json({ posts: posts });
  } catch (err) {
    console.error(err);
    next(err);
  }
});



router.post("/edit", async (req, res, next) => {
  try {
    const { contentId, title, name, password, content } = req.body;
    await Posts.updateOne({ 'contentId': contentId, 'password': password }, { $set: { 'title': title, 'name': name, 'content': content } });
    res.send({ result: "success" });
  } catch (err) {
    console.error(err);
    next(err);
  }

});

router.post("/delete", async (req, res, next) => {
  try {
    const { contentId, password } = req.body;
    await Posts.deleteOne({ 'contentId': contentId, 'password': password });
    res.send({ result: "success" });
  } catch (err) {
    console.error(err);
    next(err);
  }
});


module.exports = router;