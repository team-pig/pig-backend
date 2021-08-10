const Buckets = require('../schemas/bucket');
const BucketOrder = require('../schemas/bucketOrder');
const Documents = require('../schemas/document');
const Cards = require('../schemas/card');
const Todos = require('../schemas/todo');

const deleteAll = module.exports = {
    deleteDocuments: async function (roomId) {
        {
            try {
                await Documents.deleteMany({ roomId: roomId });
            } catch (error) {
                console.log('deleting documents function Error', error);

            }

        };
    },
    deleteBuckets: async function (roomId) {
        try {
            //버킷이 하나 남았을경우 삭제 불가이어야한다.
            //버킷 오더에서도 지워야한다

            const buckets = await Buckets.find({ roomId: roomId })
            //extract bucketId from the list of buckets...and put them in bucketsIdsArray
            const bucketIdsArray = [];
            for (i = 0; i < buckets.length; i++) {
                await bucketIdsArray.push(buckets[i].bucketId);
            }
            console.log('bucketIdsArray', bucketIdsArray);


            await Buckets.deleteMany({ roomId: roomId });
            await deleteAll.deleteCards(bucketIdsArray);
        } catch (error) {
            console.log('deletingBuckets function Error', error);

        }
    },
    deleteCards: async function (bucketIdsArray) {
        try {
            console.log('bucketarray received', bucketIdsArray);

            const cardIdsArray = [];
            for (i = 0; i < bucketIdsArray.length; i++) {
                const card = await Cards.find({ bucketId: bucketIdsArray[i] });
                if (!card) {
                    continue;
                }
                for (k = 0; k < card.length; k++) {
                    await cardIdsArray.push(card[k].cardId);
                }

                await Cards.deleteMany({ bucketId: bucketIdsArray[i] });
            }
            console.log('cardsIdsArray', cardIdsArray);

            await deleteAll.deleteTodos(cardIdsArray);

        } catch (error) {
            console.log('deleting Cards function Error', error);

        }
    },
    deleteTodos: async function (cardIdsArray) {
        try {
            console.log('receiving cardIdsarray', cardIdsArray);
            for (i = 0; i < cardIdsArray.length; i++) {
                const todo = await Todos.find({ cardId: cardIdsArray[i] });
                if (!todo) {
                    continue;
                }
                await Todos.deleteMany({ cardId: cardIdsArray[i] });
            }
        } catch (error) {
            console.log('deletingTodos function Error', error);

        }
    }
}






