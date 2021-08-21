const express = require('express');
const Documents = require('../schemas/document');
const Rooms = require('../schemas/room');
const Users = require('../schemas/users');
const authMiddleware = require('../middlewares/auth-middleware');
const isMember = require('../middlewares/isMember');

const router = express.Router();

//DOCUMENT 작성

router.post('/room/:roomId/document', authMiddleware, isMember, async (req, res) => {
  try {
    //check if this user is a member of the room
    const userId = res.locals.user._id
    const { roomId } = req.params
    const { title, content } = req.body

    const targetUser = await Users.findById(userId);
    const nickname = targetUser.nickname;
    const createdAt = new Date();
    const newDocument = await Documents.create({
      title: title,
      content: content,
      userId: userId,
      roomId: roomId,
      nickname: nickname,
      createdAt: createdAt,
      modifiedAt: createdAt,
      canEdit: true,
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
      errorMessage: 'document 작성 실패',
    })
  }
})

//모든 DOCUMENT 보여주기
router.get('/room/:roomId/documents', authMiddleware, isMember, async (req, res) => {
  try {
    const { roomId } = req.params

    const result = await Documents.find({ roomId: roomId })
    if (result.length === 0) {     //방에 도큐먼트가 없을시 result에 []가 담겨온다. 그래서 length===0
      res.status(200).send({
        ok: true,
        message: '이 방에는 아직 도큐먼트가 없습니다.',
        result: [],
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
      errorMessage: '서버에러: 도큐먼트 보여주기 실패',
    })
  }
})

//DOCUMENT 상세 보여주기
router.get('/room/:roomId/document/:documentId', authMiddleware, isMember, async (req, res) => {
  try {
    const { documentId } = req.params

    const result = await Documents.findOne({ documentId: documentId })

    if (!result) {
      res.status(400).send({
        ok: false,
        errorMessage: '존재하지 않는 도큐먼트 입니다.',
      })
      return
    }

    res.status(200).send({
      ok: true,
      message: '상세 도큐먼트 보여주기 성공',
      result: result
    })
  } catch (error) {
    console.log('display document ERROR', error)
    res.status(400).send({
      ok: false,
      errorMessage: '서버에러: 상세 도큐먼트 보여주기 실패',
    })
  }
})
//DOCUMENT 수정 가능여부 확인
router.patch('/room/:roomId/document', authMiddleware, isMember, async (req, res) => {
  try {
    //현재 상황에서 내가 문서 수정중인데 다른창에서 수정 버튼 클릭하면 canEdit이 false라서 수정 불가한가?
    //이걸 고쳐주는 메세지를 보여줘야할까?

    const { documentId } = req.body;
    const userId = res.locals.user._id;
    const targetUser = await Users.findById(userId);
    const nickname = targetUser.nickname;

    const document = await Documents.findOne({ documentId: documentId });
    if (document.canEdit === false) {
      res.status(200).send({
        'ok': true,
        message: '도큐먼트 수정중',
        canEdit: false,
        nickname: nickname
      })
      return;
    }

    await Documents.findOneAndUpdate({ documentId: documentId }, { canEdit: false, nickname:nickname });
    res.status(200).send({
      'ok': true,
      message: '수정가능',
      canEdit: true
    })

  } catch (error) {
    console.log('도큐먼트 수정가능여부 확인 에러', error);
    res.status(400).send({
      'ok': false,
      errorMessage: '서버에러: 수정가능여부 api 실패'
    })
  }
})

//수정 하다가 취소 혹은 창 밖으로 나감
router.post('/room/:roomId/document/exit', authMiddleware, isMember, async (req, res) => {
  try {
    const { documentId } = req.body;
    await Documents.findOneAndUpdate({ documentId: documentId }, { canEdit: true });

    res.status(200).send({
      'ok': true,
      message: 'api성공'
    })
  } catch (error) {
    console.log('도큐먼트 수정 취소 서버에러', error);
    res.status(400).send({
      'ok': false,
      errorMessage: 'api실패'
    })
  }
})


//DOCUMENT 수정
router.put('/room/:roomId/document', authMiddleware, isMember, async (req, res) => {
  try {
    //check if this user is a member of the room
    const userId = res.locals.user._id
    const { documentId, title, content } = req.body

    const targetUser = await Users.findById(userId);
    const nickname = targetUser.nickname;
    const modifiedAt = new Date();
    const editDocument = await Documents.findOneAndUpdate({ documentId: documentId }, {
      title: title,
      content: content,
      userId: userId,
      nickname: nickname,
      modifiedAt: modifiedAt,
      canEdit: true,
    }, { useFindAndModify: false });

    if (!editDocument) {
      res.status(400).send({
        ok: false,
        errorMessage: '존재하지 않는 도큐먼트 입니다.',
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
      errorMessage: '서버에러: 도큐먼트 수정 실패',
    })
  }
})

//DOCUMENT 삭제
router.delete('/room/:roomId/document', authMiddleware, isMember, async (req, res) => {
  try {
    const { documentId } = req.body

    const deleteDocument = await Documents.findOneAndDelete({ documentId: documentId }, { useFindAndModify: false });
    if (!deleteDocument) {
      res.status(400).send({
        ok: false,
        errorMessage: '존재하지 않는 도큐먼트 입니다',
      })
      return;
    }

    res.status(200).send({
      ok: true,
      message: '도큐먼트 삭제 성공',
    })
  } catch (error) {
    res.status(400).send({
      ok: false,
      errorMessage: '서버에러: 도큐먼트 삭제 실패',
    })
  }
})

//문서 백업기능
router.post('/room/:roomId/document/backup', authMiddleware, isMember, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { documentId } = req.body;
    Documents.create({ roomId: roomId, originalDocumentId: documentId, isBackup: true, canEdit: true });

    res.status(200).send({
      'ok': true,
      message: '문서 백업 성공'
    })
  } catch (error) {
    console.log('문서 백업 에러', error);
    res.status(400).send({
      'ok': false,
      errorMessage: '서버에러: 문서백업 실패'
    })
  }
})


module.exports = router


//     const posts = await Posts.find().sort('-contentId');

//     await Posts.updateOne({ 'contentId': contentId, 'password': password }, { $set: { 'title': title, 'name': name, 'content': content } });
