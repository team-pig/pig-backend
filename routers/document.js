const express = require("express");
const Documents = require("../schemas/document");
const Rooms = require('../schemas/room');
const Users = require('../schemas/users');
const authMiddleware = require('../middlewares/auth-middleware');

const router = express.Router();

//DOCUMENT 작성
router.post("/room/:roomId/document", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { title, content } = req.body;
    await Rooms.findByIdAndUpdate(roomId, { $push: { document: { title: title, content: content }}});

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

//DOCUMENT 보여주기
router.get('/room/:roomId/document', async (req, res) => {
  try {
    const { roomId } = req.params;
    const target = await Rooms.findById(roomId).exec();
    if (!target) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸 아이디 입니다.'
      })
      return;
    };

    const result = target.documents;

    if (!result) {
      res.status(400).send({
        'ok': false,
        message: '이 방에는 도큐먼트가 없습니다.'
      })
      return;
    }

    res.status(200).send({
      'ok': true,
      result: result
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
router.get('/room/:roomId/document', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { documentId } = req.body;
    const target = await Rooms.findOne({ _id: roomId }).exec();

    if (!target) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸 아이디 입니다.'
      })
      return;
    };

    const result = await target.document.findOne({ documentId: documentId });

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
router.put('/room/:roomId/document', async (req, res) => {
  try {

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