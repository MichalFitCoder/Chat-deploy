import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { getRequest, baseUrl, postRequest } from "../utils/services";
import { io } from "socket.io-client";
import forge from "node-forge";
import { importPublicKey, importPrivateKey , getStoredSharedKey, storeSharedKey, deriveSharedKey} from "../security/keyManager";

export const ChatContext = createContext();

export const ChatContextProvider = ({ children, user }) => {
    const [userChats, setUserChats] = useState([]);
    const [userChatsLoading, setUserChatsLoading] = useState(false);
    const [userChatsError, setUserChatsError] = useState(null);
    const [potentialChats, setPotentialChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState(null);
    const [sendTextMessageError, setSendTextMessageError] = useState(null);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [refreshUserChats, setRefreshUserChats] = useState(false);
    const [chatDeleted, setChatDeleted] = useState(false);

    // Initializing socket
    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_SOCKET_URL);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setMessages([]);
        };
    }, [user]);

    useEffect(() => {
        // Adding online users
        if (socket === null || !user?._id) return;
        socket.emit("addNewUser", user?._id);
        socket.on("getOnlineUsers", (res) => {
            setOnlineUsers(res);
        });

        return () => {
            socket.off("getOnlineUsers");
        };
    }, [socket, user]);


    // Handling creation of chat by other user
    useEffect(() => {
        if (!socket || !user?._id) return;
    
        // Listen for the new chat event
        socket.on("newChatCreated", async ({ chatId, publicKey }) => {
            try {
                // Import the sender public key
                const importedPublicKey = await importPublicKey(publicKey);
    
                const privateKey = sessionStorage.getItem("privateKey");
                const importedPrivateKey = await importPrivateKey(privateKey);
    
                console.log("PrivateKey", privateKey);
                console.log("PublicKey", publicKey);

                if (!importedPrivateKey) {
                    console.error("Private key not found in sessionStorage!");
                    return;
                }
    
                // Derive the shared key using the private key and imported public key
                const sharedKey = await deriveSharedKey(importedPrivateKey, importedPublicKey);
    
                // Store the derived shared key in sessionStorage
                storeSharedKey(chatId, sharedKey);

                setRefreshUserChats((prev) => !prev);
                console.log(`Shared key for chat ${chatId} created and stored.`);
            } catch (error) {
                console.error("Error handling 'newChatCreated' event:", error);
            }
        });

        socket.on("chatDeleted", () => {
            setTimeout(() => {
                setRefreshUserChats((prev) => !prev);
                setMessages([]);
                setChatDeleted(true);
            },100); // Delay needed for deleting chats and messages
        });

        // Cleanup the event listener on unmount or when socket changes
        return () => {
            socket.off("newChatCreated");
        };
    }, [socket]);



    // Sending messages
    const sendTextMessage = useCallback(async (textMessage, sender, currentChatId, setTextMessage) => {
        if (!textMessage || !currentChat) return;

        const recipientId = currentChat.members.find((id) => id !== user?._id);

        try {
            // Get or generate the shared key for this chat
            let sharedKey = await getStoredSharedKey(currentChatId);
            if(!sharedKey){
                return;
            }

            // Encrypt the message with the shared key (using AES-GCM)
            const encoder = new TextEncoder();
            const encodedMessage = encoder.encode(textMessage);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encryptedMessage = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                sharedKey,
                encodedMessage
            );

            // Convert the encrypted message and IV to base64
            const encryptedMessageBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedMessage)));
            const ivBase64 = btoa(String.fromCharCode(...new Uint8Array(iv)));

            // Send the encrypted message to the backend
            const response = await postRequest(`${baseUrl}/messages`, JSON.stringify({
                chatId: currentChatId,
                senderId: sender?._id,
                text: encryptedMessageBase64,
                iv: ivBase64 
            }));
    
            if (response.error) {
                return setSendTextMessageError(response);
            }
    
            // Immediately update the local state with the encrypted message
            const localMessage = {
                ...response,
                text: textMessage, // Use the plaintext for the sender
            };
            setMessages((prev) => [...prev, localMessage]);
            setTextMessage("");
    
            // Emit the encrypted message through the socket
            socket.emit("sendMessage", { ...response, recipientId });
        } catch (error) {
            console.error("Error while encrypting the message:", error);
        }
    }, [socket, currentChat, user]);
    
    
    // Receiving messages
    useEffect(() => {
        if (socket === null || currentChat === null) return;

        socket.on("getMessage", async(res) => {
            if (currentChat?._id !== res.chatId) return;

            try {
                // Retrieve the shared key for the current chat
                const sharedKey = await getStoredSharedKey(currentChat._id);

                if (!sharedKey) {
                    console.error("Shared key not found for this chat!");
                    return;
                }
    
                // Decode the Base64-encoded encrypted message and IV
                const encryptedMessage = Uint8Array.from(atob(res.text), c => c.charCodeAt(0));
                const iv = Uint8Array.from(atob(res.iv), c => c.charCodeAt(0));
    
                // Decrypt the message
                const decryptedBuffer = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv },
                    sharedKey,
                    encryptedMessage
                );
    
                // Decode the decrypted buffer into a string
                const decoder = new TextDecoder();
                const decryptedMessage = decoder.decode(decryptedBuffer);
    
                // Add the decrypted message to the chat
                setMessages((prev) => {
                    if (prev.some((msg) => msg._id === res._id)) return prev;
                    return [...prev, { ...res, text: decryptedMessage }];
                });
            } catch (error) {
                console.error("Error decrypting received message:", error);
            }


            // Avoid duplicating messages
            setMessages((prev) => {
                if (prev.some((msg) => msg._id === res._id)) return prev;
                return [...prev, res];
            });
        });

        return () => {
            socket.off("getMessage");
        };
    }, [socket, currentChat]);

    // Fetching users for potential chats
    useEffect(() => {
        const getUsers = async () => {
            const response = await getRequest(`${baseUrl}/users`);

            if (response.error) {
                return console.log("Error fetching users", response);
            }

            const pChats = response.filter((u) => {
                if (user?._id === u._id) return false;
                return onlineUsers.some(onlineUser => onlineUser.userId === u._id) && !userChats.some((chat) => chat.members.includes(u._id));
            });

            setPotentialChats(pChats);
        };

        getUsers();
    }, [userChats, onlineUsers, user]);


    // Fetching user chats
    useEffect(() => {
        const getUserChats = async () => {
            if (user?._id) {
                console.log("refreshed User chats");
                setUserChatsLoading(true);
                setUserChatsError(null);
                const response = await getRequest(`${baseUrl}/chats/${user?._id}`);

                setUserChatsLoading(false);
                if (response.error) {
                    return setUserChatsError(response);
                }
                console.log("Chats avaible for the user:", response);
                setUserChats(response);
            }
        };

        getUserChats();
    }, [user, refreshUserChats]);

    // Fetching messages for the current chat
    useEffect(() => {
        const getMessages = async () => {
            if (!currentChat?._id) return;
    
            setMessagesLoading(true);
            setMessagesError(null);
    
            try {
                // Fetch messages from the backend
                const response = await getRequest(`${baseUrl}/messages/${currentChat?._id}`);
    
                if (response.error) {
                    return setMessagesError(response);
                }
    
                // Get the shared key for decryption
                const sessionKey = await getStoredSharedKey(currentChat._id);
                if (!sessionKey) {
                    throw new Error("Session key not found for the current chat.");
                }
    
                // Decrypt messages
                const decryptedMessages = await Promise.all(
                    response.map(async (message) => {
                        try {
                            const iv = Uint8Array.from(atob(message.iv), (c) => c.charCodeAt(0));
                            const encryptedData = Uint8Array.from(atob(message.text), (c) => c.charCodeAt(0));
    
                            const decryptedData = await window.crypto.subtle.decrypt(
                                { name: "AES-GCM", iv },
                                sessionKey,
                                encryptedData
                            );
    
                            const decoder = new TextDecoder();
                            return {
                                ...message,
                                text: decoder.decode(decryptedData) // Replacing encrypted text with plaintext
                            };
                        } catch (error) {
                            console.error("Failed to decrypt message:", message, error);
                        }
                    })
                );
                setMessagesLoading(false);
                // Update state with decrypted messages
                setMessages(decryptedMessages);
            } catch (error) {
                console.error("Error while fetching or decrypting messages:", error);
                setMessagesError(error.message);
                setMessagesLoading(false);
            }
        };
    
        getMessages();
    }, [currentChat]);

    const updateCurrentChat = useCallback((chat) => {
        setChatDeleted(false);
        setCurrentChat(chat);
    }, []);

    const createChat = useCallback(async (firstId, secondId) => {
        try {
            const response = await postRequest(`${baseUrl}/chats`, JSON.stringify({
                firstId,
                secondId
            }));
    
            if (response.error) {
                console.log("Error creating chat", response);
                return;
            }
    
            // Add the new chat to the user's chats
            setUserChats((prev) => [...prev, response]);
    
            // Fetch the public key of the second user
            const userPublicKey = sessionStorage.getItem("publicKey").replace(/^"|"$/g, '').trim();
            console.log(userPublicKey);
            console.log(response.publicKey1);
            const recipientPublicKey = response?.publicKey1 === userPublicKey 
                ? response?.publicKey2 
                : response?.publicKey1;
    
            if (!recipientPublicKey) {
                console.error("Recipient public key not found!");
                return;
            }
    
            const importedPublicKey = await importPublicKey(recipientPublicKey);
    
            // Generate and store the shared key for the chat
            const privateKey = sessionStorage.getItem("privateKey");
            const importedPrivateKey = await importPrivateKey(privateKey);
    
            if (!importedPrivateKey) {
                console.error("Private key not found in sessionStorage!");
                return;
            }

            
            const sharedKey = await deriveSharedKey(importedPrivateKey, importedPublicKey);
            storeSharedKey(response._id, sharedKey);
            
            if(socket){
                socket.emit("chatCreated", {
                    chatId: response._id,
                    publicKey: userPublicKey,
                    recipientId: secondId,
                });
            }
            setRefreshUserChats((prev) => !prev);
            console.log(`Shared key for chat ${response._id} created and stored.`);
        } catch (error) {
            console.error("Error in createChat:", error);
        }
    }, [socket]);


    return (
        <ChatContext.Provider value={{
            chatDeleted,
            userChats,
            userChatsLoading,
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
        }}>
            {children}
        </ChatContext.Provider>
    );
};
