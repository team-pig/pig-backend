const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const { Schema } = mongoose;
const bucketSchema = new Schema({
    bucketId: { type: Number, index: true},
    bucketName: {
        type: String,
    },
    roomId: {
        type: String
    },
    // stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }]
}
);
bucketSchema.plugin(AutoIncrement, {inc_field: 'bucketId'});
module.exports = mongoose.model("Buckets", bucketSchema);