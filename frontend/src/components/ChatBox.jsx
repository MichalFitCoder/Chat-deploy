import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { useFetchRecipientUser } from "../hooks/useFetchRecipient";
import moment from "moment";
import "./components.css/ChatBox.css"
import InputEmoji from "react-input-emoji";

const ChatBox = () => {
    const {user} = useContext(AuthContext);
    const {currentChat, messages, messagesLoading, sendTextMessage, messagesError} = useContext(ChatContext);
    const {recipientUser} = useFetchRecipientUser(currentChat, user);
    const [textMessage, setTextMessage] = useState("");

    if(!recipientUser){ 
        return(
        <p style={{textAlign:"center", width: "100%"}}>No conversation selected</p>
        )
    }

    if(messagesLoading){
        return(
            <p style={{textAlign:"center", width: "100%"}}>Loading Conversation...</p>
        )
    }


    return (<>
        <div className="chat">   
        <div className="chat-header">
            <strong>{recipientUser.name}</strong>
        </div>  
        <div className="conversation">
            {messages && messages.map((message,index) => (
                <div className="message" key ={index}>
                <div className={`${message?.senderId === user?._id ? "single-message-self" : "single-message-other"}`} key={index}>
                    <span className="message-content">{message.text }</span>
                    <span className="sent-date">{moment(message.createdAt).calendar()}</span>
                </div>  
                
                </div>
            ))}
        </div>
        </div>
        <div className="input">
            <InputEmoji value={textMessage} onChange={setTextMessage}/>
            <button className="send-btn" onClick={()=>sendTextMessage(textMessage,user,currentChat._id,setTextMessage)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16">
                <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
            </svg>
            </button>
        </div>
    </>)
}

export default ChatBox;