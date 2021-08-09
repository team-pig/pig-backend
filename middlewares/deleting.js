const Buckets = require('../schemas/bucket');
const BucketOrder = require('../schemas/bucketOrder');
const Documents = require('../schemas/document');
const Cards = require('../schemas/card');
const Todos = require('../schemas/todo');
// const deleteAll = require('deleting.js');


const deleteAll = module.exports = {
    deleteDocuments: async function (roomId) {
        {
            try {
                await Documents.deleteMany({ roomId: roomId });
            } catch (error) {
                console.log('deleting documents function Error', error);
                res.status(400).send({
                    'ok': false,
                    message: '서버에러: 룸에 속해있는 도큐먼트들 삭제 실패'
                })
            }

        };
    },
    deleteBuckets: async function (roomId) {
        try {
            //버킷이 하나 남았을경우 삭제 불가이어야한다.


            const buckets = await Buckets.find({ roomId: roomId })
            //extract bucketId from the list of buckets...and put them in bucketsIdsArray
            const bucketIdsArray = [];
            for (i = 0; i < buckets.length; i++) {
                bucketIdsArray.push(buckets[i].bucketId);
            }
            console.log('bucketIdsArray', bucketIdsArray);


            await Buckets.deleteMany({ roomId: roomId });
            deleteAll.deleteCards(bucketIdsArray);
        } catch (error) {
            console.log('deletingBuckets function Error', error);
            res.status(400).send({
                'ok': false,
                message: '서버에러: 카드에 속해있는 투두들 삭제 실패'
            })
        }
    },
    deleteCards: async function deleteCards(bucketIdsArray) {
        try {
            console.log('bucketarray received', bucketIdsArray);

            const cardIdsArray = [];
            for (i = 0; i < bucketIdsArray.length; i++) {
                const card = await Cards.findOne({ bucketId: bucketIdsArray[i] });
                if (!card) {
                    continue
                }
                cardIdsArray.push(card.cardId);
                await Cards.deleteOne({ bucketId: bucketIdsArray[i] });
            }

            deleteAll.deleteTodos(cardIdsArray);

        } catch (error) {
            console.log('deleting Cards function Error', error);
            res.status(400).send({
                'ok': false,
                message: '서버에러: 버킷에 속해있는 카드들 삭제 실패'
            })
        }
    },
    deleteTodos: async function deleteTodos(cardIdsArray) {
        try {
            console.log('receiving cardIdsarray', cardIdsArray);
            for (i = 0; i < cardIdsArray.length; i++) {
                const todo = await Todos.findOne({ cardId: cardIdsArray[i] });
                if (todo) {
                    await Todos.deleteOne({ cardId: cardIdsArray[i] });
                }
            }
        } catch (error) {
            console.log('deletingTodos function Error', error);
            res.status(400).send({
                'ok': false,
                message: '서버에러: 카드에 속해있는 투두들 삭제 실패'
            })
        }
    }
}






