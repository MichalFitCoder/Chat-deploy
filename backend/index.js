const express = require("express");
const cors = require("cors");
const app = express();
const {Server} = require("socket.io")

const mongoose = require("mongoose");
mongoose.set('strictQuery', true);

const userRoute = require("./Routes/userRoute")
const chatRoute = require("./Routes/chatRoute")
const messageRoute = require("./Routes/messageRoute")

require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use("/api/users", userRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);

// Takes port from the hosting servicenp
const port = process.env.PORT || 5000;
const uri = process.env.ATLAS_URI;


app.post("/", (req,res) =>{
    res.send("Welcome to GogaCHAT")
});


const expressServer = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}).on('error', (err) => {
    console.error("Server failed to start:", err);
});

// Connection to the database
mongoose.connect(uri)
.then(() => console.log("MongoDB connection established"))
.catch((error) => console.log("MongoDB connection failed:", error));

// Socket server
const io = new Server(expressServer, { 
    cors: {
        origin: process.env.CLIENT_URL, 
    },
});

let onlineUsers = [];

io.on("connection", (socket) => {

    // Listening to the connection
    socket.on("addNewUser", (userId)=>{

        // Adding online user if not added already
        if(!onlineUsers.some(user => user.userId === userId)){
            onlineUsers.push({
                userId,
                socketId: socket.id
            });

            // Sending online users table to show which users are online
            io.emit("getOnlineUsers", onlineUsers);
        }

    });

    socket.on("disconnect",() =>{
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket?.id);

        io.emit("getOnlineUsers", onlineUsers);
    });

    // Add new messages in real time
    socket.on("sendMessage",(message) =>{
        const user = onlineUsers.find(user => user.userId === message.recipientId);
        if(user){
            io.to(user.socketId).emit("getMessage", message);
        }
    });   
    
});
