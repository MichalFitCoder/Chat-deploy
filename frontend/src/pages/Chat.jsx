import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import UserChat from "../components/UserChat";
import "./pages.css/chat.css";
import PotentialChats from "../components/PotentialChats";
import ChatBox from "../components/ChatBox"

const Chat = () => {
    const{user} = useContext(AuthContext);
    const{userChats, UserChatsLoading, updateCurrentChat, userChatError} = useContext(ChatContext);
    return<>
    <div className="logged-users">
        <PotentialChats/>
    </div>
    <div className="container-main">
        <div className="container-aside">
        {userChats?.length < 1 ? null :(
            <div>
                {UserChatsLoading && <p>Loading Chats...</p>}
                
                {userChats?.map((chat,index)=>{
                    return(
                        <div key={index} onClick={()=>updateCurrentChat(chat)}> 
                            <UserChat chat={chat} user={user}/>
                        </div>
                    )
                })}
            </div>
        )}
        </div>
        <div className="container-messages">
        <ChatBox/>
        </div>
    </div>
    </>
}
 
export default Chat;