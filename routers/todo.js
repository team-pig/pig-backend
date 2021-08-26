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
const deleteAll = require('../middlewares/deleting');
const router = express.Router();
const mongoose = require('mongoose');
const { kStringMaxLength } = require('buffer');

mongoose.set('useFindAndModify', false);

// memberInfo = await User.findOne({ _id: memberId }, { email: false, password: false, __v: false }).lean();



//버킷 만들기
router.post('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { bucketName } = req.body;

        //create Bucket
        const newBucket = await Buckets.create({ bucketName: bucketName, roomId: roomId, cardOrder: [] });

        const bucketId = newBucket.bucketId

        //버킷오더 테이블에 버켓이 없다면 오더 만들어주기    //이 코드 room.js에 보냈음.
        // const bucketExist = await BucketOrder.findOne({ roomId: roomId });
        // if (!bucketExist) {
        //await BucketOrder.create({ roomId: roomId });
        // }

        //bucketorder 어레이 맨앞으로 넣기
        await BucketOrder.updateOne({ roomId: roomId }, { $push: { bucketOrder: { $each: [bucketId], $position: 0 } } });

        res.status(200).send({
            'ok': true,
            message: '버킷 생성 성공',
            bucketId: bucketId

        });
    } catch (error) {
        console.log('버킷 만들기 캐치 에러', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: 버킷 만들기 실패'
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
            errorMessage: '서버에러: 버킷 위치/내용 수정 실패'
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
                errorMessage: '마지막 남은 버킷은 삭제 불가합니다'
            })
            return;
        }

        await Buckets.findOneAndDelete({ bucketId: bucketId });

        //버킷오더에서도 해당 버킷 삭제하기
        await BucketOrder.updateOne({ roomId: roomId }, { $pull: { bucketOrder: bucketId } });

        await deleteAll.deleteCards([bucketId]);
        res.status(200).send({
            'ok': true,
            message: '버킷 삭제 성공'
        })
    } catch (error) {
        console.log('bucket deleting error', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: 버킷 삭제 실패'
        })
    }
})


//카드 생성
router.post('/room/:roomId/card', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { bucketId, cardTitle, color, startDate, endDate } = req.body;

        const newCard = await Cards.create({ bucketId: bucketId, roomId: roomId, cardTitle: cardTitle, color: color, startDate: startDate, endDate: endDate, memberCount: 0 });

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
            errorMessage: '서버에러: 카드생성 실패'
        })
    }
})

//카드 내용 수정
router.patch('/room/:roomId/card', authMiddleware, isMember, async (req, res) => {
    try {
        const { cardId, cardTitle, startDate, endDate, desc, createdAt, modifiedAt, color } = req.body;

        const card = await Cards.findOneAndUpdate({ cardId: cardId },
            {
                startDate: startDate, cardTitle: cardTitle,
                endDate: endDate, desc: desc,
                createdAt: createdAt, modifiedAt: modifiedAt, color: color
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
            errorMessage: '서버에러: 카드 내용 수정 실패'
        })
    }
});

//카드 위치 수정
router.patch('/room/:roomId/cardLocation', authMiddleware, isMember, async (req, res) => {
    try {
        //added cardId and destinationBucketId


        const { roomId } = req.params;
        const { cardOrder, cardId, destinationBucketId } = req.body;
        const bucketIdArray = Object.keys(cardOrder);
        const cardIdArray = Object.values(cardOrder);
        // console.log('bucketIdArrayyy', bucketIdArray);
        // console.log('cardIdArrayyyy', cardIdArray);
        // 카드ID로 뭘 찾아서 destination버켓아이디 수정하기
        for (i = 0; i < bucketIdArray.length; i++) {
            await Buckets.findOneAndUpdate({ bucketId: bucketIdArray[i] }, { cardOrder: cardIdArray[i] });
        }
        await Cards.findOneAndUpdate({cardId: cardId},{ $set: {bucketId: destinationBucketId}});

        res.status(200).send({
            'ok': true,
            message: '카드 위치 수정 성공',
        })
    } catch (error) {
        console.log('카드위치수정 에러', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: 카드위치 수정 실패'
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
        await deleteAll.deleteTodos([cardId]);

        res.status(200).send({
            'ok': true,
            message: '카드 삭제 성공'
        })
    } catch (error) {
        console.log('todo deleting error', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: 카드 삭제 실패'
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
            errorMessage: '서버에러: 전체 보여주기 실패'
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
            errorMessage: '서버에러: 모든 카드보기 실패'
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
            errorMessage: '서버에러: 카드 상세보기 실패'
        })
    }
})



//todo보여주기
router.get('/room/:roomId/todo/:cardId', authMiddleware, isMember, async (req, res) => {
    try {
        const { cardId } = req.params;
        const allTodos = await Todos.find({ cardId: cardId });

        //방이 삭제되면 -> 버킷 다 삭제 -> 카드 내용물도 삭제 - > 카드 삭제되면 -> 투두도 다 삭제 

        //투두 생성할때 닉네임 스트링을 넣어주면 여기서 포문 돌려서 변경된 닉네임 가지고와서 보내줄 필요없다.
        //하지만 그럴경우 닉네임이 변경되면 그게 반영되지않고 생성할때의 닉네임이 보존된다.

        //여기서 더블 포문안쓰고 할 방법이 있는가?
        //닉네임을 변경하면 해당 유저의 닉네임이 저장된곳을 다 찾아서 변경해주는게 더나은가?
        //

        // for (i = 0; i < allTodos.length; i++) {
        //     for (k = 0; k < allTodos[i].members.length; k++) {
        //         console.log('allmembers', allTodos[i].members[k]);

        //     }
        // }

        res.status(200).send({
            'ok': true,
            message: '투두 보여주기 성공',
            todos: allTodos
        });

    } catch (error) {
        console.log('투두 보여주기 error', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: 투두 보여주기 실패'
        })
    }
})

