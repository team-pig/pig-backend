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
    nickname: {
        type: String
    },
    createdAt: {
        type: Date
    },
    modifiedAt: {
        type: Date
    },
    canEdit:{
        type: Boolean
    }
    // stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }]
}
);

module.exports = mongoose.model("Documents", documentSchema);