import { getChatById } from "@/services/chat.service";
import { ChatHeader } from "./header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import { useEffect, useState } from "react";
import { TChat } from "@/types/chat.types";
import { useAuth } from "@/context/auth.context";

export const ChatArea = ({ chatId }: { chatId: string }) => {
  const { user } = useAuth();
  const [chat, setChat] = useState<TChat | null>(null);

  useEffect(() => {
    const fetchChat = async () => {
      if (chatId) {
        if(user){
          const data = await getChatById(user.id, chatId);
          setChat(data);
        }
      }
    };
    fetchChat();
  }, [chatId]);

  if (!chat) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chatName={chat.name} />
      <MessageList messages={chat.messages} />
      <MessageInput />
    </div>
  );
};