//todo 생성
router.post('/room/:roomId/todo', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { cardId, todoTitle } = req.body;

        const newTodo = await Todos.create({ roomId: roomId, cardId: cardId, todoTitle: todoTitle, isChecked: false });

        res.status(200).send({
            'ok': true,
            message: '투두 생성 성공',
            todoId: newTodo.todoId
        })
    } catch (error) {
        console.log('todo creating error', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: 투두 생성 실패'
        })
    }
})

//todo 수정
router.patch('/room/:roomId/todo', authMiddleware, isMember, async (req, res) => {

    //프론트엔드에서 이미 추가되어있는 멤버를 또 추가할수있게 되어있나?
    //멤버를 삭제할대도 해당 투두에 이미 등록되어있는 멤버만 보여주어야할것.

    try {
        const { todoId, todoTitle, isChecked, addMember, removeMember } = req.body;

        const todo = await Todos.findOneAndUpdate({ todoId: todoId }, { todoTitle: todoTitle, isChecked: isChecked }, { omitUndefined: true })

        // if(addMember){

        // }


        if (addMember != null && addMember.length !== 0) {
            const user = await Users.findOne({ _id: addMember });
            const nickname = user.nickname;
            const add = { memberId: addMember, memberName: nickname }
            await Todos.updateOne({ todoId: todoId }, { $push: { members: add } });

            //카드의 memberCount update
            const cardId = todo.cardId;
            const allTodos = await Todos.find({ cardId: cardId });
            let array = [];
            for (let i = 0; i < allTodos.length; i++) {
                for (let k = 0; k < allTodos[i].members.length; k++) {
                    array.push(allTodos[i].members[k].memberId);
                }
            }
            console.log('ARRAYY', array);
            //중복 체크
            let finalArray = [];
            for (let i = 0; i < array.length; i++) {
                if (!finalArray.includes(array[i])) {
                    finalArray.push(array[i]);
                }
            }
            console.log('finalarray', finalArray);
            const memberCount = finalArray.length;
            console.log('membercount', memberCount);

            await Cards.findOneAndUpdate({ cardId: cardId }, { memberCount: memberCount });
        };

        
        if (removeMember != null && removeMember.length !== 0) {
            const user = await Users.findOne({ _id: removeMember });
            const nickname = user.nickname;
            const remove = { memberId: addMember, memberName: nickname }
            await Todos.updateOne({ todoId: todoId }, { $pull: { members: remove } });

            //카드의 memberCount update
            const cardId = todo.cardId;
            const allTodos = await Todos.find({ cardId: cardId });
            let array = [];
            for (let i = 0; i < allTodos.length; i++) {
                for (let k = 0; k < allTodos[i].members.length; k++) {
                    array.push(allTodos[i].members[k].memberId);
                }
            }
            console.log('ARRAYY', array);
            let finalArray = [];
            for (let i = 0; i < array.length; i++) {
                if (!finalArray.includes(array[i])) {
                    finalArray.push(array[i]);
                }
            }
            console.log('finalarray', finalArray);
            const memberCount = finalArray.length;
            console.log('membercount', memberCount);

            await Cards.findOneAndUpdate({ cardId: cardId }, { memberCount: memberCount });
        };






        // const newCount =
        // await Cards.findOneAndUpdate({ cardId: cardId }, { memberCount: newCount });

        res.status(200).send({
            'ok': true,
            message: '투두 수정 성공',
        })
    } catch (error) {
        console.log('todo creating error', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: 투두 수정 실패'
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
            errorMessage: '서버에러: 투두 삭제 실패'
        })

    }
})

//메인 페이지 유저 할일 리스트 보여주기
router.get('/room/:roomId/main/todos', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params
        const userId = res.locals.user._id;

        // 단순한 [String] array에서 특정 값이 있는지 찾고싶을때는 그냥 x:y 해도 된다
        //memberInfo = await User.findOne({ _id: memberId }, { email: false, password: false, __v: false }).lean();

        const checked = await Todos.find({ roomId: roomId, members: { $elemMatch: { memberId: userId } }, isChecked: true }, { members: false, _id: false, roomId: false, cardId: false, __v: false });
        const notChecked = await Todos.find({ roomId: roomId, members: { $elemMatch: { memberId: userId } }, isChecked: false }, { members: false, _id: false, roomId: false, cardId: false, __v: false });
        res.status(200).send({
            'ok': true,
            message: '유저 할일 보여주기 성공',
            result: {
                checked: checked,
                notChecked: notChecked
            }
        });
    } catch (error) {
        console.log('메인페이지 유저 할일 보여주기 error', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: 유저 할일 보여주기 실패'
        })
    }
})


//닉네임 변경
router.put('/nickname', authMiddleware, async (req, res,) => {
    try {
        //최대한 DB에 말거는 횟수 적도록.
        const userId = res.locals.user._id;
        const { newNickname } = req.body;
        await Users.findByIdAndUpdate(userId, ({ nickname: newNickname }));

        const inRoom = await Rooms.find({ members: userId });
        if (inRoom) {


            const inCard = await Cards.find({})
            if (inCard) {

            }
        }



        res.status(200).send({
            'ok': true,
            message: '닉네임 변경 성공'
        })
    } catch (error) {
        console.log('닉네임 변경에러', error);
        res.status(400).send({
            'ok': false,
            errorMessage: '서버에러: 닉네임 변경 실패'
        })
    }

})
module.exports = router