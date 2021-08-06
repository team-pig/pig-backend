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

const router = express.Router();
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);

//버킷 만들기
router.post('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {

        const userId = res.locals.user._id;  

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

        //create Bucket
        const newBucket = await Buckets.create({ bucketName: bucketName, roomId: roomId });

        const bucketId = newBucket.bucketId

        //버킷오더 테이블에 버켓이 없다면 오더 만들어주기    //이 코드 room.js에 보냈음.
        // const bucketExist = await BucketOrder.findOne({ roomId: roomId });
        // if (!bucketExist) {
            //await BucketOrder.create({ roomId: roomId });
        // }
        await BucketOrder.updateOne({ roomId: roomId }, { $push: { bucketOrder: bucketId } });

        res.status(200).send({
            'ok': true,
            message: '버킷 생성 성공',
            bucketId: bucketId

        });
    } catch (error) {
        console.log('버킷 만들기 캐치 에러', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 버킷 만들기 실패'
        })
    }
})


//버킷 내용/위치 수정
router.patch('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {
        const { bucketId, bucketName, bucketOrder } = req.body;
        const { roomId } = req.params;

        //OPTIONS
        //1. 각각의 버킷마다 bucketOrder에 저장
        //2. bucketOrder document을 따로 만들어서 roomId마다 하나씩 있게함. 저장하고 불러옴.


        //bucket을 하나씩만 수정할수있나? 그렇다면 updateOne. 여러개 동시에 수정할수있나? 그러면 updateMany

        await Buckets.updateOne({ bucketId: bucketId }, { bucketName: bucketName }, { omitUndefined: true });

        await BucketOrder.updateOne({ roomId: roomId }, { bucketOrder: bucketOrder }, { omitUndefined: true });
        //  const bucket = Buckets.findOne({roomId:roomId});


        res.status(200).send({
            'ok': true,
            message: '버킷 위치/내용 수정 성공',
        })
    } catch (error) {
        console.log('버킷 위치/내용 수정 에러', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 버킷 위치/내용 수정 실패'
        })
    }
});

//버킷 삭제
router.delete('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { bucketId } = req.body;
        await Buckets.findOneAndDelete({ bucketId: bucketId });

        //버킷오더에서도 해당 버킷 삭제하기
        await BucketOrder.updateOne({ roomId: roomId }, { $pull: { bucketOrder: bucketId } });
        res.status(200).send({
            'ok': true,
            message: '버킷 삭제 성공'
        })
    } catch (error) {
        console.log('bucket deleting error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 버킷 삭제 실패'
        })
    }
})


//카드 생성
router.post('/room/:roomId/card', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { bucketId, cardTitle } = req.body;

        const newCard = await Cards.create({ bucketId: bucketId, cardTitle: cardTitle, roomId: roomId });

        //  해당 버킷 cardOrder 마지막 순서에 새로운 카드의 카드아이디 넣기
        // await Buckets.updateOne({ bucketId: bucketId }, { $push: { cardOrder: { cardId: newCard.cardId, cardTitle: newCard.cardTitle, startDate: null, endDate: null } } });
        await Buckets.updateOne({ bucketId: bucketId }, { $push: { cardOrder: newCard.cardId } });
        res.status(200).send({
            'ok': true,
            message: '카드 생성 성공',
            cardId: newCard.cardId
        })

    } catch (error) {
        console.log('카드생성 에러', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 카드생성 실패'
        })
    }
})

//카드 내용 수정

router.patch('/room/:roomId/card', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { cardId, cardTitle, startDate, endDate, desc, taskMembers, createdAt, modifiedAt, color } = req.body;


        const card = await Cards.findOneAndUpdate({ cardId: cardId },
            {
                startDate: startDate, cardTitle: cardTitle,
                endDate: endDate, desc: desc,
                taskMembers: taskMembers, createdAt: createdAt, modifiedAt: modifiedAt, color: color
            }, { omitUndefined: true });


        const bucketId = card.bucketId;
        // await Movie.updateMany({ _id: movieId, 'comments._id': commentId }, { $set: { 'comments.$.comment': comment, 'comments.$.star': star } })



        // await Buckets.findOneAndUpdate({cardId:cardId},{startDate:startDate,endDate:endDate});
        // await Buckets.updateOne({ bucketId: bucketId, cardOrder: { $elemMatch: { cardId: cardId } } },
        //     { $set: { "cardOrder.$.startDate": startDate } });

        // await Buckets.updateOne({ cardOrder: { cardId: cardId } }, { startDate: startDate, endDate: endDate });
        // Person.update({_id: 5,grades: { $elemMatch: { grade: { $lte: 90 }, mean: { $gt: 80 } } }},
        //    { $set: { "grades.$.std" : 6 } }
        // )

        // var MongoClient = require('mongodb').MongoClient;
        // var url = "mongodb://127.0.0.1:27017/";

        // MongoClient.connect(url, function (err, db) {
        //     if (err) throw err;
        //     var dbo = db.db("admin");
        //     var myquery = { bucketId: bucketId, cardOrder.cardId:cardId};
        //     var newvalues = { $set: { name: "Mickey", address: "Canyon 123" } };
        //     dbo.collection("buckets").updateOne(myquery, newvalues, function (err, res) {
        //         if (err) throw err;
        //         console.log("1 document updated");
        //         db.close();
        //     });
        // });

        res.status(200).send({
            'ok': true,
            message: '카드 내용 수정 성공',
        })
    } catch (error) {
        console.log('카드위치수정 에러', error);
        res.status(400).send({
            'ok': false,
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
        await Cards.findOneAndUpdate({ cardId: cardId }, { bucketId: destinationBucket }, { omitUndefined: true });

        //change sourceBucket's cardOrder in Buckets
        await Buckets.findOneAndUpdate({ bucketId: sourceBucket }, { cardOrder: sourceBucketOrder }, { omitUndefined: true });

        //if sourceBucket and destinationBucket are different, then change destinationBucket's cardOrder in Buckets
        if (sourceBucket !== destinationBucket) {
            await Buckets.findOneAndUpdate({ bucketId: destinationBucket }, { cardOrder: destinationBucketOrder }, { omitUndefined: true });
        };

        res.status(200).send({
            'ok': true,
            message: '카드 위치 수정 성공',
        })
    } catch (error) {
        console.log('카드위치수정 에러', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 카드위치 수정 실패'
        })
    }
});


