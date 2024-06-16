const { Schema, model } = require('mongoose')

const UserSchema = new Schema({
    name: String,
    chatId: Number,
    phoneNumber: String,
    admin: {
        type: Boolean,
        default: false
    },
    action: String,
    status: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: Date,
})

module.exports = model("BotUsers", UserSchema)
