const mongoose = require("mongoose");

// Chat schema for one-to-one communication
const chatSchema = new mongoose.Schema({
    members: Array,
    publicKey1: { type: String, required: true }, // Public key of the first member
    publicKey2: { type: String, required: true }, // Public key of the second member
}, {
    timestamps: true,
});

const chatModel = mongoose.model("Chat", chatSchema);

module.exports = chatModel;