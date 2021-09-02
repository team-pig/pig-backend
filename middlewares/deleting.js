const Buckets = require('../schemas/bucket');
const BucketOrder = require('../schemas/bucketOrder');
const Documents = require('../schemas/document');
const Cards = require('../schemas/card');
const Todos = require('../schemas/todo');

//방 -> 문서, 버킷 -> 카드 -> 투두 순으로 종속되어있는 구조
//유저가 하나를 삭제할 경우 도미노 방식으로 그 안에 종속되어있는 모든것을 함께 삭제하는 코드입니다.
//예를 들어 버킷을 삭제할경우 해당 버킷안에 들어있는 카드와 투두리스트가 모두 삭제됩니다.

const deleteAll = module.exports = {
    deleteDocuments: async function (roomId) {
        {
            try {
                await Documents.deleteMany({ roomId: roomId });
            } catch (error) {
                console.log('deleting documents function Error', error);
                throw new Error(error);
            }
        };
    },
    deleteBuckets: async function (roomId) {
        try {
            //삭제되는 워크스페이스 방에 속해있는 모든 버킷을 찾고 버킷아이디를 array에 넣어줍니다.
            const buckets = await Buckets.find({ roomId: roomId });
            const bucketIdsArray = [];
            for (i = 0; i < buckets.length; i++) {
                bucketIdsArray.push(buckets[i].bucketId);
            }
            await Buckets.deleteMany({ roomId: roomId });
            //버킷안에 담겨있는 카드를 삭제하기위해 버킷아이디가 담긴 array를 deleteCards 함수로 넘겨줍니다. 
            await deleteAll.deleteCards(bucketIdsArray);
        } catch (error) {
            console.log('deletingBuckets function Error', error);
            throw new Error(error);
        }
    },
    deleteCards: async function (bucketIdsArray) {
        try {
            //버킷안에 있던 모든 카드를 찾고 cardId를 cardIdsArray에 넣어줍니다
            //버킷에 카드가 없을경우 해당 for문을 스킵합니다
            const cardIdsArray = [];
            for (i = 0; i < bucketIdsArray.length; i++) {
                const card = await Cards.find({ bucketId: bucketIdsArray[i] });
                if (!card) {
                    continue;
                }
                for (k = 0; k < card.length; k++) {
                    cardIdsArray.push(card[k].cardId);
                }
                await Cards.deleteMany({ bucketId: bucketIdsArray[i] });
            }
            //카드안에 담겨있는 투두리스트를 삭제하기 위해 카드아이디가 담긴 array를 deleteTodos 함수로 넘겨줍니다.
            await deleteAll.deleteTodos(cardIdsArray);
        } catch (error) {
            console.log('deleting Cards function Error', error);
            throw new Error(error);
        }
    },
    deleteTodos: async function (cardIdsArray) {
        try {
            //카드마다 속해있는 투두리스트를 찾아서 삭제합니다.
            //카드에 투두가 없다면 해당 for문을 스킵합니다.
            for (i = 0; i < cardIdsArray.length; i++) {
                const todo = await Todos.find({ cardId: cardIdsArray[i] });
                if (!todo) {
                    continue;
                }
                await Todos.deleteMany({ cardId: cardIdsArray[i] });
            }
        } catch (error) {
            console.log('deletingTodos function Error', error);
            throw new Error(error);
        }
    }
}






