const {mongoose, model} = require('mongoose');

//schema
const taskSchema = new mongoose.Schema({
    fullName: String,
    title: String,
    description: String,
    phone: String,
    deadline: Date,
    completed: { type: Boolean, default: false },
    chatId: Number 
});
``
module.exports = model("Task", taskSchema)