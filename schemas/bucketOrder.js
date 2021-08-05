const mongoose = require("mongoose");

const { Schema } = mongoose;
const bucketOrderSchema = new Schema({
    roomId: {
        type: String,
        required: true,
    },
    bucketOrder: {
        type: [String]
    }
}
);
module.exports = mongoose.model("BucketOrder", bucketOrderSchema);