//카드 삭제
router.delete('/room/:roomId/card', authMiddleware, isMember, async (req, res) => {
    try {
        const { cardId } = req.body;
        const card = await Cards.findOne({ cardId: cardId })
        const bucketId = card.bucketId;
        await Cards.findOneAndDelete({ cardId: cardId });

        //버킷안에있는 cardOrder에서 해당 카드 삭제하기
        await Buckets.updateOne({ bucketId: bucketId }, { $pull: { cardOrder: cardId } });
        res.status(200).send({
            'ok': true,
            message: '카드 삭제 성공'
        })
    } catch (error) {
        console.log('todo deleting error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 카드 삭제 실패'
        })
    }
})



//전체보여주기
router.get('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const bucketOrder = await BucketOrder.findOne({ roomId: roomId });
        const buckets = await Buckets.find({ roomId: roomId });


        res.status(200).send({
            'ok': true,
            message: '전체 보여주기 성공',
            bucketOrder: bucketOrder,
            buckets: buckets
        });

    } catch (error) {
        console.log('전체보여주기 error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 전체 보여주기 실패'
        })
    }
});



//해당 룸의 모든 카드 보여주기
router.get('/room/:roomId', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;

        const allCards = await Cards.find({ roomId: roomId });
        res.status(200).send({
            'ok': true,
            message: '해당 룸 모든 카드보기 성공',
            cards: allCards
        });

    } catch (error) {
        console.log('모든 카드보기 error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 모든 카드보기 실패'
        })
    }
})


//카드 상세보기
router.get('/room/:roomId/card/:cardId', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId, cardId } = req.params;

        const card = await Cards.findOne({ cardId: cardId });


        // 이 룸의 모든 멤버 리스트

        const room = await Rooms.findOne({ roomId: roomId });

        res.status(200).send({

            'ok': true,

            message: '카드 상세보기 성공',
            allMembers: room.members,
            result: card
        });

    } catch (error) {
        console.log('카드상세보기 error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 카드 상세보기 실패'
        })
    }
})



//todo보여주기
router.get('/room/:roomId/todo/:cardId', authMiddleware, isMember, async (req, res) => {
    try {
        const { cardId } = req.params;
        const allTodos = await Todos.find({ cardId: cardId });
        res.status(200).send({
            'ok': true,
            message: '투두 보여주기 성공',
            todos: allTodos
        });

    } catch (error) {
        console.log('투두 보여주기 error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 투두 보여주기 실패'
        })
    }
})

//todo 생성
router.post('/room/:roomId/todo', authMiddleware, isMember, async (req, res) => {
    try {
        const { cardId, todoTitle } = req.body;


        //check if cardId exists

        const newTodo = await Todos.create({ cardId: cardId, todoTitle, todoTitle, isChecked: false });


        res.status(200).send({
            'ok': true,
            message: '투두 생성 성공',
            todoId: newTodo.todoId
        })
    } catch (error) {
        console.log('todo creating error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 투두 생성 실패'
        })
    }
})

//todo 수정
router.patch('/room/:roomId/todo', authMiddleware, isMember, async (req, res) => {
    try {
        const { todoId, todoTitle, isChecked, addMember, removeMember } = req.body;
        //check if cardId exists

        await Todos.findOneAndUpdate({ todoId: todoId }, { todoTitle: todoTitle, isChecked: isChecked }, { omitUndefined: true })


        // if(addMember){

        // }
        if (addMember != null && addMember.length !== 0) {
            await Todos.updateOne({ todoId: todoId }, { $push: { members: addMember } });
        };
        if (removeMember != null && removeMember.length !== 0) {
            await Todos.updateOne({ todoId: todoId }, { $pull: { members: removeMember } });
        };
        res.status(200).send({
            'ok': true,
            message: '투두 수정 성공',
        })
    } catch (error) {
        console.log('todo creating error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 투두 수정 실패'
        })
    }
})


//todo 삭제
router.delete('/room/:roomId/todo', authMiddleware, isMember, async (req, res) => {
    try {
        const { todoId } = req.body;
        await Todos.findOneAndDelete({ todoId: todoId });
        res.status(200).send({
            'ok': true,
            message: '투두 삭제 성공'
        })
    } catch (error) {
        console.log('todo deleting error', error);
        res.status(400).send({
            'ok': false,
            message: '서버에러: 투두 삭제 실패'
        })

    }
})

module.exports = router
