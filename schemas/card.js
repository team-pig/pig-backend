const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const { Schema } = mongoose;
const cardSchema = new Schema({
    cardId: { type: Number, index: true},
    bucketId: {
        type: Number
    },
    cardTitle: {
        type: String,
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
cardSchema.plugin(AutoIncrement, {inc_field: 'cardId'});
module.exports = mongoose.model("Cards", cardSchema);