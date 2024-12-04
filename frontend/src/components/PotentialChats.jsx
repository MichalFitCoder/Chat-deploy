import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import "./components.css/PotentialChats.css"
import { AuthContext } from "../context/AuthContext";

const potentialChats = () => {
    const {potentialChats, createChat, onlineUsers} = useContext(ChatContext);
    const {user} = useContext(AuthContext);
    return (<>
            {potentialChats && potentialChats.map((u,index)=>{
                return(<div className="single-user" key={index} onClick={() => createChat(user._id, u._id)}>
                    {u.name}
                    <span className={
                        onlineUsers?.some((user) => user?.userId === u?._id) ? "user-online" : "user-ofline"
                    }></span>
                 </div>)
            })}

    </>);
}

export default potentialChats;