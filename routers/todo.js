const express = require('express');
const Buckets = require('../schemas/bucket');
const BucketOrder = require('../schemas/bucketOrder');
const Cards = require('../schemas/card');
const Todos = require('../schemas/todo');
const Documents = require('../schemas/document');
const Rooms = require('../schemas/room');
const Users = require('../schemas/users');
const authMiddleware = require('../middlewares/auth-middleware');
const isMember = require('../middlewares/isMember');
mongoose.set('useFindAndModify', false);

//버킷 만들기
router.post('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {
        const userId = res.locals.user._id;
        const { roomId } = req.params;
        const { bucketName } = req.body;

        //check if room exists
        const room = await Rooms.findOne({ roomId: roomId });
        if(!room) {
            res.status(404).send({
                ok: false,
                message: '존재하지 않는 룸 입니다.'
            });
            return;
        }

        //create Bucket
        const newBucket = await Buckets.create({ bucketName: bucketName, roomId: roomId });

        const bucketExist = await BucketOrder.findOne({ roomId: roomId });
        if (!bucketExist) {
            await BucketOrder.create({ roomId: roomId })
        }

        res.status(200).send({
            ok: true,
            message: '버킷 생성 성공',
            bucketId: newBucket.bucketId
        });
    } catch (error) {
        console.log('버킷 만들기 캐치 에러', error);
        res.status(400).send({
            ok: false,
            message: '서버에러: 버킷 만들기 실패'
        })
    }
})

//버킷 내용/ 위치 수정
router.patch('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {
        const { bucketId, bucketName, bucketOrder } = req.body;
        const { roomId } = req.params;

        //OPTIONS
        //1. 각각의 버킷마다 bucketOrder에 저장
        //2. bucketOrder document을 따로 만들어서 roomId마다 하나씩 있게함. 저장하고 불러옴.


        //bucket을 하나씩만 수정할수있나? 그렇다면 updateOne. 여러개 동시에 수정할수있나? 그러면 updateMany
        await Buckets.updateOne({ bucketId: bucketId}, { bucketOrder: bucketOrder}, { omitUndefined: true });

        await BucketOrder.updateOne({ roomId: roomId }, { bucketOrder: bucketOrder}, { omitUndefined: true });


        rest.status(200).send({
            ok: true,
            message: '버킷 위치/내용 수정 성공',
        })
    } catch (error) {
        console.log('버킷 위치/내용 수정 에러', error);
        res.status(400).send({
            ok: false,
            message: '서버에러: 버킷 위치/내용 수정 실패'
        })
    }
});


//카드 생성
router.post('/room/:roomId/card', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { bucketId, cardTitle } = req.body;

        const newCard = await Cards.create({ bucketId, cardTitle });

        //해당 버킷 cardOrder 마지막 순서에 새로운 카드의 카드아이디 넣기
        await Buckets.updateOne({ bucketId: bucketId }, { $push: { cardOrder: newCard.cardId }})

        res.status(200).send({
            ok: true,
            message: '카드 생성 성공',
            cardId: newCard.cardId
        })
    } catch (error) {
        console.log('카드생성 에러', error);
        res.status(400).send({
            ok: false,
            message: '서버에러: 카드생성 실패'
        })
    }
})

//카드 내용 수정
router.patch('/room/:roomId/card' , authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { cardId, cardTitle, startDate, endDate, desc, taskMembers, createAt, modifiedAt, color } = req.body;


        await Cards.findOneAndUpdate({ cardId: cardId },
            {
                roomId: roomId, startDate: startDate, cardTitle: cardTitle, 
                endDate: endDate, desc: desc,
                taskMembers: taskMembers, createdAt: createdAt, modifiedAt: modifiedAt, color: color },
                { omitUndefined: true });
        res.status(200).send({
            ok: true,
            message: '카드 내용 수정 성공'
        })        
    } catch (error) {
        console.log('카드위치수정 에러', error);
        res.status(400).send({
            ok: false, 
            message: '서버에러: 카드 내용 수정 실패'
        })
    }
});

//카드 위치 수정
router.patch('/room/:roomId/cardLocation', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { cardId, sourceBucket, sourceBucketOrder, destinationBucket, destinationBucketOrder } = req.body;

        //souceBucket and destinationBucket will be the same, if the card moves within the same bucket only

        //change card's bucketId in Cards
        await Cards.findOneAndUpdate({ cardId: cardId}, { bucketId: destinationBucket }, { omitUndefined: true });

        //change sourceBucket's cardOrder in Buckets
        await Buckets.findOneAndUpdate({ bucketId: sourceBucket }, { cardOrder: sourceBucketOrder }, { omitUndefined: true });

        //if sourceBucket and destinationBucket are different, then change destinationBucket's cardOrder in Buckets
        if (sourceBucket !== destinationBucket) {
            await Buckets.findOneAndUpdate({ bucketId: destinationBucket }, { cardOrder: destinationBucketOrder }, { omitUndefined: true });
        };

        res.status(200).send({
            ok: true,
            message: '카드 위치 수정 성공',
        })
    } catch (error) {
        console.log('카드위치수정 에러', error);
        res.status(400).send({
            ok: false,
            message: '서버에러: 카드위치 수정 실패'
        })
    }
});

//전체 보여주기
router.get('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const bucketOrder = await BucketOrder.findOne({ roomId: roomId });
        const buckets = await Buckets.find({ roomId: roomId });

        for (let i = 0; i < buckets.length; i++) {
            for (let k = 0; k < buckets[i].cardOrder.length; k++) {
                var cardId = buckets[i].cardOrder[k];
                console.log(`k passed (${k})`);
            }
            console.log(`i passed (${i})`, cardList);
            let cardList = await Cards.findOne({ cardId: cardId });
            console.log(`cardlist ${i}`, cardList);
            buckets[i].cardOrder.push(cardList);
        }

        res.status(200).send({
            ok: true,
            message: '전체 보여주기 성공',
            bucketOrder: bucketOrder,
            buckets: buckets,
        });
    } catch (error) {
        console.log('전체보여주기 error', error);
        res.status(400).send({
            ok: false,
            message: '서버에러: 전체 보여주기 실패'
        })
    }
});

//카드 상세보기
router.get('/room/:roomId/card/:cardId', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId, cardId } = req.params;

        const card = await Cards.findOne({ cardId: cardId });

        //이 룸의 모든 멤버 리스트

        const room = await Rooms.findOne({ roomId: roomId });

        res.status(200).send({
            ok: true,
            message: '카드 상세보기 성공',
            allMembers: room.members,
            result: card
        });
    } catch (error) {
        console.log('카드상세보기 error', error);
        res.status(400).send({
            ok: false,
            message: '서버에러: 카드 상세보기 실패'
        })
    }
});

