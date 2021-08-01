const mongoose = require("mongoose");

const { Schema } = mongoose;
const bucketSchema = new Schema({
    bucketId: { auto: true, type: 'objectId', index: true},
    bucketName: {
        type: String,
    },
    bucketOrder: {
        type: [String]
    },
    roomId: {
        type: String
    },
    // stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }]
}
);

module.exports = mongoose.model("Buckets", bucketSchema);