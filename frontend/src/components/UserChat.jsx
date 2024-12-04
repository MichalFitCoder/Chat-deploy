import React, { useContext } from 'react';
import { useFetchRecipientUser } from '../hooks/useFetchRecipient';
import './components.css/UserChat.css';
import profilePic from '../assets/prof.svg'
import { ChatContext } from '../context/ChatContext';

const UserChat = ({ chat, user }) => {
  const { recipientUser } = useFetchRecipientUser(chat, user);
  const {onlineUsers} = useContext(ChatContext);

  const isOnline = onlineUsers?.some((user) => user?.userId === recipientUser?._id);

  return (
    
    <div className="chat-container" role="button">
      <img className="profile-picture" src={profilePic}/>
      <div className="chat-info">
        <p className="chat-name">{recipientUser?.name || 'Unknown User'}</p>
        <p className="chat-message-preview">Text Message</p>
        <span className={isOnline ? "user-online" : "user-ofline"}></span>
      </div>
      <span className="chat-timestamp">2m</span>
    </div>
  );
};

export default UserChat;
