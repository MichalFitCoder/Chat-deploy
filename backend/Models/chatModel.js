const mongoose = require("mongoose")

// Chat schema for one to one communication
const chatSchema = new mongoose.Schema({
    members: Array
},{
    timestamps: true,
})

const chatModel = mongoose.model("Chat", chatSchema);

module.exports = chatModel;
