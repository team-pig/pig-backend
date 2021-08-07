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
        const { roomId } = req.params;
        const { bucketName } = req.body;

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

        //남은 버킷이 하나일때는 삭제 불가해야한다.
        const bucket = await BucketOrder.findOne({ roomId: roomId });
        if (bucket.bucketOrder.length === 1) {
            res.status(400).send({
                'ok': false,
                message: '마지막 남은 버킷은 삭제 불가합니다'
            })
            return;
        }

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
        const { cardId, cardTitle, startDate, endDate, desc, taskMembers, createdAt, modifiedAt, color } = req.body;

        const card = await Cards.findOneAndUpdate({ cardId: cardId },
            {
                startDate: startDate, cardTitle: cardTitle,
                endDate: endDate, desc: desc,
                taskMembers: taskMembers, createdAt: createdAt, modifiedAt: modifiedAt, color: color
            }, { omitUndefined: true });


        const bucketId = card.bucketId;
        // await Movie.updateMany({ _id: movieId, 'comments._id': commentId }, { $set: { 'comments.$.comment': comment, 'comments.$.star': star } })

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
        const { cardOrder } = req.body;
        const bucketIdArray = Object.keys(cardOrder);
        const cardIdArray = Object.values(cardOrder);
        // console.log('bucketIdArrayyy', bucketIdArray);
        // console.log('cardIdArrayyyy', cardIdArray);

        for (i = 0; i < bucketIdArray.length; i++) {
            await Buckets.findOneAndUpdate({ bucketId: bucketIdArray[i] }, { cardOrder: cardIdArray[i] });
        }

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



// original sourceBucketCardOrder = [4,1]
//         original destinationBucketCardOrder = [2,5]

//         incoming sourceOrder = [1]
//         incoming destinationOrder = [2,5,4]
// ------------------------------------------------------------
//         original sourceorder = [1]
//         original destination = [2,5,4]

//         incoming source = [1,4]
//         incoming destination = [2,5]

//         바뀐것만 보내주나? 안바뀐 버킷 cardOrder까지 다 보내주면 그냥 덮어버려졌을것. 그럼 일단 카드가 2군데에 가는 경우는 없을것.
//         만약 그냥 덮어버린다면 새로고침을 해야 바뀐걸 알아차릴수 있을텐데. 매번 새로고침하게할수도 없고...그럼 소켓을 쓰면 다 해결이 되긴함.


//         버킷1[1,4]
//         버킷2[4,5] 라면 첫번쨰버킷을 [1,4]로 변경하고 두번째 버킷에서 4를 빼준다.