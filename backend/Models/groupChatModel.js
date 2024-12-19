const mongoose = require("mongoose");

// Chat schema for group chat
const chatSchema = new mongoose.Schema({
    name: String,
    members: Array,
}, {
    timestamps: true,
});

const groupChatModel = mongoose.model("GroupChat", chatSchema);

module.exports = groupChatModel;