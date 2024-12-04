import { createContext, useState, useEffect, useCallback, useDebugValue } from "react";
import { getRequest, baseUrl, postRequest } from "../utils/services";
import {io} from "socket.io-client"

export const ChatContext = createContext();
export const ChatContextProvider = ({children, user}) => {
    const [userChats, setUserChats] = useState([]);
    const [UserChatsLoading, setUserChatsLoading] = useState(false);
    const [userChatsError, setUserChatsError] = useState(null);
    const [potentialChats, setPotentialChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState(null);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState(null);
    const [sendTextMessageError, setsendTextMessageEroor] = useState(null);
    const [newMessage, setNewMessage] = useState(null);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Initializing socket
    useEffect(()=>{
        const newSocket = io(import.meta.env.VITE_SOCKET_URL);
        setSocket(newSocket);

        return () =>{
            newSocket.disconnect();
        };
    },[user]);

    // Adding online users
    useEffect(()=>{
        if(socket === null) return;
        socket.emit("addNewUser", user?._id);
        socket.on("getOnlineUsers", (res)=>{
            setOnlineUsers(res);
        });

        return () =>{
            socket.off("getOnlineUsers");
        }
    }, [socket]);

    // Sending messages
    useEffect(()=>{
        if(socket === null) return;

        const recipientId = currentChat?.members?.find((id) => id !== user?._id)
        socket.emit("sendMessage",{...newMessage, recipientId});

    }, [newMessage]);

    // Reciving messages
    useEffect(() =>{
        if(socket === null) return;

        socket.on("getMessage", res => {
            if(currentChat?._id !== res.chatId) return;
            setMessages((prev) => [...prev, res]);
        })

        return () => {
            socket.off("getMessage");
        }

    }, [socket, currentChat]);


    useEffect(() => {
        const getUsers = async() =>{
            const response = await getRequest(`${baseUrl}/users`);

            if(response.error){
                return console.log("Error fetching users", response);
            }

            const pChats = response.filter((u) =>{
                let hasChat = false;
                // Exluding user from potentialChats
                if(user?._id === u._id) return false;

                if(userChats){
                    hasChat = userChats?.some((chat) =>{
                        return chat.members[0] === u._id || chat.members[1] === u._id;
                    })
                }
                return !hasChat;
            });

            setPotentialChats(pChats)
        }
        getUsers();
    }, [userChats])

    useEffect(() => {
        const getUserChats = async()=>{
            if(user?._id){
                setUserChatsLoading(true);
                setUserChatsError(null);
                const response = await getRequest(`${baseUrl}/chats/${user?._id}`);

                setUserChatsLoading(false);
                if(response.error){
                    return setUserChatsError(response);
                }
                setUserChats(response);
            }
        };

        getUserChats()
    }, [user]);

    useEffect(() => {
        const getMessages = async()=>{

                setMessagesLoading(true);
                setMessagesError(null);

                const response = await getRequest(`${baseUrl}/messages/${currentChat?._id}`);

                setMessagesLoading(false);

                if(response.error){
                    return setMessagesError(response);
                }
                setMessages(response);
            };

        getMessages()
    }, [currentChat]);


    const updateCurrentChat = useCallback((chat)=>{
        setCurrentChat(chat);
    },[])

    const sendTextMessage = useCallback(async(textMessage, sender, currentChatId, setTextMessage ) =>{
        if(!textMessage) return;

        const response = await postRequest(`${baseUrl}/messages`, JSON.stringify({
            chatId: currentChatId,
            senderId: sender?._id,
            text: textMessage
        }));

        if(response.error){
            return setsendTextMessageEroor(response);
        }

        setNewMessage(response)
        setMessages((prev)=> [...prev, response])
        setTextMessage("")
        
    },[]); 

    const createChat = useCallback( async(firstId, secondId) => {
        const response = await postRequest(`${baseUrl}/chats`, JSON.stringify({
            firstId,
            secondId
        }));

        if(response.error){
            return console.log("Error fetching users", response); 
        }

        setUserChats((prev) => [...prev, response]);
    },[]);

    return <ChatContext.Provider value = {{
        userChats,
        UserChatsLoading,
        userChatsError,
        potentialChats,
        createChat,
        updateCurrentChat,
        messages,
        messagesLoading,
        messagesError,
        currentChat,
        sendTextMessage,
        onlineUsers,
    }}>{children}</ChatContext.Provider>
}