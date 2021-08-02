const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const { Schema } = mongoose;
const todoSchema = new Schema({
    todoId: { type: Number, index: true},
    todoTitle: {
        type: String,
    },
    bucketId: {
        type: Number
    },
    cardId: {
        type: Number,
    },
    members: {
        type: [String],
    },
    isChecked: {
        type: Boolean,
    },
}
);
todoSchema.plugin(AutoIncrement, {inc_field: 'todoId'});
module.exports = mongoose.model("Todos", todoSchema);