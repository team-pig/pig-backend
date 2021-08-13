const mongoose = require("mongoose");

const { Schema } = mongoose;
const messageSchema = new Schema({
    roomId: {
        type: String
    },
    userName: {
        type: String
    },
    userId: {
        type: String
    },
    text: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("Message", messageSchema);
