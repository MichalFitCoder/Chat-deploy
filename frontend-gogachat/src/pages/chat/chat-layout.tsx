import { useParams } from "react-router-dom";
import Layout from "@/layouts/main-layout";
import { ChatArea } from "./chat-area";

const ChatLayout = () => {
  const { chatId } = useParams();

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      <Layout>
        <ChatArea chatId={chatId as string} />
      </Layout>
    </div>
  );
};

export default ChatLayout;
