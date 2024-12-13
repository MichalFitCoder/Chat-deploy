const chatModel = require("../Models/chatModel")
const userModel = require("../Models/userModel")

// create Chat
const createChat = async(req, res) =>{
    const {firstId, secondId} = req.body;
    try{
        const chat = await chatModel.findOne({
            members: {$all: [firstId, secondId]}
        });

        // If chat exist return it
        if(chat) return res.status(200).json(chat);

        const firstUser = await userModel.findById(firstId);
        const secondUser = await userModel.findById(secondId);

        if (!firstUser || !secondUser) {
            return res.status(404).json({ error: "Users not found, cannot create chat" });
        }

        // Creating chat if it does not exist
        const newChat = new chatModel({
            members: [firstId, secondId],
            publicKey1: firstUser?.publicKey,
            publicKey2: secondUser?.publicKey,
        });

        const response = await newChat.save();
        return res.status(200).json(response);

    }catch(error){
        console.log(error);
        return res.status(500).json(error);
    }
}

// get User Chats (To show existing chats in the database)

const findUserChats = async(req,res) =>{
    const userId = req.params.userId;

    try{
        const chats = await chatModel.find({
            members: {$in: [userId]}
        });

        return res.status(200).json(chats);

    }catch(error){
        console.log(error);
        return res.status(500).json(error);
    }
}

// find Chat (To show messages when clicking on a specific chat)

const findChat = async(req,res) =>{
    const {firstId, secondId} = req.params;

    try{
        const chat = await chatModel.findOne({
            members: {$all: [firstId, secondId]}
        });

        return res.status(200).json(chat);

    }catch(error){
        console.log(error);
        return res.status(500).json(error);
    }
}

module.exports = {createChat, findUserChats, findChat};