const mongoose = require("mongoose");

const { Schema } = mongoose;
const documentSchema = new Schema({
    documentId: { auto: true, type: 'objectId', index: true},
    title: {
        type: String,
    },
    content: {
        type: String
    },
    userId: {
        type: String
    },
    roomId: {
        type: String
    },
    // stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }]
}
);

module.exports = mongoose.model("Documents", documentSchema);