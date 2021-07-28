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

    // await Documents.findByIdAndUpdate(roomId, { $push: { document: { title: title, content: content, userId: userId } } });
    await Documents.create({ title: title, content: content, userId: userId, roomId: roomId });
    const room = await Rooms.findById(roomId);


    //과연 array의 마지막 도큐먼트를 가지고오는것이 버그가 없을까...? 더 좋은 방법이 있을텐데...
    // const document = room.document
    // const sortedDocument = document.slice(-1).pop();
    // const documentId = sortedDocument._id;

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
    const room = await Rooms.findById(roomId).exec();
    if (!room) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸 아이디 입니다.'
      })
      return;
    };

    const result = room.document;

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
      finalResult.push({ documentId: documentId, title: title, content: content });
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
    const room = await Rooms.findById(roomId).exec();

    if (!room) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸 아이디 입니다.'
      })
      return;
    };

    const result = await room.document.id(documentId);

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
    const userId = res.locals.user._id;
    const { roomId } = req.params;
    const { documentId, title, content } = req.body;

    const room = await Rooms.findById(roomId);
    if (!room) {
      res.status(400).send({
        'ok': false,
        message: '존재하지 않는 룸 아이디 입니다.'
      })
      return;
    }

    // await Rooms.findByIdAndUpdate(roomId, { $push: { document: { title: title, content: content, userId: userId } } });

    const targetDocument = await room.document.id(documentId);

    if (!targetDocument) {
      res.status(400).send({
        ok: 'false',
        message: '존재하지 않는 도큐먼트 입니다.'
      })
      return;
    }
    // room -> document -> find the specific document -> edit title and content
    // array에서 for문 돌려서 해당 id찾기? 아니면 id값으로 해당 도큐먼트 찾는건 이미 한건가?

    /// --- 어레이에 원래 있던 도큐먼트를 지워버리고 새로 하나 넣는 식으로 할수도...하지만 그러면 documentId가 리셋될텐데..

    await room.update({ documentId: documentId }, { $set: { title: title, content: content } })
    //await targetDocument.updateOne({title:title, content:content});

    //if userId does not match any of the members, reject and return.
    // if(userId!==room.members){

    //   return;
    // }


  } catch (error) {
    console.log('document수정 서버에러', error);
    res.status(400).send({
      'ok': false,
      message: '서버에러: 도큐먼트 수정 실패'
    })
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