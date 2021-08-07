const mongoose = require("mongoose");

const { Schema } = mongoose;
const bucketSchema = new Schema({
    bucketId: { auto: true, type: 'objectId', index: true},
    bucketName: {
        type: String,
    },
    roomId: {
        type: String
    },
    cardOrder:{
        type: Array
    }
}
);
// const AutoIncrement = require('mongoose-sequence')(mongoose);
// bucketSchema.plugin(AutoIncrement, {inc_field: 'bucketId'});
module.exports = mongoose.model("Buckets", bucketSchema);