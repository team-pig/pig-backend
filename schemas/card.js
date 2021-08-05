
const mongoose = require("mongoose");


const { Schema } = mongoose;
const cardSchema = new Schema({
    cardId: { auto: true, type: 'objectId', index: true},
    bucketId: {
        type: String
    },
    cardTitle: {
        type: String,
    },
    color:{
        type: String
    },

    startDate: {
        type: String,
    },
    endDate: {
        type: String,
    },
    desc: {
        type: String,
    },
    taskMembers: {
        type: [String],
    },
    createdAt: {
        type: String,
    },
    modifiedAt: {
        type: String,
    },
    roomId: {
        type: String
    },

}
);
module.exports = mongoose.model("Cards", cardSchema);

