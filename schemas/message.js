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
    submitTime: {
        type: String
    },
});
module.exports = mongoose.model("Message", messageSchema);
