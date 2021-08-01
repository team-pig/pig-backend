const express = require('express');
const Buckets = require('../schemas/bucket');
const Documents = require('../schemas/document');
const Rooms = require('../schemas/room');
const Users = require('../schemas/users');
const authMiddleware = require('../middlewares/auth-middleware');

const router = express.Router();


//버킷 만들기
router.post('/room/:roomId/bucket', authMiddleware, async (req, res) => {
    try {
        const userId = res.locals.user._id;    //user.userId? or user._id?
        const { roomId } = req.params;
        const { bucketName } = req.body;

        //check if room exists
        const room = await Rooms.findOne({ roomId: roomId });
        if (!room) {
            res.status(400).send({
                'ok': false,
                message: '존재하지 않는 룸 입니다'
            });
            return;
        }
        //check if user is room member

        //create Bucket
        const newBucket = await Buckets.create({ bucketName: bucketName, roomId: roomId });

        res.status(200).send({
            'ok': true,
            message: '버킷 생성 성공',
            bucketId: newBucket.bucketId
        });
    } catch (error) {
        console.log('버킷 만들기 캐치 에러', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 버킷 만들기 실패'
        })
    }
})

router.patch('/room/:roomId/bucket', authMiddleware, async (req, res) => {

    try {
        const { bucketId, bucketName, bucketOrder } = req.body;
        const { roomId } = req.params;



    } catch (error) {
        console.log('버킷 위치/내용 수정 에러', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 버킷 위치/내용 수정 실패'
        })
    }
})


