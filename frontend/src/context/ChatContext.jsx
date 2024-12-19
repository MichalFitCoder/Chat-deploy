import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { getRequest, baseUrl, postRequest } from "../utils/services";
import { io } from "socket.io-client";
import forge from "node-forge";
import { importPublicKey, importPrivateKey , getStoredSharedKey, storeSharedKey, deriveSharedKey, arrayBufferToBase64} from "../security/keyManager";

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
        setChatDeleted(false);
        return () => {
            newSocket.disconnect();
            setMessages([]);
        };
    }, [user]);

    useEffect(() => {
        // Adding online users
        if (socket === null || !user?._id) return;
        socket.emit("addNewUser", user?._id, user?.name);
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
    
        const handleNewChatCreated = async ({ chatId, publicKey }) => {
            try {
                const importedPublicKey = await importPublicKey(publicKey);
    
                const privateKey = sessionStorage.getItem("privateKey");
                if (!privateKey) {
                    console.error("Private key not found in sessionStorage.");
                    return;
                }

                const importedPrivateKey = await importPrivateKey(privateKey);
    
                if (!importedPrivateKey) {
                    console.error("Private key not found in sessionStorage!");
                    return;
                }
    
                // Deriving shared key using the private key and imported public key
                const sharedKey = await deriveSharedKey(importedPrivateKey, importedPublicKey);
    
                // Store the derived shared key in sessionStorage
                storeSharedKey(chatId, sharedKey);
    
                setRefreshUserChats((prev) => !prev);
            } catch (error) {
                console.error("Error handling 'newChatCreated' event:", error);
            }
        };
    
        const handleAddGroupChat = async ({ chatId, name, encryptedKey, publicKey }) => {
            try {
                const privateKeyBase64 = sessionStorage.getItem("privateKey");
                if (!privateKeyBase64) {
                    console.error("Private key not found for decrypting the symmetric key.");
                    return;
                }
    
                // Generating shared secret with the creator of the chat
                const privateKey = await importPrivateKey(privateKeyBase64);
                const creatorPublicKey = await importPublicKey(publicKey);
                const sharedSecret = await deriveSharedKey(privateKey, creatorPublicKey);
    
                const encryptedKeyBuffer = Uint8Array.from(atob(encryptedKey), (c) => c.charCodeAt(0)).buffer;
    
                // Decrypting the symmetric key using the private key
                const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: new Uint8Array(12) },
                    sharedSecret,
                    encryptedKeyBuffer
                );
    
                const symmetricKey = await window.crypto.subtle.importKey(
                    "raw",
                    decryptedKeyBuffer,
                    { name: "AES-GCM", length: 256 },
                    true,
                    ["encrypt", "decrypt"]
                );
                storeSharedKey(chatId, symmetricKey);
            } catch (error) {
                console.error("Error handling 'addGroupChat' event:", error);
            }
            // Triggering chat refresh
            setRefreshUserChats((prev) => !prev);
        };
    
        const handleChatDeleted = () => {
            setRefreshUserChats((prev) => !prev);
            setMessages([]);
            setChatDeleted(true);
        };
    
        const handleUserRemoved = () => {
            setRefreshUserChats((prev) => !prev);
        };
    
        // Rejestracja nasłuchiwaczy
        socket.on("newChatCreated", handleNewChatCreated);
        socket.on("addGroupChat", handleAddGroupChat);
        socket.on("chatDeleted", handleChatDeleted);
        socket.on("userRemoved", handleUserRemoved);
    
        // Cleanup nasłuchiwaczy przy odmontowaniu lub zmianie socket
        return () => {
            socket.off("newChatCreated", handleNewChatCreated);
            socket.off("addGroupChat", handleAddGroupChat);
            socket.off("chatDeleted", handleChatDeleted);
            socket.off("userRemoved", handleUserRemoved);
        };
    }, [socket, user?._id]);



    // Sending messages
    const sendTextMessage = useCallback(async (textMessage, sender, currentChatId, setTextMessage) => {
        if (!textMessage || !currentChat) return;

        const recipientIds = currentChat.members.filter((id) => id !== user?._id);

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
                senderName: sender?.name,
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
            socket.emit("sendMessage", { ...response, recipientIds });
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
                if (user?._id === u._id) return false; // Skip the current user
    
            const isUserOnline = onlineUsers.some(onlineUser => onlineUser.userId === u._id);
            const isUserInOneToOneChat = userChats.some((chat) => 
                chat.members.length === 2 && chat.members.includes(u._id) // Only one-on-one chats
            );

            // Return the user only if they are online and not in a one-to-one chat
            return isUserOnline && !isUserInOneToOneChat;
            });
    

            setPotentialChats(pChats);
        };

        getUsers();
    }, [userChats, onlineUsers, user]);


    // Fetching user chats
    useEffect(() => {
        const getUserChats = async () => {
            if (user?._id) {
                setUserChatsLoading(true);
                setUserChatsError(null);
                const response = await getRequest(`${baseUrl}/chats/${user?._id}`);

                setUserChatsLoading(false);
                if (response.error) {
                    return setUserChatsError(response);
                }
                setUserChats(response.chats);
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
            if (!userPublicKey) {
                console.error("Public key not found in sessionStorage.");
                return;
            }

            const recipientPublicKey = response?.publicKey1 === userPublicKey 
                ? response?.publicKey2 
                : response?.publicKey1;
    
            if (!recipientPublicKey) {
                console.error("Recipient public key not found!");
                return;
            }
    
            const importedPublicKey = await importPublicKey(recipientPublicKey);
    
            const privateKey = sessionStorage.getItem("privateKey");
            if (!privateKey) {
                console.error("Private key not found in sessionStorage.");
                return;
            }
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

    //========================= Handling group Chats ==============================

    const inicializeGroupChat = async(selectedUserIds, groupName) => {
        const chatMembers = selectedUserIds;
        chatMembers.push(user?._id);
        const response = await postRequest(`${baseUrl}/chats/groupChat`, JSON.stringify({
            name: groupName,
            members: chatMembers
        }));

        if (response.error) {
            console.log("Error creating chat", response);
            return;
        }
        // Adding new chat to the user's chats
        setUserChats((prev) => [...prev, response]);

        const symmetricKeyRaw = crypto.getRandomValues(new Uint8Array(32)); 

        const symmetricKey = await window.crypto.subtle.importKey(
            "raw",
            symmetricKeyRaw,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
        storeSharedKey(response._id, symmetricKey)

        const privateKey = sessionStorage.getItem("privateKey");
        if (!privateKey) {
            console.error("Private key not found in sessionStorage.");
            return;
        }

        const importedPrivateKey = await importPrivateKey(privateKey);

        if (!importedPrivateKey) {
            console.error("Private key not found in sessionStorage!");
            return;
        }

        // Getting creators public key from storage
        const userPublicKey = sessionStorage.getItem("publicKey").replace(/^"|"$/g, '').trim();
        if (!userPublicKey) {
            console.error("Public key not found in sessionStorage.");
            return;
        }

        await Promise.all(selectedUserIds.map(async (id) => {
            try{
                const publicKeyResponse = await getRequest(`${baseUrl}/users/publicKey/${id}`);

                if (publicKeyResponse.error) {
                    console.error(`Error fetching public key for user ${id}`, publicKeyResponse);
                    return;
                }

                const publicKeyBase64 = publicKeyResponse.publicKey;
                const importedPublicKey = await importPublicKey(publicKeyBase64);
                
                const sharedKey = await deriveSharedKey(importedPrivateKey, importedPublicKey);

                const symmetricKeyRaw = await window.crypto.subtle.exportKey("raw", symmetricKey);

                // Encrypt the symmetric chat key using the shared key
                const encryptedSymmetricKey = await window.crypto.subtle.encrypt(
                    { name: "AES-GCM", iv: new Uint8Array(12) },
                    sharedKey,
                    symmetricKeyRaw
                );
                // Converting the encrypted key to Base64
                const encryptedKeyBase64 = arrayBufferToBase64(encryptedSymmetricKey);

                socket.emit("groupChatCreated", {
                    userId: id,
                    chatId: response._id,
                    encryptedKey: encryptedKeyBase64,
                    name: groupName,
                    creatorPublicKey: userPublicKey
                });
            } catch (error) {
                console.error(`Error processing user ${id}:`, error);
            }
        
        }));
    }
    


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
            inicializeGroupChat,
        }}>
            {children}
        </ChatContext.Provider>
    );
};
