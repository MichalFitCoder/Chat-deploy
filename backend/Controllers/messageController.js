const messageModel = require("../Models/messageModel")

// creating Messages
const createMessage = async(req,res) =>{
    const {chatId, senderId, text} = req.body
    const message = new messageModel({
        chatId, senderId, text 
    })

    try{
        const response = await message.save();
        return res.status(200).json(response);
    }catch(error){
        console.log(error);
        return res.status(500).json(error);
    }
}
// geting Messages
const getMessages = async(req,res) =>{
    const {chatId} = req.params;  

    try{
        const messages = await messageModel.find({chatId});
        return res.status(200).json(messages);

    }catch(error){
        console.log(error);
        return res.status(500).json(error);
    }
}

module.exports = {createMessage,getMessages};