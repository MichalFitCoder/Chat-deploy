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
const groupChat = require("./Models/groupChatModel");

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
    socket.on("addNewUser", (userId, userName) => {

        const existingUser = onlineUsers.find(user => user.userId === userId);

        if (existingUser) {
            // Updating the socketId for the existing user
            existingUser.socketId = socket.id;
        } else {
            // Adding the new user to the array
            onlineUsers.push({
                userId,
                socketId: socket.id,
                name: userName
            });
        }

        // Emiting the updated list of online users
        io.emit("getOnlineUsers", onlineUsers);
    });

        // Handling group chat making
        socket.on("groupChatCreated", ({ userId, chatId, name, encryptedKey, creatorPublicKey }) => {
            const user = onlineUsers.find(user => user.userId === userId);
            if (user) {
                io.to(user.socketId).emit("addGroupChat", {
                    chatId,
                    name,
                    encryptedKey,
                    publicKey: creatorPublicKey
                });
            }
        });

    // When a new chat is created, notify the recipient with both public keys
    socket.on("chatCreated", ({ chatId, recipientId, publicKey }) => {
        const user = onlineUsers.find(user => user.userId === recipientId);
        io.to(user.socketId).emit("newChatCreated", { chatId, publicKey });
    });

    
    socket.on("disconnect", async() => {
        const user = onlineUsers.find(user => user.socketId === socket.id);
        if (user) {
            await deleteUserChatsAndMessages(user.userId, io);
            onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
            io.emit("getOnlineUsers", onlineUsers);
        }
    });
    

    socket.on("sendMessage", (message) => {

        message.recipientIds.forEach((recipientId) => {
            const user = onlineUsers.find(user => user.userId === recipientId);
            if (user) {
                io.to(user.socketId).emit("getMessage", message);
            }
        });

    });
});

const deleteUserChatsAndMessages = async (userId, io) => {
    try {
        const oneToOneChats  = await Chat.find({ members: userId });
        const groupChats = await groupChat.find({ members: userId });
        // Delete all messages and chats from the one to one chats
        for (const chat of oneToOneChats) {
            const membersIds = chat.members; // Assuming this is the correct variable

            // Delete messages and the chat
            await Message.deleteMany({ chatId: chat._id });
            await chat.deleteOne({ _id: chat._id });

            membersIds.forEach(memberId => {
                const member = onlineUsers.find(user => user.userId === memberId);
                if (member) {
                    io.to(member.socketId).emit("chatDeleted");
                }
            });
        }

         // Handling group chats
         for (const groupChat of groupChats) {
            const updatedMembers = groupChat.members.filter((member) => member !== userId);
            groupChat.members = updatedMembers;

            if (updatedMembers.length === 1) {
                await Message.deleteMany({ chatId: groupChat._id });
                await groupChat.deleteOne();

                // Notifing all members of the group about the deletion
                groupChat.members.forEach((memberId) => {
                    const otherUser = onlineUsers.find(user => user.userId === memberId);
                    if (otherUser) {
                        io.to(otherUser.socketId).emit("chatDeleted");
                    }
                });

            } else {
                // Save the updated group chat
                await groupChat.save();

                // Notifing all remaining members about the user removal
                updatedMembers.forEach((memberId) => {
                    const otherUser = onlineUsers.find(user => user.userId === memberId);
                    if (otherUser && otherUser.socketId) {
                        io.to(otherUser.socketId).emit("userRemoved");
                    }
                });
            }
        }


    } catch (error) {
        console.error(`There was a problem while deleting chat and messages of the user: ${userId}:`, error);
    }
};


