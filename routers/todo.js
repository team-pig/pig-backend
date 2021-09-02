const express = require('express');
const Buckets = require('../schemas/bucket');
const BucketOrder = require('../schemas/bucketOrder');
const Cards = require('../schemas/card');
const Todos = require('../schemas/todo');
const Rooms = require('../schemas/room');
const Users = require('../schemas/users');
const authMiddleware = require('../middlewares/auth-middleware');
const isMember = require('../middlewares/isMember');
const deleteAll = require('../middlewares/deleting');
const router = express.Router();
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);

//버킷 만들기
router.post('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { bucketName } = req.body;
        //create Bucket
        const newBucket = await Buckets.create({ bucketName: bucketName, roomId: roomId, cardOrder: [] });

        const bucketId = newBucket.bucketId

        //새로 만들어진 버킷을 bucketorder 어레이 맨앞으로 넣기
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


// 버킷 내용/위치 수정
router.patch('/room/:roomId/bucket', authMiddleware, isMember, async (req, res) => {
    try {
        const { bucketId, bucketName, bucketOrder } = req.body;
        const { roomId } = req.params;

        await Buckets.updateOne({ bucketId: bucketId }, { bucketName: bucketName }, { omitUndefined: true });
        await BucketOrder.updateOne({ roomId: roomId }, { bucketOrder: bucketOrder }, { omitUndefined: true });

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

        const bucket = await BucketOrder.findOne({ roomId: roomId });

        //남은 버킷이 하나일때는 삭제 불가해야한다.
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

        //삭제되는 버킷에 종속된 카드와 투두도 함께 삭제
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

        //버킷의 cardOrder array 맨 뒤로 넣기
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

        await Cards.findOneAndUpdate({ cardId: cardId },
            {
                startDate: startDate, cardTitle: cardTitle,
                endDate: endDate, desc: desc,
                createdAt: createdAt, modifiedAt: modifiedAt, color: color
            }, { omitUndefined: true });
        
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
        const { cardOrder, cardId, destinationBucketId } = req.body;
        //클라이언트에서 넘겨준 cardOrder Object의 key와 value를 쪼개서 각각 array에 담는다.
        const bucketIdArray = Object.keys(cardOrder);
        const cardIdArray = Object.values(cardOrder);

        //각각의 bucket마다 cardOrder를 수정해준다
        for (i = 0; i < bucketIdArray.length; i++) {
            await Buckets.findOneAndUpdate({ bucketId: bucketIdArray[i] }, { cardOrder: cardIdArray[i] });
        }
        await Cards.findOneAndUpdate({ cardId: cardId }, { $set: { bucketId: destinationBucketId } });

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
        //해당 카드에 종속되어있는 모든 투두 삭제하기
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


//칸반 보드 전체보여주기
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
        const room = await Rooms.findOne({ roomId: roomId });

        //해당 룸의 모든 멤버 리스트도 보내주기
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
    try {
        const { todoId, todoTitle, isChecked, addMember, removeMember } = req.body;
        const todo = await Todos.findOneAndUpdate({ todoId: todoId }, { todoTitle: todoTitle, isChecked: isChecked }, { omitUndefined: true });

        //addMember에 정보가 담겨올경우 투두에 멤버를 추가한다.
        if (addMember != null && addMember.length !== 0) {
            const user = await Users.findOne({ _id: addMember });
            const nickname = user.nickname;
            const avatar = user.avatar;
            const color = user.color;
            const add = { memberId: addMember, memberName: nickname, avatar: avatar, color: color };
            await Todos.updateOne({ todoId: todoId }, { $push: { members: add } });

            //카드의 memberCount update
            const cardId = todo.cardId;
            const allTodos = await Todos.find({ cardId: cardId });
            // 일단 카드의 모든 투두에 배정되어있는 멤버를 어레이에 담는다
            let array = [];
            for (let i = 0; i < allTodos.length; i++) {
                for (let k = 0; k < allTodos[i].members.length; k++) {
                    array.push(allTodos[i].members[k].memberId);
                }
            }
            //중복이 되지않게 finalArray에담는다.
            let finalArray = [];
            for (let i = 0; i < array.length; i++) {
                if (!finalArray.includes(array[i])) {
                    finalArray.push(array[i]);
                }
            }
            //finalArray의 길이가 곧 해당 카드에 배정된 총 멤버의 수.
            const memberCount = finalArray.length;
            await Cards.findOneAndUpdate({ cardId: cardId }, { memberCount: memberCount });
        };

        //removeMember에 정보가 담겨올우 해당 투두에서 멤버를 제거한다
        if (removeMember != null && removeMember.length !== 0) {
            const user = await Users.findOne({ _id: removeMember });
            const nickname = user.nickname;
            const remove = { memberId: addMember, memberName: nickname }
            await Todos.updateOne({ todoId: todoId }, { $pull: { members: remove } });

            //카드의 memberCount update
            const cardId = todo.cardId;
            const allTodos = await Todos.find({ cardId: cardId });
            // 일단 카드의 모든 투두에 배정되어있는 멤버를 어레이에 담는다
            let array = [];
            for (let i = 0; i < allTodos.length; i++) {
                for (let k = 0; k < allTodos[i].members.length; k++) {
                    array.push(allTodos[i].members[k].memberId);
                }
            }

            //중복이 되지않게 finalArray에담는다.
            let finalArray = [];
            for (let i = 0; i < array.length; i++) {
                if (!finalArray.includes(array[i])) {
                    finalArray.push(array[i]);
                }
            }
            //finalArray의 길이가 곧 해당 카드에 배정된 총 멤버의 수.
            const memberCount = finalArray.length;
            await Cards.findOneAndUpdate({ cardId: cardId }, { memberCount: memberCount });
        };

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

        // 워크스페이스의 모든 투두를 체크 된것과 체크안된것으로 나누어서 변수에 넣고 클라이언트에게 보내준다. 
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
});

module.exports = router