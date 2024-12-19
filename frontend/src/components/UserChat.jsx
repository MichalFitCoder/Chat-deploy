import React, { useContext } from 'react';
import { useFetchRecipientUsers } from '../hooks/useFetchRecipient';
import './components.css/UserChat.css';
import profilePic from '../assets/prof.svg'
import { ChatContext } from '../context/ChatContext';

const UserChat = ({ chat, user }) => {
  const { recipientUsers } = useFetchRecipientUsers(chat, user);
  const {onlineUsers} = useContext(ChatContext);

  const isGroupChat = chat?.name;

  const recipientUser = !isGroupChat
  ? recipientUsers.find((recipient) => recipient._id !== user?._id)
  : null;

const isOnline = recipientUser
  ? onlineUsers?.some((onlineUser) => onlineUser?.userId === recipientUser?._id)
  : false;

  return (
    <div className="chat-container" role="button">
      <img className="profile-picture" src={profilePic}/>
      <div className="chat-info">
        <p className="chat-name">{isGroupChat ? chat.name : recipientUser?.name || 'Unknown User'}</p>
        <p className="chat-message-preview">{isGroupChat ? 'Group Chat' : 'One to one chat' }</p>
        <span className={isGroupChat ? "group" : "user-online"}></span>
      </div>
      <span className="chat-timestamp">{isGroupChat ? `${recipientUsers.length + 1} members`  : "Online"}</span>
    </div>
  );
};

export default UserChat;
