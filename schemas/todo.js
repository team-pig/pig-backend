
const mongoose = require("mongoose");


const { Schema } = mongoose;
const todoSchema = new Schema({
    todoId: { auto: true, type: 'objectId', index: true},
    todoTitle: {
        type: String,
    },
    bucketId: {
        type: String
    },
    cardId: {
        type: String,
    },
    members: {
        type: [Object],
    },
    isChecked: {
        type: Boolean,

    },
}
);
module.exports = mongoose.model("Todos", todoSchema);
