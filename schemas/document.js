const mongoose = require("mongoose");

const { Schema } = mongoose;
const documentSchema = new Schema({
    title: {
        type: String,
    },
    content: {
        type: String
    },
    userId: {
        type: String
    }
});

module.exports = mongoose.model("Documents", documentSchema);