const mongoose = require("mongoose");

const { Schema } = mongoose;
const postsSchema = new Schema({
    contentId:{
        type:Number,
        required:true,
    },
    title: {
        type: String,
        required: true,
    },
    name: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("posts",postsSchema);