const express = require("express");
const cors = require("cors");
const app = express();
const { Server } = require("socket.io");
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
const Chat = require('./Models/chatModel');
const Message = require('./Models/messageModel');

const userRoute = require("./Routes/userRoute");
const chatRoute = require("./Routes/chatRoute");
const messageRoute = require("./Routes/messageRoute");
const config = require("./Config/config"); 

require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use("/api/users", userRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);

const port = process.env.PORT || 5000;
const uri = process.env.ATLAS_URI;app.post("/", (req, res) => {
    res.send("Welcome to GogaCHAT");
});

const expressServer = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
}).on('error', (err) => {
    console.error("Server failed to start:", err);
});

// Connection to the database
mongoose.connect(config.mongoURI)
    .then(() => console.log("MongoDB connection established"))
    .catch((error) => console.log("MongoDB connection failed:", error));


    
// Socket server
const io = new Server(expressServer, { 
    cors: {
        origin: config.clientUrl,
    },
});

let onlineUsers = [];

io.on("connection", (socket) => {
    socket.on("addNewUser", (userId) => {
        if (!onlineUsers.some(user => user.userId === userId)) {
            onlineUsers.push({
                userId,
                socketId: socket.id
            });
            io.emit("getOnlineUsers", onlineUsers);
        }
    });

    // When a new chat is created, notify the recipient with both public keys
    socket.on("chatCreated", ({ chatId, recipientId, publicKey }) => {
        console.log("RecipientID", recipientId);
        const user = onlineUsers.find(user => user.userId === recipientId);
        io.to(user.socketId).emit("newChatCreated", { chatId, publicKey });
    });

    
    socket.on("disconnect", async() => {
        const user = onlineUsers.find(user => user.socketId === socket.id);
        if (user) {
            await deleteUserChatsAndMessages(user.userId,io);
            onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
            io.emit("getOnlineUsers", onlineUsers);
        }
    });
    

    socket.on("sendMessage", (message) => {
        const user = onlineUsers.find(user => user.userId === message.recipientId);
        if (user) {
            io.to(user.socketId).emit("getMessage", message);
        }
    });
});


const deleteUserChatsAndMessages = async (userId, io) => {
    try {
        const chats = await Chat.find({ members: userId });
        // Delete all messages and chats from the user
        for (const chat of chats) {

            const otherUserId = chat.members.find((member) => member !== userId);
            const otherUser = onlineUsers.find(user => user.userId === otherUserId);
            // Notify the other user about the chat deletion
            console.log("Emiting chat deletion :", otherUserId);
            io.to(otherUser.socketId).emit("chatDeleted");

            // Delete all messages in this chat
            await Message.deleteMany({ chatId: chat._id });

            await chat.deleteOne({ _id: chat._id });
        }
    } catch (error) {
        console.error(`There was a problem while deleting chat and messages of the user: ${userId}:`, error);
    }
};


