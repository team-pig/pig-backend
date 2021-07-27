const mongoose = require("mongoose");

const { Schema } = mongoose;
const UserSchema = new Schema({
    email: {
        type: String,
        isEmail: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    nickname: {
        type: String,
        required: true,
        unique: true,
    },
});

UserSchema.virtual('userId').get(function () {
    return this._id.toHexString();
});

UserSchema.set('toJSON', {
    virtual: true,
});

module.exports = mongoose.model('user', UserSchema);